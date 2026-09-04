"use client";

import { X, Sparkles, Star, Check, ShieldCheck } from "lucide-react";
import { Product } from "@/services/catalogService";

interface ProductComparisonModalProps {
  products: Product[];
  bestMatchId?: string;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export default function ProductComparisonModal({
  products,
  bestMatchId,
  onClose,
  onSelectProduct
}: ProductComparisonModalProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-white">Side-by-Side Product Comparison</h3>
              <p className="text-xs text-slate-400">AI-verified specifications & stock availability matrix</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="p-3 text-slate-400 font-semibold uppercase tracking-wider w-36">Metric</th>
                {products.map((p) => {
                  const isBest = p.id === bestMatchId;
                  return (
                    <th key={p.id} className="p-3 min-w-[200px]">
                      <div className="space-y-1">
                        {isBest && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] tracking-wide">
                            ★ BEST MATCH
                          </span>
                        )}
                        <h4 className="font-bold text-white text-sm">{p.name}</h4>
                        <span className="text-[11px] text-slate-400 font-medium">{p.brand}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              
              {/* Price Row */}
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 text-slate-400 font-sans font-medium">Price</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-emerald-400 font-bold text-sm">
                    ₹{p.price.toLocaleString('en-IN')}
                  </td>
                ))}
              </tr>

              {/* Rating Row */}
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 text-slate-400 font-sans font-medium">Rating</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-amber-400 font-bold">
                    ★ {p.rating}
                  </td>
                ))}
              </tr>

              {/* Battery */}
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 text-slate-400 font-sans font-medium">Battery</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-slate-200">
                    {p.specifications.battery || "N/A"}
                  </td>
                ))}
              </tr>

              {/* ANC */}
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 text-slate-400 font-sans font-medium">Noise Cancellation</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3">
                    {p.specifications.noise_cancellation ? (
                      <span className="text-cyan-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Active (ANC)
                      </span>
                    ) : (
                      <span className="text-slate-500">Passive Isolation</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Connectivity */}
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 text-slate-400 font-sans font-medium">Connectivity</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-slate-200">
                    {p.specifications.connectivity || "Bluetooth"}
                  </td>
                ))}
              </tr>

              {/* Stock Status */}
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 text-slate-400 font-sans font-medium">Inventory Stock</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3">
                    <span className={p.stock > 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {p.stock > 0 ? `${p.stock} units` : "Out of Stock"}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Delivery Days */}
              <tr className="hover:bg-slate-800/30">
                <td className="p-3 text-slate-400 font-sans font-medium">Guaranteed Delivery</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-slate-300">
                    {p.delivery_days} business days
                  </td>
                ))}
              </tr>

              {/* Action / Select Row */}
              <tr>
                <td className="p-3 text-slate-400 font-sans font-medium">Select Option</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3">
                    {p.stock > 0 ? (
                      <button
                        onClick={() => {
                          onSelectProduct(p);
                          onClose();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow transition"
                      >
                        Select & Checkout
                      </button>
                    ) : (
                      <button disabled className="w-full py-2 px-3 rounded-xl bg-slate-800 text-slate-500 text-xs font-semibold cursor-not-allowed">
                        Sold Out
                      </button>
                    )}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
          >
            Close Comparison
          </button>
        </div>

      </div>
    </div>
  );
}
