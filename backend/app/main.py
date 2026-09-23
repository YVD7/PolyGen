import os
import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import CORS_ORIGINS, STORAGE_DIR
from app.models.schemas import (
    GenerationRequest,
    GenerationStatus,
    DecimateRequest,
    DecimateResponse,
    PresetItem
)
from app.pipeline.orchestrator import PolyGenOrchestrator
from app.presets.preset_loader import get_presets

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("polygen")

app = FastAPI(
    title="PolyGen Text-to-3D Pipeline API",
    description="Multi-stage Generative 3D Asset Pipeline powered by LangChain, Trimesh, and QEM Decimation.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global orchestrator instance
orchestrator = PolyGenOrchestrator()

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing PolyGen Engine...")
    # Pre-generate the default showcase hero asset: Medieval Broadsword from the PDF
    try:
        default_req = GenerationRequest(
            prompt="A rusted, medieval broadsword with a glowing blue sapphire in the hilt.",
            style="game_ready",
            target_faces=10000,
            texture_res=1024,
            decimation_enabled=True
        )
        hero_status = orchestrator.run_pipeline(default_req)
        # Aliased as 'preset_broadsword' for instant preview
        orchestrator.tasks["preset_broadsword"] = hero_status
        orchestrator.mesh_cache["preset_broadsword"] = orchestrator.mesh_cache.get(hero_status.id)
        logger.info(f"Hero asset generated successfully (ID: {hero_status.id})")
    except Exception as e:
        logger.error(f"Failed to generate startup hero asset: {e}")

@app.get("/")
def read_root():
    return {
        "project": "PolyGen: Generative Text-to-3D Asset Pipeline",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/presets", response_model=list[PresetItem])
def list_presets():
    return get_presets()

@app.post("/api/generate", response_model=GenerationStatus)
def generate_3d_asset(request: GenerationRequest):
    """
    Submits a natural language prompt to the 6-stage LangChain & Trimesh generative pipeline.
    """
    try:
        result = orchestrator.run_pipeline(request)
        return result
    except Exception as e:
        logger.exception("Generation failure")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status/{task_id}", response_model=GenerationStatus)
def check_status(task_id: str):
    status = orchestrator.get_status(task_id)
    if not status:
        raise HTTPException(status_code=404, detail="Task not found")
    return status

@app.post("/api/decimate", response_model=DecimateResponse)
def decimate_asset(request: DecimateRequest):
    """
    Dynamically applies Quadric Error Metrics (QEM) decimation to reduce polygon count.
    """
    try:
        response = orchestrator.re_decimate(request.model_id, request.target_faces)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.exception("Decimation failure")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/models/{model_id}/glb")
def get_model_glb(model_id: str):
    """
    Serves the standard binary glTF/GLB model.
    """
    path = STORAGE_DIR / "exports" / f"{model_id}.glb"
    if not path.exists():
        # Check if mapped to another task or preset
        task = orchestrator.get_status(model_id)
        if task and (STORAGE_DIR / "exports" / f"{task.id}.glb").exists():
            path = STORAGE_DIR / "exports" / f"{task.id}.glb"
        else:
            raise HTTPException(status_code=404, detail=f"GLB asset '{model_id}' not found")
    return FileResponse(
        path=str(path),
        media_type="model/gltf-binary",
        filename=f"{model_id}.glb"
    )

@app.get("/api/models/{model_id}/obj")
def get_model_obj(model_id: str):
    """
    Serves the Wavefront OBJ mesh file.
    """
    path = STORAGE_DIR / "exports" / f"{model_id}.obj"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"OBJ asset '{model_id}' not found")
    return FileResponse(
        path=str(path),
        media_type="text/plain",
        filename=f"{model_id}.obj"
    )

@app.get("/api/models/{model_id}/textures/{tex_type}")
def get_model_texture(model_id: str, tex_type: str):
    """
    Serves individual PBR texture maps: albedo, normal, roughness, metallic, emissive.
    """
    valid_types = ["albedo", "normal", "roughness", "metallic", "emissive"]
    if tex_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid texture type: {tex_type}")

    # Check for direct file
    path = STORAGE_DIR / "textures" / f"{model_id}_{tex_type}.png"
    if not path.exists():
        # Check task mapping
        task = orchestrator.get_status(model_id)
        if task:
            path = STORAGE_DIR / "textures" / f"{task.id}_{tex_type}.png"

    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Texture '{tex_type}' for model '{model_id}' not found")

    return FileResponse(
        path=str(path),
        media_type="image/png",
        filename=f"{model_id}_{tex_type}.png"
    )
