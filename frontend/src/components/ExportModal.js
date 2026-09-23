"use client";

import React from "react";
import { Download, Box, Image as ImageIcon, ExternalLink, Gamepad2 } from "lucide-react";
import { getGlbUrl, getObjUrl, getTextureUrl } from "../utils/api";

export default function ExportModal({ modelId, prompt, meshStats }) {
  if (!modelId) return null;

  const glbUrl = getGlbUrl(modelId);
  const objUrl = getObjUrl(modelId);

  const textureTypes = [
    { id: "albedo", name: "Albedo / Base Color", ext: "PNG" },
    { id: "normal", name: "Normal (Tangent Bump)", ext: "PNG" },
    { id: "roughness", name: "PBR Roughness", ext: "PNG" },
    { id: "metallic", name: "PBR Metalness", ext: "PNG" },
    { id: "emissive", name: "Emissive Glow", ext: "PNG" },
  ];

  return (
    <div className="glass-panel p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-200">
            Game Engine Export Suite
          </h3>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <Gamepad2 className="w-3.5 h-3.5" />
          UE5 & Unity Ready
        </div>
      </div>

      {/* Main Download Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* GLB Download */}
        <a
          href={glbUrl}
          download={`${modelId}.glb`}
          className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/20 hover:from-emerald-500/40 hover:to-teal-500/30 border border-emerald-500/30 hover:border-emerald-400/50 text-slate-200 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Download .GLB</div>
              <div className="text-[10px] text-slate-400">Standard Binary glTF 2.0</div>
            </div>
          </div>
          <Download className="w-4 h-4 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
        </a>

        {/* OBJ Download */}
        <a
          href={objUrl}
          download={`${modelId}.obj`}
          className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-white/10 text-slate-300 group-hover:scale-105 transition-transform">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Download .OBJ</div>
              <div className="text-[10px] text-slate-400">Wavefront Geometry</div>
            </div>
          </div>
          <Download className="w-4 h-4 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
        </a>
      </div>

      {/* PBR Texture Maps */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Generated PBR Texture Pack:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {textureTypes.map((t) => (
            <a
              key={t.id}
              href={getTextureUrl(modelId, t.id)}
              download={`${modelId}_${t.id}.png`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2 rounded-lg bg-black/40 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-[11px] text-slate-300 hover:text-cyan-300 transition-all"
            >
              <span className="truncate">{t.name}</span>
              <Download className="w-3 h-3 text-slate-500 hover:text-cyan-300 shrink-0 ml-1" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
