"use client";

import { useState, useEffect } from "react";
import { Zap, Tag, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { DayDeal } from "@/services/offersService";

interface ProductMap {
  [id: string]: { name: string; category: string };
}

interface DayDealsBannerProps {
  productMap?: ProductMap;
  onDealClick?: (productId: string) => void;
}

export default function DayDealsBanner({ productMap = {}, onDealClick }: DayDealsBannerProps) {
  const [deals, setDeals] = useState<DayDeal[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    fetch("/api/offers")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setDeals(j.data.dayDeals);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (deals.length <= 1) return;
    const t = setInterval(() => setActiveIdx((i) => (i + 1) % deals.length), 4000);
    return () => clearInterval(t);
  }, [deals.length]);

  if (!deals.length || dismissed) return null;

  const deal = deals[activeIdx];

  const badgeColors: Record<string, string> = {
    HOT: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    FLASH: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    SPECIAL: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    "AI PICK": "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  };
  const badgeClass = badgeColors[deal.badge] || "bg-slate-700 text-slate-300 border-slate-600";

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-950/80 via-slate-900 to-cyan-950/80 border border-indigo-500/30 shadow-lg shadow-indigo-500/10 p-4 mb-2">
      {/* Animated gradient glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-transparent to-cyan-600/5 pointer-events-none" />

      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-widest">Today&apos;s Deals</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 font-mono">
            {deals.length} active
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-500 hover:text-slate-300 transition p-1"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Deal cards row */}
      <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
        {deals.map((d, idx) => {
          const name = productMap[d.productId]?.name || d.productId;
          const isActive = idx === activeIdx;
          const bc = badgeColors[d.badge] || "bg-slate-700 text-slate-300 border-slate-600";
          return (
            <button
              key={d.productId}
              onClick={() => {
                setActiveIdx(idx);
                if (onDealClick) onDealClick(d.productId);
              }}
              className={`shrink-0 flex flex-col gap-1.5 p-3 rounded-xl border transition-all text-left min-w-[180px] max-w-[220px] ${
                isActive
                  ? "bg-indigo-950/60 border-indigo-500/50 shadow-md shadow-indigo-500/10"
                  : "bg-slate-950/40 border-slate-800/60 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${bc}`}>
                  {d.badge}
                </span>
                <span className="text-[10px] text-slate-400 truncate">{d.label}</span>
              </div>
              <p className="text-xs font-semibold text-white truncate">{name}</p>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  RS.{d.dealPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-slate-500 line-through font-mono text-[10px]">
                  RS.{d.originalPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/25">
                  -{d.savingsPercent}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 italic">{d.highlight}</p>
            </button>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-1.5 mt-3 justify-center">
        {deals.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className={`rounded-full transition-all ${
              idx === activeIdx ? "w-4 h-1.5 bg-cyan-400" : "w-1.5 h-1.5 bg-slate-700 hover:bg-slate-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
