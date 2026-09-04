import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { products } from "./catalog.js";
import { agentEngine } from "./agentEngine.js";
import { policyEngine, POLICY_LIMITS } from "./policyEngine.js";
import { razorpayService } from "./razorpayService.js";
import { auditLogger } from "./auditLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// --- 1. Catalog Endpoints (Codata OpenAPI Specification) ---
app.get("/api/products", (req, res) => {
  const { category, brand, query, pageOffset = 0, pageLimit = 50 } = req.query;
  let list = [...products];

  if (category) list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
  if (brand) list = list.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  const offset = parseInt(pageOffset, 10);
  const limit = parseInt(pageLimit, 10);
  const paged = list.slice(offset, offset + limit);

  res.json({
    data: paged,
    pagination: {
      total: list.length,
      pageOffset: offset,
      pageLimit: limit
    }
  });
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

// --- 2. Conversational Agent Endpoint ---
app.post("/api/chat", async (req, res) => {
  try {
    const { sessionId, message, conversationHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await agentEngine.processUserMessage({
      sessionId: sessionId || "00000000-0000-4000-8000-000000000001",
      message,
      conversationHistory
    });

    res.json(response);
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Internal agent processing error", details: err.message });
  }
});

// --- 3. Bounded & Gated Checkout Phase 1: Propose Order ---
app.post("/api/checkout/propose", (req, res) => {
  try {
    const { sessionId, items, buyerInfo } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required" });
    }

    const proposal = policyEngine.proposeCheckout({
      sessionId: sessionId || "00000000-0000-4000-8000-000000000001",
      items,
      buyerInfo
    });

    res.json(proposal);
  } catch (err) {
    console.error("Checkout proposal error:", err);
    res.status(500).json({ error: "Failed to propose checkout", details: err.message });
  }
});

// --- 4. Gated Checkout Phase 2: Human / Merchant Approval -> Razorpay Order ---
app.post("/api/checkout/approve", async (req, res) => {
  try {
    const { approvalToken, authorizedBy = "human_operator" } = req.body;
    if (!approvalToken) {
      return res.status(400).json({ error: "approvalToken is required" });
    }

    const gateResolution = policyEngine.resolveApproval({
      token: approvalToken,
      action: "approve",
      authorizedBy
    });

    if (!gateResolution.success) {
      return res.status(400).json(gateResolution);
    }

    const { orderData } = gateResolution;

    // Create official / simulated Razorpay Order
    const razorpayOrder = await razorpayService.createOrder({
      sessionId: orderData.sessionId,
      amountInRupees: orderData.totalAmount,
      currency: orderData.currency,
      receipt: `rcpt_${orderData.token.slice(-8)}`,
      notes: {
        approvalToken: orderData.token,
        authorizedBy
      }
    });

    res.json({
      success: true,
      status: "razorpay_order_created",
      orderData,
      razorpayOrder,
      checkoutConfig: {
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Agent Commerce Gateway",
        description: `Autonomous Order for ${orderData.items.map(i => i.product.name).join(", ")}`,
        order_id: razorpayOrder.orderId
      }
    });
  } catch (err) {
    console.error("Approval error:", err);
    res.status(500).json({ error: "Order approval processing failed", details: err.message });
  }
});

// --- 5. Reject Gated Checkout ---
app.post("/api/checkout/reject", (req, res) => {
  const { approvalToken } = req.body;
  const result = policyEngine.resolveApproval({ token: approvalToken, action: "reject" });
  res.json(result);
});

// --- 6. Razorpay Payment Verification ---
app.post("/api/razorpay/verify", (req, res) => {
  const { sessionId, paymentId, orderId, signature } = req.body;
  const verification = razorpayService.verifyPayment({ sessionId, paymentId, orderId, signature });
  res.json(verification);
});

// --- 7. Live Audit Trail Endpoint (Codata AgentToolCall) ---
app.get("/api/audit-logs", (req, res) => {
  const { sessionId, limit } = req.query;
  const logs = auditLogger.getLogs({ sessionId, limit: limit ? parseInt(limit, 10) : 50 });
  res.json({
    total: logs.length,
    policyLimits: POLICY_LIMITS,
    items: logs
  });
});

// --- 8. One-Click Failure Simulator (To directly demonstrate "The Bar") ---
app.post("/api/simulate-failure", (req, res) => {
  const { type, sessionId = "00000000-0000-4000-8000-000000000001" } = req.body;

  if (type === "out_of_stock") {
    const soldOutItem = products.find(p => p.stock === 0);
    const check = agentEngine.checkStock({ sessionId, productId: soldOutItem.id, quantity: 1 });
    const alternative = products.find(p => p.category === soldOutItem.category && p.stock > 0);

    return res.json({
      type: "out_of_stock_handled",
      title: "Out of Stock Failure Handled Gracefully",
      originalItem: soldOutItem,
      checkResult: check,
      alternativeSuggested: alternative,
      auditLogged: true,
      message: `Item "${soldOutItem.name}" has 0 stock. Agent caught shortage and redirected to "${alternative.name}".`
    });
  }

  if (type === "policy_violation") {
    // Attempt to order ₹35,000 worth of goods exceeding ₹10,000 limit
    const item = products[0];
    const proposal = policyEngine.proposeCheckout({
      sessionId,
      items: [{ productId: item.id, quantity: 10 }]
    });

    return res.json({
      type: "policy_violation_handled",
      title: "Spending Bounds Guardrail Intercepted",
      attemptedQuantity: 10,
      attemptedTotal: item.price * 10,
      proposalResult: proposal,
      auditLogged: true,
      message: `Autonomous purchase proposal of ₹${(item.price * 10).toLocaleString('en-IN')} exceeded policy bound of ₹${POLICY_LIMITS.MAX_TRANSACTION_AMOUNT.toLocaleString('en-IN')}. Intercepted before any money action occurred.`
    });
  }

  res.status(400).json({ error: "Invalid failure type. Expected 'out_of_stock' or 'policy_violation'" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Agent Commerce Gateway is running!`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📋 Codata OpenAPI Catalog: http://localhost:${PORT}/api/products`);
  console.log(`🛡️ Policy Guardrails: Active (Max Single Limit: ₹${POLICY_LIMITS.MAX_TRANSACTION_AMOUNT})`);
  console.log(`💳 Razorpay Test Mode: Active`);
  console.log(`📊 Live Audit Trail: http://localhost:${PORT}/api/audit-logs`);
  console.log(`======================================================\n`);
});
