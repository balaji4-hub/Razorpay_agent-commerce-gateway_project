"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  ShoppingBag,
  Tag,
  Zap,
  Ticket
} from "lucide-react";
import { Product } from "@/services/catalogService";
import { RankedRecommendation } from "@/services/recommendationService";
import RecommendationCard from "@/components/RecommendationCard";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import AgentActivityPanel from "@/components/AgentActivityPanel";
import CompactAuditTrail from "@/components/CompactAuditTrail";
import ApprovalModal from "@/components/ApprovalModal";
import RazorpayCheckout from "@/components/RazorpayCheckout";
import CrossSellBanner from "@/components/CrossSellBanner";
import { ApprovalRequest } from "@/services/approvalService";
import { useRouter, useSearchParams } from "next/navigation";

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  recommendation?: RankedRecommendation | null;
  products?: Product[];
  crossSell?: any;
  timestamp: string;
}


const DEFAULT_SUGGESTED_PROMPTS = [
  "Find wireless headphones under ₹5000",
  "I need headphones for travel with ANC",
  "Show me ANC headphones with long battery life",
  "Find high-rated earbuds under ₹4500",
  "Test out of stock headphone",
  "Buy bulk 10 units (Exceed ₹5000 limit)"
];

function ShopAgentContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init",
      sender: "agent",
      text: "Hello! I am your Autonomous Commerce Gateway Agent.\n\nI can help you search our catalog with controlled tools, calculate multi-factor recommendations, and safely initiate bounded transactions via Razorpay test mode. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState<string[]>([
    "Gateway agent online",
    "Connected to controlled catalog tools",
    "Deterministic policy engine active"
  ]);

  // Comparison Modal State
  const [compareProductsList, setCompareProductsList] = useState<Product[] | null>(null);
  const [bestMatchId, setBestMatchId] = useState<string | undefined>(undefined);

  // Approval Modal State (Feature 6)
  const [pendingApproval, setPendingApproval] = useState<ApprovalRequest | null>(null);

  // Razorpay Checkout State (Feature 5)
  const [activeRazorpayOrder, setActiveRazorpayOrder] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle URL query parameter pre-fill
  useEffect(() => {
    const productQuery = searchParams.get("product");
    if (productQuery) {
      handleSendMessage(`I'm interested in buying ${productQuery}. What are its specs and availability?`);
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSendMessage(customText?: string) {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: "user_" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, sessionId: "shop_session_01" })
      });

      const data = await res.json();
      if (data.success) {
        if (data.reasoningSteps) {
          setReasoningSteps(data.reasoningSteps);
        }

        const agentMsg: ChatMessage = {
          id: "agent_" + Date.now(),
          sender: "agent",
          text: data.reply,
          recommendation: data.recommendation,
          products: data.products || data.allMatchedProducts,
          crossSell: data.crossSell,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages((prev) => [...prev, agentMsg]);


        // If comparison available
        if (data.allMatchedProducts && data.allMatchedProducts.length >= 2) {
          setCompareProductsList(data.allMatchedProducts.slice(0, 3));
          setBestMatchId(data.recommendation?.bestMatch?.id);
        }
      } else {
        const errorMsg: ChatMessage = {
          id: "err_" + Date.now(),
          sender: "agent",
          text: `⚠️ Error communicating with catalog tool: ${data.error || "Internal error"}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "err_" + Date.now(),
        sender: "agent",
        text: `⚠️ Network error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  // Handle Checkout initiation from Recommendation Card
  async function handleProductSelect(product: Product) {
    try {
      // Step 1: Policy Engine Evaluation
      const policyRes = await fetch("/api/policy/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: {
            actionType: "CREATE_PAYMENT",
            productId: product.id,
            amount: product.price,
            currency: product.currency,
            reason: `User selected ${product.name} from agent recommendation`,
            requestedBy: "AI_AGENT"
          }
        })
      });

      const policyData = await policyRes.json();
      const decision = policyData.data;

      // Rule 3: BLOCKED
      if (decision.status === "BLOCKED") {
        alert(`❌ TRANSACTION BLOCKED BY POLICY GUARDRAIL:\n${decision.reasons.join("\n")}`);
        return;
      }

      // Rule 2: APPROVAL_REQUIRED -> Open Human Approval Gate Modal (Feature 6)
      if (decision.status === "APPROVAL_REQUIRED") {
        const apprRes = await fetch("/api/approvals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType: "CREATE_PAYMENT",
            productId: product.id,
            productName: product.name,
            amount: product.price,
            currency: product.currency,
            reason: `User requested checkout for ${product.name}. Amount exceeds autonomous threshold of ₹2,000.`,
            riskLevel: decision.riskLevel
          })
        });
        const apprData = await apprRes.json();
        if (apprData.success) {
          setPendingApproval(apprData.data);
        }
        return;
      }

      // Rule 1: ALLOWED -> Direct Razorpay Order Creation (Feature 5)
      await triggerRazorpayOrder(product);
    } catch (err: any) {
      alert("Checkout initiation failed: " + err.message);
    }
  }

  // Trigger Razorpay Order Creation
  async function triggerRazorpayOrder(product: Product, approvalId?: string) {
    try {
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          amount: product.price,
          currency: product.currency,
          approvalId
        })
      });

      const orderData = await orderRes.json();
      if (orderData.success) {
        setActiveRazorpayOrder(orderData.data);
      } else {
        alert("Payment initialization rejected: " + (orderData.error || "Validation error"));
      }
    } catch (err: any) {
      alert("Payment error: " + err.message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Autonomous AI Shopping Agent</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                Controlled Tools Only
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Natural language shopping assistant with multi-factor scoring, no raw hallucination, and gated checkout.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMessages([messages[0]]);
              setReasoningSteps(["Conversation reset", "Awaiting user input"]);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-mono transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Chat Assistant (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[750px] justify-between">
          
          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className={`space-y-3 max-w-xl ${isUser ? "text-right" : "text-left"}`}>
                    
                    {/* Text Bubble */}
                    <div
                      className={`inline-block p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-medium rounded-tr-sm shadow-md"
                          : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-sm shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      <span className="text-[9px] opacity-60 block mt-1.5 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Interactive Recommendation Card inside Chat */}
                    {msg.recommendation && (
                      <div className="text-left w-full pt-1 animate-in fade-in zoom-in-95 duration-200">
                        <RecommendationCard
                          recommendation={msg.recommendation}
                          onSelectProduct={handleProductSelect}
                          onOpenComparison={() => {
                            if (compareProductsList) {
                              setCompareProductsList(compareProductsList);
                            }
                          }}
                        />

                        {/* In-Chat Cross-Sell / Upsell Drawer */}
                        {msg.crossSell && (
                          <CrossSellBanner
                            mainProduct={msg.crossSell.mainProduct}
                            accessories={msg.crossSell.accessories}
                            bundleDiscountPercent={msg.crossSell.bundleDiscountPercent}
                            onAddBundle={(bundleAccessories) => {
                              const discount = (msg.crossSell.bundleDiscountPercent || 10) / 100;
                              const bundleAccessoriesTotal = bundleAccessories.reduce(
                                (acc: number, item: Product) => acc + Math.round(item.price * (1 - discount)),
                                0
                              );
                              const combinedProduct: Product = {
                                ...msg.crossSell.mainProduct,
                                id: `${msg.crossSell.mainProduct.id}_bundle`,
                                name: `${msg.crossSell.mainProduct.name} + Bundle (${bundleAccessories.map(a => a.name).join(", ")})`,
                                price: msg.crossSell.mainProduct.price + bundleAccessoriesTotal
                              };
                              handleProductSelect(combinedProduct);
                            }}
                            onDismiss={() => {
                              setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, crossSell: null } : m));
                            }}
                          />
                        )}
                      </div>
                    )}


                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                      <User className="w-4 h-4 text-cyan-400" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-950 border border-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2 text-xs text-cyan-400 font-mono">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing controlled catalog tools...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Area: Suggested Prompts & Input Box */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            
            {/* Suggested Prompt Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
              <span className="text-[10px] text-slate-500 font-mono uppercase shrink-0">Prompts:</span>
              {DEFAULT_SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={loading}
                  className="shrink-0 px-3 py-1 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 text-[11px] transition flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask the shopping agent (e.g. 'I need travel headphones under ₹5000')..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loading}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition"
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-bold text-xs text-white shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>

        </div>

        {/* RIGHT COLUMN: Real-Time Reasoning & Audit Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Real-time Controlled Tool Reasoning Panel */}
          <AgentActivityPanel steps={reasoningSteps} isProcessing={loading} />

          {/* Real-Time Compact Audit Trail */}
          <CompactAuditTrail />

        </div>

      </div>

      {/* Comparison Modal */}
      {compareProductsList && (
        <ProductComparisonModal
          products={compareProductsList}
          bestMatchId={bestMatchId}
          onClose={() => setCompareProductsList(null)}
          onSelectProduct={handleProductSelect}
        />
      )}

      {/* Approval Gating Modal (Feature 6) */}
      {pendingApproval && (
        <ApprovalModal
          approvalRequest={pendingApproval}
          onClose={() => setPendingApproval(null)}
          onApproved={async (req) => {
            setPendingApproval(null);
            // After human approval, trigger Razorpay test order creation
            const prod = {
              id: req.productId || "prod_001",
              name: req.productName || "Approved Item",
              price: req.amount,
              currency: req.currency
            } as Product;
            await triggerRazorpayOrder(prod, req.id);
          }}
          onRejected={() => {
            setPendingApproval(null);
            setMessages(prev => [
              ...prev,
              {
                id: "rej_" + Date.now(),
                sender: "agent",
                text: "⚠️ **Transaction Blocked**: The purchase was not completed because human approval was declined.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]);
          }}
        />
      )}

      {/* Razorpay Test Checkout Drawer / Modal (Feature 5) */}
      {activeRazorpayOrder && (
        <RazorpayCheckout
          orderData={activeRazorpayOrder}
          onClose={() => setActiveRazorpayOrder(null)}
          onSuccess={(payment) => {
            setActiveRazorpayOrder(null);
            router.push(
              `/payment/success?orderId=${encodeURIComponent(payment.orderId)}&paymentId=${encodeURIComponent(payment.paymentId)}&amount=${payment.amount}&productName=${encodeURIComponent(activeRazorpayOrder.product.name)}`
            );
          }}
        />
      )}

    </div>
  );
}

export default function ShopAgentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
          <p className="text-xs text-slate-400 font-mono">Initializing Autonomous Agent Session...</p>
        </div>
      </div>
    }>
      <ShopAgentContent />
    </Suspense>
  );
}
