import { NextRequest, NextResponse } from "next/server";
import { auditService } from "@/services/auditService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    const events = sessionId 
      ? auditService.getSessionEvents(sessionId) 
      : auditService.getAllEvents();

    const summary = auditService.getAuditSummary(sessionId || undefined);

    return NextResponse.json({
      success: true,
      summary,
      total: events.length,
      data: events
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit events", details: error.message },
      { status: 500 }
    );
  }
}
