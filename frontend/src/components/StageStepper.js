"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles,
  FileCheck,
  Activity
} from "lucide-react";

export default function StageStepper({ taskStatus }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!taskStatus || !taskStatus.stages) return null;

  const { stages, progress, current_stage, total_duration_ms, material_specs } = taskStatus;

  return (
    <div className="glass-panel p-4 space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            Pipeline Execution Stepper
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {total_duration_ms && (
            <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              {(total_duration_ms / 1000).toFixed(1)}s
            </span>
          )}
          <span className="text-xs font-mono font-bold text-cyan-400">
            {progress}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stage Grid */}
      <div className="space-y-1.5 pt-1">
        {stages.map((stage, idx) => {
          const isDone = stage.status === "completed";
          const isRunning = stage.status === "running";

          return (
            <div
              key={stage.id || idx}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                isRunning
                  ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-200"
                  : isDone
                  ? "bg-white/[0.03] text-slate-300"
                  : "text-slate-500"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : isRunning ? (
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                )}
                <span className="truncate font-medium">{stage.name}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {stage.duration_ms !== null && stage.duration_ms !== undefined && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {stage.duration_ms}ms
                  </span>
                )}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                    isDone
                      ? "text-emerald-400 bg-emerald-500/10"
                      : isRunning
                      ? "text-cyan-300 bg-cyan-500/20 animate-pulse"
                      : "text-slate-600"
                  }`}
                >
                  {stage.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* LangChain Details Toggle */}
      {material_specs?.decomposition_notes && (
        <div className="pt-2 border-t border-white/5">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <span>LangChain Reasoning & Decomposition</span>
            {showDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          {showDetails && (
            <div className="mt-2 p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-slate-300 space-y-1">
              <p className="text-cyan-400 font-semibold">{material_specs.material_name}</p>
              <p className="text-slate-400 leading-relaxed">
                {material_specs.decomposition_notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
