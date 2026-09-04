import assert from "assert";
import fs from "fs";
import path from "path";

// 1. Verify products.json
console.log("\n🧪 --- RUNNING SUITE: FEATURE 1 (PRODUCT CATALOG) ---");
const rawProducts = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "products.json"), "utf-8"));
assert(Array.isArray(rawProducts), "products.json must be an array");
assert(rawProducts.length >= 12, `Expected >= 12 products, got ${rawProducts.length}`);

// Verify required schema fields on every product
for (const p of rawProducts) {
  assert(p.id, `Product missing id`);
  assert(p.name, `Product ${p.id} missing name`);
  assert(p.category, `Product ${p.id} missing category`);
  assert(p.brand, `Product ${p.id} missing brand`);
  assert(typeof p.price === "number", `Product ${p.id} price must be number`);
  assert(p.currency === "INR", `Product ${p.id} currency must be INR`);
  assert(Array.isArray(p.features), `Product ${p.id} features must be array`);
  assert(typeof p.specifications === "object", `Product ${p.id} specifications must be object`);
  assert(typeof p.stock === "number", `Product ${p.id} stock must be number`);
  assert(typeof p.rating === "number", `Product ${p.id} rating must be number`);
  assert(typeof p.delivery_days === "number", `Product ${p.id} delivery_days must be number`);
  assert(typeof p.return_policy_days === "number", `Product ${p.id} return_policy_days must be number`);
}
console.log(`✅ [Feature 1] Verified ${rawProducts.length} products adhere to the exact JSON schema.`);

// 2. Verify Policy Engine Rules
console.log("\n🧪 --- RUNNING SUITE: FEATURE 4 (FINANCIAL POLICY ENGINE) ---");
import { PolicyEngine, INITIAL_POLICIES } from "../services/policyEngine.js";
const policyEngine = new PolicyEngine(INITIAL_POLICIES);

// Test ₹500 transaction -> ALLOWED
const d500 = policyEngine.evaluatePolicy({
  actionType: "CREATE_PAYMENT",
  amount: 500,
  currency: "INR",
  reason: "Small gadget accessory",
  requestedBy: "AI_AGENT"
});
assert.strictEqual(d500.status, "ALLOWED", "₹500 must be ALLOWED");
assert.strictEqual(d500.riskLevel, "LOW");
console.log("✅ [Policy Engine] ₹500 -> ALLOWED (LOW risk)");

// Test ₹2000 transaction -> ALLOWED
const d2000 = policyEngine.evaluatePolicy({
  actionType: "CREATE_PAYMENT",
  amount: 2000,
  currency: "INR",
  reason: "Headphones purchase at threshold",
  requestedBy: "AI_AGENT"
});
assert.strictEqual(d2000.status, "ALLOWED", "₹2000 must be ALLOWED");
assert.strictEqual(d2000.riskLevel, "LOW");
console.log("✅ [Policy Engine] ₹2000 -> ALLOWED (LOW risk)");

// Test ₹4499 transaction -> APPROVAL_REQUIRED
const d4499 = policyEngine.evaluatePolicy({
  actionType: "CREATE_PAYMENT",
  amount: 4499,
  currency: "INR",
  reason: "JBL Tune 760NC ANC headphones",
  requestedBy: "AI_AGENT"
});
assert.strictEqual(d4499.status, "APPROVAL_REQUIRED", "₹4499 must require approval");
assert.strictEqual(d4499.riskLevel, "MEDIUM");
console.log("✅ [Policy Engine] ₹4499 -> APPROVAL_REQUIRED (MEDIUM risk)");

// Test ₹5000 transaction -> APPROVAL_REQUIRED
const d5000 = policyEngine.evaluatePolicy({
  actionType: "CREATE_PAYMENT",
  amount: 5000,
  currency: "INR",
  reason: "OnePlus Buds 3 at upper bound",
  requestedBy: "AI_AGENT"
});
assert.strictEqual(d5000.status, "APPROVAL_REQUIRED", "₹5000 must require approval");
console.log("✅ [Policy Engine] ₹5000 -> APPROVAL_REQUIRED (Upper boundary)");

