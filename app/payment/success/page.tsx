"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  ShoppingBag, 
  Activity, 
  Receipt,
  Download
} from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "order_sim_test_001";
  const paymentId = searchParams.get("paymentId") || "pay_sim_test_001";
  const amount = searchParams.get("amount") || "4499";
  const productName = searchParams.get("productName") || "JBL Tune 760NC";
  const timestamp = new Date().toISOString();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 space-y-6">
      
      {/* Top Success Badge */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center glow-emerald animate-in zoom-in-75">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold uppercase tracking-wider">
          Payment Captured & Verified
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Autonomous Transaction Complete
        </h1>
        <p className="text-slate-400 text-xs max-w-md mx-auto">
          Razorpay test-mode transaction verified with HMAC-SHA256 signature and explainable intent audit trail.
        </p>
      </div>

      {/* Digital Receipt Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">Settlement Summary</h3>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">STATUS: CAPTURED</span>
        </div>

        <div className="space-y-2.5 divide-y divide-slate-800/80">
          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-sans">Merchant Item</span>
            <span className="font-bold text-white font-sans truncate max-w-[250px]">{productName}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-sans">Total Paid</span>
            <span className="font-extrabold text-emerald-400 text-base">
              ₹{Number(amount).toLocaleString('en-IN')}.00 INR
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-sans">Razorpay Order ID</span>
            <span className="text-slate-300">{orderId}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-sans">Razorpay Payment ID</span>
            <span className="text-slate-300">{paymentId}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-sans">Verification Timestamp</span>
            <span className="text-slate-400 text-[11px]">{new Date(timestamp).toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-400 font-sans">Protocol Standard</span>
            <span className="text-indigo-400 text-[11px]">NPCI UAP • ACP Agent Commerce v2</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-sans flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>No money was charged. This was executed in official Razorpay Sandbox Test Mode.</span>
        </div>
      </div>

      {/* Action Links */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          href="/audit"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700"
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>View Audit Trail Timeline</span>
        </Link>

        <Link
          href="/shop"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Return to AI Shopping Agent</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-24 text-xs text-slate-400 font-mono">
        Loading payment verification receipt...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
