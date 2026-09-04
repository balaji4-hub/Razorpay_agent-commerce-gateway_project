import { NextRequest, NextResponse } from "next/server";
import { auditService } from "@/services/auditService";

export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const { transactionId } = params;
    const events = auditService.getTransactionEvents(transactionId);

    return NextResponse.json({
      success: true,
      transactionId,
      total: events.length,
      data: events
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch transaction audit trail", details: error.message },
      { status: 500 }
    );
  }
}
