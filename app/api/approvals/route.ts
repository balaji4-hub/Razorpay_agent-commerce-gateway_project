import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/services/approvalService";

export async function GET() {
  try {
    const requests = approvalService.getAllRequests();
    return NextResponse.json({
      success: true,
      total: requests.length,
      data: requests
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch approvals", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actionType, productId, productName, amount, currency, reason, riskLevel, sessionId } = body;

    if (!actionType || !amount || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: actionType, amount, reason" },
        { status: 400 }
      );
    }

    const created = approvalService.createApprovalRequest({
      actionType,
      productId,
      productName,
      amount: Number(amount),
      currency,
      reason,
      riskLevel,
      sessionId
    });

    return NextResponse.json({
      success: true,
      data: created
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to create approval request", details: error.message },
      { status: 500 }
    );
  }
}
