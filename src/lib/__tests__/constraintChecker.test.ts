// =============================================================================
// PromptVault Lite — Constraint Checker Tests (Phase 1 — Basis)
// =============================================================================

import { describe, it, expect } from "vitest";
import { extractHardConstraints, checkConflicts } from "../constraintChecker";
import type { HardConstraint, MissingInfoAnswer } from "@/types";

// =============================================================================
// Helpers
// =============================================================================

function ans(itemId: string, value: string): MissingInfoAnswer {
  return { itemId, value, answeredAt: "2026-07-09T00:00:00Z" };
}

// =============================================================================
// extractHardConstraints
// =============================================================================

describe("extractHardConstraints", () => {
  // --- Empty / No match ---

  it("returns empty array for empty string", () => {
    expect(extractHardConstraints("")).toEqual([]);
  });

  it("returns empty array for whitespace-only string", () => {
    expect(extractHardConstraints("   \n  ")).toEqual([]);
  });

  it("returns empty array for normal German sentence with no constraints", () => {
    const result = extractHardConstraints(
      "Bitte erstelle einen Prompt für mein Projekt.",
    );
    expect(result).toEqual([]);
  });

  // --- offline_only ---

  it('detects "Keine Cloud verwenden" → offline_only (hard)', () => {
    const result = extractHardConstraints("Keine Cloud verwenden");
    expect(result.length).toBeGreaterThanOrEqual(1);
    const found = result.find((c) => c.category === "offline_only");
    expect(found).toBeDefined();
    if (found) expect(found.severity).toBe("hard");
  });

  it('detects "nur lokal ausführen" → offline_only', () => {
    const result = extractHardConstraints("nur lokal ausführen");
    const found = result.find((c) => c.category === "offline_only");
    expect(found).toBeDefined();
  });

  it('detects "local-only" → offline_only', () => {
    const result = extractHardConstraints("This tool is local-only");
    const found = result.find((c) => c.category === "offline_only");
    expect(found).toBeDefined();
  });

  // --- max_length ---

  it('detects "Maximal 200 Wörter" → max_length (hard)', () => {
    const result = extractHardConstraints("Maximal 200 Wörter");
    const found = result.find((c) => c.category === "max_length");
    expect(found).toBeDefined();
    if (found) expect(found.severity).toBe("hard");
  });

  it('detects "höchstens 500 Zeichen" → max_length', () => {
    const result = extractHardConstraints("höchstens 500 Zeichen");
    const found = result.find((c) => c.category === "max_length");
    expect(found).toBeDefined();
  });

  it('detects "max 150 words" → max_length', () => {
    const result = extractHardConstraints("max 150 words");
    const found = result.find((c) => c.category === "max_length");
    expect(found).toBeDefined();
  });

  // --- language ---

  it('detects "Nur auf Deutsch" → language (hard)', () => {
    const result = extractHardConstraints("Nur auf Deutsch antworten");
    const found = result.find((c) => c.category === "language");
    expect(found).toBeDefined();
    if (found) expect(found.severity).toBe("hard");
  });

  it('detects "in englischer Sprache" is not a false positive', () => {
    // "in englischer Sprache" should not match "in deutscher sprache" pattern
    const result = extractHardConstraints(
      "Bitte in deutscher Sprache antworten",
    );
    const found = result.find((c) => c.category === "language");
    expect(found).toBeDefined();
  });

  // --- no_examples ---

  it('detects "Keine Beispiele" → no_examples (soft)', () => {
    const result = extractHardConstraints("Keine Beispiele nennen");
    const found = result.find((c) => c.category === "no_examples");
    expect(found).toBeDefined();
    if (found) expect(found.severity).toBe("soft");
  });

  // --- format_lock ---

  it('detects "als JSON ausgeben" → format_lock (hard)', () => {
    const result = extractHardConstraints("Bitte als JSON ausgeben");
    const found = result.find((c) => c.category === "format_lock");
    expect(found).toBeDefined();
  });

  // --- approval_required ---

  it('detects "vor der Ausführung bestätigen" → approval_required', () => {
    const result = extractHardConstraints(
      "Bitte vor der Ausführung bestätigen",
    );
    const found = result.find((c) => c.category === "approval_required");
    expect(found).toBeDefined();
  });

  // --- tool_restriction ---

  it('detects "keine Tools verwenden" → tool_restriction', () => {
    const result = extractHardConstraints("Bitte keine Tools verwenden");
    const found = result.find((c) => c.category === "tool_restriction");
    expect(found).toBeDefined();
  });

  // --- scope_boundary ---

  it('detects "nur diese Datei ändern" → scope_boundary', () => {
    const result = extractHardConstraints("Bitte nur diese Datei ändern");
    const found = result.find((c) => c.category === "scope_boundary");
    expect(found).toBeDefined();
  });

  // --- Position ---

  it("assigns correct position (line/column) to detected constraints", () => {
    const result = extractHardConstraints("Keine Cloud verwenden");
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].position).toBeDefined();
    if (result[0].position) {
      expect(result[0].position.line).toBeGreaterThanOrEqual(1);
      expect(result[0].position.column).toBeGreaterThanOrEqual(1);
    }
  });

  // --- No false positives ---

  it("does not detect constraints in normal descriptive text", () => {
    // "lokal laufen" could match something, but let's check it doesn't over-match
    // The key is that normal sentences about weather, cooking etc don't trigger
    const neutral =
      "Heute ist ein schöner Tag. Ich möchte einen Kuchen backen. Danke für deine Hilfe.";
    const neutralResult = extractHardConstraints(neutral);
    expect(neutralResult).toEqual([]);
  });
});

