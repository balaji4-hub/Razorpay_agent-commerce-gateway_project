import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Agent Commerce Gateway — Autonomous AI Buyer & Merchant Gateway",
  description: "Next-gen merchant platform enabling AI agents and shoppers to discover, evaluate, and transact safely with policy enforcement and audit trails."
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Razorpay Standard Checkout CDN */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