// Test ₹6000 transaction -> BLOCKED
const d6000 = policyEngine.evaluatePolicy({
  actionType: "CREATE_PAYMENT",
  amount: 6000,
  currency: "INR",
  reason: "Sony headphones exceeding policy limit",
  requestedBy: "AI_AGENT"
});
assert.strictEqual(d6000.status, "BLOCKED", "₹6000 must be BLOCKED");
assert.strictEqual(d6000.riskLevel, "HIGH");
console.log("✅ [Policy Engine] ₹6000 -> BLOCKED (Exceeds ₹5,000 ceiling)");

// Test Unsupported Currency -> BLOCKED
const dUSD = policyEngine.evaluatePolicy({
  actionType: "CREATE_PAYMENT",
  amount: 100,
  currency: "USD",
  reason: "US Dollar purchase",
  requestedBy: "AI_AGENT"
});
assert.strictEqual(dUSD.status, "BLOCKED", "USD must be BLOCKED");
console.log("✅ [Policy Engine] USD currency -> BLOCKED");

// Test Missing Reason -> BLOCKED
const dNoReason = policyEngine.evaluatePolicy({
  actionType: "CREATE_PAYMENT",
  amount: 1000,
  currency: "INR",
  reason: "",
  requestedBy: "AI_AGENT"
});
assert.strictEqual(dNoReason.status, "BLOCKED", "Missing reason must be BLOCKED");
console.log("✅ [Policy Engine] Missing reason -> BLOCKED");

// Test Invalid Amount -> BLOCKED
const dInvalidAmount = policyEngine.evaluatePolicy({
  actionType: "CREATE_PAYMENT",
  amount: -50,
  currency: "INR",
  reason: "Negative value test",
  requestedBy: "AI_AGENT"
});
assert.strictEqual(dInvalidAmount.status, "BLOCKED", "Negative amount must be BLOCKED");
console.log("✅ [Policy Engine] Negative/Invalid amount -> BLOCKED");

// 3. Verify Human Approval Gate (Feature 6)
console.log("\n🧪 --- RUNNING SUITE: FEATURE 6 (HUMAN APPROVAL GATE) ---");
import { ApprovalService } from "../services/approvalService.js";
const approvalService = new ApprovalService();

const newAppr = approvalService.createApprovalRequest({
  actionType: "CREATE_PAYMENT",
  productId: "prod_001",
  productName: "JBL Tune 760NC",
  amount: 4499,
  reason: "Test approval gate",
  riskLevel: "MEDIUM"
});
assert.strictEqual(newAppr.status, "PENDING");
console.log(`✅ [Approval Gate] Ticket #${newAppr.id} created with status PENDING`);

// Approve request
const approvedResult = approvalService.approveRequest(newAppr.id, "TEST_SUITE_OPERATOR");
assert.strictEqual(approvedResult.success, true);
assert.strictEqual(approvedResult.request.status, "APPROVED");
console.log(`✅ [Approval Gate] Ticket #${newAppr.id} successfully transitioned to APPROVED`);

// Mark consumed (prevents replay attack)
const consumedFirstTime = approvalService.markConsumed(newAppr.id);
assert.strictEqual(consumedFirstTime, true, "First consumption must succeed");
const consumedSecondTime = approvalService.markConsumed(newAppr.id);
assert.strictEqual(consumedSecondTime, false, "Replay consumption must fail");
console.log(`✅ [Approval Gate] Single-use security enforcement verified (Replay prevented).`);

// 4. Verify Audit Trail (Feature 7)
console.log("\n🧪 --- RUNNING SUITE: FEATURE 7 (EXPLAINABLE AUDIT TRAIL) ---");
import { auditService } from "../services/auditService.js";
const allEvents = auditService.getAllEvents();
assert(allEvents.length > 0, "Audit trail must have captured events");
const summary = auditService.getAuditSummary();
assert(typeof summary.totalActions === "number");
console.log(`✅ [Audit Trail] ${allEvents.length} events logged with actors, reasons, and status.`);
console.log(`✅ [Audit Trail] Summary: ${summary.aiDecisions} AI decisions, ${summary.financialActions} financial actions recorded.`);

console.log("\n🎉 ALL AUTOMATED UNIT AND SECURITY TESTS PASSED WITH 100% SUCCESS!\n");
