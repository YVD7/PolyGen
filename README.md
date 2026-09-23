# PolyGen: Generative Text-to-3D Asset Pipeline

> An end-to-end generative 3D asset pipeline transforming natural language prompts into game-ready, texture-wrapped, and QEM-decimated `.glb` models for Unreal Engine, Unity, and WebXR.

---

## 🌟 Key Features

1. **LangChain Multi-Stage Agentic Orchestration**:
   - Decomposes natural language prompts (e.g., *"A rusted medieval broadsword with a glowing blue sapphire in the hilt"*) into 3D morphology, topological components, and PBR material definitions.
2. **3D Mesh Generation & Wavefront OBJ Synthesis**:
   - Generates high-density initial meshes with parametric structures and coordinates centered and normalized to standard game-engine bounding units.
3. **Trimesh Automated UV Parameterization**:
   - Computes conformal cylindrical/spherical UV layout parameterization and vertex normals.
4. **PBR Texture Synthesis Engine**:
   - Synthesizes 5 full PBR texture maps:
     - **Albedo / Base Color Map** (RGB)
     - **Tangent Normal Map** (Sobel-filtered surface bump details)
     - **Roughness Map** (Grayscale microfacet roughness)
     - **Metallic Map** (Grayscale dielectric vs conductor)
     - **Emissive Map** (RGB glow for gems, energy cores, and thrusters)
5. **Quadric Error Metrics (QEM) Decimation**:
   - Uses `fast_simplification` and Trimesh QEM algorithm to optimize high-poly meshes down to game-ready polygon budgets (e.g. 50k+ down to 10k faces) while preserving silhouette and hard edges.
   - Interactive live re-decimation slider in the studio UI.
6. **Game Engine Export Suite**:
   - Direct download of standard binary `.glb` (glTF 2.0 with embedded PBR textures & UVs) and `.obj`.
   - Download individual high-res PBR texture packs.
7. **React Three Fiber (R3F) 3D Studio Web Viewer**:
   - Orbit controls, lighting presets (Studio, Cyberpunk Neon, Sunset), and ground grid.
   - Shading modes: **PBR Lit**, **Wireframe Topology Inspection**, **Vertex Normals**, and **Clay Studio**.
   - Live PBR tuning: Roughness, Metalness, and Emissive glow intensity sliders.

---

## 🚀 Quick Start

### 1. Backend (FastAPI + LangChain + Trimesh)
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is accessible at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.

### 2. Frontend (Next.js + React Three Fiber)
```bash
cd frontend
npm run dev
```
Open `http://localhost:3000` to access the PolyGen Studio interface.

---

## 📁 Repository Structure

```
PolyGen/
├── backend/
│   ├── .venv/                     # Python 3.14 virtual environment
│   ├── app/
│   │   ├── main.py                # FastAPI REST & asset streaming endpoints
│   │   ├── config.py              # Configuration & storage paths
│   │   ├── models/schemas.py      # Pydantic schemas (Pipeline stages, Mesh stats, PBR specs)
│   │   ├── pipeline/
│   │   │   ├── orchestrator.py    # LangChain multi-stage coordinator
│   │   │   ├── prompt_engine.py   # LangChain prompt decomposition agent
│   │   │   ├── mesh_generator.py  # 3D mesh synthesis (OBJ format)
│   │   │   ├── uv_unwrapper.py    # Trimesh conformal UV parameterization
│   │   │   ├── texture_engine.py  # PBR texture synthesizer (Albedo, Normal, Emissive)
│   │   │   ├── decimation.py      # Quadric Error Metrics (QEM) decimation
│   │   │   └── exporter.py        # GLB & OBJ binary packaging
│   │   └── presets/
│   │       └── preset_loader.py   # Preconfigured models (Broadsword, Drone, Obelisk, Chest)
│   ├── requirements.txt
│   └── run.sh
├── frontend/
│   ├── package.json               # Next.js, R3F, Drei, Three, Lucide
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js            # Main PolyGen Studio workstation
│   │   │   ├── layout.js          # Root layout with fonts & metadata
│   │   │   └── globals.css        # Obsidian & neon glassmorphism design system
│   │   ├── components/
│   │   │   ├── Viewer3D.js        # R3F Canvas with lighting, shadows, grid
│   │   │   ├── ModelRenderer.js   # GLTF / PBR / Wireframe topology shader
│   │   │   ├── ViewportControls.js# Shading & lighting toolbar
│   │   │   ├── PromptConsole.js   # Text-to-3D generation console
│   │   │   ├── StageStepper.js    # Multi-stage live progress & timings
│   │   │   ├── DecimationInspector.js # QEM reduction stats & dynamic slider
│   │   │   ├── MaterialEditor.js  # Live PBR parameter tweak sliders
│   │   │   ├── ExportModal.js     # Game engine download suite (GLB, OBJ, PBR)
│   │   │   └── AssetLibrary.js    # Preset gallery
│   │   └── utils/
│   │       └── api.js             # API connector
└── README.md
```
