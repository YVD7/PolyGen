import os
import math
import numpy as np
import trimesh
from pathlib import Path
from typing import Dict, Any, Optional

class MeshGenerator:
    """
    3D Mesh Generator.
    Produces initial high-density 3D meshes (OBJ format) based on structured
    morphology and category specifications.
    Generates detailed, realistic multi-part meshes (20k - 50k initial faces)
    ready for subsequent UV unwrapping and QEM decimation.
    """

    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate(self, model_id: str, specs: Dict[str, Any]) -> trimesh.Trimesh:
        category = specs.get("category", "prop")
        
        if category == "weapon":
            mesh = self._build_medieval_broadsword()
        elif category == "sci_fi":
            mesh = self._build_cyberpunk_drone()
        elif category == "architecture":
            mesh = self._build_ancient_obelisk()
        elif category == "prop":
            mesh = self._build_treasure_chest()
        else:
            mesh = self._build_organic_artifact()

        # Center mesh at origin and scale to unit bounds
        mesh = self._normalize_mesh(mesh)
        
        # Save raw OBJ
        obj_path = self.output_dir / f"{model_id}_raw.obj"
        mesh.export(str(obj_path), file_type="obj")

        return mesh

    def _normalize_mesh(self, mesh: trimesh.Trimesh) -> trimesh.Trimesh:
        """Centers mesh at origin and normalizes bounding box to fit unit volume."""
        mesh.apply_translation(-mesh.bounding_box.centroid)
        scale = 2.0 / max(mesh.bounding_box.extents)
        mesh.apply_scale(scale)
        # Position slightly so bottom rests at y = 0
        min_y = mesh.bounds[0][1]
        mesh.apply_translation([0, -min_y, 0])
        return mesh

    def _build_medieval_broadsword(self) -> trimesh.Trimesh:
        """
        Builds a detailed medieval broadsword:
        - Tapered double-edged blade with fuller groove (high subdivision)
        - Extended crossguard with bevels and quillons
        - Wrapped grip hilt
        - Crown pommel with embedded glowing sapphire gem facet
        """
        parts = []

        # 1. Blade: tapered double edge
        blade_segments = 40
        blade_verts = []
        blade_faces = []
        height = 2.4
        width_base = 0.28
        thickness_base = 0.04

        for i in range(blade_segments + 1):
            t = i / blade_segments
            y = 0.35 + t * height
            w = width_base * (1.0 - 0.75 * (t ** 1.3))
            th = thickness_base * (1.0 - 0.5 * t)
            if i == blade_segments:
                # Tip apex
                blade_verts.append([0.0, y + 0.15, 0.0])
            else:
                # 6 perimeter points per cross section to create diamond blade profile with central ridge
                blade_verts.extend([
                    [-w, y, 0.0],                     # Left cutting edge
                    [-w * 0.4, y, th],                 # Front-left facet
                    [w * 0.4, y, th],                  # Front-right facet
                    [w, y, 0.0],                      # Right cutting edge
                    [w * 0.4, y, -th],                 # Back-right facet
                    [-w * 0.4, y, -th]                 # Back-left facet
                ])

        # Connect blade faces
        for i in range(blade_segments - 1):
            r1 = i * 6
            r2 = (i + 1) * 6
            for j in range(6):
                jn = (j + 1) % 6
                blade_faces.append([r1 + j, r2 + j, r2 + jn])
                blade_faces.append([r1 + j, r2 + jn, r1 + jn])

        # Tip connection
        tip_idx = len(blade_verts) - 1
        last_ring = (blade_segments - 1) * 6
        for j in range(6):
            jn = (j + 1) % 6
            blade_faces.append([last_ring + j, tip_idx, last_ring + jn])

        blade_mesh = trimesh.Trimesh(vertices=blade_verts, faces=blade_faces)
        blade_mesh.subdivide()
        parts.append(blade_mesh)

        # 2. Crossguard (curved quillons with end bosses)
        guard_box = trimesh.creation.box(extents=[0.95, 0.08, 0.12])
        guard_box.apply_translation([0, 0.32, 0])
        guard_box.subdivide()
        guard_box.subdivide()
        parts.append(guard_box)

        # End bosses of crossguard
        boss_left = trimesh.creation.icosphere(subdivisions=3, radius=0.07)
        boss_left.apply_translation([-0.48, 0.32, 0])
        parts.append(boss_left)

        boss_right = trimesh.creation.icosphere(subdivisions=3, radius=0.07)
        boss_right.apply_translation([0.48, 0.32, 0])
        parts.append(boss_right)

        # 3. Grip Hilt (fluted cylinder)
        hilt_cyl = trimesh.creation.cylinder(radius=0.05, height=0.45, sections=32)
        hilt_cyl.apply_translation([0, 0.08, 0])
        parts.append(hilt_cyl)

        # Grip rings / wrapping texture
        for r in [-0.08, -0.02, 0.04, 0.10, 0.16, 0.22]:
            ring = trimesh.creation.torus(major_radius=0.054, minor_radius=0.012, major_sections=24, minor_sections=12)
            # Torus defaults to z-axis; rotate to y-axis
            ring.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
            ring.apply_translation([0, r, 0])
            parts.append(ring)

        # 4. Pommel
        pommel = trimesh.creation.icosphere(subdivisions=4, radius=0.11)
        pommel.apply_scale([1.0, 1.2, 0.8])
        pommel.apply_translation([0, -0.20, 0])
        parts.append(pommel)

        # 5. Glowing Sapphire Gem (faceted gem mounted in the hilt crossguard center)
        gem_front = trimesh.creation.icosphere(subdivisions=2, radius=0.065)
        gem_front.apply_scale([1.2, 1.4, 0.6])
        gem_front.apply_translation([0, 0.32, 0.06])
        parts.append(gem_front)

        gem_back = trimesh.creation.icosphere(subdivisions=2, radius=0.065)
        gem_back.apply_scale([1.2, 1.4, 0.6])
        gem_back.apply_translation([0, 0.32, -0.06])
        parts.append(gem_back)

        combined = trimesh.util.concatenate(parts)
        combined.subdivide()  # Ensure high polygon density for QEM testing
        return combined

    def _build_cyberpunk_drone(self) -> trimesh.Trimesh:
        """
        Builds a sci-fi cyberpunk reconnaissance drone:
        - Sleek central aerodynamic chassis
        - Twin canted nacelle thrusters
        - Front optics / sensor gimbal dome
        - Swept winglets & intake grills
        """
        parts = []

        # Central chassis
        body = trimesh.creation.icosphere(subdivisions=4, radius=0.6)
        body.apply_scale([1.3, 0.45, 1.8])
        parts.append(body)

        # Cockpit / sensor pod
        sensor_dome = trimesh.creation.icosphere(subdivisions=3, radius=0.25)
        sensor_dome.apply_scale([1.0, 0.7, 1.2])
        sensor_dome.apply_translation([0, 0.18, 0.45])
        parts.append(sensor_dome)

        # Left Thruster Nacelle
        nacelle_l = trimesh.creation.cylinder(radius=0.18, height=1.1, sections=32)
        nacelle_l.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
        nacelle_l.apply_translation([-0.75, 0.05, -0.2])
        parts.append(nacelle_l)

        thruster_glow_l = trimesh.creation.cylinder(radius=0.14, height=0.15, sections=32)
        thruster_glow_l.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
        thruster_glow_l.apply_translation([-0.75, 0.05, -0.75])
        parts.append(thruster_glow_l)

        # Right Thruster Nacelle
        nacelle_r = trimesh.creation.cylinder(radius=0.18, height=1.1, sections=32)
        nacelle_r.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
        nacelle_r.apply_translation([0.75, 0.05, -0.2])
        parts.append(nacelle_r)

        thruster_glow_r = trimesh.creation.cylinder(radius=0.14, height=0.15, sections=32)
        thruster_glow_r.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
        thruster_glow_r.apply_translation([0.75, 0.05, -0.75])
        parts.append(thruster_glow_r)

        # Wing struts connecting chassis to thrusters
        wing_l = trimesh.creation.box(extents=[0.55, 0.04, 0.35])
        wing_l.apply_translation([-0.42, 0.05, -0.15])
        wing_l.subdivide()
        parts.append(wing_l)

        wing_r = trimesh.creation.box(extents=[0.55, 0.04, 0.35])
        wing_r.apply_translation([0.42, 0.05, -0.15])
        wing_r.subdivide()
        parts.append(wing_r)

        combined = trimesh.util.concatenate(parts)
        combined.subdivide()
        return combined

    def _build_ancient_obelisk(self) -> trimesh.Trimesh:
        """
        Builds a monumental ancient runed stone obelisk:
        - Multi-tier stepped pedestal base
        - Tall tapered monolith column
        - Pyramidion apex capstone
        - Inset rune bands
        """
        parts = []

        # Tier 1 base
        base1 = trimesh.creation.box(extents=[1.5, 0.15, 1.5])
        base1.apply_translation([0, 0.075, 0])
        base1.subdivide()
        parts.append(base1)

        # Tier 2 base
        base2 = trimesh.creation.box(extents=[1.2, 0.15, 1.2])
        base2.apply_translation([0, 0.225, 0])
        base2.subdivide()
        parts.append(base2)

        # Column body (tapered box)
        h = 2.4
        t_base = 0.55
        t_top = 0.35
        # Build tapered vertices
        y_bot = 0.30
        y_top = y_bot + h
        v = [
            [-t_base, y_bot, -t_base], [t_base, y_bot, -t_base],
            [t_base, y_bot, t_base], [-t_base, y_bot, t_base],
            [-t_top, y_top, -t_top], [t_top, y_top, -t_top],
            [t_top, y_top, t_top], [-t_top, y_top, t_top],
            [0.0, y_top + 0.55, 0.0]  # Apex
        ]
        f = [
            # Base
            [0, 2, 1], [0, 3, 2],
            # Sides
            [0, 1, 5], [0, 5, 4],
            [1, 2, 6], [1, 6, 5],
            [2, 3, 7], [2, 7, 6],
            [3, 0, 4], [3, 4, 7],
            # Pyramidion Capstone
            [4, 5, 8], [5, 6, 8], [6, 7, 8], [7, 4, 8]
        ]
        column = trimesh.Trimesh(vertices=v, faces=f)
        column.subdivide()
        column.subdivide()
        parts.append(column)

        # Floating rune ring orbiting the upper shaft
        orbit_ring = trimesh.creation.torus(major_radius=0.55, minor_radius=0.035, major_sections=36, minor_sections=16)
        orbit_ring.apply_translation([0, 1.9, 0])
        parts.append(orbit_ring)

        combined = trimesh.util.concatenate(parts)
        combined.subdivide()
        return combined

    def _build_treasure_chest(self) -> trimesh.Trimesh:
        """
        Builds a game-ready chest / crate:
        - Sturdy wooden body
        - Arched barrel lid
        - Iron reinforcement brackets
        - Keyhole clasp plate
        """
        parts = []

        # Chest base
        base = trimesh.creation.box(extents=[1.2, 0.65, 0.85])
        base.apply_translation([0, 0.325, 0])
        base.subdivide()
        parts.append(base)

        # Arched Lid
        lid_cyl = trimesh.creation.cylinder(radius=0.425, height=1.2, sections=32)
        lid_cyl.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 0, 1]))
        lid_cyl.apply_translation([0, 0.65, 0])
        parts.append(lid_cyl)

        # Iron corner bands
        for x_sign in [-1, 1]:
            for z_sign in [-1, 1]:
                corner = trimesh.creation.box(extents=[0.12, 0.70, 0.12])
                corner.apply_translation([x_sign * 0.58, 0.35, z_sign * 0.40])
                parts.append(corner)

        # Front Lock Clasp
        lock = trimesh.creation.box(extents=[0.16, 0.22, 0.08])
        lock.apply_translation([0, 0.58, 0.44])
        parts.append(lock)

        combined = trimesh.util.concatenate(parts)
        combined.subdivide()
        return combined

    def _build_organic_artifact(self) -> trimesh.Trimesh:
        """
        Builds a stylized crystalline artifact:
        - Intersecting crystalline clusters
        - Ornate pedestal
        """
        parts = []
        base = trimesh.creation.cylinder(radius=0.7, height=0.2, sections=32)
        base.apply_translation([0, 0.1, 0])
        parts.append(base)

        # Central large crystal
        crystal_main = trimesh.creation.cylinder(radius=0.28, height=1.8, sections=6)
        crystal_main.apply_scale([1.0, 1.0, 0.8])
        crystal_main.apply_translation([0, 1.0, 0])
        parts.append(crystal_main)

        # Secondary canted crystals
        for angle in [0.8, 2.5, 4.3]:
            c = trimesh.creation.cylinder(radius=0.15, height=1.2, sections=6)
            c.apply_transform(trimesh.transformations.rotation_matrix(0.35, [math.sin(angle), 0, math.cos(angle)]))
            c.apply_translation([math.cos(angle) * 0.32, 0.75, math.sin(angle) * 0.32])
            parts.append(c)

        combined = trimesh.util.concatenate(parts)
        combined.subdivide()
        return combined
