from typing import List
from app.models.schemas import PresetItem

PRESET_MODELS: List[PresetItem] = [
    PresetItem(
        id="preset_broadsword",
        name="Rusted Medieval Broadsword",
        prompt="A rusted, medieval broadsword with a glowing blue sapphire in the hilt.",
        category="weapon",
        description="Dual-edged weathered blade with fullers, bronze-iron crossguard, and an embedded luminescent sapphire gem.",
        target_faces=10000,
        material_type="Weathered Iron & Glowing Sapphire",
        preview_tag="Hero Asset"
    ),
    PresetItem(
        id="preset_drone",
        name="Cyberpunk Recon Drone",
        prompt="A sleek cyberpunk reconnaissance drone with twin neon cyan thruster pods and sensor dome.",
        category="sci_fi",
        description="Aerodynamic carbon-composite chassis with twin canted engine pods and luminescent navigation conduits.",
        target_faces=12000,
        material_type="Matte Titanium & Neon Cyan",
        preview_tag="Sci-Fi Vehicle"
    ),
    PresetItem(
        id="preset_obelisk",
        name="Ancient Runed Obelisk",
        prompt="An ancient monumental sandstone obelisk with glowing celestial rune carvings and pyramidion apex.",
        category="architecture",
        description="Stepped weathered stone pedestal with monolithic shaft inscribed with illuminated mystical glyphs.",
        target_faces=8500,
        material_type="Sandstone & Celestial Emissive",
        preview_tag="Environment Prop"
    ),
    PresetItem(
        id="preset_chest",
        name="Reinforced Fantasy Chest",
        prompt="A sturdy oak treasure chest with curved barrel lid and heavy hammered iron reinforcement bands.",
        category="prop",
        description="Handcrafted wooden chest with riveted metal corners, arched lid, and antique brass latch.",
        target_faces=6500,
        material_type="Polished Wood & Hammered Iron",
        preview_tag="Game Prop"
    )
]

def get_presets() -> List[PresetItem]:
    return PRESET_MODELS
