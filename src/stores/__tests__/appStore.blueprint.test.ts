import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/stores/appStore";
import type { BlueprintDetectOutput, BlueprintEvaluation } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDetection(
  overrides: Partial<BlueprintDetectOutput> = {},
): BlueprintDetectOutput {
  return {
    content_class: "PROMPT",
    blueprint_type: null,
    contamination_status: "CLEAN",
    confidence: 0.95,
    prompt_signals: ["has_goal"],
    blueprint_signals: [],
    contamination_signals: [],
    ...overrides,
  };
}

function makeEvaluation(
  overrides: Partial<BlueprintEvaluation> = {},
): BlueprintEvaluation {
  return {
    content_class: "BLUEPRINT",
    blueprint_type: "generic_blueprint",
    contamination_status: "CLEAN",
    goal_clarity_score: 70,
    scope_sharpness_score: 65,
    architecture_score: 80,
    feasibility_score: 75,
    risk_coverage_score: 60,
    security_privacy_score: 55,
    testability_score: 50,
    evidence_readiness_score: 40,
    context_purity_score: 85,
    overall_score: 65,
    dimensions: [],
    strengths: [],
    warnings: [],
    missing_elements: [],
    suggested_improvements: [],
    confidence: 0.85,
    evaluated_at: "2026-06-20T00:00:00Z",
    ...overrides,
    // Nested spread for dimensions etc would need manual override
  };
}

function resetStore() {
  useAppStore.setState({
    prompts: [],
    evaluations: {},
    hygiene: {},
    contextEvaluations: {},
    blueprintDetections: {},
    blueprintEvaluations: {},
    selectedPromptId: null,
    filters: {
      search: "",
      category: null,
      minScore: 0,
      maxScore: 100,
      hygieneStatus: null,
      tags: [],
      favoritesOnly: false,
    },
    currentFolderPath: null,
  });
}

// ---------------------------------------------------------------------------
// T1 — Blueprint State Tests
// ---------------------------------------------------------------------------

describe("Blueprint State", () => {
  beforeEach(resetStore);

  it("initial blueprintDetections is empty", () => {
    const state = useAppStore.getState();
    expect(state.blueprintDetections).toEqual({});
  });

  it("initial blueprintEvaluations is empty", () => {
    const state = useAppStore.getState();
    expect(state.blueprintEvaluations).toEqual({});
  });

  it("setBlueprintDetection stores detection by id", () => {
    const detection = makeDetection({ content_class: "BLUEPRINT" });
    useAppStore.getState().setBlueprintDetection("prompt-1", detection);

    const state = useAppStore.getState();
    expect(state.blueprintDetections["prompt-1"]).toEqual(detection);
  });

  it("setBlueprintDetection overwrites existing entry", () => {
    const first = makeDetection({ content_class: "PROMPT" });
    useAppStore.getState().setBlueprintDetection("prompt-1", first);

    const second = makeDetection({ content_class: "BLUEPRINT" });
    useAppStore.getState().setBlueprintDetection("prompt-1", second);

    const state = useAppStore.getState();
    expect(state.blueprintDetections["prompt-1"].content_class).toBe(
      "BLUEPRINT",
    );
  });

  it("setBlueprintEvaluation stores evaluation by id", () => {
    const evaluation = makeEvaluation({ overall_score: 80 });
    useAppStore.getState().setBlueprintEvaluation("prompt-2", evaluation);

    const state = useAppStore.getState();
    expect(state.blueprintEvaluations["prompt-2"]).toEqual(evaluation);
  });

  it("setBlueprintDetection does not affect other entries", () => {
    useAppStore
      .getState()
      .setBlueprintDetection(
        "prompt-1",
        makeDetection({ content_class: "BLUEPRINT" }),
      );
    useAppStore
      .getState()
      .setBlueprintDetection(
        "prompt-2",
        makeDetection({ content_class: "PROMPT" }),
      );

    const state = useAppStore.getState();
    expect(state.blueprintDetections["prompt-1"].content_class).toBe(
      "BLUEPRINT",
    );
    expect(state.blueprintDetections["prompt-2"].content_class).toBe("PROMPT");
  });

  it("selectedBlueprintDetection returns detection for selected id", () => {
    const detection = makeDetection({
      content_class: "PROMPT_BLUEPRINT_HYBRID",
    });
    useAppStore.setState({ selectedPromptId: "prompt-1" });
    useAppStore.getState().setBlueprintDetection("prompt-1", detection);

    const result = useAppStore.getState().selectedBlueprintDetection();
    expect(result).not.toBeNull();
    if (result) {
      expect(result.content_class).toBe("PROMPT_BLUEPRINT_HYBRID");
    }
  });

  it("selectedBlueprintDetection returns null when no item selected", () => {
    useAppStore.getState().setBlueprintDetection("prompt-1", makeDetection());

    const result = useAppStore.getState().selectedBlueprintDetection();
    expect(result).toBeNull();
  });

  it("selectedBlueprintDetection returns null if detection not found", () => {
    useAppStore.setState({ selectedPromptId: "nonexistent" });

    const result = useAppStore.getState().selectedBlueprintDetection();
    expect(result).toBeNull();
  });

  it("selectedBlueprintEvaluation returns evaluation for selected id", () => {
    const evaluation = makeEvaluation({ overall_score: 90 });
    useAppStore.setState({ selectedPromptId: "prompt-3" });
    useAppStore.getState().setBlueprintEvaluation("prompt-3", evaluation);

    const result = useAppStore.getState().selectedBlueprintEvaluation();
    expect(result).not.toBeNull();
    if (result) {
      expect(result.overall_score).toBe(90);
    }
  });

  it("selectedBlueprintEvaluation returns null when no item selected", () => {
    useAppStore.getState().setBlueprintEvaluation("prompt-1", makeEvaluation());

    const result = useAppStore.getState().selectedBlueprintEvaluation();
    expect(result).toBeNull();
  });

  it("selectedBlueprintEvaluation returns null if evaluation not found", () => {
    useAppStore.setState({ selectedPromptId: "nonexistent" });

    const result = useAppStore.getState().selectedBlueprintEvaluation();
    expect(result).toBeNull();
  });

  // Regression: existing prompt state flows remain unbroken
  it("existing prompt state flows remain unbroken after blueprint state changes", () => {
    useAppStore.setState({
      selectedPromptId: "prompt-1",
      evaluations: {
        "prompt-1": {
          id: "eval-1",
          prompt_id: "prompt-1",
          overall_score: 75,
          criteria: [],
          missing_sections: [],
          recommendations: [],
          evaluated_at: "2026-01-01T00:00:00Z",
        },
      },
    });

    // Set a blueprint detection — this must not break the existing evaluation
    useAppStore
      .getState()
      .setBlueprintDetection(
        "prompt-1",
        makeDetection({ content_class: "BLUEPRINT" }),
      );

    const state = useAppStore.getState();
    expect(state.evaluations["prompt-1"].overall_score).toBe(75);
    expect(state.selectedEvaluation()).not.toBeNull();
    const promptEval = state.selectedEvaluation();
    expect(promptEval).not.toBeNull();
    if (promptEval) {
      expect(promptEval.overall_score).toBe(75);
    }
  });
});
