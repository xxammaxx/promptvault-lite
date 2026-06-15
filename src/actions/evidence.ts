// =============================================================================
// Evidence Log — Immutable audit trail for every action call
// =============================================================================

import type { ActionName, EvidenceLogEntry } from "@/types";

/** Action type for evidence log entries */
export type EvidenceAction = ActionName | "(unknown)";

// In-memory evidence log (for the session)
const evidenceLog: EvidenceLogEntry[] = [];

/** Max entries in memory (ring buffer behavior) */
const MAX_EVIDENCE_ENTRIES = 1000;

/**
 * Simple string hasher for input fingerprinting.
 * NOT a cryptographic hash — used only for evidence dedup/comparison.
 */
function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0; // Convert to 32bit integer
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Create a hash of any input value for evidence tracking */
export function hashInput(input: unknown): string {
  try {
    return hashString(JSON.stringify(input));
  } catch {
    return hashString(String(input));
  }
}

/** Record an evidence log entry */
export function logEvidence(
  action: EvidenceAction,
  input: unknown,
  result: EvidenceLogEntry["result"],
  durationMs: number,
  error?: string,
): EvidenceLogEntry {
  const entry: EvidenceLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    input_hash: hashInput(input),
    result,
    duration_ms: durationMs,
  };

  if (error) {
    entry.error = error;
  }

  evidenceLog.push(entry);

  // Ring buffer: remove oldest entries if exceeding max
  while (evidenceLog.length > MAX_EVIDENCE_ENTRIES) {
    evidenceLog.shift();
  }

  return entry;
}

/** Get all evidence log entries */
export function getEvidenceLog(): ReadonlyArray<EvidenceLogEntry> {
  return evidenceLog;
}

/** Get evidence log entries for a specific action */
export function getEvidenceByAction(
  action: EvidenceAction,
): EvidenceLogEntry[] {
  return evidenceLog.filter((e) => e.action === action);
}

/** Clear the evidence log (for testing) */
export function clearEvidenceLog(): void {
  evidenceLog.length = 0;
}

/** Count results by type */
export function getEvidenceSummary(): {
  total: number;
  success: number;
  error: number;
  blocked: number;
} {
  const summary = {
    total: evidenceLog.length,
    success: 0,
    error: 0,
    blocked: 0,
  };
  for (const entry of evidenceLog) {
    switch (entry.result) {
      case "success":
        summary.success++;
        break;
      case "error":
        summary.error++;
        break;
      case "blocked":
        summary.blocked++;
        break;
    }
  }
  return summary;
}
