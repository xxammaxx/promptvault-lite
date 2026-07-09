// =============================================================================
// PromptVault Lite — Missing-Info-Detector Tests
// =============================================================================

import { describe, it, expect } from "vitest";
import { detectGaps } from "../missingInfoDetector";
import type {
  PromptContextEvaluation,
  PromptHygiene,
  BlueprintEvaluation,
} from "@/types";

// =============================================================================
// Mock Helpers
// =============================================================================

function makeMockContextEval(
  overrides: Partial<PromptContextEvaluation> = {},
): PromptContextEvaluation {
  return {
    detected_prompt_type: "structured_prompt",
    detected_context_profile: "moderate",
    prompt_engineering_score: 70,
    context_engineering_score: 65,
    agent_readiness_score: 60,
    robustness_score: 80,
    overall_score: 70,
    criteria: [],
    strengths: [],
    warnings: [],
    missing_elements: [],
    suggested_improvements: [],
    risk_flags: [],
    confidence: 0.8,
    evaluated_at: "2026-07-09T00:00:00Z",
    ...overrides,
  };
}

function makeMockHygiene(
  overrides: Partial<PromptHygiene> = {},
): PromptHygiene {
  return {
    id: "hygiene-1",
    prompt_id: "prompt-1",
    hygiene_score: 85,
    status: "clean",
    artifacts: [],
    analyzed_at: "2026-07-09T00:00:00Z",
    ...overrides,
  };
}

function makeMockBlueprintEval(
  overrides: Partial<BlueprintEvaluation> = {},
): BlueprintEvaluation {
  return {
    content_class: "BLUEPRINT",
    blueprint_type: "architecture_blueprint",
    contamination_status: "CLEAN",
    goal_clarity_score: 60,
    scope_sharpness_score: 65,
    architecture_score: 70,
    feasibility_score: 55,
    risk_coverage_score: 50,
    security_privacy_score: 60,
    testability_score: 50,
    evidence_readiness_score: 45,
    context_purity_score: 70,
    overall_score: 60,
    dimensions: [],
    strengths: [],
    warnings: [],
    missing_elements: [],
    suggested_improvements: [],
    confidence: 0.7,
    evaluated_at: "2026-07-09T00:00:00Z",
    ...overrides,
  };
}

// =============================================================================
// detectGaps
// =============================================================================

