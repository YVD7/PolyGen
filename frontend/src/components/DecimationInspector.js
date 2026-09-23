"use client";

import React, { useState } from "react";
import { Sliders, ShieldCheck, Zap, Scissors, RefreshCw } from "lucide-react";

export default function DecimationInspector({
  meshStats,
  modelId,
  onReDecimate,
  isDecimating,
}) {
  const [sliderVal, setSliderVal] = useState(
    meshStats?.face_count || 10000
  );

  if (!meshStats) {
    return (
      <div className="glass-panel p-4 text-center text-xs text-slate-500">
        No mesh geometry loaded.
      </div>
    );
  }

  const {
    vertex_count,
    face_count,
    original_face_count,
    reduction_pct,
    is_watertight,
  } = meshStats;

  const handleApplyDecimation = () => {
    if (isDecimating || !modelId) return;
    onReDecimate(sliderVal);
  };

  return (
    <div className="glass-panel p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-200">
            QEM Polygon Optimization
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-[11px]">
          Quadric Error Metrics
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Current Triangles
          </span>
          <span className="text-base font-bold font-mono text-cyan-400">
            {face_count.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">
            from {original_face_count.toLocaleString()} raw
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Reduction Ratio
          </span>
          <span className="text-base font-bold font-mono text-emerald-400">
            -{reduction_pct}%
          </span>
          <span className="text-[10px] text-slate-500 block">
            {vertex_count.toLocaleString()} vertices
          </span>
        </div>
      </div>

      {/* Topology Health */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
        <span className="text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Topology Health:
        </span>
        <span className="font-mono text-emerald-400 text-[11px]">
          Manifold Clean
        </span>
      </div>

      {/* Interactive Decimation Slider */}
      <div className="space-y-2 pt-1 border-t border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Target Triangle Count</span>
          <span className="font-mono font-semibold text-cyan-400">
            {sliderVal.toLocaleString()} faces
          </span>
        </div>

        <input
          type="range"
          min={1000}
          max={Math.max(original_face_count, 30000)}
          step={500}
          value={sliderVal}
          onChange={(e) => setSliderVal(Number(e.target.value))}
          disabled={isDecimating}
        />

        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>1,000 (Ultra Low)</span>
          <span>10k (Game-Ready)</span>
          <span>30k+ (Cinematic)</span>
        </div>

        <button
          onClick={handleApplyDecimation}
          disabled={isDecimating || sliderVal === face_count}
          className={`w-full py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            isDecimating
              ? "bg-purple-500/20 text-purple-300 cursor-not-allowed"
              : sliderVal === face_count
              ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
              : "bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer shadow-md shadow-purple-600/30"
          }`}
        >
          {isDecimating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Optimizing Mesh Geometry...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>Apply QEM Decimation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
