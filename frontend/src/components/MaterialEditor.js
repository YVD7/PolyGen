"use client";

import React from "react";
import { Sliders, Droplets, Sparkles, Flame } from "lucide-react";

export default function MaterialEditor({
  materialSettings,
  setMaterialSettings,
  materialSpecs,
}) {
  return (
    <div className="glass-panel p-4 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-200">
            PBR Material Tuning
          </h3>
        </div>
        {materialSpecs?.material_name && (
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 truncate max-w-[140px]">
            {materialSpecs.material_name}
          </span>
        )}
      </div>

      <div className="space-y-3 text-xs">
        {/* Roughness Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Roughness (Glossiness)</span>
            <span className="font-mono text-cyan-400 font-semibold">
              {(materialSettings.roughness ?? 0.5).toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.02}
            value={materialSettings.roughness ?? 0.5}
            onChange={(e) =>
              setMaterialSettings((prev) => ({
                ...prev,
                roughness: parseFloat(e.target.value),
              }))
            }
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Mirror Polished (0.0)</span>
            <span>Matte Rough (1.0)</span>
          </div>
        </div>

        {/* Metalness Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Metalness (Conductor)</span>
            <span className="font-mono text-cyan-400 font-semibold">
              {(materialSettings.metalness ?? 0.5).toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.02}
            value={materialSettings.metalness ?? 0.5}
            onChange={(e) =>
              setMaterialSettings((prev) => ({
                ...prev,
                metalness: parseFloat(e.target.value),
              }))
            }
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Dielectric (0.0)</span>
            <span>Pure Metal (1.0)</span>
          </div>
        </div>

        {/* Emissive Glow Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-slate-400">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              Emissive Glow Boost
            </span>
            <span className="font-mono text-cyan-400 font-semibold">
              {(materialSettings.emissiveIntensity ?? 1.0).toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min={0.0}
            max={5.0}
            step={0.1}
            value={materialSettings.emissiveIntensity ?? 1.0}
            onChange={(e) =>
              setMaterialSettings((prev) => ({
                ...prev,
                emissiveIntensity: parseFloat(e.target.value),
              }))
            }
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Unlit (0.0x)</span>
            <span>Hyper-Glow (5.0x)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
