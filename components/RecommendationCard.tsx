"use client";

import { Star, Sparkles, CheckCircle2, ArrowRight, GitCompare, ShieldCheck } from "lucide-react";
import { RankedRecommendation } from "@/services/recommendationService";
import { Product } from "@/services/catalogService";

interface RecommendationCardProps {
  recommendation: RankedRecommendation;
  onSelectProduct: (product: Product) => void;
  onOpenComparison?: () => void;
}

export default function RecommendationCard({
  recommendation,
  onSelectProduct,
  onOpenComparison
}: RecommendationCardProps) {
  const { bestMatch, bestMatchScore, alternatives, explanation } = recommendation;

  return (
    <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/40 rounded-2xl p-5 shadow-xl space-y-4 glow-indigo">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            BEST MATCH
          </span>
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-500/30">
            {bestMatchScore.overallScore}% Match Score
          </span>
        </div>

        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span>{bestMatch.rating}</span>
        </div>
      </div>

      {/* Main Recommended Product Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{bestMatch.brand}</span>
          <h4 className="text-lg font-bold text-white tracking-tight">{bestMatch.name}</h4>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{bestMatch.description}</p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] text-slate-400 block">Price in INR</span>
          <span className="text-2xl font-extrabold font-mono text-emerald-400">
            ₹{bestMatch.price.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Why We Recommend It (Explainable Summary) */}
      <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          Why We Recommend It:
        </span>
        <div className="space-y-1.5">
          {explanation.reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Options */}
      {alternatives && alternatives.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
            Alternative Options Considered:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {alternatives.map(({ product, score }) => (
              <button
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-left text-xs group transition"
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-white group-hover:text-cyan-400 transition-colors block truncate">
                    {product.name}
                  </span>
                  <span className="text-[11px] text-slate-400">Score: {score.overallScore}% • ₹{product.price.toLocaleString('en-IN')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
        {onOpenComparison && (
          <button
            onClick={onOpenComparison}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Compare Specs Table</span>
          </button>
        )}

        <button
          onClick={() => onSelectProduct(bestMatch)}
          className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
        >
          <span>Select & Proceed to Policy Check</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
