"use client";

import { CheckCircle2, Loader2, Sparkles, Activity, ShieldCheck } from "lucide-react";

interface AgentActivityPanelProps {
  steps: string[];
  isProcessing?: boolean;
}

export default function AgentActivityPanel({ steps, isProcessing }: AgentActivityPanelProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Agent Reasoning & Controlled Tool Stream
          </h3>
        </div>

        {isProcessing ? (
          <span className="flex items-center gap-1.5 text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>EXECUTING TOOLS...</span>
          </span>
        ) : (
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
            IDLE / READY
          </span>
        )}
      </div>

      {/* Steps List */}
      <div className="space-y-2">
        {steps.length === 0 ? (
          <div className="text-[11px] text-slate-500 text-center py-4 font-mono">
            Awaiting user prompt to activate autonomous tool loop.
          </div>
        ) : (
          steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/80 font-mono animate-in fade-in slide-in-from-left-2 duration-150"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-300 truncate">{step}</span>
            </div>
          ))
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-950/20 px-3 py-2 rounded-xl border border-cyan-500/20 font-mono animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span>Synthesizing optimal recommendation...</span>
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60 font-mono">
        <span>No raw hallucination allowed</span>
        <span className="text-indigo-400">Strict Tool Execution Mode</span>
      </div>

    </div>
  );
}
