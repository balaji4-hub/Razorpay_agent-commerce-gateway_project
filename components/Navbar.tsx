"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bot, 
  ShoppingBag, 
  Layers, 
  ShieldCheck, 
  KeyRound, 
  Activity, 
  CheckCircle2, 
  Cpu
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Catalog", href: "/catalog", icon: Layers, badge: "Agent-Readable" },
    { name: "AI Shop Agent", href: "/shop", icon: Bot, badge: "Tool Calling" },
    { name: "Policy Engine", href: "/policy", icon: ShieldCheck, badge: "Bounded" },
    { name: "Approval Gate", href: "/approvals", icon: KeyRound, badge: "Gated" },
    { name: "Audit Trail", href: "/audit", icon: Activity, badge: "Explainable" }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo & Title */}
        <Link href="/shop" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                Agent Commerce Gateway
              </span>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/30">
                v2.0 PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Autonomous AI Buyer Engine • NPCI UAP • Razorpay Test Mode
            </p>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Status Badges */}
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Razorpay: Sandbox Test Mode</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px] font-mono text-indigo-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Guardrails:</span>
            <span className="font-semibold text-white">Bounded & Gated</span>
          </div>
        </div>

      </div>

      {/* Mobile Nav Row */}
      <div className="flex md:hidden overflow-x-auto px-4 py-2 border-t border-slate-800/60 bg-slate-950/60 gap-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                isActive ? "bg-slate-800 text-cyan-400" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
