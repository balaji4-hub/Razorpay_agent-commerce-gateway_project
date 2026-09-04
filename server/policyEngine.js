import { randomUUID } from "crypto";
import { products } from "./catalog.js";
import { auditLogger } from "./auditLogger.js";

// Global Policy Constants (Bounded Money Actions)
export const POLICY_LIMITS = {
  MAX_TRANSACTION_AMOUNT: 10000.00, // Maximum autonomous single order limit in INR
  MAX_QUANTITY_PER_ITEM: 5,
  ALLOWED_CURRENCIES: ["INR"],
  APPROVAL_TIMEOUT_MS: 300000 // 5 minutes TTL for gated approvals
};

class PolicyEngine {
  constructor() {
    this.pendingApprovals = new Map(); // token -> approval request
  }

  /**
   * Validate and propose a checkout action (Phase 1: Bounded & Explainable check)
   */
  proposeCheckout({ sessionId, items, buyerInfo = {} }) {
    const startTime = performance.now();
    const checks = {
      isBounded: false,
      isInventoryAvailable: false,
      isCurrencyValid: false,
      isExplainable: false,
      violations: []
    };

    let calculatedTotal = 0;
    const validatedItems = [];

    // 1. Verify each item against catalog
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        checks.violations.push(`Product ID ${item.productId} does not exist in catalog.`);
        continue;
      }

      if (!product.isActive) {
        checks.violations.push(`Product "${product.name}" is currently inactive.`);
      }

      if (item.quantity <= 0 || item.quantity > POLICY_LIMITS.MAX_QUANTITY_PER_ITEM) {
        checks.violations.push(
          `Requested quantity (${item.quantity}) for "${product.name}" violates bounded limit (1 - ${POLICY_LIMITS.MAX_QUANTITY_PER_ITEM}).`
        );
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        checks.violations.push(
          `Inventory shortage for "${product.name}": requested ${item.quantity}, available stock is ${product.stock}.`
        );
      }

      const unitPrice = item.discountedPrice || product.price;
      const lineTotal = unitPrice * item.quantity;
      calculatedTotal += lineTotal;

      validatedItems.push({
        product,
        quantity: item.quantity,
        unitPrice,
        lineTotal
      });
    }

    // 2. Validate Currency
    checks.isCurrencyValid = POLICY_LIMITS.ALLOWED_CURRENCIES.includes("INR");

    // 3. Validate Spending Bounds
    if (calculatedTotal > POLICY_LIMITS.MAX_TRANSACTION_AMOUNT) {
      checks.violations.push(
        `Total amount ₹${calculatedTotal.toFixed(2)} exceeds autonomous transaction limit of ₹${POLICY_LIMITS.MAX_TRANSACTION_AMOUNT.toFixed(2)}.`
      );
    }

    checks.isBounded = checks.violations.length === 0;
    checks.isInventoryAvailable = !checks.violations.some(v => v.includes("Inventory shortage"));

    // 4. Construct Explainability Model
    const intentExplanation = {
      summary: `Autonomous order authorization proposal for ${validatedItems.length} catalog item(s).`,
      rationale: validatedItems.map(v => 
        `Item "${v.product.name}" (Qty: ${v.quantity}) selected per buyer request with rating ${v.product.rating}★ and ${v.product.deliveryDays}-day guaranteed delivery.`
      ),
      costBreakdown: {
        subtotal: calculatedTotal,
        currency: "INR",
        boundedLimit: POLICY_LIMITS.MAX_TRANSACTION_AMOUNT,
        status: checks.isBounded ? "WITHIN_BOUNDS" : "EXCEEDS_BOUNDS"
      },
      policiesEnforced: [
        "NPCI UAP / ACP Agent-to-Merchant Guardrail v1",
        "Pre-checkout Inventory Reservation Check",
        "Hard Cap Spending Limit (₹10,000)",
        "Mandatory Human-in-the-Loop Gated Approval"
      ],
      timestamp: new Date().toISOString()
    };

    const durationMs = performance.now() - startTime;

    // If bounded checks failed, record audit and return policy rejection
    if (!checks.isBounded) {
      auditLogger.logToolCall({
        sessionId,
        toolName: "enforcePolicyGuardrails",
        inputPayload: { items, calculatedTotal },
        outputPayload: { checks, intentExplanation },
        success: false,
        errorMessage: checks.violations.join("; "),
        durationMs
      });

      return {
        success: false,
        status: "policy_violation",
        violations: checks.violations,
        explanation: intentExplanation
      };
    }

    // Passed bounded checks -> Place in "awaiting_approval" state (Gated)
    const approvalToken = "appr_" + randomUUID();
    const pendingRequest = {
      token: approvalToken,
      sessionId,
      status: "awaiting_approval", // matches Codata ShoppingAgent run status
      items: validatedItems,
      totalAmount: calculatedTotal,
      currency: "INR",
      buyerInfo,
      intentExplanation,
      expiresAt: new Date(Date.now() + POLICY_LIMITS.APPROVAL_TIMEOUT_MS).toISOString(),
      createdAt: new Date().toISOString()
    };

    this.pendingApprovals.set(approvalToken, pendingRequest);

    auditLogger.logToolCall({
      sessionId,
      toolName: "enforcePolicyGuardrails",
      inputPayload: { items, totalAmount: calculatedTotal },
      outputPayload: { status: "awaiting_approval", token: approvalToken, intentExplanation },
      success: true,
      durationMs
    });

    return {
      success: true,
      status: "awaiting_approval",
      approvalToken,
      totalAmount: calculatedTotal,
      currency: "INR",
      items: validatedItems,
      explanation: intentExplanation
    };
  }

  /**
   * Release gate upon human-in-the-loop or merchant explicit approval
   */
  resolveApproval({ token, action, authorizedBy = "human_shopper" }) {
    const pending = this.pendingApprovals.get(token);
    if (!pending) {
      return {
        success: false,
        error: "Approval token invalid or expired"
      };
    }

    if (new Date(pending.expiresAt) < new Date()) {
      this.pendingApprovals.delete(token);
      return {
        success: false,
        error: "Approval token has expired"
      };
    }

    if (action === "approve") {
      pending.status = "approved";
      pending.authorizedBy = authorizedBy;
      pending.authorizedAt = new Date().toISOString();
      this.pendingApprovals.delete(token);

      return {
        success: true,
        status: "approved",
        orderData: pending
      };
    } else {
      pending.status = "rejected";
      pending.rejectedAt = new Date().toISOString();
      this.pendingApprovals.delete(token);

      return {
        success: false,
        status: "rejected",
        message: "Transaction was rejected by human operator."
      };
    }
  }
}

export const policyEngine = new PolicyEngine();
