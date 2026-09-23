import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
from typing import Dict, Any
from app.models.schemas import PBRMaterialSpecs

class TextureSynthesisEngine:
    """
    PBR Texture Synthesis Engine.
    Generates 5 full PBR texture maps (Albedo, Normal, Roughness, Metallic, Emissive)
    matching the decomposed prompt, category, and material specifications.
    Textures seamlessly wrap onto the UV-unwrapped mesh.
    """

    def __init__(self, output_dir: Path):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_pbr_pack(
        self,
        model_id: str,
        category: str,
        pbr_specs: PBRMaterialSpecs,
        resolution: int = 1024
    ) -> Dict[str, Path]:
        """
        Synthesizes high-resolution PBR texture maps.
        Returns dictionary of file paths: albedo, normal, roughness, metallic, emissive.
        """
        w, h = resolution, resolution

        # 1. Albedo (Base Color) Map
        albedo_img = self._generate_albedo(category, pbr_specs, w, h)
        albedo_path = self.output_dir / f"{model_id}_albedo.png"
        albedo_img.save(str(albedo_path))

        # 2. Normal Map (from procedural height / micro-details)
        normal_img = self._generate_normal_map(albedo_img, pbr_specs.normal_strength, w, h)
        normal_path = self.output_dir / f"{model_id}_normal.png"
        normal_img.save(str(normal_path))

        # 3. Roughness Map
        roughness_img = self._generate_roughness_map(category, pbr_specs.roughness, w, h)
        roughness_path = self.output_dir / f"{model_id}_roughness.png"
        roughness_img.save(str(roughness_path))

        # 4. Metallic Map
        metallic_img = self._generate_metallic_map(category, pbr_specs.metallic, w, h)
        metallic_path = self.output_dir / f"{model_id}_metallic.png"
        metallic_img.save(str(metallic_path))

        # 5. Emissive Glow Map
        emissive_img = self._generate_emissive_map(category, pbr_specs, w, h)
        emissive_path = self.output_dir / f"{model_id}_emissive.png"
        emissive_img.save(str(emissive_path))

        return {
            "albedo": albedo_path,
            "normal": normal_path,
            "roughness": roughness_path,
            "metallic": metallic_path,
            "emissive": emissive_path
        }

    def _generate_albedo(self, category: str, specs: PBRMaterialSpecs, w: int, h: int) -> Image.Image:
        # Base RGB
        base_rgb = tuple(int(c * 255) for c in specs.base_color)
        img = Image.new("RGB", (w, h), color=base_rgb)
        draw = ImageDraw.Draw(img)

        # Procedural noise & surface pattern
        np_arr = np.array(img, dtype=np.float32)
        noise = np.random.normal(0, 14, (h, w, 3))
        np_arr = np.clip(np_arr + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(np_arr)
        draw = ImageDraw.Draw(img)

        if category == "weapon":
            # Damascus steel patterns and edge highlight
            for y in range(0, h, 6):
                wave = int(math.sin(y / 15.0) * 8)
                shade = 20 if (y // 6) % 2 == 0 else -20
                draw.line([(0, y + wave), (w, y + wave)], fill=(max(0, min(255, base_rgb[0] + shade)),
                                                                 max(0, min(255, base_rgb[1] + shade)),
                                                                 max(0, min(255, base_rgb[2] + shade))), width=2)
            # Weathered rust flecks if rusted
            if "rust" in specs.material_name.lower():
                for _ in range(350):
                    rx = np.random.randint(0, w)
                    ry = np.random.randint(0, h)
                    rsize = np.random.randint(3, 14)
                    rust_color = (np.random.randint(120, 175), np.random.randint(60, 95), np.random.randint(30, 50))
                    draw.ellipse([rx, ry, rx + rsize, ry + rsize], fill=rust_color)

            # Central sapphire gem texture region
            if specs.emissive_intensity > 0:
                cx, cy = w // 2, h // 4
                for r in range(60, 0, -2):
                    g_val = int(220 * (1 - r / 60))
                    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(20, 120 + g_val // 2, 255))

        elif category == "sci_fi":
            # Panel lines, carbon fiber grid, technological circuits
            step = w // 16
            for x in range(0, w, step):
                draw.line([(x, 0), (x, h)], fill=(30, 35, 45), width=3)
            for y in range(0, h, step):
                draw.line([(0, y), (w, y)], fill=(30, 35, 45), width=3)
            # Warning stripes / accents
            for i in range(4):
                draw.polygon([(i * 50, 0), (i * 50 + 25, 0), (i * 50 - 50, 100), (i * 50 - 75, 100)], fill=(240, 180, 20))

        elif category == "architecture":
            # Stone brickwork and runic glyphs
            step_y = h // 12
            for row, y in enumerate(range(0, h, step_y)):
                draw.line([(0, y), (w, y)], fill=(40, 38, 35), width=3)
                offset = (w // 8) if row % 2 == 1 else 0
                for x in range(offset, w, w // 4):
                    draw.line([(x, y), (x, min(h, y + step_y))], fill=(40, 38, 35), width=3)

        return img.filter(ImageFilter.SMOOTH)

    def _generate_normal_map(self, albedo: Image.Image, strength: float, w: int, h: int) -> Image.Image:
        # Convert albedo to grayscale height map
        gray = albedo.convert("L")
        arr = np.array(gray, dtype=np.float32)

        # Sobel convolution for surface gradients
        sobel_x = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float32)
        sobel_y = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float32)

        from scipy.signal import convolve2d
        dx = convolve2d(arr, sobel_x, mode="same", boundary="symm") * (strength * 0.05)
        dy = convolve2d(arr, sobel_y, mode="same", boundary="symm") * (strength * 0.05)
        dz = np.ones_like(arr) * 255.0

        norm = np.sqrt(dx**2 + dy**2 + dz**2)
        nx = (dx / norm) * 127.5 + 127.5
        ny = (dy / norm) * 127.5 + 127.5
        nz = (dz / norm) * 127.5 + 127.5

        normal_data = np.stack([nx, ny, nz], axis=2).astype(np.uint8)
        return Image.fromarray(normal_data, mode="RGB")

    def _generate_roughness_map(self, category: str, base_roughness: float, w: int, h: int) -> Image.Image:
        base_val = int(base_roughness * 255)
        arr = np.full((h, w), base_val, dtype=np.float32)
        noise = np.random.normal(0, 25, (h, w))
        arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(arr, mode="L")
        return img.filter(ImageFilter.GaussianBlur(1.0))

    def _generate_metallic_map(self, category: str, base_metallic: float, w: int, h: int) -> Image.Image:
        base_val = int(base_metallic * 255)
        arr = np.full((h, w), base_val, dtype=np.uint8)
        img = Image.fromarray(arr, mode="L")
        return img

    def _generate_emissive_map(self, category: str, specs: PBRMaterialSpecs, w: int, h: int) -> Image.Image:
        if specs.emissive_intensity <= 0.01:
            return Image.new("RGB", (w, h), color=(0, 0, 0))

        img = Image.new("RGB", (w, h), color=(0, 0, 0))
        draw = ImageDraw.Draw(img)
        em_rgb = tuple(int(c * 255) for c in specs.emissive_color)

        if category == "weapon":
            # Center glowing gem in crossguard
            cx, cy = w // 2, h // 4
            for r in range(70, 0, -2):
                glow_factor = (1.0 - r / 70.0) ** 1.5
                c = tuple(int(ch * glow_factor) for ch in em_rgb)
                draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
        elif category == "sci_fi":
            # Thruster jet nozzles + cockpit HUD glow
            for tx in [w // 4, 3 * w // 4]:
                ty = 3 * h // 4
                for r in range(80, 0, -3):
                    glow_factor = (1.0 - r / 80.0) ** 1.3
                    c = tuple(int(ch * glow_factor) for ch in em_rgb)
                    draw.ellipse([tx - r, ty - r, tx + r, ty + r], fill=c)
        elif category == "architecture":
            # Ancient magical glowing runes along vertical pillar
            for y in range(h // 6, 5 * h // 6, 45):
                draw.text((w // 2 - 20, y), "ᚱ ᛟ ᚦ ᛗ ᛋ", fill=em_rgb)
        else:
            # Generic glowing core
            cx, cy = w // 2, h // 2
            for r in range(100, 0, -4):
                c = tuple(int(ch * (1.0 - r / 100.0)) for ch in em_rgb)
                draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)

        return img.filter(ImageFilter.GaussianBlur(2.0))
