export type AuditActor = 
  | "USER" 
  | "AI_AGENT" 
  | "POLICY_ENGINE" 
  | "HUMAN_APPROVER" 
  | "PAYMENT_SYSTEM";

export type AuditAction = 
  | "USER_REQUEST"
  | "AI_INTENT_PARSED"
  | "CATALOG_SEARCH"
  | "PRODUCT_RECOMMENDED"
  | "PRODUCT_SELECTED"
  | "STOCK_CHECKED"
  | "POLICY_CHECK_STARTED"
  | "POLICY_DECISION"
  | "APPROVAL_REQUESTED"
  | "APPROVAL_GRANTED"
  | "APPROVAL_REJECTED"
  | "PAYMENT_ORDER_CREATED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "ACTION_BLOCKED";

export type AuditStatus = "SUCCESS" | "PENDING" | "FAILED" | "BLOCKED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface AuditEvent {
  id: string;
  timestamp: string;
  sessionId: string;
  actor: AuditActor;
  action: AuditAction | string;
  reason: string;
  metadata: Record<string, any>;
  status: AuditStatus;
  riskLevel?: RiskLevel;
}

export interface AuditSummary {
  totalActions: number;
  aiDecisions: number;
  financialActions: number;
  approvalRequired: boolean;
  finalStatus: string;
  latestEventTimestamp?: string;
}

class AuditService {
  private events: AuditEvent[] = [];

  constructor() {
    // Seed initial event for session tracking
    this.logEvent({
      sessionId: "sess_init_001",
      actor: "PAYMENT_SYSTEM",
      action: "USER_REQUEST",
      reason: "Agent Commerce Gateway session initialized",
      metadata: { environment: "test-mode", currency: "INR", version: "2.0" },
      status: "SUCCESS",
      riskLevel: "LOW"
    });
  }

  logEvent(params: {
    sessionId?: string;
    actor: AuditActor;
    action: AuditAction | string;
    reason: string;
    metadata?: Record<string, any>;
    status: AuditStatus;
    riskLevel?: RiskLevel;
  }): AuditEvent {
    const event: AuditEvent = {
      id: "evt_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      sessionId: params.sessionId || "default_session",
      actor: params.actor,
      action: params.action,
      reason: params.reason,
      metadata: params.metadata || {},
      status: params.status,
      riskLevel: params.riskLevel
    };

    // Prepend so latest events appear at top
    this.events.unshift(event);

    // Keep max 500 records
    if (this.events.length > 500) {
      this.events.pop();
    }

    return event;
  }

  getAllEvents(): AuditEvent[] {
    return this.events;
  }

  getSessionEvents(sessionId: string): AuditEvent[] {
    if (!sessionId) return this.events;
    return this.events.filter(e => e.sessionId === sessionId);
  }

  getTransactionEvents(transactionId: string): AuditEvent[] {
    return this.events.filter(e => 
      e.metadata?.transactionId === transactionId || 
      e.metadata?.orderId === transactionId ||
      e.metadata?.approvalId === transactionId
    );
  }

  getAuditSummary(sessionId?: string): AuditSummary {
    const list = sessionId ? this.getSessionEvents(sessionId) : this.events;
    const aiDecisions = list.filter(e => e.actor === "AI_AGENT" && (e.action === "AI_INTENT_PARSED" || e.action === "PRODUCT_RECOMMENDED")).length;
    const financialActions = list.filter(e => 
      e.action === "POLICY_DECISION" || 
      e.action === "PAYMENT_ORDER_CREATED" || 
      e.action === "PAYMENT_SUCCESS" || 
      e.action === "ACTION_BLOCKED"
    ).length;

    const approvalRequired = list.some(e => e.action === "APPROVAL_REQUESTED" || (e.action === "POLICY_DECISION" && e.metadata?.status === "APPROVAL_REQUIRED"));

    const hasPaymentSuccess = list.some(e => e.action === "PAYMENT_SUCCESS");
    const hasBlocked = list.some(e => e.action === "ACTION_BLOCKED" || e.status === "BLOCKED");

    let finalStatus = "Active Session";
    if (hasPaymentSuccess) finalStatus = "Payment Successful";
    else if (hasBlocked) finalStatus = "Action Blocked (Policy Enforced)";
    else if (approvalRequired) finalStatus = "Approval In Progress";

    return {
      totalActions: list.length,
      aiDecisions,
      financialActions,
      approvalRequired,
      finalStatus,
      latestEventTimestamp: list[0]?.timestamp
    };
  }

  clear() {
    this.events = [];
  }
}

export const auditService = new AuditService();
