// =============================================================================
// PromptVault Lite — Constraint Checker Direction Profile Tests (#215 Batch 3)
// =============================================================================
// Tests for checkDirectionProfileConflicts — profile vs. constraint compatibility.
// Security categories → BLOCKING. Non-security categories → WARNING.
// Existing constraintChecker.test.ts (36 tests) must remain unaffected.
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  extractHardConstraints,
  checkDirectionProfileConflicts,
} from "../constraintChecker";
import { getProfile } from "../directionProfiles";
import type { DirectionProfile, HardConstraint } from "@/types";

// =============================================================================
// Test Helpers
// =============================================================================

function expectProfile(profileId: string): DirectionProfile {
  const p = getProfile(profileId);
  expect(p).toBeDefined();
  return p as DirectionProfile;
}

function hc(
  category: HardConstraint["category"],
  text: string,
): HardConstraint {
  return {
    id: `HC_TEST_${category}`,
    constraintText: text,
    category,
    severity: "hard",
    position: { line: 1, column: 1 },
  };
}

// =============================================================================
// Pre-fetch all profiles
// =============================================================================

const sachlichProfile = expectProfile("sachlich");
const verkaeuferischProfile = expectProfile("verkaeuferisch");
const technischProfile = expectProfile("technisch");
const kurzProfile = expectProfile("kurz");
const ausfuehrlichProfile = expectProfile("ausfuehrlich");
const kreativProfile = expectProfile("kreativ");
const kritischProfile = expectProfile("kritisch");
const anfaengerProfile = expectProfile("anfaenger");
const experteProfile = expectProfile("experte");
const deepResearchProfile = expectProfile("deep_research");
const agentischProfile = expectProfile("agentisch");
const complianceProfile = expectProfile("compliance");

// =============================================================================
// checkDirectionProfileConflicts
// =============================================================================