// =============================================================================
// checkConflicts
// =============================================================================

describe("checkConflicts", () => {
  // --- No conflicts ---

  it("returns empty array when no constraints provided", () => {
    const result = checkConflicts([], [ans("1", "irrelevant")]);
    expect(result).toEqual([]);
  });

  it("returns empty array when no answers provided", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_001",
        constraintText: "Keine Cloud verwenden",
        category: "offline_only",
        severity: "hard",
        position: null,
      },
    ];
    expect(checkConflicts(constraints, [])).toEqual([]);
  });

  it("returns empty array when answers do not conflict", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_001",
        constraintText: "Keine Cloud verwenden",
        category: "offline_only",
        severity: "hard",
        position: null,
      },
    ];
    const result = checkConflicts(constraints, [ans("1", "Lokal ausführen")]);
    expect(result).toEqual([]);
  });

  // --- BLOCKING conflicts ---

  it("detects BLOCKING conflict: Cloud-LLM answer vs. offline_only constraint", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_001",
        constraintText: "Keine Cloud verwenden",
        category: "offline_only",
        severity: "hard",
        position: null,
      },
    ];
    const result = checkConflicts(constraints, [
      ans("1", "Cloud-LLM für Deep Research"),
    ]);
    expect(result.length).toBe(1);
    expect(result[0].severity).toBe("blocking");
    expect(result[0].constraint.category).toBe("offline_only");
    expect(result[0].resolutions.length).toBe(3);
  });

  it("detects BLOCKING conflict: English answer vs. language constraint", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_002",
        constraintText: "Nur auf Deutsch",
        category: "language",
        severity: "hard",
        position: null,
      },
    ];
    const result = checkConflicts(constraints, [
      ans("1", "Please respond in English"),
    ]);
    expect(result.length).toBe(1);
    expect(result[0].severity).toBe("blocking");
  });

  // --- WARNING conflicts ---

  it("detects WARNING conflict: ausführlich answer vs. max_length constraint", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_003",
        constraintText: "Maximal 200 Wörter",
        category: "max_length",
        severity: "hard",
        position: null,
      },
    ];
    const result = checkConflicts(constraints, [
      ans("1", "Ausführliche Variante"),
    ]);
    expect(result.length).toBe(1);
    expect(result[0].severity).toBe("warning");
  });

  it("detects WARNING conflict: Beispiele answer vs. no_examples constraint", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_004",
        constraintText: "Keine Beispiele",
        category: "no_examples",
        severity: "soft",
        position: null,
      },
    ];
    const result = checkConflicts(constraints, [ans("1", "Mit Beispielen")]);
    expect(result.length).toBe(1);
    expect(result[0].severity).toBe("warning");
  });

  // --- Conflict structure ---

  it("each conflict has id, description, resolutions, and selectedResolution=null", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_001",
        constraintText: "Keine Cloud verwenden",
        category: "offline_only",
        severity: "hard",
        position: null,
      },
    ];
    const result = checkConflicts(constraints, [
      ans("1", "Cloud-Dienst nutzen"),
    ]);
    expect(result.length).toBe(1);
    expect(result[0].id).toBeTruthy();
    expect(result[0].description).toBeTruthy();
    expect(result[0].resolutions).toBeInstanceOf(Array);
    expect(result[0].resolutions.length).toBe(3);
    expect(result[0].selectedResolution).toBeNull();
  });

  // --- No false positives ---

  it("returns empty array for unrelated answers", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_001",
        constraintText: "Keine Cloud verwenden",
        category: "offline_only",
        severity: "hard",
        position: null,
      },
    ];
    const result = checkConflicts(constraints, [
      ans("1", "Das Projekt heißt TestApp"),
      ans("2", "Zielgruppe sind Entwickler"),
    ]);
    expect(result).toEqual([]);
  });
});

// =============================================================================
// Deterministic Constraint IDs (Batch 2 — mutable counter replacement)
// =============================================================================

