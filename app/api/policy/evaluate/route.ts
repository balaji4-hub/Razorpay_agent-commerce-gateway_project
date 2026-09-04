import { NextRequest, NextResponse } from "next/server";
import { policyEngine, FinancialAction } from "@/services/policyEngine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId = "default_session" } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Financial action payload is required" },
        { status: 400 }
      );
    }

    const decision = policyEngine.evaluatePolicy(action as FinancialAction, sessionId);

    return NextResponse.json({
      success: true,
      data: decision
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Policy evaluation failed", details: error.message },
      { status: 500 }
    );
  }
}
