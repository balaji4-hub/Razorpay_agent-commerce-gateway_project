"use client";

import { useState, useEffect } from "react";
import { 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { ApprovalRequest, ApprovalStatus } from "@/services/approvalService";

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<ApprovalStatus | "ALL">("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function fetchApprovals() {
    try {
      setLoading(true);
      const res = await fetch("/api/approvals");
      const json = await res.json();
      if (json.success) {
        setRequests(json.data);
      }
    } catch (err) {
      console.error("Failed to load approvals", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApprovals();
  }, []);

  async function handleApprove(id: string) {
    try {
      setProcessingId(id);
      const res = await fetch(`/api/approvals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolvedBy: "MERCHANT_DASHBOARD" })
      });
      const data = await res.json();
      if (data.success) {
        await fetchApprovals();
      } else {
        alert("Action failed: " + data.error);
      }
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    try {
      setProcessingId(id);
      const res = await fetch(`/api/approvals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolvedBy: "MERCHANT_DASHBOARD" })
      });
      const data = await res.json();
      if (data.success) {
        await fetchApprovals();
      } else {
        alert("Action failed: " + data.error);
      }
    } finally {
      setProcessingId(null);
    }
  }

  const filteredList = requests.filter((r) => {
    if (filterTab === "ALL") return true;
    return r.status === filterTab;
  });

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-3">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Feature 6: Mandatory Human Approval Gate</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Autonomous Action Approval Gateway
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Financial actions exceeding the autonomous policy threshold (₹2,000) are locked in a pending state until authorized by a human operator. Approvals automatically expire after 10 minutes.
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => {
          const isSelected = filterTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                isSelected
                  ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent"
              }`}
            >
              <span>{tab}</span>
              {tab === "PENDING" && pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-sans text-[10px] flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Approvals Table / Card Stream */}
      {loading && requests.length === 0 ? (
        <div className="text-center py-20 text-xs text-slate-500 font-mono">
          Loading approval requests...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-16 text-center text-xs text-slate-500 space-y-2">
          <KeyRound className="w-8 h-8 text-slate-600 mx-auto" />
          <p>No approval tickets found under filter: {filterTab}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((req) => {
            const isPending = req.status === "PENDING";
            const isApproved = req.status === "APPROVED";
            const isRejected = req.status === "REJECTED";
            const isExpired = req.status === "EXPIRED";

            return (
              <div
                key={req.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                {/* Left: Action, Product, Reason */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-slate-950 text-cyan-400 border border-slate-800 font-mono text-xs font-bold">
                      {req.actionType}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${
                        isApproved
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                          : isPending
                          ? "bg-amber-950/60 text-amber-300 border-amber-500/30"
                          : isRejected
                          ? "bg-rose-950/60 text-rose-300 border-rose-500/30"
                          : "bg-slate-950 text-slate-500 border-slate-800"
                      }`}
                    >
                      {req.status}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-400 border border-slate-800">
                      RISK: {req.riskLevel}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white">
                    {req.productName || "Autonomous Merchant Purchase"}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-sans">
                    {req.reason}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                    <span>ID: {req.id}</span>
                    <span>Requested: {new Date(req.requestedAt).toLocaleTimeString()}</span>
                    {req.resolvedAt && (
                      <span className="text-slate-400">
                        Resolved by: {req.resolvedBy || "HUMAN"} at {new Date(req.resolvedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Gating Actions */}
                <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">Amount</span>
                    <span className="text-xl font-extrabold font-mono text-emerald-400">
                      ₹{req.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={processingId === req.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 text-xs font-semibold text-slate-300 transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={processingId === req.id}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition"
                      >
                        Approve
                      </button>
                    </div>
                  )}

                  {isApproved && (
                    <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Unlocked for Payment
                    </span>
                  )}

                  {isRejected && (
                    <span className="text-xs text-rose-400 font-mono font-bold flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Transaction Cancelled
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
