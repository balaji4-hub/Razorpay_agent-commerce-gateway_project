import { randomUUID } from "crypto";

// In-memory persistent audit log conforming to Codata AgentToolCall asset
class AuditLogger {
  constructor() {
    this.logs = [];
  }

  logToolCall({ sessionId, toolName, inputPayload, outputPayload, success, errorMessage = null, durationMs = 0 }) {
    const entry = {
      id: randomUUID(),
      sessionId: sessionId || "00000000-0000-0000-0000-000000000001",
      toolName,
      inputPayload,
      outputPayload: outputPayload || null,
      success: Boolean(success),
      errorMessage: errorMessage || null,
      durationMs: Math.round(durationMs),
      calledAt: new Date().toISOString()
    };

    // Prepend so latest appears first
    this.logs.unshift(entry);

    // Keep max 200 items in memory
    if (this.logs.length > 200) {
      this.logs.pop();
    }

    return entry;
  }

  getLogs({ sessionId, limit = 50 } = {}) {
    let result = this.logs;
    if (sessionId) {
      result = result.filter(log => log.sessionId === sessionId);
    }
    return result.slice(0, limit);
  }

  clear() {
    this.logs = [];
  }
}

export const auditLogger = new AuditLogger();
