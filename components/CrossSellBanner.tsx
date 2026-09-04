"use client";

import { useState } from "react";
import { ShoppingBag, Sparkles, X, Plus, Check } from "lucide-react";
import { Product } from "@/services/catalogService";

interface CrossSellBannerProps {
  mainProduct: Product;
  accessories: { accessoryId: string; reason: string; product?: Product }[];
  bundleDiscountPercent: number;
  onAddBundle: (products: Product[]) => void;
  onDismiss: () => void;
}

export default function CrossSellBanner({
  mainProduct,
  accessories,
  bundleDiscountPercent,
  onAddBundle,
  onDismiss,
}: CrossSellBannerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedProducts = accessories
    .filter((a) => selected.has(a.accessoryId) && a.product)
    .map((a) => a.product!);

  const bundleTotal = selectedProducts.reduce((s, p) => s + p.price, 0);
  const discountedBundle = Math.round(bundleTotal * (1 - bundleDiscountPercent / 100));

  return (
    <div className="mt-3 rounded-2xl border border-amber-500/25 bg-amber-950/20 p-4 space-y-3 relative animate-in fade-in slide-in-from-bottom-2 duration-200">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Complete the Bundle</p>
          <p className="text-[10px] text-amber-400/80">
            Add accessories at {bundleDiscountPercent}% off
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {accessories.map((acc) => {
          const isSelected = selected.has(acc.accessoryId);
          const prod = acc.product;
          return (
            <button
              key={acc.accessoryId}
              onClick={() => toggle(acc.accessoryId)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition ${
                isSelected
                  ? "bg-amber-950/40 border-amber-500/40"
                  : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                  isSelected
                    ? "bg-amber-500 border-amber-500"
                    : "border-slate-600 bg-slate-800"
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-slate-950" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {prod ? prod.name : acc.accessoryId}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{acc.reason}</p>
              </div>
              {prod && (
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold font-mono text-white">
                    RS.{Math.round(prod.price * (1 - bundleDiscountPercent / 100)).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-slate-500 line-through font-mono">
                    RS.{prod.price.toLocaleString("en-IN")}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-slate-400">Bundle saves you</p>
            <p className="text-sm font-bold text-emerald-400 font-mono">
              RS.{(bundleTotal - discountedBundle).toLocaleString("en-IN")} off
            </p>
          </div>
          <button
            onClick={() => onAddBundle(selectedProducts)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bundle</span>
          </button>
        </div>
      )}
    </div>
  );
}
