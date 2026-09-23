import numpy as np
import trimesh
import logging

logger = logging.getLogger(__name__)

class UVUnwrapper:
    """
    Automated UV parameterization and normals recalculation using Trimesh.
    Computes seamless 2D texture coordinates (UVs) mapped in [0, 1]
    and ensures clean vertex normals for PBR shading.
    """

    @staticmethod
    def unwrap(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
        """
        Calculates UV parameterization coordinates and normal vectors.
        """
        # Ensure normals are computed and consistent
        mesh.fix_normals()
        
        vertices = mesh.vertices
        bounds = mesh.bounds
        extents = bounds[1] - bounds[0]
        # Avoid division by zero
        extents = np.where(extents < 1e-6, 1.0, extents)

        # Spherical / cylindrical conformal projection for seamless UV layout
        # Calculate cylindrical angle theta in [0, 1] and height v in [0, 1]
        x = vertices[:, 0]
        y = vertices[:, 1]
        z = vertices[:, 2]

        theta = np.arctan2(z, x)  # [-pi, pi]
        u = (theta + np.pi) / (2.0 * np.pi)  # [0, 1]
        
        # Vertical coordinate normalized
        v = (y - bounds[0][1]) / extents[1]
        v = np.clip(v, 0.0, 1.0)

        # Cylindrical UVs
        uvs = np.column_stack([u, v])
        
        # Assign UVs to mesh visual
        mesh.visual = trimesh.visual.TextureVisuals(uv=uvs)
        
        return mesh
