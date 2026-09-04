"use client";

import { useState } from "react";
import { 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  Clock, 
  AlertTriangle,
  Loader2
} from "lucide-react";
import { ApprovalRequest } from "@/services/approvalService";

interface ApprovalModalProps {
  approvalRequest: ApprovalRequest;
  onClose: () => void;
  onApproved: (approvedRequest: ApprovalRequest) => void;
  onRejected: (rejectedRequest: ApprovalRequest) => void;
}

export default function ApprovalModal({
  approvalRequest,
  onClose,
  onApproved,
  onRejected
}: ApprovalModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    try {
      setLoading(true);
      const res = await fetch(`/api/approvals/${approvalRequest.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolvedBy: "HUMAN_MERCHANT_OPERATOR" })
      });
      const data = await res.json();
      if (data.success) {
        onApproved(data.data);
      } else {
        alert("Approval failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    try {
      setLoading(true);
      const res = await fetch(`/api/approvals/${approvalRequest.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolvedBy: "HUMAN_MERCHANT_OPERATOR" })
      });
      const data = await res.json();
      if (data.success) {
        onRejected(data.data);
      } else {
        alert("Rejection failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 glow-indigo">
        
        {/* Modal Top Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Autonomous Action Gate</h3>
              <p className="text-[11px] text-amber-400/90 font-mono">STATUS: AWAITING HUMAN APPROVAL</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* Action Spec */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono">
            <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="font-sans font-semibold">Action Requested:</span>
              <span className="font-bold text-cyan-400">{approvalRequest.actionType}</span>
            </div>

            <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="font-sans font-semibold">Target Product:</span>
              <span className="font-bold text-white font-sans truncate max-w-[240px]">
                {approvalRequest.productName}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="font-sans font-semibold">Total Amount:</span>
              <span className="font-extrabold text-emerald-400 text-base">
                ₹{approvalRequest.amount.toLocaleString('en-IN')} {approvalRequest.currency}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span className="font-sans font-semibold">Risk Level:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                {approvalRequest.riskLevel} RISK
              </span>
            </div>
          </div>

          {/* Reason & Policy Trigger Box */}
          <div className="space-y-2 bg-amber-950/20 border border-amber-500/20 p-3.5 rounded-xl">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">
                Intent Reason:
              </span>
              <p className="text-slate-200 text-xs mt-0.5 leading-relaxed font-sans">
                {approvalRequest.reason}
              </p>
            </div>

            <div className="pt-2 border-t border-amber-500/20">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                Policy Rule Triggered:
              </span>
              <p className="text-slate-300 text-[11px] mt-0.5 font-sans">
                Transaction exceeds autonomous limit of ₹2,000. Autonomous agents are prohibited from dispatching payments without human confirmation.
              </p>
            </div>
          </div>

          {/* Outcome Notice */}
          <div className="flex items-center gap-2 text-slate-400 text-[11px] bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-sans">
            <CreditCard className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>What will happen next:</strong> A Razorpay test-mode payment order will be authorized and the checkout interface will launch.
            </span>
          </div>

        </div>

        {/* Modal Buttons */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-500/40 border border-slate-700 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Action</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Approve & Continue</span>
          </button>
        </div>

      </div>
    </div>
  );
}
