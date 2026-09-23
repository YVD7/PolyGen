import time
import trimesh
import logging
from typing import Tuple, Dict, Any
from app.models.schemas import MeshStats

logger = logging.getLogger(__name__)

class QEMDecimator:
    """
    Quadric Error Metrics (QEM) Decimation and Optimization Engine.
    Reduces dense generative meshes down to game-ready polygon budgets
    (e.g., 50k+ -> 10k or 5k triangles) while preserving boundary edges and silhouette.
    """

    @staticmethod
    def decimate(
        mesh: trimesh.Trimesh,
        target_faces: int = 10000
    ) -> Tuple[trimesh.Trimesh, MeshStats]:
        """
        Executes QEM decimation on the input mesh.
        Returns the simplified mesh and detailed topology reduction metrics.
        """
        t0 = time.time()
        orig_faces = len(mesh.faces)
        
        # If mesh is already smaller than target, keep it
        if orig_faces <= target_faces or target_faces <= 0:
            stats = MeshStats(
                vertex_count=len(mesh.vertices),
                face_count=orig_faces,
                original_face_count=orig_faces,
                reduction_pct=0.0,
                is_watertight=bool(mesh.is_watertight),
                bounding_box=[float(x) for x in mesh.bounding_box.extents]
            )
            return mesh, stats

        try:
            # QEM simplification via fast_simplification
            simplified = mesh.simplify_quadric_decimation(face_count=target_faces)
            # Recompute normals and fix winding
            simplified.fix_normals()
            simplified.remove_unreferenced_vertices()
        except Exception as e:
            logger.warning(f"Fast QEM simplification encountered: {e}. Fallback to sub-sampling.")
            # Fallback face decimation
            factor = max(0.1, min(1.0, target_faces / float(orig_faces)))
            simplified = mesh.simplify_quadratic_decimation(int(orig_faces * factor))

        new_faces = len(simplified.faces)
        reduction_pct = round(((orig_faces - new_faces) / float(orig_faces)) * 100.0, 2)
        elapsed_ms = int((time.time() - t0) * 1000)

        logger.info(
            f"QEM Decimation completed in {elapsed_ms}ms: "
            f"{orig_faces} -> {new_faces} faces ({reduction_pct}% reduction)"
        )

        stats = MeshStats(
            vertex_count=len(simplified.vertices),
            face_count=new_faces,
            original_face_count=orig_faces,
            reduction_pct=reduction_pct,
            is_watertight=bool(simplified.is_watertight),
            bounding_box=[float(x) for x in simplified.bounding_box.extents]
        )

        return simplified, stats