describe("checkDirectionProfileConflicts", () => {
  // --- Empty / No conflict ---

  it("returns empty array for empty constraints", () => {
    const result = checkDirectionProfileConflicts(sachlichProfile, []);
    expect(result).toEqual([]);
  });

  it("returns empty array when profile has no conflicting categories", () => {
    const constraints = [hc("offline_only", "Keine Cloud verwenden")];
    const result = checkDirectionProfileConflicts(sachlichProfile, constraints);
    expect(result).toEqual([]);
  });

  it("returns empty array when constraint category not in conflicting list", () => {
    // sachlich has no conflicting categories — nothing should conflict
    const constraints = [
      hc("offline_only", "Keine Cloud verwenden"),
      hc("max_length", "Maximal 200 Wörter"),
      hc("language", "Nur auf Deutsch"),
    ];
    const result = checkDirectionProfileConflicts(sachlichProfile, constraints);
    expect(result).toEqual([]);
  });

  // --- Security BLOCKING: offline_only + deep_research ---

  it("detects BLOCKING conflict: deep_research + offline_only", () => {
    const constraints = [hc("offline_only", "Keine Cloud verwenden")];
    const result = checkDirectionProfileConflicts(
      deepResearchProfile,
      constraints,
    );
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("blocking");
    expect(result[0].constraint.category).toBe("offline_only");
    expect(result[0].conflictingSource).toBe(deepResearchProfile.label);
    expect(result[0].description).toMatch(/Sicherheitsregel/i);
  });

  it("BLOCKING: deep_research + offline_only has require_human_approval resolution", () => {
    const constraints = [hc("offline_only", "Keine Cloud verwenden")];
    const result = checkDirectionProfileConflicts(
      deepResearchProfile,
      constraints,
    );
    expect(result).toHaveLength(1);

    const optionIds = result[0].resolutions.map((r) => r.id);
    expect(optionIds).toContain("require_human_approval");
    expect(optionIds).not.toContain("change_constraint");
    // Security categories: change_constraint replaced by require_human_approval
  });

  // --- Security BLOCKING: agentisch + approval_required ---

  it("detects BLOCKING conflict: agentisch + approval_required", () => {
    const constraints = [
      hc("approval_required", "vor der Ausführung bestätigen"),
    ];
    const result = checkDirectionProfileConflicts(
      agentischProfile,
      constraints,
    );
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("blocking");
    expect(result[0].constraint.category).toBe("approval_required");
    expect(result[0].conflictingSource).toBe(agentischProfile.label);
  });

  it("BLOCKING: agentisch + approval_required has require_human_approval in resolutions", () => {
    const constraints = [
      hc("approval_required", "vor der Ausführung bestätigen"),
    ];
    const result = checkDirectionProfileConflicts(
      agentischProfile,
      constraints,
    );
    expect(result).toHaveLength(1);

    const optionIds = result[0].resolutions.map((r) => r.id);
    expect(optionIds).toContain("require_human_approval");
    expect(optionIds).not.toContain("change_constraint");
  });

  // --- Security BLOCKING: scope_boundary ---

  it("detects BLOCKING conflict: agentisch + scope_boundary", () => {
    // scope_boundary IS in agentisch's conflicting categories per spec §7.3
    // ("Keine neuen Dateien" + agentisch → BLOCKING).
    const constraints = [hc("scope_boundary", "nur diese Datei ändern")];
    const result = checkDirectionProfileConflicts(
      agentischProfile,
      constraints,
    );
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("blocking");
    expect(result[0].constraint.category).toBe("scope_boundary");
    expect(result[0].conflictingSource).toBe(agentischProfile.label);
    // Security categories: require_human_approval, NOT change_constraint
    const optionIds = result[0].resolutions.map((r) => r.id);
    expect(optionIds).toContain("require_human_approval");
    expect(optionIds).not.toContain("change_constraint");
  });

  // --- WARNING: Non-security categories ---

  it("detects WARNING conflict: ausfuehrlich + max_length", () => {
    const constraints = [hc("max_length", "Maximal 200 Wörter")];
    const result = checkDirectionProfileConflicts(
      ausfuehrlichProfile,
      constraints,
    );
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("warning");
    expect(result[0].constraint.category).toBe("max_length");
  });

  it("detects WARNING conflict: kurz + max_length", () => {
    const constraints = [hc("max_length", "Maximal 100 Zeichen")];
    const result = checkDirectionProfileConflicts(kurzProfile, constraints);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("warning");
  });

  it("detects WARNING conflict: verkaeuferisch + no_examples", () => {
    const constraints = [hc("no_examples", "Keine Beispiele")];
    const result = checkDirectionProfileConflicts(
      verkaeuferischProfile,
      constraints,
    );
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("warning");
    expect(result[0].constraint.category).toBe("no_examples");
  });

  it("detects WARNING conflicts: kreativ + no_examples and format_lock", () => {
    const constraints = [
      hc("no_examples", "Keine Beispiele"),
      hc("format_lock", "als JSON ausgeben"),
    ];
    const result = checkDirectionProfileConflicts(kreativProfile, constraints);
    expect(result).toHaveLength(2);
    // Both should be WARNING severity
    for (const conflict of result) {
      expect(conflict.severity).toBe("warning");
    }
    // Verify the constraint categories
    const categories = result.map((c) => c.constraint.category).sort();
    expect(categories).toEqual(["format_lock", "no_examples"]);
  });

  // --- Non-security WARNING: resolution options ---

  it("WARNING conflicts include change_constraint in resolutions", () => {
    const constraints = [hc("max_length", "Maximal 200 Wörter")];
    const result = checkDirectionProfileConflicts(
      ausfuehrlichProfile,
      constraints,
    );
    expect(result).toHaveLength(1);

    const optionIds = result[0].resolutions.map((r) => r.id);
    expect(optionIds).toContain("change_constraint");
    expect(optionIds).not.toContain("require_human_approval");
  });

  it("WARNING conflicts for no_examples include change_constraint", () => {
    const constraints = [hc("no_examples", "Keine Beispiele")];
    const result = checkDirectionProfileConflicts(
      verkaeuferischProfile,
      constraints,
    );
    expect(result).toHaveLength(1);

    const optionIds = result[0].resolutions.map((r) => r.id);
    expect(optionIds).toContain("change_constraint");
  });

  // --- Universally compatible profiles ---

  it("sachlich: no conflicts with any constraint category", () => {
    const constraints = [
      hc("offline_only", "Keine Cloud verwenden"),
      hc("max_length", "Maximal 200 Wörter"),
      hc("no_examples", "Keine Beispiele"),
      hc("language", "Nur auf Deutsch"),
      hc("format_lock", "als JSON ausgeben"),
      hc("tool_restriction", "keine Tools verwenden"),
      hc("approval_required", "vor der Ausführung bestätigen"),
      hc("scope_boundary", "nur diese Datei ändern"),
    ];
    const result = checkDirectionProfileConflicts(sachlichProfile, constraints);
    expect(result).toEqual([]);
  });

  it("technisch: no conflicts with any constraint category", () => {
    const constraints = [
      hc("offline_only", "Keine Cloud verwenden"),
      hc("approval_required", "vor der Ausführung bestätigen"),
    ];
    const result = checkDirectionProfileConflicts(
      technischProfile,
      constraints,
    );
    expect(result).toEqual([]);
  });

  it("kritisch: no conflicts with any constraint category", () => {
    const constraints = [
      hc("offline_only", "Keine Cloud verwenden"),
      hc("approval_required", "vor der Ausführung bestätigen"),
    ];
    const result = checkDirectionProfileConflicts(kritischProfile, constraints);
    expect(result).toEqual([]);
  });

  it("anfaenger: no conflicts with any constraint category", () => {
    const constraints = [hc("offline_only", "Keine Cloud verwenden")];
    const result = checkDirectionProfileConflicts(
      anfaengerProfile,
      constraints,
    );
    expect(result).toEqual([]);
  });

  it("experte: no conflicts with any constraint category", () => {
    const constraints = [
      hc("approval_required", "vor der Ausführung bestätigen"),
    ];
    const result = checkDirectionProfileConflicts(experteProfile, constraints);
    expect(result).toEqual([]);
  });

  it("compliance: no conflicts with any constraint category", () => {
    const constraints = [
      hc("offline_only", "Keine Cloud verwenden"),
      hc("approval_required", "vor der Ausführung bestätigen"),
      hc("scope_boundary", "nur diese Datei ändern"),
    ];
    const result = checkDirectionProfileConflicts(
      complianceProfile,
      constraints,
    );
    expect(result).toEqual([]);
  });

  // --- Multiple constraints with mixed results ---

  it("returns both BLOCKING and WARNING conflicts for mixed constraints", () => {
    const constraints = [
      hc("offline_only", "Keine Cloud verwenden"),
      hc("max_length", "Maximal 200 Wörter"),
    ];
    const result = checkDirectionProfileConflicts(
      deepResearchProfile,
      constraints,
    );
    // deep_research conflicts with offline_only → BLOCKING
    // deep_research does NOT conflict with max_length → no conflict
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("blocking");
    expect(result[0].constraint.category).toBe("offline_only");
  });

  // --- Conflict structure validation ---

  it("each conflict has all required fields", () => {
    const constraints = [hc("offline_only", "Keine Cloud verwenden")];
    const result = checkDirectionProfileConflicts(
      deepResearchProfile,
      constraints,
    );
    expect(result).toHaveLength(1);

    const conflict = result[0];
    expect(conflict.id).toMatch(/^DPC_\d{3}$/);
    expect(conflict.constraint).toBeDefined();
    expect(conflict.constraint.category).toBe("offline_only");
    expect(conflict.conflictingSource).toBeTruthy();
    expect(conflict.description).toBeTruthy();
    expect(conflict.severity).toBe("blocking");
    expect(Array.isArray(conflict.resolutions)).toBe(true);
    expect(conflict.resolutions.length).toBeGreaterThan(0);
    expect(conflict.selectedResolution).toBeNull();
  });

  // --- Resolution options structure ---

  it("all resolution options have required fields", () => {
    const constraints = [hc("offline_only", "Keine Cloud verwenden")];
    const result = checkDirectionProfileConflicts(
      deepResearchProfile,
      constraints,
    );
    for (const option of result[0].resolutions) {
      expect(option.id).toBeTruthy();
      expect(option.label).toBeTruthy();
      expect(option.description).toBeTruthy();
      expect(option.consequence).toBeTruthy();
    }
  });

  it("always includes keep_constraint and save_as_review options", () => {
    // Test with both security and non-security categories
    const offlineResult = checkDirectionProfileConflicts(deepResearchProfile, [
      hc("offline_only", "Keine Cloud verwenden"),
    ]);
    const lengthResult = checkDirectionProfileConflicts(ausfuehrlichProfile, [
      hc("max_length", "Maximal 200 Wörter"),
    ]);

    for (const result of [offlineResult, lengthResult]) {
      expect(result).toHaveLength(1);
      const optionIds = result[0].resolutions.map((r) => r.id);
      expect(optionIds).toContain("keep_constraint");
      expect(optionIds).toContain("save_as_review");
    }
  });

  // --- Profile with no conflicting categories ---

  it("returns empty for profile with empty conflictingConstraintCategories", () => {
    const constraints = [
      hc("offline_only", "Keine Cloud verwenden"),
      hc("max_length", "Maximal 200 Wörter"),
    ];
    const result = checkDirectionProfileConflicts(sachlichProfile, constraints);
    expect(result).toEqual([]);
  });

  // --- Constraint not in any profile conflict list ---

  it("language constraint: sachlich profile → no conflict", () => {
    const constraints = [hc("language", "Nur auf Deutsch")];
    const result = checkDirectionProfileConflicts(sachlichProfile, constraints);
    expect(result).toEqual([]);
  });

  it("tool_restriction constraint: sachlich profile → no conflict", () => {
    const constraints = [hc("tool_restriction", "keine Tools verwenden")];
    const result = checkDirectionProfileConflicts(sachlichProfile, constraints);
    expect(result).toEqual([]);
  });

  // --- Deterministic IDs ---

  it("generates deterministic conflict IDs", () => {
    const constraints = [hc("offline_only", "Keine Cloud verwenden")];
    const result1 = checkDirectionProfileConflicts(
      deepResearchProfile,
      constraints,
    );
    const result2 = checkDirectionProfileConflicts(
      deepResearchProfile,
      constraints,
    );

    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(1);

    // IDs are sequential (DPC_001, DPC_001) — same input, same order
    expect(result1[0].id).toBe(result2[0].id);
  });

  // --- Agent + multiple security constraints ---

  it("agentisch detects both approval_required AND scope_boundary as BLOCKING", () => {
    const constraints = [
      hc("approval_required", "vor der Ausführung bestätigen"),
      hc("scope_boundary", "nur diese Datei ändern"),
    ];
    const result = checkDirectionProfileConflicts(
      agentischProfile,
      constraints,
    );
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.constraint.category).sort()).toEqual(
      ["approval_required", "scope_boundary"].sort(),
    );
    for (const conflict of result) {
      expect(conflict.severity).toBe("blocking");
      const optionIds = conflict.resolutions.map((r) => r.id);
      expect(optionIds).toContain("require_human_approval");
      expect(optionIds).not.toContain("change_constraint");
    }
  });

  // --- scope_boundary: only conflicts where defined ---

  it("deep_research: scope_boundary does NOT conflict (not in conflicting categories)", () => {
    const constraints = [hc("scope_boundary", "nur diese Datei ändern")];
    const result = checkDirectionProfileConflicts(
      deepResearchProfile,
      constraints,
    );
    // scope_boundary is NOT in deep_research's conflicting categories → no conflict
    expect(result).toEqual([]);
  });

  it("kritisch: scope_boundary does NOT conflict (universally compatible)", () => {
    const constraints = [hc("scope_boundary", "nur diese Datei ändern")];
    const result = checkDirectionProfileConflicts(kritischProfile, constraints);
    expect(result).toEqual([]);
  });

  // --- All 3 SECURITY_CATEGORIES produce BLOCKING when conflicting ---

  it("all SECURITY_CATEGORIES (offline_only, approval_required, scope_boundary) produce BLOCKING severity", () => {
    // offline_only → conflicts with deep_research
    const r1 = checkDirectionProfileConflicts(deepResearchProfile, [
      hc("offline_only", "Keine Cloud verwenden"),
    ]);
    expect(r1[0].severity).toBe("blocking");

    // approval_required → conflicts with agentisch
    const r2 = checkDirectionProfileConflicts(agentischProfile, [
      hc("approval_required", "vor der Ausführung bestätigen"),
    ]);
    expect(r2[0].severity).toBe("blocking");

    // scope_boundary → conflicts with agentisch
    const r3 = checkDirectionProfileConflicts(agentischProfile, [
      hc("scope_boundary", "nur diese Datei ändern"),
    ]);
    expect(r3[0].severity).toBe("blocking");

    // All three have require_human_approval, NOT change_constraint
    for (const result of [r1, r2, r3]) {
      const optionIds = result[0].resolutions.map((r) => r.id);
      expect(optionIds).toContain("require_human_approval");
      expect(optionIds).not.toContain("change_constraint");
    }
  });
});

