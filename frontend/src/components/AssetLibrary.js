"use client";

import React from "react";
import { FolderGit2, Sparkles, Box, Check } from "lucide-react";

export default function AssetLibrary({
  presets,
  onSelectPreset,
  activeModelId,
}) {
  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-200">
            Showcase Library
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {presets.length} Models
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {presets.map((preset) => {
          const isActive = activeModelId === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                isActive
                  ? "bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/15"
                  : "bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/15"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-cyan-300 border border-white/5">
                  {preset.preview_tag}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 font-bold">
                    <Check className="w-3 h-3" /> ACTIVE
                  </span>
                )}
              </div>

              <h4 className="text-xs font-semibold text-white mb-1 line-clamp-1">
                {preset.name}
              </h4>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                {preset.description}
              </p>

              <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[10px] font-mono text-slate-400">
                <span>{preset.target_faces.toLocaleString()} tris</span>
                <span className="text-cyan-400">Load &gt;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
