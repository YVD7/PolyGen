"use client";

import React, { useState } from "react";
import { Sparkles, Wand2, Terminal, Shield, Zap, Pyramid, Package } from "lucide-react";

export default function PromptConsole({
  onGenerate,
  isGenerating,
  activePrompt,
  setActivePrompt,
}) {
  const [style, setStyle] = useState("game_ready");
  const [targetFaces, setTargetFaces] = useState(10000);
  const [textureRes, setTextureRes] = useState(1024);

  const samplePrompts = [
    {
      label: "Medieval Broadsword",
      icon: Shield,
      text: "A rusted, medieval broadsword with a glowing blue sapphire in the hilt.",
      faces: 10000,
    },
    {
      label: "Cyberpunk Drone",
      icon: Zap,
      text: "A sleek cyberpunk reconnaissance drone with twin neon cyan thruster pods and sensor dome.",
      faces: 12000,
    },
    {
      label: "Ancient Obelisk",
      icon: Pyramid,
      text: "An ancient monumental sandstone obelisk with glowing celestial rune carvings and pyramidion apex.",
      faces: 8500,
    },
    {
      label: "Fantasy Chest",
      icon: Package,
      text: "A sturdy oak treasure chest with curved barrel lid and heavy hammered iron reinforcement bands.",
      faces: 6500,
    },
  ];

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!activePrompt.trim() || isGenerating) return;
    onGenerate({
      prompt: activePrompt.trim(),
      style,
      target_faces: parseInt(targetFaces, 10),
      texture_res: parseInt(textureRes, 10),
      decimation_enabled: true,
    });
  };

  const handleSelectSample = (sample) => {
    setActivePrompt(sample.text);
    setTargetFaces(sample.faces);
    onGenerate({
      prompt: sample.text,
      style,
      target_faces: sample.faces,
      texture_res: textureRes,
      decimation_enabled: true,
    });
  };

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
              Text-to-3D Generator
            </h2>
            <p className="text-xs text-slate-400">
              LangChain Multi-Stage Agentic Pipeline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ONLINE
        </div>
      </div>

      {/* Main Prompt Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={activePrompt}
            onChange={(e) => setActivePrompt(e.target.value)}
            placeholder="Describe the 3D model (e.g. 'A rusted, medieval broadsword with a glowing blue sapphire in the hilt.')..."
            rows={3}
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 resize-none font-sans"
            disabled={isGenerating}
          />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Project Showcase Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((s, idx) => {
              const Icon = s.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-xs text-slate-300 hover:text-cyan-300 transition-all text-left"
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generation Controls: Budget & Resolution */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Polygon Budget (Target Faces)
            </label>
            <select
              value={targetFaces}
              onChange={(e) => setTargetFaces(Number(e.target.value))}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value={5000}>5,000 Faces (Mobile / WebXR)</option>
              <option value={10000}>10,000 Faces (Game-Ready Engine)</option>
              <option value={20000}>20,000 Faces (High-Detail Cinematic)</option>
              <option value={40000}>40,000 Faces (Uncompressed Raw)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              PBR Texture Resolution
            </label>
            <select
              value={textureRes}
              onChange={(e) => setTextureRes(Number(e.target.value))}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value={1024}>1024 x 1024 (Optimized PBR Pack)</option>
              <option value={2048}>2048 x 2048 (4K Ultra Fidelity)</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isGenerating || !activePrompt.trim()}
          className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
            isGenerating
              ? "bg-cyan-500/30 text-cyan-200 cursor-not-allowed border border-cyan-500/40"
              : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold shadow-cyan-500/25 hover:shadow-cyan-500/40 cursor-pointer"
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing 3D Asset Pipeline...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate 3D Asset</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
