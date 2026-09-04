import { NextRequest, NextResponse } from "next/server";
import { razorpayService } from "@/services/razorpayService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      sessionId = "default_session" 
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id) {
      return NextResponse.json(
        { success: false, error: "Missing razorpay_payment_id or razorpay_order_id" },
        { status: 400 }
      );
    }

    const verified = razorpayService.verifyPaymentSignature({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature || "sim_sig_" + Date.now(),
      sessionId
    });

    if (!verified) {
      return NextResponse.json(
        { success: false, error: "Payment signature verification failed. Untrusted payment source." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: "captured",
        verifiedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Payment verification error", details: error.message },
      { status: 500 }
    );
  }
}
