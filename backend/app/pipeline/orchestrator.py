import time
import uuid
import logging
from typing import Dict, Any, Optional
from pathlib import Path

from app.config import STORAGE_DIR
from app.models.schemas import (
    GenerationRequest,
    GenerationStatus,
    PipelineStageStatus,
    MeshStats,
    DecimateResponse
)
from app.pipeline.prompt_engine import PromptDecompositionEngine
from app.pipeline.mesh_generator import MeshGenerator
from app.pipeline.uv_unwrapper import UVUnwrapper
from app.pipeline.texture_engine import TextureSynthesisEngine
from app.pipeline.decimation import QEMDecimator
from app.pipeline.exporter import ModelExporter

logger = logging.getLogger(__name__)

class PolyGenOrchestrator:
    """
    Central LangChain-driven multi-stage agentic orchestrator for PolyGen.
    Executes the 6-stage Text-to-3D generation pipeline and tracks real-time progress.
    """

    def __init__(self):
        self.prompt_engine = PromptDecompositionEngine()
        self.mesh_gen = MeshGenerator(STORAGE_DIR / "models")
        self.texture_engine = TextureSynthesisEngine(STORAGE_DIR / "textures")
        self.exporter = ModelExporter(STORAGE_DIR / "exports")
        
        # In-memory storage for active and completed tasks
        self.tasks: Dict[str, GenerationStatus] = {}
        # Cache for high-density un-decimated raw meshes so users can re-decimate anytime
        self.mesh_cache: Dict[str, Any] = {}

    def get_status(self, task_id: str) -> Optional[GenerationStatus]:
        return self.tasks.get(task_id)

    def run_pipeline(self, request: GenerationRequest) -> GenerationStatus:
        task_id = f"pg_{uuid.uuid4().hex[:10]}"
        t_start = time.time()

        # Initialize pipeline stages
        stages = [
            PipelineStageStatus(
                id="stage_1_langchain",
                name="LangChain Prompt Deconstruction",
                description="Deconstructing text prompt into 3D morphology & PBR material parameters"
            ),
            PipelineStageStatus(
                id="stage_2_mesh_gen",
                name="3D Mesh Synthesis",
                description="Synthesizing high-density 3D geometry in Wavefront OBJ format"
            ),
            PipelineStageStatus(
                id="stage_3_uv_unwrap",
                name="UV Parameterization",
                description="Computing conformal UV coordinates and surface normal vectors"
            ),
            PipelineStageStatus(
                id="stage_4_textures",
                name="PBR Texture Synthesis",
                description="Generating Albedo, Normal, Roughness, Metallic, and Emissive maps"
            ),
            PipelineStageStatus(
                id="stage_5_decimation",
                name="QEM Decimation",
                description=f"Simplifying mesh to {request.target_faces:,} game-ready polygon budget"
            ),
            PipelineStageStatus(
                id="stage_6_export",
                name="glTF / GLB Packaging",
                description="Compiling binary GLB container ready for Unreal Engine and Unity"
            )
        ]

        status = GenerationStatus(
            id=task_id,
            prompt=request.prompt,
            status="processing",
            progress=5,
            current_stage=stages[0].name,
            stages=stages,
            created_at=t_start
        )
        self.tasks[task_id] = status

        try:
            # ----------------------------------------------------
            # Stage 1: LangChain Prompt Analysis
            # ----------------------------------------------------
            t0 = time.time()
            stages[0].status = "running"
            stages[0].progress = 50
            specs = self.prompt_engine.analyze(request.prompt, request.style)
            pbr_specs = specs["pbr_material"]
            status.material_specs = pbr_specs
            stages[0].progress = 100
            stages[0].status = "completed"
            stages[0].duration_ms = int((time.time() - t0) * 1000)
            stages[0].details = pbr_specs.decomposition_notes
            status.progress = 18
            status.current_stage = stages[1].name

            # ----------------------------------------------------
            # Stage 2: 3D Mesh Generation (Raw OBJ)
            # ----------------------------------------------------
            t0 = time.time()
            stages[1].status = "running"
            stages[1].progress = 50
            raw_mesh = self.mesh_gen.generate(task_id, specs)
            stages[1].progress = 100
            stages[1].status = "completed"
            stages[1].duration_ms = int((time.time() - t0) * 1000)
            stages[1].details = f"Generated {len(raw_mesh.faces):,} raw triangles with {len(raw_mesh.vertices):,} vertices."
            status.progress = 36
            status.current_stage = stages[2].name

            # Cache the raw high-density mesh for re-decimation
            self.mesh_cache[task_id] = {
                "raw_mesh": raw_mesh.copy(),
                "specs": specs,
                "pbr_specs": pbr_specs
            }

            # ----------------------------------------------------
            # Stage 3: UV Parameterization & Normals
            # ----------------------------------------------------
            t0 = time.time()
            stages[2].status = "running"
            stages[2].progress = 50
            uv_mesh = UVUnwrapper.unwrap(raw_mesh)
            stages[2].progress = 100
            stages[2].status = "completed"
            stages[2].duration_ms = int((time.time() - t0) * 1000)
            stages[2].details = "Conformal UV unwrapping and smooth vertex normals computed."
            status.progress = 54
            status.current_stage = stages[3].name

            # ----------------------------------------------------
            # Stage 4: PBR Texture Synthesis
            # ----------------------------------------------------
            t0 = time.time()
            stages[3].status = "running"
            stages[3].progress = 50
            textures = self.texture_engine.generate_pbr_pack(
                model_id=task_id,
                category=specs.get("category", "prop"),
                pbr_specs=pbr_specs,
                resolution=request.texture_res
            )
            status.textures = {
                k: f"/api/models/{task_id}/textures/{k}" for k in textures.keys()
            }
            stages[3].progress = 100
            stages[3].status = "completed"
            stages[3].duration_ms = int((time.time() - t0) * 1000)
            stages[3].details = f"Generated 5 PBR texture maps at {request.texture_res}x{request.texture_res} resolution."
            status.progress = 72
            status.current_stage = stages[4].name

            # ----------------------------------------------------
            # Stage 5: QEM Decimation
            # ----------------------------------------------------
            t0 = time.time()
            stages[4].status = "running"
            stages[4].progress = 50
            if request.decimation_enabled:
                decimated_mesh, stats = QEMDecimator.decimate(uv_mesh, request.target_faces)
            else:
                decimated_mesh = uv_mesh
                stats = MeshStats(
                    vertex_count=len(uv_mesh.vertices),
                    face_count=len(uv_mesh.faces),
                    original_face_count=len(uv_mesh.faces),
                    reduction_pct=0.0,
                    is_watertight=bool(uv_mesh.is_watertight),
                    bounding_box=[float(x) for x in uv_mesh.bounding_box.extents]
                )
            status.mesh_stats = stats
            stages[4].progress = 100
            stages[4].status = "completed"
            stages[4].duration_ms = int((time.time() - t0) * 1000)
            stages[4].details = f"Reduced from {stats.original_face_count:,} to {stats.face_count:,} faces ({stats.reduction_pct}% reduction)."
            status.progress = 90
            status.current_stage = stages[5].name

            # ----------------------------------------------------
            # Stage 6: glTF / GLB Packaging
            # ----------------------------------------------------
            t0 = time.time()
            stages[5].status = "running"
            stages[5].progress = 50
            glb_path = self.exporter.export_glb(
                model_id=task_id,
                mesh=decimated_mesh,
                albedo_path=textures["albedo"]
            )
            obj_path = self.exporter.export_obj(
                model_id=task_id,
                mesh=decimated_mesh
            )
            status.glb_url = f"/api/models/{task_id}/glb"
            status.obj_url = f"/api/models/{task_id}/obj"
            stages[5].progress = 100
            stages[5].status = "completed"
            stages[5].duration_ms = int((time.time() - t0) * 1000)
            stages[5].details = f"Exported standard binary .glb ({glb_path.stat().st_size // 1024} KB) and .obj."

            # Complete!
            status.status = "completed"
            status.progress = 100
            status.current_stage = "Finished"
            status.total_duration_ms = int((time.time() - t_start) * 1000)
            logger.info(f"PolyGen generation {task_id} completed in {status.total_duration_ms}ms")

        except Exception as e:
            logger.exception(f"Pipeline error on task {task_id}: {e}")
            status.status = "failed"
            status.error = str(e)

        return status

    def re_decimate(self, model_id: str, target_faces: int) -> DecimateResponse:
        """
        Dynamically applies QEM decimation to an existing model's cached raw mesh
        and re-exports the GLB without regenerating textures.
        """
        t0 = time.time()
        cached = self.mesh_cache.get(model_id)
        if not cached:
            # Check if task exists and use exported mesh if cache missing
            raise ValueError(f"Model ID '{model_id}' not found in active session cache.")

        raw_mesh = cached["raw_mesh"].copy()
        uv_mesh = UVUnwrapper.unwrap(raw_mesh)
        decimated, stats = QEMDecimator.decimate(uv_mesh, target_faces)

        # Re-export GLB
        albedo_path = STORAGE_DIR / "textures" / f"{model_id}_albedo.png"
        glb_path = self.exporter.export_glb(model_id, decimated, albedo_path)

        # Update task stats if present
        if model_id in self.tasks:
            self.tasks[model_id].mesh_stats = stats

        elapsed_ms = int((time.time() - t0) * 1000)
        return DecimateResponse(
            model_id=model_id,
            original_faces=stats.original_face_count,
            new_faces=stats.face_count,
            reduction_pct=stats.reduction_pct,
            glb_url=f"/api/models/{model_id}/glb",
            duration_ms=elapsed_ms
        )
