import crypto from "crypto";
import { auditService } from "./auditService";

export interface CreateOrderParams {
  productId: string;
  productName: string;
  amount: number; // in Rupees
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
  sessionId?: string;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number; // in paise
  currency: string;
  receipt: string;
  status: string;
  keyId: string;
  isSimulator: boolean;
  notes?: Record<string, any>;
}

export class RazorpayService {
  private keyId: string;
  private keySecret: string;
  private isSimulator: boolean;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_agent_gateway_001";
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || "mock_secret_key_testing";
    // If user provided a real Razorpay test key that doesn't contain "mock" or "agent_gateway"
    this.isSimulator = !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.includes("mock");
  }

  /**
   * 1. createRazorpayOrder
   */
  async createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
    const amountInPaise = Math.round(params.amount * 100);
    const currency = params.currency || "INR";
    const receipt = params.receipt || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Real API call if authentic test keys provided
    if (!this.isSimulator) {
      try {
        const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency,
            receipt,
            notes: {
              ...params.notes,
              gateway: "AgentCommerceGateway",
              productId: params.productId
            }
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.description || "Razorpay order creation failed");
        }

        auditService.logEvent({
          sessionId: params.sessionId,
          actor: "PAYMENT_SYSTEM",
          action: "PAYMENT_ORDER_CREATED",
          reason: `Official Razorpay test order created: ${data.id}`,
          metadata: { orderId: data.id, amount: params.amount, paise: amountInPaise },
          status: "SUCCESS"
        });

        return {
          id: data.id,
          amount: data.amount,
          currency: data.currency,
          receipt: data.receipt,
          status: data.status,
          keyId: this.keyId,
          isSimulator: false,
          notes: data.notes
        };
      } catch (err: any) {
        auditService.logEvent({
          sessionId: params.sessionId,
          actor: "PAYMENT_SYSTEM",
          action: "PAYMENT_FAILED",
          reason: `Razorpay API error: ${err.message}`,
          metadata: { error: err.message },
          status: "FAILED"
        });
        throw err;
      }
    }

    // High-Fidelity Test-Mode Simulator (Zero Friction / Immediate Execution)
    const simulatedOrderId = "order_" + Math.random().toString(36).substring(2, 14);
    const simulatedOrder: RazorpayOrderResult = {
      id: simulatedOrderId,
      amount: amountInPaise,
      currency,
      receipt,
      status: "created",
      keyId: this.keyId,
      isSimulator: true,
      notes: {
        ...params.notes,
        productName: params.productName,
        productId: params.productId,
        protocol: "NPCI-UAP-ACP",
        test_mode: "true"
      }
    };

    auditService.logEvent({
      sessionId: params.sessionId,
      actor: "PAYMENT_SYSTEM",
      action: "PAYMENT_ORDER_CREATED",
      reason: `Sandbox Razorpay test order initialized: ${simulatedOrderId}`,
      metadata: { orderId: simulatedOrderId, amount: params.amount, paise: amountInPaise },
      status: "SUCCESS"
    });

    return simulatedOrder;
  }

  /**
   * 2. verifyPaymentSignature
   */
  verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
    sessionId?: string;
  }): boolean {
    const { orderId, paymentId, signature } = params;

    // If sandbox simulator:
    if (this.isSimulator) {
      const isValid = Boolean(paymentId && orderId);
      auditService.logEvent({
        sessionId: params.sessionId,
        actor: "PAYMENT_SYSTEM",
        action: isValid ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED",
        reason: isValid 
          ? `Sandbox payment signature verified for payment ${paymentId}` 
          : `Invalid payment verification data`,
        metadata: { orderId, paymentId, verified: isValid },
        status: isValid ? "SUCCESS" : "FAILED"
      });
      return isValid;
    }

    // Official HMAC-SHA256 verification
    try {
      const hmac = crypto.createHmac("sha256", this.keySecret);
      hmac.update(`${orderId}|${paymentId}`);
      const generatedSignature = hmac.digest("hex");
      const isMatch = generatedSignature === signature;

      auditService.logEvent({
        sessionId: params.sessionId,
        actor: "PAYMENT_SYSTEM",
        action: isMatch ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED",
        reason: isMatch ? "Razorpay HMAC-SHA256 signature verified" : "Signature mismatch detected",
        metadata: { orderId, paymentId, verified: isMatch },
        status: isMatch ? "SUCCESS" : "FAILED"
      });

      return isMatch;
    } catch (err: any) {
      console.error("Signature verification error", err);
      return false;
    }
  }

  /**
   * 3. getPaymentStatus
   */
  getPaymentStatus(orderId: string): string {
    return "captured";
  }
}

export const razorpayService = new RazorpayService();
