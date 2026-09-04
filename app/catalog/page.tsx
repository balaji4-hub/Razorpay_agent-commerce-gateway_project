"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  SlidersHorizontal, 
  Star, 
  Check, 
  Clock, 
  RotateCcw, 
  Sparkles, 
  Code2, 
  ExternalLink,
  Layers,
  ArrowRight,
  Zap,
  Tag,
  Ticket
} from "lucide-react";
import Link from "next/link";
import { Product } from "@/services/catalogService";
import DayDealsBanner from "@/components/DayDealsBanner";
import { DayDeal, Voucher } from "@/services/offersService";


const CATEGORIES = [
  "All",
  "Headphones",
  "Earbuds",
  "Smartwatches",
  "Speakers",
  "Phone Accessories"
];

// Fallback image generator based on category
function getProductImage(category: string, id: string) {
  const map: Record<string, string> = {
    "headphones": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80",
    "earbuds": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80",
    "smartwatches": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80",
    "speakers": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=80",
    "phone accessories": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80"
  };
  return map[category.toLowerCase()] || map["headphones"];
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [dayDeals, setDayDeals] = useState<Record<string, DayDeal>>({});
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState<number>(20000);
  const [inspectProduct, setInspectProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, offersRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/offers").catch(() => null)
        ]);

        const prodJson = await prodRes.json();
        if (prodJson.success) {
          setProducts(prodJson.data);
        }

        if (offersRes) {
          const offersJson = await offersRes.json();
          if (offersJson.success && offersJson.data) {
            const dealsMap: Record<string, DayDeal> = {};
            offersJson.data.dayDeals?.forEach((d: DayDeal) => {
              dealsMap[d.productId] = d;
            });
            setDayDeals(dealsMap);
            setVouchers(offersJson.data.vouchers || []);
          }
        }
      } catch (err) {
        console.error("Failed to load catalog data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);


  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === "All" ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchPrice = p.price <= maxPrice;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.features.some((f) => f.toLowerCase().includes(q));
      return matchCat && matchPrice && matchQuery;
    });
  }, [products, selectedCategory, maxPrice, searchQuery]);

  const productMap = useMemo(() => {
    const map: Record<string, { name: string; category: string }> = {};
    products.forEach((p) => {
      map[p.id] = { name: p.name, category: p.category };
    });
    return map;
  }, [products]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Feature 1: Agent-Readable Merchant Catalog</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Merchant Product Catalog
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Structured JSON catalog with AI-verifiable specifications, stock levels, return guarantees, and multi-parameter filtering. Ready for autonomous AI shoppers and human discovery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all"
          >
            <span>Ask AI Shopping Agent</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Day Deals Rotating Banner */}
      <DayDealsBanner
        productMap={productMap}
        onDealClick={(productId) => {
          const target = products.find((p) => p.id === productId);
          if (target) {
            setSearchQuery(target.name);
          }
        }}
      />

      {/* Active Voucher Code Strip */}
      {vouchers.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-white">Active Promo Vouchers:</span>
            <span className="text-slate-400 text-[11px]">Use at checkout for instant discounts</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {vouchers.map((v) => (
              <span
                key={v.code}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-1.5"
              >
                <span>{v.code}</span>
                <span className="text-slate-400 font-normal">({v.discountPercent ? `${v.discountPercent}% off` : `₹${v.flatAmount} off`})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">

        
        {/* Search & Max Price Slider Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Search Input */}
          <div className="md:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name, brand, feature (e.g. 'ANC', 'bass', 'JBL')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition"
            />
          </div>

          {/* Max Price Slider */}
          <div className="md:col-span-5 flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-700/80">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Max Price:</span>
                <span className="font-mono font-bold text-white">₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="20000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/80">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25"
                    : "bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

      </div>

      {/* Catalog Results Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
            <p className="text-xs text-slate-400 font-mono">Loading agent-readable catalog...</p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8 space-y-3">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No matching products found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try resetting your price slider or searching for other keywords like "wireless", "headphones", or "JBL".
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setMaxPrice(20000);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4 px-1">
            <span>Showing <strong className="text-white">{filteredProducts.length}</strong> structured catalog item(s)</span>
            <span className="font-mono text-[11px] text-cyan-400">Endpoint: GET /api/products</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const inStock = product.stock > 0;
              const img = getProductImage(product.category, product.id);
              const deal = dayDeals[product.id];

              return (
                <div
                  key={product.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl overflow-hidden shadow-lg transition-all flex flex-col group"
                >
                  {/* Product Image Container */}
                  <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={img}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
                      <span className="px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur text-[10px] font-bold text-cyan-400 border border-cyan-500/30 uppercase tracking-wider font-mono">
                        {product.category}
                      </span>
                      {deal && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1 font-mono">
                          <Zap className="w-3 h-3 fill-white" />
                          <span>{deal.badge}</span>
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold backdrop-blur border font-mono ${
                          inStock
                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-950/80 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {inStock ? `${product.stock} in stock` : "Sold Out"}
                      </span>
                    </div>
                  </div>

                  {/* Product Info Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-semibold">{product.brand}</span>
                        <div className="flex items-center gap-1 text-amber-400 font-medium">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{product.rating}</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-base text-white tracking-tight group-hover:text-cyan-400 transition-colors line-clamp-1">
                        {product.name}
                      </h3>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      {/* Day Deal Alert Banner if product has an active deal */}
                      {deal && (
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-lg font-mono">
                          <span className="flex items-center gap-1 font-bold">
                            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{deal.label}</span>
                          </span>
                          <span className="text-[10px] text-amber-400/90">{deal.highlight}</span>
                        </div>
                      )}

                      {/* Top 3 Features (Explicit Requirement) */}
                      <div className="mt-3 space-y-1 border-t border-slate-800/60 pt-3">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                          Top Features:
                        </span>
                        <div className="space-y-1">
                          {product.features.slice(0, 3).map((feat, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                              <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery & Return Policy Info */}
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {product.delivery_days} days delivery
                        </span>
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 text-slate-400" />
                          {product.return_policy_days} days return
                        </span>
                      </div>
                    </div>

                    {/* Footer: Price & Actions */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {deal ? "Special Deal Price" : "Price in INR"}
                        </span>
                        {deal ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold font-mono text-emerald-400">
                              ₹{deal.dealPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-slate-500 line-through font-mono">
                              ₹{product.price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 font-mono">
                              -{deal.savingsPercent}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xl font-bold font-mono text-white">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">

                        {/* Inspect Raw Agent JSON */}
                        <button
                          onClick={() => setInspectProduct(product)}
                          title="Inspect AI Agent JSON schema"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                        >
                          <Code2 className="w-4 h-4" />
                        </button>

                        {/* Buy / Chat with Agent */}
                        <Link
                          href={`/shop?product=${encodeURIComponent(product.name)}`}
                          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition flex items-center gap-1"
                        >
                          <span>Ask Agent</span>
                          <Sparkles className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* JSON Schema Inspection Modal for AI Developers */}
      {inspectProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono text-xs font-bold text-white uppercase">
                  Agent-Readable JSON Schema • {inspectProduct.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectProduct(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                [ESC / Close]
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <pre className="text-xs font-mono text-cyan-300 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
                {JSON.stringify(inspectProduct, null, 2)}
              </pre>
            </div>
            <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectProduct(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
