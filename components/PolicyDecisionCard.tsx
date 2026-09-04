"use client";

import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Cpu, 
  CreditCard,
  ArrowRight
} from "lucide-react";
import { PolicyDecision, PolicyStatus } from "@/services/policyEngine";

interface PolicyDecisionCardProps {
  decision: PolicyDecision;
  onProceedToApproval?: () => void;
  onProceedToPayment?: () => void;
}

export default function PolicyDecisionCard({
  decision,
  onProceedToApproval,
  onProceedToPayment
}: PolicyDecisionCardProps) {
  const { status, riskLevel, reasons, policyChecks, action, evaluatedAt } = decision;

  const statusConfig: Record<PolicyStatus, { title: string; color: string; bg: string; border: string; icon: any }> = {
    ALLOWED: {
      title: "ALLOWED",
      color: "text-emerald-400",
      bg: "bg-emerald-950/40",
      border: "border-emerald-500/40",
      icon: ShieldCheck
    },
    APPROVAL_REQUIRED: {
      title: "APPROVAL REQUIRED",
      color: "text-amber-400",
      bg: "bg-amber-950/40",
      border: "border-amber-500/40",
      icon: AlertTriangle
    },
    BLOCKED: {
      title: "ACTION BLOCKED",
      color: "text-rose-400",
      bg: "bg-rose-950/40",
      border: "border-rose-500/40",
      icon: ShieldAlert
    }
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className={`rounded-2xl p-5 border shadow-xl space-y-4 ${currentStatus.bg} ${currentStatus.border} transition-all`}>
      
      {/* Top Banner: Status & Risk */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${currentStatus.color}`} />
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Policy Decision</span>
            <h4 className={`text-sm font-extrabold tracking-wide font-mono ${currentStatus.color}`}>
              {currentStatus.title}
            </h4>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Risk Level</span>
          <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${
            riskLevel === "LOW" 
              ? "bg-emerald-950 text-emerald-400 border-emerald-500/30"
              : riskLevel === "MEDIUM"
              ? "bg-amber-950 text-amber-300 border-amber-500/30"
              : "bg-rose-950 text-rose-300 border-rose-500/30"
          }`}>
            {riskLevel} RISK
          </span>
        </div>
      </div>

      {/* AI Action Request Details */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-mono">
          <Cpu className="w-3.5 h-3.5" />
          AI ACTION REQUEST
        </span>
        
        <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
          <div>
            <span className="text-[11px] text-slate-400 block font-sans">Action Type:</span>
            <span className="font-semibold text-white">{action.actionType}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-sans">Requested Amount:</span>
            <span className="font-extrabold text-emerald-400">
              ₹{action.amount ? action.amount.toLocaleString('en-IN') : '0.00'} {action.currency || 'INR'}
            </span>
          </div>
        </div>

        <div className="pt-1 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-400 block">Reason:</span>
          <p className="text-slate-200 text-xs mt-0.5 leading-relaxed font-sans">{action.reason}</p>
        </div>
      </div>

      {/* Policy Checks List */}
      <div className="space-y-2 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
          POLICY CHECKS EVALUATED
        </span>
        <div className="space-y-1.5">
          {policyChecks.map((chk, idx) => (
            <div 
              key={idx} 
              className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${
                chk.passed 
                  ? "bg-emerald-950/20 border-emerald-500/20 text-slate-200"
                  : chk.requiredForApproval
                  ? "bg-amber-950/30 border-amber-500/30 text-amber-200"
                  : "bg-rose-950/30 border-rose-500/30 text-rose-200"
              }`}
            >
              {chk.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : chk.requiredForApproval ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold block">{chk.name}</span>
                <span className="text-[11px] opacity-80">{chk.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(evaluatedAt).toLocaleTimeString()}
        </span>

        {status === "APPROVAL_REQUIRED" && onProceedToApproval && (
          <button
            onClick={onProceedToApproval}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition"
          >
            <span>Request Human Approval</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {status === "ALLOWED" && onProceedToPayment && (
          <button
            onClick={onProceedToPayment}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition"
          >
            <span>Execute Razorpay Order</span>
            <CreditCard className="w-3.5 h-3.5" />
          </button>
        )}

        {status === "BLOCKED" && (
          <span className="text-xs font-mono text-rose-400 font-semibold">
            Execution Prevented by Policy Guardrail
          </span>
        )}
      </div>

    </div>
  );
}
