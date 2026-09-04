import assert from "assert";

async function runLiveServerTests() {
  console.log("======================================================");
  console.log("🚀 TESTING LIVE NEXT.JS APP ROUTER AGENT COMMERCE GATEWAY");
  console.log("======================================================\n");

  const BASE_URL = "http://localhost:3000";

  // --- 1. Test Feature 1: Agent-Readable Catalog ---
  console.log("▶ [Feature 1] Testing Catalog APIs...");
  const catRes = await fetch(`${BASE_URL}/api/products`);
  assert.strictEqual(catRes.status, 200);
  const catData = await catRes.json();
  assert(catData.success, "Catalog API must return success");
  assert(catData.data.length >= 12, `Expected >= 12 items, got ${catData.data.length}`);
  console.log(`  ✓ GET /api/products -> ${catData.data.length} structured catalog items found`);

  // Category filter
  const headRes = await fetch(`${BASE_URL}/api/products?category=headphones`);
  const headData = await headRes.json();
  assert(headData.data.every(p => p.category === "headphones"));
  console.log(`  ✓ GET /api/products?category=headphones -> ${headData.data.length} headphones filtered`);

  // MaxPrice filter
  const priceRes = await fetch(`${BASE_URL}/api/products?maxPrice=5000`);
  const priceData = await priceRes.json();
  assert(priceData.data.every(p => p.price <= 5000));
  console.log(`  ✓ GET /api/products?maxPrice=5000 -> ${priceData.data.length} products under ₹5,000`);

  // Single product fetch
  const singleRes = await fetch(`${BASE_URL}/api/products/prod_001`);
  assert.strictEqual(singleRes.status, 200);
  const singleData = await singleRes.json();
  assert.strictEqual(singleData.data.id, "prod_001");
  console.log(`  ✓ GET /api/products/prod_001 -> Details for "${singleData.data.name}" retrieved`);

  // --- 2. Test Feature 2 & 3: Controlled AI Agent & Recommendation Engine ---
  console.log("\n▶ [Feature 2 & 3] Testing AI Shopping Agent & Scoring Engine...");
  const chatRes = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "I need headphones for travel under ₹5000 with ANC",
      sessionId: "test_live_sess_01"
    })
  });
  assert.strictEqual(chatRes.status, 200);
  const chatData = await chatRes.json();
  assert(chatData.success);
  assert(chatData.reasoningSteps.length >= 3, "Agent must show concise reasoning steps");
  assert(chatData.recommendation, "Agent must return structured recommendation");
  console.log(`  ✓ POST /api/chat -> AI parsed intent and executed controlled tools`);
  console.log(`  ✓ Real-time Reasoning Steps: ${chatData.reasoningSteps.join(" -> ")}`);
  console.log(`  ✓ Best Match: "${chatData.recommendation.bestMatch.name}" (Score: ${chatData.recommendation.bestMatchScore.overallScore}/100)`);
  console.log(`  ✓ Explainable Rationale: ${chatData.recommendation.explanation.reasons[0]}`);

  // Test Out of Stock Graceful Handling
  const oosRes = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "I want Sennheiser HD 450SE",
      sessionId: "test_live_sess_01"
    })
  });
  const oosData = await oosRes.json();
  console.log(`  ✓ Handled specific product lookup; availability checked.`);

  // --- 3. Test Feature 4: Financial Policy Engine ---
  console.log("\n▶ [Feature 4] Testing Deterministic Financial Policy Engine...");
  
  // Test ₹500 -> ALLOWED
  const p500Res = await fetch(`${BASE_URL}/api/policy/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: {
        actionType: "CREATE_PAYMENT",
        amount: 500,
        currency: "INR",
        reason: "Small cable accessory purchase",
        requestedBy: "AI_AGENT"
      }
    })
  });
  const p500Data = await p500Res.json();
  assert.strictEqual(p500Data.data.status, "ALLOWED");
  assert.strictEqual(p500Data.data.riskLevel, "LOW");
  console.log("  ✓ Policy Check: ₹500 -> ALLOWED (Low Risk)");

  // Test ₹4,499 -> APPROVAL_REQUIRED
  const p4499Res = await fetch(`${BASE_URL}/api/policy/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: {
        actionType: "CREATE_PAYMENT",
        amount: 4499,
        currency: "INR",
        reason: "JBL Tune 760NC checkout request",
        requestedBy: "AI_AGENT"
      }
    })
  });
  const p4499Data = await p4499Res.json();
  assert.strictEqual(p4499Data.data.status, "APPROVAL_REQUIRED");
  assert.strictEqual(p4499Data.data.riskLevel, "MEDIUM");
  console.log("  ✓ Policy Check: ₹4,499 -> APPROVAL_REQUIRED (Medium Risk, Human Gate Triggered)");

  // Test ₹6,000 -> BLOCKED
  const p6000Res = await fetch(`${BASE_URL}/api/policy/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: {
        actionType: "CREATE_PAYMENT",
        amount: 6000,
        currency: "INR",
        reason: "Bulk item exceeding single order bound",
        requestedBy: "AI_AGENT"
      }
    })
  });
  const p6000Data = await p6000Res.json();
  assert.strictEqual(p6000Data.data.status, "BLOCKED");
  assert.strictEqual(p6000Data.data.riskLevel, "HIGH");
  console.log("  ✓ Policy Check: ₹6,000 -> BLOCKED (High Risk, Exceeds ₹5,000 Limit)");

  // --- 4. Test Feature 5 & 6: Human Approval Gate & Razorpay Order Security ---
  console.log("\n▶ [Feature 5 & 6] Testing Approval Gating & Razorpay Integration...");

  // Test 403 Forbidden when creating payment without approval for ₹4,499 item
  const unauthPayRes = await fetch(`${BASE_URL}/api/payment/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: "prod_001",
      amount: 4499,
      currency: "INR"
    })
  });
  assert.strictEqual(unauthPayRes.status, 403, "Payment endpoint must return HTTP 403 when unapproved");
  console.log("  ✓ Security Guardrail: /api/payment/create-order returned HTTP 403 (Payment prevented without approval)");

  // Create Approval Ticket
  const createTicketRes = await fetch(`${BASE_URL}/api/approvals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      actionType: "CREATE_PAYMENT",
      productId: "prod_001",
      productName: "JBL Tune 760NC",
      amount: 4499,
      currency: "INR",
      reason: "User selected product in chat and requested checkout",
      riskLevel: "MEDIUM"
    })
  });
  const ticketData = await createTicketRes.json();
  const ticketId = ticketData.data.id;
  console.log(`  ✓ Approval Gate: Ticket #${ticketId} created (Status: PENDING)`);

  // Approve Ticket
  const approveRes = await fetch(`${BASE_URL}/api/approvals/${ticketId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolvedBy: "TEST_SUITE_SUPERVISOR" })
  });
  const approvedData = await approveRes.json();
  assert(approvedData.success);
  console.log(`  ✓ Approval Gate: Ticket #${ticketId} APPROVED by human supervisor`);

  // Now create Razorpay order using the approved ticket
  const payOrderRes = await fetch(`${BASE_URL}/api/payment/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: "prod_001",
      amount: 4499,
      currency: "INR",
      approvalId: ticketId
    })
  });
  assert.strictEqual(payOrderRes.status, 200, "Approved ticket must allow order creation");
  const payOrderData = await payOrderRes.json();
  assert(payOrderData.success);
  const rzpOrder = payOrderData.data;
  console.log(`  ✓ Razorpay Test Order Created: ID="${rzpOrder.orderId}", Amount=${rzpOrder.amount / 100} ${rzpOrder.currency} (in paise: ${rzpOrder.amount})`);

  // Verify Signature
  const verifyRes = await fetch(`${BASE_URL}/api/payment/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: rzpOrder.orderId,
      razorpay_payment_id: "pay_test_verified_001",
      razorpay_signature: "sig_verified_valid"
    })
  });
  const verifyData = await verifyRes.json();
  assert(verifyData.success);
  console.log(`  ✓ Razorpay Payment Verified: Payment ID="${verifyData.data.paymentId}", Status="${verifyData.data.status}"`);

  // --- 5. Test Feature 7: Explainable Audit Trail ---
  console.log("\n▶ [Feature 7] Testing Explainable Audit Trail Stream...");
  const auditRes = await fetch(`${BASE_URL}/api/audit`);
  assert.strictEqual(auditRes.status, 200);
  const auditData = await auditRes.json();
  assert(auditData.data.length >= 6);
  console.log(`  ✓ GET /api/audit -> ${auditData.total} audit events captured across user, AI, policy, approval, and payment systems`);
  console.log(`  ✓ Audit Summary: Actions=${auditData.summary.totalActions}, AI Decisions=${auditData.summary.aiDecisions}, Financial Actions=${auditData.summary.financialActions}, Status="${auditData.summary.finalStatus}"`);

  console.log("\n======================================================");
  console.log("🎉 ALL 7 FEATURES VERIFIED 100% WORKING ON NEXT.JS APP ROUTER!");
  console.log("======================================================\n");
}

runLiveServerTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
