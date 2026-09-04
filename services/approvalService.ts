import { auditService } from "./auditService";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface ApprovalRequest {
  id: string;
  actionType: string;
  productId?: string;
  productName?: string;
  amount: number;
  currency: string;
  reason: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  status: ApprovalStatus;
  requestedAt: string;
  expiresAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  usedForPayment?: boolean;
}

const APPROVAL_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL as required

class ApprovalService {
  private requests: Map<string, ApprovalRequest> = new Map();

  constructor() {
    // Seed an initial demo request for immediate testing
    this.createApprovalRequest({
      actionType: "CREATE_PAYMENT",
      productId: "prod_001",
      productName: "JBL Tune 760NC",
      amount: 4499,
      currency: "INR",
      reason: "User explicitly selected JBL Tune 760NC. Exceeds ₹2,000 autonomous threshold.",
      riskLevel: "MEDIUM"
    });
  }

  /**
   * Create new Approval Request
   */
  createApprovalRequest(params: {
    actionType: string;
    productId?: string;
    productName?: string;
    amount: number;
    currency?: string;
    reason: string;
    riskLevel?: "LOW" | "MEDIUM" | "HIGH";
    sessionId?: string;
  }): ApprovalRequest {
    const now = Date.now();
    const id = "appr_" + Math.random().toString(36).substring(2, 9) + "_" + now.toString(36);
    
    const request: ApprovalRequest = {
      id,
      actionType: params.actionType,
      productId: params.productId,
      productName: params.productName || "Merchant Item",
      amount: params.amount,
      currency: params.currency || "INR",
      reason: params.reason,
      riskLevel: params.riskLevel || "MEDIUM",
      status: "PENDING",
      requestedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + APPROVAL_TTL_MS).toISOString(),
      usedForPayment: false
    };

    this.requests.set(id, request);

    auditService.logEvent({
      sessionId: params.sessionId,
      actor: "POLICY_ENGINE",
      action: "APPROVAL_REQUESTED",
      reason: `Mandatory approval ticket created for ${request.productName} (₹${request.amount})`,
      metadata: { approvalId: id, amount: request.amount, riskLevel: request.riskLevel },
      status: "PENDING",
      riskLevel: request.riskLevel
    });

    return request;
  }

  /**
   * Get all approval requests (with automatic expiration check)
   */
  getAllRequests(): ApprovalRequest[] {
    const now = new Date();
    const list: ApprovalRequest[] = [];

    this.requests.forEach((req) => {
      if (req.status === "PENDING" && new Date(req.expiresAt) < now) {
        req.status = "EXPIRED";
      }
      list.unshift(req);
    });

    return list;
  }

  /**
   * Get single approval request by ID
   */
  getRequestById(id: string): ApprovalRequest | undefined {
    const req = this.requests.get(id);
    if (!req) return undefined;

    if (req.status === "PENDING" && new Date(req.expiresAt) < new Date()) {
      req.status = "EXPIRED";
    }

    return req;
  }

  /**
   * Approve Request
   */
  approveRequest(id: string, resolvedBy: string = "HUMAN_OPERATOR", sessionId?: string): { success: boolean; request?: ApprovalRequest; error?: string } {
    const req = this.getRequestById(id);
    if (!req) {
      return { success: false, error: "Approval request not found" };
    }

    if (req.status === "EXPIRED") {
      return { success: false, error: "Approval request has expired (10-minute limit reached)" };
    }

    if (req.status !== "PENDING") {
      return { success: false, error: `Request cannot be approved; current status is ${req.status}` };
    }

    req.status = "APPROVED";
    req.resolvedAt = new Date().toISOString();
    req.resolvedBy = resolvedBy;

    auditService.logEvent({
      sessionId,
      actor: "HUMAN_APPROVER",
      action: "APPROVAL_GRANTED",
      reason: `Human approver explicitly authorized transaction #${id}`,
      metadata: { approvalId: id, resolvedBy, amount: req.amount },
      status: "SUCCESS"
    });

    return { success: true, request: req };
  }

  /**
   * Reject Request
   */
  rejectRequest(id: string, resolvedBy: string = "HUMAN_OPERATOR", sessionId?: string): { success: boolean; request?: ApprovalRequest; error?: string } {
    const req = this.getRequestById(id);
    if (!req) {
      return { success: false, error: "Approval request not found" };
    }

    if (req.status !== "PENDING") {
      return { success: false, error: `Request cannot be rejected; current status is ${req.status}` };
    }

    req.status = "REJECTED";
    req.resolvedAt = new Date().toISOString();
    req.resolvedBy = resolvedBy;

    auditService.logEvent({
      sessionId,
      actor: "HUMAN_APPROVER",
      action: "APPROVAL_REJECTED",
      reason: `Human approver rejected transaction #${id}`,
      metadata: { approvalId: id, resolvedBy, amount: req.amount },
      status: "BLOCKED"
    });

    return { success: true, request: req };
  }

  /**
   * Mark Approval as consumed by Payment System (prevents reuse)
   */
  markConsumed(id: string): boolean {
    const req = this.requests.get(id);
    if (!req || req.status !== "APPROVED" || req.usedForPayment) {
      return false;
    }
    req.usedForPayment = true;
    return true;
  }
}

export const approvalService = new ApprovalService();