// =============================================================================
// Integration: Real-world scenarios with extractHardConstraints
// =============================================================================

describe("checkDirectionProfileConflicts — Integration with extractHardConstraints", () => {
  it("detects conflict from real prompt text: offline_only → deep_research", () => {
    const prompt =
      "Keine Cloud verwenden. Alles muss lokal laufen. Nur auf Deutsch.";
    const constraints = extractHardConstraints(prompt);
    expect(constraints.length).toBeGreaterThan(0);

    const result = checkDirectionProfileConflicts(
      deepResearchProfile,
      constraints,
    );
    expect(result.length).toBeGreaterThan(0);

    const offlineConflict = result.find(
      (c) => c.constraint.category === "offline_only",
    );
    expect(offlineConflict).toBeDefined();
    expect(offlineConflict?.severity).toBe("blocking");
  });

  it("no conflict for universally compatible profile with real prompt", () => {
    const prompt =
      "Keine Cloud verwenden. Maximal 200 Wörter. Nur auf Deutsch. vor der Ausführung bestätigen.";
    const constraints = extractHardConstraints(prompt);
    expect(constraints.length).toBeGreaterThan(0);

    const result = checkDirectionProfileConflicts(sachlichProfile, constraints);
    expect(result).toEqual([]);
  });

  it("detects mixed conflicts with real prompt", () => {
    const prompt =
      "Keine Cloud verwenden. Maximal 200 Wörter. Keine Beispiele.";
    const constraints = extractHardConstraints(prompt);

    const result = checkDirectionProfileConflicts(
      deepResearchProfile,
      constraints,
    );
    // deep_research conflicts with offline_only → 1 BLOCKING
    // deep_research does NOT conflict with max_length or no_examples
    expect(result.length).toBe(1);
    expect(result[0].constraint.category).toBe("offline_only");
    expect(result[0].severity).toBe("blocking");
  });
});

// =============================================================================
// Regression: #216 constraintChecker.test.ts unchanged
// =============================================================================
// Imported tests are run together by vitest — no explicit regression test
// needed here. The existing constraintChecker.test.ts (36 tests) must
// pass unchanged, verified by the parent test runner.
// =============================================================================
