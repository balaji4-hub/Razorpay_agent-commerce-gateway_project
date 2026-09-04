import { auditService } from "./auditService";

export type FinancialActionType = 
  | "CREATE_PAYMENT" 
  | "CREATE_ORDER" 
  | "ISSUE_DISCOUNT" 
  | "REFUND";

export interface FinancialAction {
  actionType: FinancialActionType;
  amount?: number;
  currency?: string;
  productId?: string;
  reason: string;
  requestedBy: "AI_AGENT";
  metadata?: Record<string, any>;
}

export type PolicyStatus = "ALLOWED" | "APPROVAL_REQUIRED" | "BLOCKED";
export type PolicyRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface PolicyCheck {
  name: string;
  passed: boolean;
  message: string;
  requiredForApproval?: boolean;
}

export interface PolicyDecision {
  id: string;
  status: PolicyStatus;
  reasons: string[];
  policyChecks: PolicyCheck[];
  riskLevel: PolicyRiskLevel;
  action: FinancialAction;
  evaluatedAt: string;
}

export interface PolicyConfig {
  maxTransactionAmount: number;
  requireApprovalAbove: number;
  maxDiscountPercentage: number;
  maxRetries: number;
  allowedCurrencies: string[];
}

export const INITIAL_POLICIES: PolicyConfig = {
  maxTransactionAmount: 5000,
  requireApprovalAbove: 2000,
  maxDiscountPercentage: 20,
  maxRetries: 1,
  allowedCurrencies: ["INR"]
};

export class PolicyEngine {
  private config: PolicyConfig;

  constructor(config: PolicyConfig = INITIAL_POLICIES) {
    this.config = config;
  }

  /**
   * Check 1: Action Type Validity
   */
  checkActionType(action: FinancialAction): PolicyCheck {
    const validTypes: FinancialActionType[] = ["CREATE_PAYMENT", "CREATE_ORDER", "ISSUE_DISCOUNT", "REFUND"];
    const passed = validTypes.includes(action.actionType);
    return {
      name: "Action Type Verification",
      passed,
      message: passed 
        ? `Supported autonomous action type: ${action.actionType}`
        : `Unsupported financial action type: ${action.actionType}`
    };
  }

  /**
   * Check 2: Currency Support
   */
  checkCurrency(currency?: string): PolicyCheck {
    const passed = Boolean(currency && this.config.allowedCurrencies.includes(currency.toUpperCase()));
    return {
      name: "Currency Validation",
      passed,
      message: passed
        ? `Supported transaction currency: ${currency?.toUpperCase()}`
        : `Unsupported currency '${currency || "EMPTY"}'. Allowed: ${this.config.allowedCurrencies.join(", ")}`
    };
  }

  /**
   * Check 3: Reason Completeness (Explainability Bar)
   */
  checkReason(reason?: string): PolicyCheck {
    const passed = Boolean(reason && typeof reason === "string" && reason.trim().length >= 5);
    return {
      name: "Explainable Intent Verification",
      passed,
      message: passed
        ? `Valid actionable justification provided`
        : `Missing or insufficient intent rationale. Autonomous money actions must provide an explainable justification.`
    };
  }

  /**
   * Check 4: Transaction Amount Validity & Absolute Bounds
   */
  checkTransactionLimit(amount?: number): PolicyCheck {
    if (amount === undefined || amount === null || isNaN(amount) || amount <= 0) {
      return {
        name: "Amount Validity Check",
        passed: false,
        message: "Invalid transaction amount. Must be a positive numeric value."
      };
    }

    if (amount > this.config.maxTransactionAmount) {
      return {
        name: "Hard Transaction Ceiling Check",
        passed: false,
        message: `Amount ₹${amount.toLocaleString('en-IN')} exceeds maximum allowed policy limit of ₹${this.config.maxTransactionAmount.toLocaleString('en-IN')}.`
      };
    }

    return {
      name: "Hard Transaction Ceiling Check",
      passed: true,
      message: `Amount ₹${amount.toLocaleString('en-IN')} is within ₹${this.config.maxTransactionAmount.toLocaleString('en-IN')} maximum threshold.`
    };
  }

