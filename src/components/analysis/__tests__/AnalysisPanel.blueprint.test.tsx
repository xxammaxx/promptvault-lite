import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalysisPanel } from "../AnalysisPanel";

vi.mock("@/stores/appStore", () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from "@/stores/appStore";
import type {
  PromptItem,
  PromptEvaluation,
  PromptHygiene,
  PromptContextEvaluation,
  BlueprintEvaluation,
  BlueprintDimensionScore,
  BlueprintImprovement,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal PromptItem for tests */
function makePrompt(overrides: Partial<PromptItem> = {}): PromptItem {
  return {
    id: "test-prompt-1",
    file_path: "/test/prompt.md",
    file_name: "prompt.md",
    title: "Test Prompt",
    description: "A test prompt",
    content: "This is the prompt content.",
    category: "general",
    tags: [],
    version: "1.0",
    raw_frontmatter: {},
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    is_favorite: false,
    ...overrides,
  };
}

/** Create a minimal PromptEvaluation for tests */
function makePromptEval(): PromptEvaluation {
  return {
    id: "eval-001",
    prompt_id: "test-prompt-1",
    overall_score: 75,
    criteria: [
      {
        name: "Clarity",
        score: 8,
        max_score: 10,
        weight: 1,
        details: "Clear enough",
      },
    ],
    missing_sections: [],
    recommendations: ["Improve structure"],
    evaluated_at: "2024-01-02T00:00:00Z",
  };
}

/** Create a minimal BlueprintEvaluation for tests */
function makeBlueprintEval(
  overrides: Partial<BlueprintEvaluation> = {},
): BlueprintEvaluation {
  const base: BlueprintEvaluation = {
    content_class: "BLUEPRINT",
    blueprint_type: "architecture_blueprint",
    contamination_status: "CLEAN",
    goal_clarity_score: 70,
    scope_sharpness_score: 65,
    architecture_score: 60,
    feasibility_score: 75,
    risk_coverage_score: 50,
    security_privacy_score: 80,
    testability_score: 55,
    evidence_readiness_score: 45,
    context_purity_score: 85,
    overall_score: 68,
    confidence: 0.88,
    evaluated_at: "2024-01-02T00:00:00Z",
    dimensions: [
      {
        name: "Goal Clarity",
        score: 2,
        max_score: 3,
        details: "Goals are clearly stated.",
      } as BlueprintDimensionScore,
      {
        name: "Scope Sharpness",
        score: 1,
        max_score: 2,
        details: "Scope is reasonably defined.",
      } as BlueprintDimensionScore,
      {
        name: "Blueprint Fidelity",
        score: 1,
        max_score: 2,
        details: "Moderate fidelity.",
      } as BlueprintDimensionScore,
    ],
    strengths: ["Well-structured", "Clear goals"],
    warnings: ["Missing evidence gates"],
    missing_elements: ["Deployment section"],
    suggested_improvements: [
      {
        priority: "high",
        message: "Add deployment section",
      } as BlueprintImprovement,
      {
        priority: "medium",
        message: "Improve risk coverage",
      } as BlueprintImprovement,
    ],
  };
  return { ...base, ...overrides } as BlueprintEvaluation;
}

/** Mock store helper — mirrors the existing AnalysisPanel.test.tsx pattern */
function mockStore(overrides: {
  prompt?: PromptItem | null;
  evaluation?: PromptEvaluation | null;
  hygiene?: PromptHygiene | null;
  contextEval?: PromptContextEvaluation | null;
  blueprintEval?: BlueprintEvaluation | null;
  isAnalyzing?: boolean;
}) {
  const {
    prompt = null,
    evaluation = null,
    hygiene = null,
    contextEval = null,
    blueprintEval = null,
    isAnalyzing = false,
  } = overrides;

  (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (s: unknown) => unknown) => {
      const state = {
        selectedPrompt: () => prompt,
        selectedEvaluation: () => evaluation,
        selectedHygiene: () => hygiene,
        selectedContextEvaluation: () => contextEval,
        selectedBlueprintEvaluation: () => blueprintEval,
        isAnalyzing,
        analyzeSelected: vi.fn(),
      };
      return selector(state);
    },
  );
}

// ---------------------------------------------------------------------------
// T7 — AnalysisPanel Blueprint Evaluation Integration
// ---------------------------------------------------------------------------

describe("AnalysisPanel — Blueprint Evaluation Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- RT-001: BlueprintEvaluationPanel renders when evaluation exists ---

  it("renders BlueprintEvaluationPanel when blueprint evaluation exists", () => {
    const prompt = makePrompt();
    const bpEval = makeBlueprintEval();
    mockStore({ prompt, blueprintEval: bpEval });

    render(<AnalysisPanel />);

    // Blueprint evaluation headings should be visible
    expect(screen.getByText("Blueprint Quality Score")).toBeInTheDocument();
    // Overall score rendered as circular gauge value
    expect(screen.getByText("68")).toBeInTheDocument();
    // Blueprint type badge (may appear multiple times — badge + dimension label)
    const archElements = screen.getAllByText("Architecture");
    expect(archElements.length).toBeGreaterThanOrEqual(1);
    // Confidence badge
    expect(screen.getByText("88% confidence")).toBeInTheDocument();
  });

  // --- RT-002: BlueprintEvaluationPanel does NOT render when evaluation is null ---

  it("does NOT render BlueprintEvaluationPanel when evaluation is null", () => {
    const prompt = makePrompt();
    const promptEval = makePromptEval();
    mockStore({ prompt, evaluation: promptEval, blueprintEval: null });

    render(<AnalysisPanel />);

    // Blueprint evaluation heading must NOT be present
    expect(
      screen.queryByText("Blueprint Quality Score"),
    ).not.toBeInTheDocument();
    // But prompt analysis IS shown (prompt has evaluation)
    expect(screen.getByText("Qualitätsanalyse")).toBeInTheDocument();
  });

  // --- RT-003: BlueprintEvaluationPanel does NOT render when evaluation undefined ---

  it("does NOT render BlueprintEvaluationPanel when evaluation is undefined", () => {
    const prompt = makePrompt();
    const promptEval = makePromptEval();
    mockStore({
      prompt,
      evaluation: promptEval,
      blueprintEval: undefined as unknown as null,
    });

    render(<AnalysisPanel />);

    expect(
      screen.queryByText("Blueprint Quality Score"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Qualitätsanalyse")).toBeInTheDocument();
  });

  // --- RT-004: Existing prompt analysis renders alongside blueprint evaluation ---

  it("renders existing prompt analysis alongside blueprint evaluation", () => {
    const prompt = makePrompt();
    const promptEval = makePromptEval();
    const bpEval = makeBlueprintEval();
    mockStore({ prompt, evaluation: promptEval, blueprintEval: bpEval });

    render(<AnalysisPanel />);

    // Both sections should be visible simultaneously
    expect(screen.getByText("Blueprint Quality Score")).toBeInTheDocument();
    expect(screen.getByText("Qualitätsanalyse")).toBeInTheDocument();
    expect(screen.getByText("Gesamtwertung")).toBeInTheDocument();
  });

  // --- RT-005: BlueprintEvaluationPanel surfaces dimension data ---

  it("renders blueprint evaluation dimensions", () => {
    const prompt = makePrompt();
    const bpEval = makeBlueprintEval();
    mockStore({ prompt, blueprintEval: bpEval });

    render(<AnalysisPanel />);

    // Dimension names should appear (use getAllByText since prompt eval may also have some)
    expect(screen.getByText("Dimension Scores")).toBeInTheDocument();
    // Dimension labels are rendered inside MiniScoreBar
    const goalElements = screen.getAllByText("Goal Clarity");
    expect(goalElements.length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Scope Sharpness").length,
    ).toBeGreaterThanOrEqual(1);
  });

  // --- RT-006: BlueprintEvaluationPanel shows strengths and warnings ---

  it("renders strengths and warnings from evaluation", () => {
    const prompt = makePrompt();
    const bpEval = makeBlueprintEval();
    mockStore({ prompt, blueprintEval: bpEval });

    render(<AnalysisPanel />);

    // Strengths and warnings headings
    expect(screen.getByText(/Strengths/)).toBeInTheDocument();
    expect(screen.getByText(/Warnings/)).toBeInTheDocument();
  });

  // --- RT-007: Empty arrays don't crash ---

  it("does not crash when strengths/warnings/missing are empty", () => {
    const prompt = makePrompt();
    const bpEval = makeBlueprintEval({
      strengths: [],
      warnings: [],
      missing_elements: [],
      suggested_improvements: [],
    });
    mockStore({ prompt, blueprintEval: bpEval });

    // Should render without throwing
    const { container } = render(<AnalysisPanel />);
    expect(container).toBeTruthy();
    // Blueprint evaluation section renders (Strengths section hidden when 0 items)
    expect(screen.getByText("Blueprint Quality Score")).toBeInTheDocument();
  });

  // --- RT-008: Negative/NaN/out-of-range scores don't crash ---

  it("handles edge case scores without crashing", () => {
    const prompt = makePrompt();
    const bpEval = makeBlueprintEval({
      overall_score: -10,
      confidence: 1.5,
    });
    mockStore({ prompt, blueprintEval: bpEval });

    const { container } = render(<AnalysisPanel />);
    expect(container).toBeTruthy();
    // CircularScore clamps to 0-100, so score 0 should be displayed
    // The panel renders, even with edge case scores
    expect(screen.getByText("Blueprint Quality Score")).toBeInTheDocument();
  });

  // --- RT-009: Suggested improvements with priority ---

  it("renders suggested improvements section", () => {
    const prompt = makePrompt();
    const bpEval = makeBlueprintEval();
    mockStore({ prompt, blueprintEval: bpEval });

    render(<AnalysisPanel />);

    expect(screen.getByText(/Suggested Improvements/)).toBeInTheDocument();
  });

  // --- RT-010: No original content or secret leaks ---

  it("does NOT render original prompt content in blueprint evaluation", () => {
    const prompt = makePrompt({ content: "API_KEY=secret123 token=abc" });
    const bpEval = makeBlueprintEval();
    mockStore({ prompt, blueprintEval: bpEval });

    render(<AnalysisPanel />);

    // The blueprint evaluation panel does NOT render the content string
    expect(screen.queryByText("API_KEY=secret123")).not.toBeInTheDocument();
    expect(screen.queryByText("token=abc")).not.toBeInTheDocument();
  });

  // --- RT-011: Blueprint evaluation null — existing analysis still renders ---

  it("renders existing prompt analysis when no blueprint evaluation and prompt has eval", () => {
    const prompt = makePrompt();
    const promptEval = makePromptEval();
    mockStore({ prompt, evaluation: promptEval, blueprintEval: null });

    render(<AnalysisPanel />);

    // Prompt evaluation sections visible
    expect(screen.getByText("Qualitätsanalyse")).toBeInTheDocument();
    expect(screen.getByText("Gesamtwertung")).toBeInTheDocument();
    expect(screen.getByText("Empfehlungen")).toBeInTheDocument();
    // Blueprint NOT present
    expect(
      screen.queryByText("Blueprint Quality Score"),
    ).not.toBeInTheDocument();
  });

  // --- RT-012: Blueprint eval present even without prompt eval ---

  it("shows BlueprintEvaluationPanel when only blueprint eval exists (no prompt eval)", () => {
    const prompt = makePrompt();
    const bpEval = makeBlueprintEval();
    mockStore({
      prompt,
      evaluation: null,
      hygiene: null,
      contextEval: null,
      blueprintEval: bpEval,
    });

    render(<AnalysisPanel />);

    // Blueprint evaluation IS shown (guard now allows blueprintEval to pass through)
    expect(screen.getByText("Blueprint Quality Score")).toBeInTheDocument();
  });

  // --- RT-013: Confidence edge case — 100% ---

  it("renders 100% confidence correctly", () => {
    const prompt = makePrompt();
    const bpEval = makeBlueprintEval({ confidence: 1.0 });
    mockStore({ prompt, blueprintEval: bpEval });

    render(<AnalysisPanel />);

    // Confidence renders as "100% confidence" in the badge span
    expect(screen.getByText("100% confidence")).toBeInTheDocument();
  });

  // --- RT-014: Score 100 renders correct color ---

  it("renders score 100 with score-high class", () => {
    const prompt = makePrompt();
    const bpEval = makeBlueprintEval({ overall_score: 100 });
    mockStore({ prompt, blueprintEval: bpEval });

    render(<AnalysisPanel />);

    // Score 100 should render in the circular-score-value span
    const scoreValues = screen.getAllByText("100");
    // At least one of them should have the score-high class
    const scoreHighElement = scoreValues.find((el) =>
      el.className.includes("score-high"),
    );
    expect(scoreHighElement).toBeTruthy();
  });
});
