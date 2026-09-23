"use client";

import React, { useState, useEffect } from "react";
import {
  Boxes,
  Sparkles,
  Layers,
  Cpu,
  Download,
  Terminal,
  Activity,
  Github,
  HelpCircle,
  ExternalLink,
  Shield,
  Zap
} from "lucide-react";

import Viewer3D from "../components/Viewer3D";
import ViewportControls from "../components/ViewportControls";
import PromptConsole from "../components/PromptConsole";
import StageStepper from "../components/StageStepper";
import DecimationInspector from "../components/DecimationInspector";
import MaterialEditor from "../components/MaterialEditor";
import ExportModal from "../components/ExportModal";
import AssetLibrary from "../components/AssetLibrary";

import {
  fetchPresets,
  generate3DAsset,
  getTaskStatus,
  decimateMesh,
  getGlbUrl
} from "../utils/api";

export default function PolyGenStudio() {
  // Active model state
  const [activePrompt, setActivePrompt] = useState(
    "A rusted, medieval broadsword with a glowing blue sapphire in the hilt."
  );
  const [currentModelId, setCurrentModelId] = useState("preset_broadsword");
  const [currentModelUrl, setCurrentModelUrl] = useState(getGlbUrl("preset_broadsword"));

  // Generation & Pipeline state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDecimating, setIsDecimating] = useState(false);
  const [taskStatus, setTaskStatus] = useState(null);
  const [presets, setPresets] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  // 3D Viewport state
  const [shadingMode, setShadingMode] = useState("pbr");
  const [lightingPreset, setLightingPreset] = useState("studio");
  const [viewportBg, setViewportBg] = useState("slate");
  const [autoRotate, setAutoRotate] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // PBR Material tweaks
  const [materialSettings, setMaterialSettings] = useState({
    roughness: 0.5,
    metalness: 0.7,
    emissiveIntensity: 2.5,
  });

  // Load presets on mount
  useEffect(() => {
    async function loadInitial() {
      try {
        const list = await fetchPresets();
        setPresets(list);

        // Fetch initial hero status for preset_broadsword
        try {
          const hero = await getTaskStatus("preset_broadsword");
          if (hero) {
            setTaskStatus(hero);
            if (hero.material_specs) {
              setMaterialSettings({
                roughness: hero.material_specs.roughness,
                metalness: hero.material_specs.metallic,
                emissiveIntensity: hero.material_specs.emissive_intensity || 2.5,
              });
            }
          }
        } catch {
          // If not ready yet, keep default
        }
      } catch (err) {
        console.warn("Backend not yet connected or initializing:", err);
      }
    }
    loadInitial();
  }, []);

  // Handle generation submission
  const handleGenerate = async (payload) => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const result = await generate3DAsset(payload);
      setTaskStatus(result);
      setCurrentModelId(result.id);
      setCurrentModelUrl(getGlbUrl(result.id));

      if (result.material_specs) {
        setMaterialSettings({
          roughness: result.material_specs.roughness,
          metalness: result.material_specs.metallic,
          emissiveIntensity: result.material_specs.emissive_intensity || 1.0,
        });
      }

      // Check if finished or polling required
      if (result.status === "completed") {
        setIsGenerating(false);
      } else {
        // Polling loop for pipeline stages
        const interval = setInterval(async () => {
          try {
            const status = await getTaskStatus(result.id);
            setTaskStatus(status);
            if (status.status === "completed" || status.status === "failed") {
              clearInterval(interval);
              setIsGenerating(false);
              if (status.status === "completed") {
                setCurrentModelUrl(getGlbUrl(status.id));
              } else {
                setErrorMsg(status.error || "Generation pipeline failed");
              }
            }
          } catch {
            clearInterval(interval);
            setIsGenerating(false);
          }
        }, 800);
      }
    } catch (err) {
      console.error("Generation error:", err);
      setErrorMsg(err.message || "Failed to trigger generation");
      setIsGenerating(false);
    }
  };

  // Handle dynamic QEM re-decimation
  const handleReDecimate = async (targetFaces) => {
    if (!currentModelId) return;
    setIsDecimating(true);
    try {
      const res = await decimateMesh(currentModelId, targetFaces);
      // Force reload glb by appending timestamp query
      setCurrentModelUrl(`${getGlbUrl(currentModelId)}?t=${Date.now()}`);
      if (taskStatus && taskStatus.mesh_stats) {
        setTaskStatus({
          ...taskStatus,
          mesh_stats: {
            ...taskStatus.mesh_stats,
            face_count: res.new_faces,
            reduction_pct: res.reduction_pct,
          },
        });
      }
    } catch (err) {
      console.error("Decimation error:", err);
      setErrorMsg("Failed to re-decimate mesh");
    } finally {
      setIsDecimating(false);
    }
  };

  // Handle selecting a preset from the library
  const handleSelectPreset = async (preset) => {
    setActivePrompt(preset.prompt);
    await handleGenerate({
      prompt: preset.prompt,
      style: "game_ready",
      target_faces: preset.target_faces,
      texture_res: 1024,
      decimation_enabled: true,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e]">
      {/* Top Navbar */}
      <header className="h-16 px-6 border-b border-white/10 bg-[#090b12]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Boxes className="w-5 h-5 text-black font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white font-sans">
                POLYGEN
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                v2.0 3D ENGINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Generative Text-to-3D Asset Pipeline &amp; QEM Decimation Studio
            </p>
          </div>
        </div>

        {/* Pipeline Architecture Badges */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>LangChain Orchestrator</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-slate-300">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Trimesh UV Engine</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>PBR Texture Synthesis</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-slate-300">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>QEM Decimator</span>
          </div>
        </div>

        {/* Server Connection Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Backend 8000</span>
          </div>
        </div>
      </header>

      {/* Error banner if any */}
      {errorMsg && (
        <div className="bg-red-500/15 border-b border-red-500/30 px-6 py-2.5 text-xs text-red-300 flex items-center justify-between">
          <span>Error: {errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-white ml-4 font-mono font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Studio Workstation Layout */}
      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1920px] mx-auto w-full">
        {/* Left Column: Command & Pipeline Controls (4 Cols) */}
        <div className="lg:col-span-4 space-y-5 flex flex-col">
          {/* Prompt Console */}
          <PromptConsole
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            activePrompt={activePrompt}
            setActivePrompt={setActivePrompt}
          />

          {/* Pipeline Execution Stepper */}
          {taskStatus && <StageStepper taskStatus={taskStatus} />}

          {/* QEM Decimation & Topology Inspector */}
          {taskStatus?.mesh_stats && (
            <DecimationInspector
              meshStats={taskStatus.mesh_stats}
              modelId={currentModelId}
              onReDecimate={handleReDecimate}
              isDecimating={isDecimating}
            />
          )}

          {/* Real-time PBR Material Editor */}
          <MaterialEditor
            materialSettings={materialSettings}
            setMaterialSettings={setMaterialSettings}
            materialSpecs={taskStatus?.material_specs}
          />
        </div>

        {/* Right Column: 3D Viewport, Export Suite, Showcase Library (8 Cols) */}
        <div className="lg:col-span-8 space-y-5 flex flex-col">
          {/* 3D Viewport Container */}
          <div className="relative flex-1 min-h-[500px] lg:min-h-[560px] glass-panel overflow-hidden flex flex-col">
            {/* Top Viewport Overlay Controls */}
            <ViewportControls
              shadingMode={shadingMode}
              setShadingMode={setShadingMode}
              lightingPreset={lightingPreset}
              setLightingPreset={setLightingPreset}
              autoRotate={autoRotate}
              setAutoRotate={setAutoRotate}
              showGrid={showGrid}
              setShowGrid={setShowGrid}
              viewportBg={viewportBg}
              setViewportBg={setViewportBg}
            />

            {/* R3F 3D Canvas */}
            <div className="flex-1 w-full h-full">
              <Viewer3D
                modelUrl={currentModelUrl}
                shadingMode={shadingMode}
                lightingPreset={lightingPreset}
                viewportBg={viewportBg}
                materialSettings={materialSettings}
                autoRotate={autoRotate}
                showGrid={showGrid}
              />
            </div>

            {/* Bottom Viewport Info Bar */}
            <div className="px-4 py-2.5 bg-black/70 backdrop-blur-md border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-medium">Asset:</span>
                <span className="text-slate-200 truncate max-w-[280px] font-mono text-[11px]">
                  {activePrompt}
                </span>
              </div>

              {taskStatus?.mesh_stats && (
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <div className="text-slate-400">
                    Triangles:{" "}
                    <span className="text-cyan-400 font-semibold">
                      {taskStatus.mesh_stats.face_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Vertices:{" "}
                    <span className="text-purple-300 font-semibold">
                      {taskStatus.mesh_stats.vertex_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-400 hidden sm:block">
                    Format:{" "}
                    <span className="text-emerald-400 font-semibold">
                      glTF 2.0 (Binary)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Game Engine Export Suite */}
          <ExportModal
            modelId={currentModelId}
            prompt={activePrompt}
            meshStats={taskStatus?.mesh_stats}
          />

          {/* Showcase Library & Presets */}
          <AssetLibrary
            presets={presets}
            onSelectPreset={handleSelectPreset}
            activeModelId={currentModelId}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 px-6 border-t border-white/5 bg-[#05060a] flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>PolyGen Generative Text-to-3D Pipeline</span>
          <span>•</span>
          <span>Infotact Solutions Vol. II</span>
        </div>
        <div className="flex items-center gap-4">
          <span>TripoSR / Shap-E Diffusion Architecture</span>
          <span>•</span>
          <span>FastAPI + LangChain + Trimesh</span>
        </div>
      </footer>
    </div>
  );
}
