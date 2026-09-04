"use client";

import { useState, useEffect } from "react";
import { 
  Activity, 
  RefreshCw, 
  ShieldCheck, 
  User, 
  Bot, 
  Cpu, 
  KeyRound, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Code2,
  Filter
} from "lucide-react";
import { AuditEvent, AuditSummary } from "@/services/auditService";

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "AI" | "FINANCIAL" | "FAILED" | "BLOCKED">("ALL");
  const [inspectEvent, setInspectEvent] = useState<AuditEvent | null>(null);

  async function loadAuditData() {
    try {
      setLoading(true);
      const res = await fetch("/api/audit");
      const json = await res.json();
      if (json.success) {
        setEvents(json.data);
        setSummary(json.summary);
      }
    } catch (err) {
      console.error("Failed to load audit data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuditData();
  }, []);

  const filteredEvents = events.filter((evt) => {
    if (filter === "ALL") return true;
    if (filter === "AI") return evt.actor === "AI_AGENT";
    if (filter === "FINANCIAL") {
      return (
        evt.actor === "POLICY_ENGINE" ||
        evt.actor === "PAYMENT_SYSTEM" ||
        evt.actor === "HUMAN_APPROVER"
      );
    }
    if (filter === "FAILED") return evt.status === "FAILED";
    if (filter === "BLOCKED") return evt.status === "BLOCKED";
    return true;
  });

  const actorIcons: Record<string, any> = {
    USER: User,
    AI_AGENT: Bot,
    POLICY_ENGINE: ShieldCheck,
    HUMAN_APPROVER: KeyRound,
    PAYMENT_SYSTEM: CreditCard
  };

  const actorColors: Record<string, string> = {
    USER: "text-purple-400 bg-purple-950/40 border-purple-500/30",
    AI_AGENT: "text-cyan-400 bg-cyan-950/40 border-cyan-500/30",
    POLICY_ENGINE: "text-amber-400 bg-amber-950/40 border-amber-500/30",
    HUMAN_APPROVER: "text-indigo-400 bg-indigo-950/40 border-indigo-500/30",
    PAYMENT_SYSTEM: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30"
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
            <Activity className="w-3.5 h-3.5" />
            <span>Feature 7: Explainable & Immutable Audit Trail</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Autonomous Commerce Audit Trail
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            A comprehensive, tamper-evident timeline proving <strong>what happened, when it happened, why it happened, who initiated it</strong>, and whether financial actions were approved, bounded, or completed.
          </p>
        </div>

        <button
          onClick={loadAuditData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* Audit Summary Card at the Top */}
      {summary && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              SESSION SUMMARY METRICS
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Latest Event: {summary.latestEventTimestamp ? new Date(summary.latestEventTimestamp).toLocaleTimeString() : 'N/A'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center font-mono">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block font-sans">Total Actions</span>
              <span className="text-2xl font-extrabold text-white">{summary.totalActions}</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block font-sans">AI Decisions</span>
              <span className="text-2xl font-extrabold text-cyan-400">{summary.aiDecisions}</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block font-sans">Financial Actions</span>
              <span className="text-2xl font-extrabold text-amber-400">{summary.financialActions}</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block font-sans">Approval Required</span>
              <span className={`text-xl font-extrabold ${summary.approvalRequired ? "text-amber-300" : "text-emerald-400"}`}>
                {summary.approvalRequired ? "YES" : "NO"}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block font-sans">Final Status</span>
              <span className="text-sm font-bold text-emerald-400 truncate block mt-1">
                {summary.finalStatus}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "AI", "FINANCIAL", "FAILED", "BLOCKED"] as const).map((tab) => {
            const isSelected = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  isSelected
                    ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent"
                }`}
              >
                {tab === "ALL" && "All Events"}
                {tab === "AI" && "AI Actions"}
                {tab === "FINANCIAL" && "Financial Actions"}
                {tab === "FAILED" && "Failed Actions"}
                {tab === "BLOCKED" && "Blocked Actions"}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing <strong className="text-white">{filteredEvents.length}</strong> recorded event(s)
        </span>
      </div>

      {/* Vertical Timeline UI */}
      {filteredEvents.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-16 text-center text-xs text-slate-500 space-y-2">
          <Activity className="w-8 h-8 text-slate-700 mx-auto" />
          <p>No audit trail events match the selected filter.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-800 ml-4 md:ml-8 space-y-6 pb-8">
          {filteredEvents.map((evt, idx) => {
            const Icon = actorIcons[evt.actor] || Activity;
            const actorStyle = actorColors[evt.actor] || "text-slate-400 bg-slate-800 border-slate-700";
            const isBlocked = evt.status === "BLOCKED";
            const isFailed = evt.status === "FAILED";
            const isSuccess = evt.status === "SUCCESS";

            return (
              <div key={evt.id} className="relative pl-6 md:pl-8 group">
                
                {/* Timeline Bullet Node */}
                <div className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full border-2 flex items-center justify-center backdrop-blur transition-all ${
                  isBlocked
                    ? "bg-rose-950 border-rose-500 text-rose-400 glow-rose"
                    : isFailed
                    ? "bg-amber-950 border-amber-500 text-amber-400"
                    : "bg-slate-950 border-cyan-500 text-cyan-400"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Event Card */}
                <div className={`bg-slate-900/80 border rounded-2xl p-5 shadow-lg space-y-3 transition-all ${
                  isBlocked
                    ? "border-rose-500/40 hover:border-rose-500/60 bg-rose-950/10"
                    : isFailed
                    ? "border-amber-500/40 hover:border-amber-500/60 bg-amber-950/10"
                    : "border-slate-800 hover:border-slate-700"
                }`}>
                  
                  {/* Card Header: Timestamp, Actor, Action */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-slate-600 font-mono">•</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${actorStyle}`}>
                        {evt.actor}
                      </span>
                      <span className="font-mono font-bold text-white text-xs tracking-wide">
                        {evt.action}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        isSuccess
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                          : isBlocked
                          ? "bg-rose-950/60 text-rose-300 border-rose-500/30"
                          : "bg-amber-950/60 text-amber-300 border-amber-500/30"
                      }`}>
                        {evt.status}
                      </span>

                      {evt.riskLevel && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {evt.riskLevel} RISK
                        </span>
                      )}

                      <button
                        onClick={() => setInspectEvent(evt)}
                        title="Inspect Event Payload JSON"
                        className="p-1 rounded text-slate-500 hover:text-cyan-400 transition"
                      >
                        <Code2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Explainability Reason */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                      Reason / What Happened:
                    </span>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed font-sans">
                      {evt.reason}
                    </p>
                  </div>

                  {/* Metadata preview if present */}
                  {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                    <div className="text-[11px] font-mono text-slate-400 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 truncate">
                      <span className="text-slate-500 mr-2">// Metadata:</span>
                      <span>{JSON.stringify(evt.metadata)}</span>
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* JSON Inspection Modal */}
      {inspectEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold text-white">
                AUDIT EVENT PAYLOAD • {inspectEvent.id}
              </h3>
              <button
                onClick={() => setInspectEvent(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                [Close]
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <pre className="text-xs font-mono text-emerald-400 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
                {JSON.stringify(inspectEvent, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
