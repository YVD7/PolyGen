from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class GenerationRequest(BaseModel):
    prompt: str = Field(..., description="Natural language prompt describing the 3D asset")
    style: str = Field(default="game_ready", description="Asset style: game_ready, stylized, scifi, medieval")
    target_faces: int = Field(default=10000, description="Target polygon/triangle face count after QEM decimation")
    texture_res: int = Field(default=1024, description="PBR texture map resolution in pixels (e.g., 1024, 2048)")
    decimation_enabled: bool = Field(default=True, description="Whether to apply QEM decimation")

class PipelineStageStatus(BaseModel):
    id: str
    name: str
    description: str
    progress: int = 0  # 0 to 100
    status: str = "pending"  # pending, running, completed, error
    details: Optional[str] = None
    duration_ms: Optional[int] = None

class MeshStats(BaseModel):
    vertex_count: int
    face_count: int
    original_face_count: int
    reduction_pct: float
    is_watertight: bool
    bounding_box: List[float] = [0.0, 0.0, 0.0]  # width, height, depth

class PBRMaterialSpecs(BaseModel):
    base_color: List[float] = [0.7, 0.7, 0.7]  # RGB 0-1
    roughness: float = 0.5
    metallic: float = 0.2
    emissive_color: List[float] = [0.0, 0.0, 0.0]
    emissive_intensity: float = 0.0
    normal_strength: float = 1.0
    material_name: str = "PBR_Default"
    decomposition_notes: str = ""

class GenerationStatus(BaseModel):
    id: str
    prompt: str
    status: str  # queued, processing, completed, failed
    progress: int  # 0 to 100
    current_stage: str
    stages: List[PipelineStageStatus]
    mesh_stats: Optional[MeshStats] = None
    material_specs: Optional[PBRMaterialSpecs] = None
    glb_url: Optional[str] = None
    obj_url: Optional[str] = None
    textures: Dict[str, str] = {}  # albedo, normal, roughness, metallic, emissive
    created_at: float
    total_duration_ms: Optional[int] = None
    error: Optional[str] = None

class DecimateRequest(BaseModel):
    model_id: str
    target_faces: int = Field(..., ge=200, le=200000)

class DecimateResponse(BaseModel):
    model_id: str
    original_faces: int
    new_faces: int
    reduction_pct: float
    glb_url: str
    duration_ms: int

class PresetItem(BaseModel):
    id: str
    name: str
    prompt: str
    category: str
    description: str
    target_faces: int
    material_type: str
    preview_tag: str
