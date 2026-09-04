"use client";

import { useState } from "react";
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Lock, 
  X, 
  Loader2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import VoucherInput from "@/components/VoucherInput";


interface RazorpayOrderData {
  orderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  isSimulator: boolean;
  product: {
    id: string;
    name: string;
    price: number;
  };
}

interface RazorpayCheckoutProps {
  orderData: RazorpayOrderData;
  onClose: () => void;
  onSuccess: (paymentDetails: { paymentId: string; orderId: string; amount: number }) => void;
}

export default function RazorpayCheckout({
  orderData,
  onClose,
  onSuccess
}: RazorpayCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD">("UPI");
  const [upiId, setUpiId] = useState("ai.shopper@oksbi");
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [processing, setProcessing] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{ discountAmount: number; finalAmount: number; code: string } | null>(null);
  const router = useRouter();

  const originalAmountINR = orderData.amount / 100;
  const finalAmountINR = appliedDiscount ? appliedDiscount.finalAmount : originalAmountINR;
  const finalAmountPaise = finalAmountINR * 100;


  async function handleCompletePayment() {
    setProcessing(true);
    setPaymentFailed(false);

    try {
      // FAILURE SIMULATION MODE
      if (simulateFailure) {
        await new Promise(r => setTimeout(r, 1200));
        setPaymentFailed(true);
        setProcessing(false);
        return;
      }

      // 1. If not simulator and window.Razorpay is available, open official modal
      if (!orderData.isSimulator && typeof window !== "undefined" && (window as any).Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: finalAmountPaise,
          currency: orderData.currency,
          name: "Agent Commerce Gateway",
          description: `Autonomous Order for ${orderData.product.name}`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              onSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: finalAmountINR
              });
            } else {
              alert("Signature verification failed: " + verifyData.error);
            }
          }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setProcessing(false);
        return;
      }

      // 2. High-Fidelity Test Mode Simulator
      await new Promise(r => setTimeout(r, 900)); // Simulate gateway roundtrip

      const simulatedPaymentId = "pay_rzp_test_" + Math.random().toString(36).substring(2, 10);
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_payment_id: simulatedPaymentId,
          razorpay_order_id: orderData.orderId,
          razorpay_signature: "sig_test_" + Date.now()
        })
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        onSuccess({
          paymentId: simulatedPaymentId,
          orderId: orderData.orderId,
          amount: finalAmountINR
        });
      } else {
        alert("Payment verification failed: " + verifyData.error);
      }
    } catch (err: any) {
      alert("Payment processing error: " + err.message);
    } finally {
      setProcessing(false);
    }
  }


  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Razorpay Test Checkout</h3>
              <p className="text-[11px] text-slate-400 font-mono">SANDBOX MODE • NO REAL CHARGE</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Details Banner */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[80vh] custom-scrollbar">
          
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-sans">Item</span>
              <h4 className="font-bold text-white text-sm truncate max-w-[200px]">
                {orderData.product.name}
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">Order ID: {orderData.orderId}</span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-sans">Amount to Pay</span>
              <span className="text-xl font-extrabold font-mono text-emerald-400">
                RS.{originalAmountINR.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
              Select Test Payment Instrument
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-xs font-semibold ${
                  paymentMethod === "UPI"
                    ? "bg-cyan-950/40 border-cyan-500 text-cyan-300"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI Autopay</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition text-xs font-semibold ${
                  paymentMethod === "CARD"
                    ? "bg-cyan-950/40 border-cyan-500 text-cyan-300"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Test Card</span>
              </button>
            </div>
          </div>

          {/* Instrument Inputs */}
          {paymentMethod === "UPI" ? (
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 block font-sans">Virtual Payment Address (VPA)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block font-mono">Simulates instant NPCI / UPI Mandate Auth</span>
            </div>
          ) : (
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="text-[11px] text-slate-400 block font-sans">Test Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="MM/YY"
                  defaultValue="12/28"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs text-center"
                />
                <input
                  type="text"
                  placeholder="CVV"
                  defaultValue="999"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs text-center"
                />
              </div>
            </div>
          )}

          {/* Voucher Code Input */}
          <VoucherInput
            originalAmount={originalAmountINR}
            onDiscountApplied={(discountAmount, finalAmount, code) => {
              setAppliedDiscount({ discountAmount, finalAmount, code });
            }}
            onDiscountRemoved={() => setAppliedDiscount(null)}
          />

          {/* Price Summary with Discount */}
          {appliedDiscount && (
            <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-xl px-4 py-3 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Original price</span>
                <span className="font-mono line-through">RS.{originalAmountINR.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-[11px] text-emerald-400">
                <span>Voucher ({appliedDiscount.code})</span>
                <span className="font-mono font-bold">-RS.{appliedDiscount.discountAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white border-t border-emerald-500/20 pt-1 mt-1">
                <span>Total</span>
                <span className="font-mono text-emerald-400">RS.{finalAmountINR.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          {/* Payment Failure Alert */}
          {paymentFailed && (
            <div className="flex items-start gap-3 bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-300">Payment was not completed</p>
                <p className="text-[11px] text-rose-400/80 mt-0.5">
                  No money has been charged. The item is still in your cart. Please try again or contact support.
                </p>
                <button
                  onClick={() => { setPaymentFailed(false); setSimulateFailure(false); }}
                  className="mt-2 text-[10px] px-3 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 transition font-mono"
                >
                  Retry Payment
                </button>
              </div>
            </div>
          )}

          {/* Security Guarantee */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>End-to-End Encrypted via Razorpay Test Key: <code className="text-white">{orderData.keyId}</code></span>
          </div>

          {/* Developer: Simulate Failure Toggle */}
          <div className="flex items-center justify-between bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/60">
            <div>
              <p className="text-[11px] font-semibold text-slate-300">Simulate Payment Failure</p>
              <p className="text-[10px] text-slate-500 font-mono">Dev toggle — triggers graceful failure UX</p>
            </div>
            <button
              onClick={() => { setSimulateFailure(!simulateFailure); setPaymentFailed(false); }}
              className="shrink-0 text-slate-400 hover:text-white transition"
            >
              {simulateFailure
                ? <ToggleRight className="w-7 h-7 text-rose-400" />
                : <ToggleLeft className="w-7 h-7 text-slate-600" />
              }
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCompletePayment}
            disabled={processing || paymentFailed}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 ${
              simulateFailure
                ? "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-500/25"
                : "bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25"
            } disabled:opacity-50`}
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {simulateFailure
                ? "Simulate Failure"
                : `Pay RS.${finalAmountINR.toLocaleString("en-IN")} (Test Mode)`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