describe("detectGaps", () => {
  // --- Basic detection ---

  it("returns empty array when all analysis data is clean", () => {
    const result = detectGaps({
      contextEval: makeMockContextEval(),
      hygiene: makeMockHygiene(),
    });
    expect(result).toEqual([]);
  });

  it("detects gaps from missing_elements", () => {
    const ctx = makeMockContextEval({
      missing_elements: ["Zieldefinition", "Ausgabeformat"],
    });
    const result = detectGaps({
      contextEval: ctx,
      hygiene: makeMockHygiene(),
    });
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.some((i) => i.label === "Zieldefinition")).toBe(true);
    expect(result.some((i) => i.label === "Ausgabeformat")).toBe(true);
  });

  it("detects gaps from risk_flags", () => {
    const ctx = makeMockContextEval({
      risk_flags: [
        {
          flag: "missing_goal",
          severity: "critical",
          message: "Kein Ziel definiert",
          score_penalty: 20,
        },
      ],
    });
    const result = detectGaps({
      contextEval: ctx,
      hygiene: makeMockHygiene(),
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].source).toBe("risk_flag");
    expect(result[0].label).toBe("missing_goal");
  });

  it("detects gaps from criteria with score 0", () => {
    const ctx = makeMockContextEval({
      criteria: [
        {
          dimension: "prompt_engineering",
          name: "Zielklarheit",
          score: 0,
          max_score: 2,
          details: "Kein Ziel erkennbar",
        },
      ],
    });
    const result = detectGaps({
      contextEval: ctx,
      hygiene: makeMockHygiene(),
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].source).toBe("prompt_engineering");
    expect(result[0].label).toBe("Zielklarheit");
  });

  it("detects gaps from suggested_improvements", () => {
    const ctx = makeMockContextEval({
      suggested_improvements: [
        {
          dimension: "prompt_engineering",
          criterion: "Zieldefinition",
          message: "Ein klares Ziel verbessert die Optimierung.",
          priority: "high",
        },
      ],
    });
    const result = detectGaps({
      contextEval: ctx,
      hygiene: makeMockHygiene(),
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].source).toBe("prompt_engineering");
  });

  it("detects gaps from blueprint missing_elements", () => {
    const bp = makeMockBlueprintEval({
      missing_elements: ["Sicherheitsanforderungen"],
    });
    const result = detectGaps({
      contextEval: makeMockContextEval(),
      hygiene: makeMockHygiene(),
      blueprintEval: bp,
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].source).toBe("blueprint");
    expect(result[0].label).toBe("Sicherheitsanforderungen");
  });

  it("detects hygiene gap when score < 50", () => {
    const result = detectGaps({
      contextEval: makeMockContextEval(),
      hygiene: makeMockHygiene({ hygiene_score: 30 }),
    });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].source).toBe("hygiene");
  });

  it("does NOT detect hygiene gap when score >= 50", () => {
    const result = detectGaps({
      contextEval: makeMockContextEval(),
      hygiene: makeMockHygiene({ hygiene_score: 75 }),
    });
    const hygieneItems = result.filter((i) => i.source === "hygiene");
    expect(hygieneItems.length).toBe(0);
  });

  // --- Deduplication ---

  it("deduplicates items with the same normalized label", () => {
    const ctx = makeMockContextEval({
      missing_elements: ["Zieldefinition"],
      risk_flags: [
        {
          flag: "missing_goal",
          severity: "critical",
          message: "Zieldefinition fehlt",
          score_penalty: 20,
        },
      ],
    });
    // Both risk_flag and missing_elements refer to the same concept
    // The "missing_goal" RiskFlag has label "missing_goal" which is different
    // from "Zieldefinition", so they should pass through as different labels.
    const result = detectGaps({
      contextEval: ctx,
      hygiene: makeMockHygiene(),
    });
    // Both should be present since labels differ (Zieldefinition vs missing_goal)
    expect(result.filter((i) => i.label === "Zieldefinition").length).toBe(1);
    expect(result.filter((i) => i.label === "missing_goal").length).toBe(1);
  });

  it("deduplicates identical labels from different sources", () => {
    const ctx = makeMockContextEval({
      missing_elements: ["Zieldefinition", "Zieldefinition"], // duplicate
    });
    const result = detectGaps({
      contextEval: ctx,
      hygiene: makeMockHygiene(),
    });
    const matching = result.filter((i) => i.label === "Zieldefinition");
    expect(matching.length).toBe(1);
  });

  // --- Edge Cases ---

  it("returns empty array for empty prompt (promptContentLength=0)", () => {
    const result = detectGaps({
      contextEval: makeMockContextEval({
        missing_elements: ["Zieldefinition"],
      }),
      hygiene: makeMockHygiene(),
      promptContentLength: 0,
    });
    expect(result).toEqual([]);
  });

  it("returns empty array for BLOCKING_SENSITIVE_CONTENT", () => {
    const bp = makeMockBlueprintEval({
      contamination_status: "BLOCKING_SENSITIVE_CONTENT",
      missing_elements: ["Sicherheitsanforderungen"],
    });
    const result = detectGaps({
      contextEval: makeMockContextEval(),
      hygiene: makeMockHygiene(),
      blueprintEval: bp,
    });
    expect(result).toEqual([]);
  });

  it("returns empty array when contaminationStatusOverride is BLOCKING_SENSITIVE_CONTENT", () => {
    const result = detectGaps({
      contextEval: makeMockContextEval({
        missing_elements: ["Zieldefinition"],
      }),
      hygiene: makeMockHygiene(),
      contaminationStatusOverride: "BLOCKING_SENSITIVE_CONTENT",
    });
    expect(result).toEqual([]);
  });

  it("limits items to max 3 when prompt is < 50 chars", () => {
    const ctx = makeMockContextEval({
      missing_elements: ["A", "B", "C", "D", "E"],
    });
    const result = detectGaps({
      contextEval: ctx,
      hygiene: makeMockHygiene(),
      promptContentLength: 30,
    });
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("returns all items when prompt is long enough", () => {
    const ctx = makeMockContextEval({
      missing_elements: ["A", "B", "C", "D", "E", "F"],
    });
    const result = detectGaps({
      contextEval: ctx,
      hygiene: makeMockHygiene(),
      promptContentLength: 500,
    });
    expect(result.length).toBe(6);
  });

  // --- Each item has required fields ---

  it("every item has id, source, label, question, rationale, inputType", () => {
    const ctx = makeMockContextEval({
      missing_elements: ["Zieldefinition"],
    });
    const result = detectGaps({
      contextEval: ctx,
      hygiene: makeMockHygiene(),
    });
    for (const item of result) {
      expect(item.id).toBeTruthy();
      expect(item.source).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.question).toBeTruthy();
      expect(item.rationale).toBeTruthy();
      expect(item.inputType).toBeTruthy();
    }
  });
});
