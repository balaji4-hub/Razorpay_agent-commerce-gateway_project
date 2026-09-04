import { NextRequest, NextResponse } from "next/server";
import { auditService } from "@/services/auditService";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const events = auditService.getSessionEvents(sessionId);
    const summary = auditService.getAuditSummary(sessionId);

    return NextResponse.json({
      success: true,
      sessionId,
      summary,
      total: events.length,
      data: events
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch session audit events", details: error.message },
      { status: 500 }
    );
  }
}
