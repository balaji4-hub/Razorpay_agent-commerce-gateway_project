import { NextRequest, NextResponse } from "next/server";
import { approvalService } from "@/services/approvalService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { resolvedBy = "HUMAN_OPERATOR", sessionId } = body;

    const result = approvalService.approveRequest(id, resolvedBy, sessionId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.request
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Approval failed", details: error.message },
      { status: 500 }
    );
  }
}
