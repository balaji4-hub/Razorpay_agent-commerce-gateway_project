import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/services/catalogService";
import { policyEngine } from "@/services/policyEngine";
import { approvalService } from "@/services/approvalService";
import { razorpayService } from "@/services/razorpayService";
import { auditService } from "@/services/auditService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      productId, 
      amount, 
      currency = "INR", 
      policyDecisionId, 
      approvalId,
      sessionId = "default_session" 
    } = body;

    // 1. Verify Product Exists
    const product = getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: `Product ID '${productId}' was not found in catalog.` },
        { status: 400 }
      );
    }

    // 2. Verify Stock Availability
    if (product.stock <= 0) {
      auditService.logEvent({
        sessionId,
        actor: "PAYMENT_SYSTEM",
        action: "PAYMENT_FAILED",
        reason: `Checkout aborted: Product '${product.name}' is out of stock.`,
        metadata: { productId, stock: product.stock },
        status: "FAILED"
      });
      return NextResponse.json(
        { success: false, error: `Product '${product.name}' is out of stock.` },
        { status: 400 }
      );
    }

    // 3. Verify Price Integrity
    const expectedAmount = product.price;
    if (amount !== undefined && Math.abs(amount - expectedAmount) > 1) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Price mismatch detected: submitted ₹${amount}, catalog price is ₹${expectedAmount}.` 
        },
        { status: 400 }
      );
    }

    // 4. Policy Check
    const policyDecision = policyEngine.evaluatePolicy({
      actionType: "CREATE_PAYMENT",
      amount: expectedAmount,
      currency,
      productId: product.id,
      reason: `Direct checkout order for ${product.name}`,
      requestedBy: "AI_AGENT"
    }, sessionId);

    if (policyDecision.status === "BLOCKED") {
      return NextResponse.json(
        {
          success: false,
          error: "Transaction blocked by financial policy engine.",
          reasons: policyDecision.reasons
        },
        { status: 403 }
      );
    }

    // 5. Verify Approval if Required (Feature 6 Security Requirement)
    if (policyDecision.status === "APPROVAL_REQUIRED") {
      if (!approvalId) {
        auditService.logEvent({
          sessionId,
          actor: "PAYMENT_SYSTEM",
          action: "ACTION_BLOCKED",
          reason: `Unauthorized payment attempt: Transaction of ₹${expectedAmount} requires human approval, but no approvalId was presented.`,
          metadata: { amount: expectedAmount, productId },
          status: "BLOCKED",
          riskLevel: "HIGH"
        });

        return NextResponse.json(
          {
            success: false,
            error: "HTTP 403 Forbidden: This transaction exceeds autonomous limits and requires human approval before payment can be created.",
            requiresApproval: true
          },
          { status: 403 }
        );
      }

      const approval = approvalService.getRequestById(approvalId);
      if (!approval || approval.status !== "APPROVED") {
        return NextResponse.json(
          {
            success: false,
            error: `HTTP 403 Forbidden: Approval ticket '${approvalId}' is not approved (Current status: ${approval?.status || 'NOT_FOUND'}).`
          },
          { status: 403 }
        );
      }

      if (approval.usedForPayment) {
        return NextResponse.json(
          {
            success: false,
            error: `HTTP 403 Forbidden: Approval ticket '${approvalId}' has already been consumed for another order.`
          },
          { status: 403 }
        );
      }

      // Mark approval as used
      approvalService.markConsumed(approvalId);
    }

    // 6. Create Razorpay Test Order
    const razorpayOrder = await razorpayService.createRazorpayOrder({
      productId: product.id,
      productName: product.name,
      amount: expectedAmount,
      currency,
      notes: {
        approvalId: approvalId || "AUTO_ALLOWED",
        policyDecisionId: policyDecision.id
      },
      sessionId
    });

    // Return only safe fields to frontend
    return NextResponse.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: razorpayOrder.keyId,
        isSimulator: razorpayOrder.isSimulator,
        product: {
          id: product.id,
          name: product.name,
          price: product.price
        }
      }
    });

  } catch (error: any) {
    console.error("Create payment order error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Payment could not be initialized. No money has been charged. Please try again.",
        details: error.message
      },
      { status: 500 }
    );
  }
}