  /**
   * Check 5: Approval Threshold (Human-in-the-Loop Gating)
   */
  checkApprovalThreshold(amount: number): { requiresApproval: boolean; check: PolicyCheck } {
    const requiresApproval = amount > this.config.requireApprovalAbove && amount <= this.config.maxTransactionAmount;
    return {
      requiresApproval,
      check: {
        name: "Human Approval Gate Check",
        passed: !requiresApproval,
        requiredForApproval: requiresApproval,
        message: requiresApproval
          ? `Amount ₹${amount.toLocaleString('en-IN')} exceeds autonomous threshold of ₹${this.config.requireApprovalAbove.toLocaleString('en-IN')}. Mandatory human authorization required.`
          : `Amount ₹${amount.toLocaleString('en-IN')} is under autonomous threshold of ₹${this.config.requireApprovalAbove.toLocaleString('en-IN')}. Auto-approved.`
      }
    };
  }

  /**
   * Risk Level Calculator
   */
  calculateRiskLevel(amount: number, status: PolicyStatus): PolicyRiskLevel {
    if (status === "BLOCKED" || amount > this.config.maxTransactionAmount) {
      return "HIGH";
    }
    if (status === "APPROVAL_REQUIRED" || amount > this.config.requireApprovalAbove) {
      return "MEDIUM";
    }
    return "LOW";
  }

  /**
   * Deterministic Policy Evaluation Engine
   */
  evaluatePolicy(action: FinancialAction, sessionId: string = "default_session"): PolicyDecision {
    const checks: PolicyCheck[] = [];
    const reasons: string[] = [];

    // Check 1: Action Type
    const typeCheck = this.checkActionType(action);
    checks.push(typeCheck);
    if (!typeCheck.passed) reasons.push(typeCheck.message);

    // Check 2: Reason
    const reasonCheck = this.checkReason(action.reason);
    checks.push(reasonCheck);
    if (!reasonCheck.passed) reasons.push(reasonCheck.message);

    // Check 3: Currency
    const currencyCheck = this.checkCurrency(action.currency);
    checks.push(currencyCheck);
    if (!currencyCheck.passed) reasons.push(currencyCheck.message);

    // Check 4: Amount & Limit
    const limitCheck = this.checkTransactionLimit(action.amount);
    checks.push(limitCheck);
    if (!limitCheck.passed) reasons.push(limitCheck.message);

    // If any fundamental validity check failed -> BLOCKED
    if (!typeCheck.passed || !reasonCheck.passed || !currencyCheck.passed || !limitCheck.passed) {
      const decision: PolicyDecision = {
        id: "dec_" + Math.random().toString(36).substring(2, 10),
        status: "BLOCKED",
        reasons,
        policyChecks: checks,
        riskLevel: "HIGH",
        action,
        evaluatedAt: new Date().toISOString()
      };

      auditService.logEvent({
        sessionId,
        actor: "POLICY_ENGINE",
        action: "ACTION_BLOCKED",
        reason: reasons.join("; "),
        metadata: { decision },
        status: "BLOCKED",
        riskLevel: "HIGH"
      });

      return decision;
    }

    const amount = action.amount!;

    // Rule 1: <= 2000 -> ALLOWED
    // Rule 2: > 2000 and <= 5000 -> APPROVAL_REQUIRED
    // Rule 3: > 5000 -> BLOCKED (already handled above)
    const { requiresApproval, check: approvalCheck } = this.checkApprovalThreshold(amount);
    checks.push(approvalCheck);

    let status: PolicyStatus = "ALLOWED";
    if (requiresApproval) {
      status = "APPROVAL_REQUIRED";
      reasons.push(approvalCheck.message);
    } else {
      reasons.push(`Autonomous transaction authorized within policy limit (≤ ₹${this.config.requireApprovalAbove.toLocaleString('en-IN')}).`);
    }

    const riskLevel = this.calculateRiskLevel(amount, status);

    const decision: PolicyDecision = {
      id: "dec_" + Math.random().toString(36).substring(2, 10),
      status,
      reasons,
      policyChecks: checks,
      riskLevel,
      action,
      evaluatedAt: new Date().toISOString()
    };

    auditService.logEvent({
      sessionId,
      actor: "POLICY_ENGINE",
      action: "POLICY_DECISION",
      reason: `Policy decision: ${status} (Risk: ${riskLevel})`,
      metadata: { decision },
      status: status === "APPROVAL_REQUIRED" ? "PENDING" : "SUCCESS",
      riskLevel
    });

    return decision;
  }
}

export const policyEngine = new PolicyEngine();
