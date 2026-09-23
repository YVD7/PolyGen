"use client";

import React from "react";
import {
  Sparkles,
  Layers,
  Compass,
  Box,
  Sun,
  RotateCw,
  Grid as GridIcon,
  Palette,
  Focus
} from "lucide-react";

export default function ViewportControls({
  shadingMode,
  setShadingMode,
  lightingPreset,
  setLightingPreset,
  autoRotate,
  setAutoRotate,
  showGrid,
  setShowGrid,
  viewportBg,
  setViewportBg,
  onResetCamera,
}) {
  const modes = [
    { id: "pbr", label: "PBR Lit", icon: Sparkles },
    { id: "wireframe", label: "Wireframe", icon: Layers },
    { id: "normals", label: "Normals", icon: Compass },
    { id: "clay", label: "Clay Studio", icon: Box },
  ];

  const lights = [
    { id: "studio", label: "Studio" },
    { id: "cyberpunk", label: "Cyberpunk" },
    { id: "sunset", label: "Sunset" },
  ];

  const bgOptions = [
    { id: "slate", label: "Slate", color: "#1e2538" },
    { id: "neutral", label: "Neutral Gray", color: "#334155" },
    { id: "light", label: "Light Studio", color: "#e2e8f0" },
    { id: "dark", label: "Deep Dark", color: "#0d111a" },
  ];

  return (
    <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none z-10">
      {/* Left: Shading Modes */}
      <div className="flex items-center gap-1 p-1 bg-black/75 backdrop-blur-md border border-white/15 rounded-lg pointer-events-auto shadow-xl">
        {modes.map((m) => {
          const Icon = m.icon;
          const active = shadingMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setShadingMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                active
                  ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/30"
                  : "text-slate-300 hover:text-white hover:bg-white/10 border border-transparent"
              }`}
              title={m.label}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Lighting, Background, Turntable, Grid */}
      <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
        {/* Background Color Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-black/75 backdrop-blur-md border border-white/15 rounded-lg shadow-xl">
          <Palette className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Backdrop:</span>
          {bgOptions.map((bg) => (
            <button
              key={bg.id}
              onClick={() => setViewportBg(bg.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                viewportBg === bg.id
                  ? "bg-cyan-500/30 text-white font-semibold border border-cyan-500/50 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/10 border border-transparent"
              }`}
              title={`Switch backdrop to ${bg.label}`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/30"
                style={{ backgroundColor: bg.color }}
              />
              <span className="text-[11px]">{bg.label}</span>
            </button>
          ))}
        </div>

        {/* Lighting Selector */}
        <div className="flex items-center gap-1 p-1 bg-black/75 backdrop-blur-md border border-white/15 rounded-lg shadow-xl">
          <Sun className="w-3.5 h-3.5 text-amber-400 ml-1.5" />
          {lights.map((l) => (
            <button
              key={l.id}
              onClick={() => setLightingPreset(l.id)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                lightingPreset === l.id
                  ? "bg-white/25 text-white font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Turntable Auto-rotate */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md border transition-all ${
            autoRotate
              ? "bg-cyan-500/25 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/30"
              : "bg-black/75 text-slate-300 hover:text-white border-white/15 hover:bg-white/10"
          }`}
          title="Toggle Turntable Rotation"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Turntable</span>
        </button>

        {/* Grid Floor Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1.5 rounded-lg backdrop-blur-md border transition-all ${
            showGrid
              ? "bg-cyan-500/25 text-cyan-300 border-cyan-500/50"
              : "bg-black/75 text-slate-400 hover:text-slate-200 border-white/15"
          }`}
          title="Toggle Ground Grid"
        >
          <GridIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