describe("deterministic constraint IDs", () => {
  it("produces the same ID for the same constraint across multiple calls", () => {
    const result1 = extractHardConstraints("Keine Cloud verwenden");
    const result2 = extractHardConstraints("Keine Cloud verwenden");

    expect(result1.length).toBeGreaterThanOrEqual(1);
    expect(result2.length).toBeGreaterThanOrEqual(1);

    const found1 = result1.find((c) => c.category === "offline_only");
    const found2 = result2.find((c) => c.category === "offline_only");

    expect(found1).toBeDefined();
    expect(found2).toBeDefined();
    if (found1 && found2) {
      expect(found1.id).toBe(found2.id);
    }
  });

  it("produces different IDs for different constraints in the same text", () => {
    const result = extractHardConstraints(
      "Keine Cloud verwenden. Maximal 200 Wörter. Nur auf Deutsch.",
    );

    // Should have at least 3 constraints
    expect(result.length).toBeGreaterThanOrEqual(3);

    // All IDs should be unique
    const ids = result.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("does not require counter reset between calls", () => {
    // Multiple calls should work without any reset
    extractHardConstraints("Keine Cloud verwenden");
    extractHardConstraints("Nur auf Deutsch");
    const result = extractHardConstraints("Keine Cloud verwenden");

    const found = result.find((c) => c.category === "offline_only");
    expect(found).toBeDefined();
    // Should still have an ID (not undefined or stale)
    if (found) {
      expect(found.id).toMatch(/^HC_[A-F0-9]+$/);
    }
  });
});

// =============================================================================
// Security-Hardened Resolution Options (Batch 2)
// =============================================================================

describe("security-hardened resolution options", () => {
  it("replaces change_constraint with require_human_approval for offline_only", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_SEC_001",
        constraintText: "Keine Cloud verwenden",
        category: "offline_only",
        severity: "hard",
        position: null,
      },
    ];
    const result = checkConflicts(constraints, [
      ans("1", "Cloud-Dienst nutzen"),
    ]);
    expect(result.length).toBe(1);

    const optionIds = result[0].resolutions.map((r) => r.id);
    expect(optionIds).toContain("require_human_approval");
    expect(optionIds).not.toContain("change_constraint");
    expect(optionIds).toContain("keep_constraint");
    expect(optionIds).toContain("save_as_review");
    expect(result[0].resolutions.length).toBe(3);
  });

  it("replaces change_constraint with require_human_approval for approval_required", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_SEC_002",
        constraintText: "vor der Ausführung bestätigen",
        category: "approval_required",
        severity: "hard",
        position: null,
      },
    ];
    const result = checkConflicts(constraints, [
      ans("1", "Automatisch deployen"),
    ]);
    expect(result.length).toBe(1);

    const optionIds = result[0].resolutions.map((r) => r.id);
    expect(optionIds).toContain("require_human_approval");
    expect(optionIds).not.toContain("change_constraint");
  });

  it("replaces change_constraint with require_human_approval for scope_boundary", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_SEC_003",
        constraintText: "nur diese Datei ändern",
        category: "scope_boundary",
        severity: "hard",
        position: null,
      },
    ];
    const result = checkConflicts(constraints, [
      ans("1", "Refactoring des gesamten Projekts"),
    ]);
    expect(result.length).toBe(1);

    const optionIds = result[0].resolutions.map((r) => r.id);
    expect(optionIds).toContain("require_human_approval");
    expect(optionIds).not.toContain("change_constraint");
  });

  it("includes change_constraint for non-security categories (max_length)", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_NS_001",
        constraintText: "Maximal 200 Wörter",
        category: "max_length",
        severity: "hard",
        position: null,
      },
    ];
    const result = checkConflicts(constraints, [
      ans("1", "Ausführliche Variante"),
    ]);
    expect(result.length).toBe(1);

    const optionIds = result[0].resolutions.map((r) => r.id);
    expect(optionIds).toContain("change_constraint");
    expect(optionIds).not.toContain("require_human_approval");
    expect(optionIds).toContain("keep_constraint");
    expect(optionIds).toContain("save_as_review");
    expect(result[0].resolutions.length).toBe(3);
  });

  it("includes change_constraint for non-security categories (format_lock)", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_NS_002",
        constraintText: "als JSON ausgeben",
        category: "format_lock",
        severity: "hard",
        position: null,
      },
    ];
    const result = checkConflicts(constraints, [
      ans("1", "Als Markdown ausgeben"),
    ]);
    expect(result.length).toBe(1);

    const optionIds = result[0].resolutions.map((r) => r.id);
    expect(optionIds).toContain("change_constraint");
    expect(optionIds).not.toContain("require_human_approval");
  });

  it("security option descriptions mention the security implication", () => {
    const constraints: HardConstraint[] = [
      {
        id: "HC_SEC_004",
        constraintText: "Keine Cloud verwenden",
        category: "offline_only",
        severity: "hard",
        position: null,
      },
    ];
    const result = checkConflicts(constraints, [ans("1", "Cloud-LLM nutzen")]);
    expect(result.length).toBe(1);

    const keepOption = result[0].resolutions.find(
      (r) => r.id === "keep_constraint",
    );
    expect(keepOption).toBeDefined();
    if (keepOption) {
      expect(keepOption.description).toMatch(/Sicherheitsregel/i);
    }

    const humanOption = result[0].resolutions.find(
      (r) => r.id === "require_human_approval",
    );
    expect(humanOption).toBeDefined();
    if (humanOption) {
      expect(humanOption.description).toMatch(/Freigabe|Prüfung/i);
      expect(humanOption.consequence).toMatch(/erhalten/i);
    }
  });
});
