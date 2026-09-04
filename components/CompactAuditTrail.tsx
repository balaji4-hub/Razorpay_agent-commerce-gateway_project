"use client";

import { useState, useEffect } from "react";
import { 
  Activity, 
  RefreshCw, 
  ArrowUpRight, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle 
} from "lucide-react";
import Link from "next/link";
import { AuditEvent } from "@/services/auditService";

export default function CompactAuditTrail() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchEvents() {
    try {
      setLoading(true);
      const res = await fetch("/api/audit");
      const json = await res.json();
      if (json.success) {
        setEvents(json.data.slice(0, 8)); // latest 8 events
      }
    } catch (err) {
      console.error("Failed to load audit trail", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
    // Poll every 4 seconds during interactive sessions
    const interval = setInterval(fetchEvents, 4000);
    return () => clearInterval(interval);
  }, []);

  const actorColors: Record<string, string> = {
    USER: "text-purple-400 bg-purple-950/40 border-purple-500/30",
    AI_AGENT: "text-cyan-400 bg-cyan-950/40 border-cyan-500/30",
    POLICY_ENGINE: "text-amber-400 bg-amber-950/40 border-amber-500/30",
    HUMAN_APPROVER: "text-indigo-400 bg-indigo-950/40 border-indigo-500/30",
    PAYMENT_SYSTEM: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30"
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Real-Time Audit Trail
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvents}
            title="Refresh Audit Trail"
            className="p-1 rounded text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/audit"
            className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-0.5"
          >
            <span>Full View</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
        {events.length === 0 ? (
          <div className="text-[11px] text-slate-500 text-center py-6 font-mono">
            No audit events captured yet.
          </div>
        ) : (
          events.map((evt) => {
            const actorStyle = actorColors[evt.actor] || "text-slate-400 bg-slate-800 border-slate-700";
            const isBlocked = evt.status === "BLOCKED";
            const isFailed = evt.status === "FAILED";
            const isSuccess = evt.status === "SUCCESS";

            return (
              <div
                key={evt.id}
                className={`p-2.5 rounded-xl border text-[11px] font-mono space-y-1 transition ${
                  isBlocked
                    ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                    : isFailed
                    ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                    : "bg-slate-950/60 border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${actorStyle}`}>
                      {evt.actor}
                    </span>
                    <span className="font-bold text-white text-[11px] truncate max-w-[140px]">
                      {evt.action}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 font-sans leading-tight line-clamp-2">
                  {evt.reason}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span>Immutable Event Stream</span>
        <span className="text-emerald-400">Live Listening Active</span>
      </div>

    </div>
  );
}
