"use client";

import { useState } from "react";
import { Tag, CheckCircle2, XCircle, Loader2, Ticket } from "lucide-react";

interface VoucherInputProps {
  originalAmount: number;
  onDiscountApplied: (discountAmount: number, finalAmount: number, code: string) => void;
  onDiscountRemoved: () => void;
}

export default function VoucherInput({
  originalAmount,
  onDiscountApplied,
  onDiscountRemoved,
}: VoucherInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    error?: string;
    discountAmount?: number;
    finalAmount?: number;
    label?: string;
  } | null>(null);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  async function handleApply() {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), amount: originalAmount }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const r = json.data;
        setResult({
          valid: r.valid,
          error: r.error,
          discountAmount: r.discountAmount,
          finalAmount: r.finalAmount,
          label: r.voucher?.label,
        });
        if (r.valid) {
          setAppliedCode(code.trim().toUpperCase());
          onDiscountApplied(r.discountAmount, r.finalAmount, code.trim().toUpperCase());
        }
      }
    } catch {
      setResult({ valid: false, error: "Failed to validate voucher. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  function handleRemove() {
    setCode("");
    setResult(null);
    setAppliedCode(null);
    onDiscountRemoved();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
        <Ticket className="w-3.5 h-3.5 text-amber-400" />
        <span>Voucher / Offer Code</span>
      </div>

      {appliedCode ? (
        <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/30 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-300 font-mono">{appliedCode}</p>
              <p className="text-[10px] text-emerald-400/70">
                {result?.label} — Save RS.{result?.discountAmount?.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition font-mono"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter voucher code (e.g. SAVE10)"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setResult(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500 uppercase placeholder:normal-case placeholder:text-slate-500 placeholder:font-sans"
              />
            </div>
            <button
              onClick={handleApply}
              disabled={!code.trim() || loading}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition disabled:opacity-40 font-mono"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
            </button>
          </div>

          {result && !result.valid && (
            <div className="flex items-center gap-1.5 text-[11px] text-rose-400">
              <XCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{result.error}</span>
            </div>
          )}

          {/* Available codes hint */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["SAVE10", "AGENT20", "FLAT500", "WELCOME15"].map((c) => (
              <button
                key={c}
                onClick={() => { setCode(c); setResult(null); }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-400 hover:text-white transition font-mono"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
