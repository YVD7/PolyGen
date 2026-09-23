import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
PRESETS_DIR = BASE_DIR / "app" / "presets"

# Ensure required directories exist
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
(STORAGE_DIR / "models").mkdir(parents=True, exist_ok=True)
(STORAGE_DIR / "textures").mkdir(parents=True, exist_ok=True)
(STORAGE_DIR / "exports").mkdir(parents=True, exist_ok=True)

# CORS configuration
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "*"
]

DEFAULT_TARGET_FACES = 10000
DEFAULT_TEXTURE_RES = 1024
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
