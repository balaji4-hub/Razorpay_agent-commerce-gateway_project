"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Play, 
  CheckCircle2, 
  Sliders, 
  Cpu, 
  AlertTriangle, 
  RefreshCw,
  Zap,
  Info
} from "lucide-react";
import PolicyDecisionCard from "@/components/PolicyDecisionCard";
import { FinancialAction, PolicyDecision, INITIAL_POLICIES } from "@/services/policyEngine";

export default function PolicySimulatorPage() {
  const [actionType, setActionType] = useState<string>("CREATE_PAYMENT");
  const [amount, setAmount] = useState<number>(4499);
  const [currency, setCurrency] = useState<string>("INR");
  const [reason, setReason] = useState<string>("User explicitly selected JBL Tune 760NC for travel commute.");
  const [decision, setDecision] = useState<PolicyDecision | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  // Quick Preset Scenarios (Explicitly Requested by User)
  const presets = [
    { label: "₹500 (Auto-Allowed)", amount: 500, currency: "INR", reason: "Purchase of phone screen protector", desc: "Under ₹2,000 threshold" },
    { label: "₹2,000 (Exact Bound Allowed)", amount: 2000, currency: "INR", reason: "boAt Rockerz 550 wireless headphones", desc: "Boundary condition at ₹2,000" },
    { label: "₹4,499 (Approval Required)", amount: 4499, currency: "INR", reason: "User requested JBL Tune 760NC ANC headphones", desc: "Exceeds ₹2,000, requires human gate" },
    { label: "₹5,000 (Max Approval Limit)", amount: 5000, currency: "INR", reason: "OnePlus Buds 3 Flagship TWS Earbuds", desc: "Upper boundary for approval" },
    { label: "₹6,000 (Policy Blocked)", amount: 6000, currency: "INR", reason: "Sony WH-CH720N over-ear headphones", desc: "Exceeds ₹5,000 ceiling -> BLOCKED" },
    { label: "USD Currency (Blocked)", amount: 150, currency: "USD", reason: "Cross-border gadget purchase", desc: "Unsupported currency -> BLOCKED" },
    { label: "Missing Reason (Blocked)", amount: 1299, currency: "INR", reason: "", desc: "Empty justification -> BLOCKED" },
    { label: "Invalid Amount -₹100", amount: -100, currency: "INR", reason: "Negative amount exploit attempt", desc: "Invalid value -> BLOCKED" }
  ];

  async function runEvaluation(actionToEval?: FinancialAction) {
    const act: FinancialAction = actionToEval || {
      actionType: actionType as any,
      amount: Number(amount),
      currency,
      reason,
      requestedBy: "AI_AGENT"
    };

    try {
      setEvaluating(true);
      const res = await fetch("/api/policy/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: act, sessionId: "sim_session_01" })
      });
      const data = await res.json();
      if (data.success) {
        setDecision(data.data);
      }
    } catch (err) {
      console.error("Evaluation failed", err);
    } finally {
      setEvaluating(false);
    }
  }

  function applyPreset(preset: typeof presets[0]) {
    setAmount(preset.amount);
    setCurrency(preset.currency);
    setReason(preset.reason);
    runEvaluation({
      actionType: "CREATE_PAYMENT",
      amount: preset.amount,
      currency: preset.currency,
      reason: preset.reason,
      requestedBy: "AI_AGENT"
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Feature 4: Deterministic Financial Policy Engine</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Financial Policy Simulator & Risk Engine
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          The AI agent can <strong>never directly execute money transactions</strong>. Every autonomous intent is intercepted by this deterministic policy engine to enforce spending ceilings, human-in-the-loop approvals, currency locks, and audit transparency.
        </p>
      </div>

      {/* Rules Legend Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 space-y-1 text-xs">
          <div className="flex items-center justify-between font-bold text-emerald-400 font-mono">
            <span>RULE 1: AUTO-ALLOWED</span>
            <span>≤ ₹2,000 INR</span>
          </div>
          <p className="text-slate-300">
            Autonomous transactions under ₹2,000 proceed automatically without human latency.
          </p>
        </div>

        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 space-y-1 text-xs">
          <div className="flex items-center justify-between font-bold text-amber-400 font-mono">
            <span>RULE 2: APPROVAL REQUIRED</span>
            <span>₹2,001 - ₹5,000 INR</span>
          </div>
          <p className="text-slate-300">
            Triggers mandatory Human-in-the-Loop gating modal. Order cannot execute until approved.
          </p>
        </div>

        <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 space-y-1 text-xs">
          <div className="flex items-center justify-between font-bold text-rose-400 font-mono">
            <span>RULE 3: BLOCKED</span>
            <span>&gt; ₹5,000 / Non-INR</span>
          </div>
          <p className="text-slate-300">
            Hard ceiling violation, invalid currency, or missing rationale blocks the transaction instantly.
          </p>
        </div>
      </div>

      {/* Main Grid: Presets & Custom Simulator Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Presets & Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick Presets */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Automated Evaluation Presets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition group space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-white group-hover:text-amber-300">
                    <span>{preset.label}</span>
                    <Play className="w-3 h-3 text-slate-500 group-hover:text-amber-400 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Action Builder Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Custom Financial Action Inspector
            </h3>

            <div className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1.5 font-medium">Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:ring-2 focus:ring-cyan-500/50 outline-none"
                  >
                    <option value="CREATE_PAYMENT">CREATE_PAYMENT</option>
                    <option value="CREATE_ORDER">CREATE_ORDER</option>
                    <option value="ISSUE_DISCOUNT">ISSUE_DISCOUNT</option>
                    <option value="REFUND">REFUND</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1.5 font-medium">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:ring-2 focus:ring-cyan-500/50 outline-none"
                  >
                    <option value="INR">INR (Indian Rupee - Supported)</option>
                    <option value="USD">USD (US Dollar - Blocked)</option>
                    <option value="EUR">EUR (Euro - Blocked)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5 font-medium">
                  Transaction Amount: <strong className="text-white font-mono">₹{amount.toLocaleString('en-IN')}</strong>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="flex-1 accent-cyan-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1.5 font-medium">
                  Explainable Intent Reason (Mandatory Guardrail)
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide explicit rationale why the AI agent is requesting this financial action..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                />
              </div>

              <button
                onClick={() => runEvaluation()}
                disabled={evaluating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                {evaluating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>Evaluate Deterministic Policy Rules</span>
              </button>

            </div>
          </div>

        </div>

        {/* Right Column: Live PolicyDecisionCard Output (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>LIVE EVALUATION RESULT</span>
            <span>POST /api/policy/evaluate</span>
          </div>

          {decision ? (
            <PolicyDecisionCard
              decision={decision}
              onProceedToApproval={() => alert("Approval gate ticket created! View at /approvals")}
              onProceedToPayment={() => alert("Auto-allowed! Razorpay test order initialized.")}
            />
          ) : (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-500 space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-slate-700" />
              <p>Click any preset on the left or press "Evaluate" to trigger real-time policy evaluation.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
