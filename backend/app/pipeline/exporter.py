import os
import trimesh
import numpy as np
from PIL import Image
from pathlib import Path
from typing import Dict, Any

class ModelExporter:
    """
    Standard GLB, GLTF, and OBJ Export Pipeline.
    Packages decimated geometry with embedded PBR textures into game-ready formats.
    """

    def __init__(self, exports_dir: Path):
        self.exports_dir = exports_dir
        self.exports_dir.mkdir(parents=True, exist_ok=True)

    def export_glb(
        self,
        model_id: str,
        mesh: trimesh.Trimesh,
        albedo_path: Path
    ) -> Path:
        """
        Embeds UV coordinates and albedo texture into a single binary .glb file.
        """
        glb_path = self.exports_dir / f"{model_id}.glb"
        
        # Clone mesh to avoid mutating original
        export_mesh = mesh.copy()

        # Load albedo texture image
        if albedo_path.exists():
            try:
                albedo_img = Image.open(str(albedo_path)).convert("RGB")
                
                # Check UVs
                uvs = None
                if hasattr(export_mesh.visual, "uv") and export_mesh.visual.uv is not None and len(export_mesh.visual.uv) == len(export_mesh.vertices):
                    uvs = export_mesh.visual.uv
                else:
                    # Fallback planar / cylindrical UV calculation
                    bounds = export_mesh.bounds
                    extents = bounds[1] - bounds[0]
                    extents = np.where(extents < 1e-6, 1.0, extents)
                    u = (export_mesh.vertices[:, 0] - bounds[0][0]) / extents[0]
                    v = (export_mesh.vertices[:, 1] - bounds[0][1]) / extents[1]
                    uvs = np.column_stack([np.clip(u, 0, 1), np.clip(v, 0, 1)])

                export_mesh.visual = trimesh.visual.TextureVisuals(uv=uvs, image=albedo_img)
            except Exception as e:
                # If image loading fails, proceed with default visual
                pass

        glb_data = export_mesh.export(file_type="glb")
        with open(glb_path, "wb") as f:
            f.write(glb_data)

        return glb_path

    def export_obj(
        self,
        model_id: str,
        mesh: trimesh.Trimesh
    ) -> Path:
        """
        Exports clean Wavefront OBJ file.
        """
        obj_path = self.exports_dir / f"{model_id}.obj"
        obj_data = mesh.export(file_type="obj")
        with open(obj_path, "w", encoding="utf-8") as f:
            f.write(obj_data)
        return obj_path
