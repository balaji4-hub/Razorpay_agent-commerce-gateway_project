import { randomUUID } from "crypto";
import { auditLogger } from "./auditLogger.js";

// Razorpay Test Mode Configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_autonomous_agent_001";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "mock_secret_key_demo";

class RazorpayService {
  constructor() {
    this.keyId = RAZORPAY_KEY_ID;
    this.isLiveTestKey = process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes("autonomous_agent");
  }

  /**
   * Create an official Razorpay Test Order
   * Amount must be in paise (e.g., ₹100.00 = 10000 paise)
   */
  async createOrder({ sessionId, amountInRupees, currency = "INR", receipt, notes = {} }) {
    const startTime = performance.now();
    const amountInPaise = Math.round(amountInRupees * 100);

    try {
      // If user has supplied authentic Razorpay Test API credentials:
      if (this.isLiveTestKey) {
        const auth = Buffer.from(`${this.keyId}:${RAZORPAY_KEY_SECRET}`).toString("base64");
        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency,
            receipt: receipt || `rcpt_${Date.now()}`,
            notes: {
              ...notes,
              agentic_gateway: "true",
              protocol: "NPCI-UAP-ACP"
            }
          })
        });

        const data = await response.json();
        const durationMs = performance.now() - startTime;

        if (!response.ok) {
          throw new Error(data.error?.description || "Razorpay API error");
        }

        auditLogger.logToolCall({
          sessionId,
          toolName: "createRazorpayOrder",
          inputPayload: { amountInRupees, amountInPaise, currency, receipt },
          outputPayload: data,
          success: true,
          durationMs
        });

        return {
          orderId: data.id,
          amount: data.amount,
          currency: data.currency,
          keyId: this.keyId,
          status: data.status,
          receipt: data.receipt,
          isSimulator: false
        };
      }

      // Built-in High-Fidelity Razorpay Test Mode Sandbox Simulator
      const simulatedOrderId = "order_" + randomUUID().substring(0, 14).replace(/-/g, "");
      const simulatedOrder = {
        orderId: simulatedOrderId,
        amount: amountInPaise,
        currency,
        keyId: this.keyId,
        status: "created",
        receipt: receipt || `rcpt_agent_${Date.now()}`,
        createdAt: Math.floor(Date.now() / 1000),
        notes: {
          ...notes,
          protocol: "NPCI-UAP-ACP",
          agentName: "AgentCommerceGateway",
          gatedApproval: "passed"
        },
        isSimulator: true
      };

      const durationMs = performance.now() - startTime;

      auditLogger.logToolCall({
        sessionId,
        toolName: "createRazorpayOrder",
        inputPayload: { amountInRupees, amountInPaise, currency, receipt },
        outputPayload: simulatedOrder,
        success: true,
        durationMs
      });

      return simulatedOrder;
    } catch (err) {
      const durationMs = performance.now() - startTime;
      auditLogger.logToolCall({
        sessionId,
        toolName: "createRazorpayOrder",
        inputPayload: { amountInRupees, currency },
        outputPayload: null,
        success: false,
        errorMessage: err.message,
        durationMs
      });
      throw err;
    }
  }

  /**
   * Mock / Verify payment confirmation
   */
  verifyPayment({ sessionId, paymentId, orderId, signature = "sig_valid_test_token" }) {
    const verified = Boolean(paymentId && orderId);
    auditLogger.logToolCall({
      sessionId,
      toolName: "verifyRazorpayPayment",
      inputPayload: { paymentId, orderId },
      outputPayload: { verified, settledAt: new Date().toISOString() },
      success: verified,
      durationMs: 12
    });

    return {
      verified,
      paymentId,
      orderId,
      status: "captured",
      timestamp: new Date().toISOString()
    };
  }
}

export const razorpayService = new RazorpayService();
