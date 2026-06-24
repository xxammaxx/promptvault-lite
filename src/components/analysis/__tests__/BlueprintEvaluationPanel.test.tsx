import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { BlueprintEvaluationPanel } from "../BlueprintEvaluationPanel";
import type { BlueprintEvaluation } from "@/types";

// ---- Helpers ----

function makeEvaluation(
  overrides: Partial<BlueprintEvaluation> = {},
): BlueprintEvaluation {
  return {
    content_class: "BLUEPRINT",
    blueprint_type: "architecture_blueprint",
    contamination_status: "CLEAN",
    goal_clarity_score: 72,
    scope_sharpness_score: 65,
    architecture_score: 80,
    feasibility_score: 55,
    risk_coverage_score: 40,
    security_privacy_score: 90,
    testability_score: 30,
    evidence_readiness_score: 60,
    context_purity_score: 85,
    overall_score: 68,
    dimensions: [
      {
        dimension: "goal_clarity",
        name: "Goal Clarity",
        score: 2,
        max_score: 2,
        details: "Goal is well-defined and specific.",
      },
      {
        dimension: "scope_sharpness",
        name: "Scope Sharpness",
        score: 1,
        max_score: 2,
        details: "Scope could be sharper on deliverables.",
      },
      {
        dimension: "architecture",
        name: "Architecture Completeness",
        score: 2,
        max_score: 2,
        details: "Architecture is fully mapped out.",
      },
      {
        dimension: "feasibility",
        name: "Feasibility",
        score: 1,
        max_score: 2,
        details: "Some feasibility concerns remain.",
      },
      {
        dimension: "risk_coverage",
        name: "Risk Coverage",
        score: 1,
        max_score: 2,
        details: "Risk coverage is partial.",
      },
      {
        dimension: "security_privacy",
        name: "Security & Privacy",
        score: 2,
        max_score: 2,
        details: "Security considerations are extensive.",
      },
      {
        dimension: "testability",
        name: "Testability",
        score: 0,
        max_score: 2,
        details: "No test plan or verification strategy.",
      },
      {
        dimension: "evidence_readiness",
        name: "Evidence Readiness",
        score: 1,
        max_score: 2,
        details: "Evidence contracts present but incomplete.",
      },
      {
        dimension: "context_purity",
        name: "Context Purity",
        score: 2,
        max_score: 2,
        details: "Context is clean and well-scoped.",
      },
      {
        dimension: "next_step_clarity",
        name: "Next Step Clarity",
        score: 1,
        max_score: 2,
        details: "Next steps are partially defined.",
      },
    ],
    strengths: [
      "Well-structured sections",
      "Clear goal definition",
      "Strong security mitigation plan",
    ],
    warnings: [
      "Missing test verification section",
      "Scope boundaries are fuzzy",
    ],
    missing_elements: [
      "Deployment rollback plan",
      "Data migration strategy",
      "Monitoring and alerting section",
    ],
    suggested_improvements: [
      {
        dimension: "testability",
        criterion: "test_plan",
        message: "Add a test plan with concrete verification steps.",
        priority: "high",
      },
      {
        dimension: "scope_sharpness",
        criterion: "scope_boundary",
        message: "Define explicit in-scope / out-of-scope boundaries.",
        priority: "medium",
      },
      {
        dimension: "risk_coverage",
        criterion: "risk_matrix",
        message: "Add a risk matrix for remaining concerns.",
        priority: "medium",
      },
      {
        dimension: "evidence_readiness",
        criterion: "evidence_contract",
        message: "Complete evidence contracts for each section.",
        priority: "low",
      },
    ],
    confidence: 0.82,
    evaluated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---- Tests ----

describe("BlueprintEvaluationPanel", () => {
  // ── 1. Null / empty state ──

  it("renders nothing when evaluation is null", () => {
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={null} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when evaluation is undefined", () => {
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={undefined as unknown as null} />,
    );
    expect(container.innerHTML).toBe("");
  });

  // ── 2. Overall Score ──

  it("renders overall score as circular gauge", () => {
    const eval_ = makeEvaluation({ overall_score: 68 });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("Overall Blueprint Score");
    const svgCircle = container.querySelector("svg circle");
    expect(svgCircle).not.toBeNull();
    expect(container.textContent).toContain("68");
  });

  // ── 3. Blueprint Type Badge ──

  it("renders blueprint_type badge", () => {
    const eval_ = makeEvaluation({ blueprint_type: "security_blueprint" });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("Security");
  });

  it("does not render blueprint_type badge when type is null", () => {
    const eval_ = makeEvaluation({ blueprint_type: null });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    const header = container.querySelector(".blueprint-eval-header");
    expect(header?.textContent).toContain("Blueprint");
    expect(header?.textContent).not.toContain("Security");
    expect(header?.textContent).not.toContain("Architecture");
  });

  // ── 4. Confidence ──

  it("renders confidence percentage", () => {
    const eval_ = makeEvaluation({ confidence: 0.82 });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("82% confidence");
  });

  it("renders classification context with primary kind, tags, and reasons", () => {
    const eval_ = makeEvaluation({
      content_class: "PROMPT_BLUEPRINT_HYBRID",
      classification_tags: ["AGENT_PROMPT", "WORKFLOW"],
      classification_reasons: [
        "Structured agent-prompt headings detected.",
        "Workflow governance sections detected.",
      ],
    });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );

    expect(container.textContent).toContain("Primary Kind: PROMPT_BLUEPRINT_HYBRID");
    expect(container.textContent).toContain("AGENT_PROMPT");
    expect(container.textContent).toContain("WORKFLOW");
    expect(container.textContent).toContain(
      "Structured agent-prompt headings detected.",
    );
  });

  it("renders 0% when confidence is 0", () => {
    const eval_ = makeEvaluation({ confidence: 0 });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("0% confidence");
  });

  // ── 5. All 10 dimensions (detailed breakdown) ──

  it("renders all dimensions from the dimensions array", () => {
    const eval_ = makeEvaluation();
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("Goal Clarity");
    expect(container.textContent).toContain("Scope Sharpness");
    expect(container.textContent).toContain("Architecture Completeness");
    expect(container.textContent).toContain("Feasibility");
    expect(container.textContent).toContain("Risk Coverage");
    expect(container.textContent).toContain("Security & Privacy");
    expect(container.textContent).toContain("Testability");
    expect(container.textContent).toContain("Evidence Readiness");
    expect(container.textContent).toContain("Context Purity");
    expect(container.textContent).toContain("Next Step Clarity");
  });

  it("renders '10 dimensions' in the heading", () => {
    const eval_ = makeEvaluation();
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("10 dimensions");
  });

  // ── 6. Dimension scores ──

  it("renders dimension score values (x/y format)", () => {
    const eval_ = makeEvaluation();
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("2/2");
    expect(container.textContent).toContain("1/2");
    expect(container.textContent).toContain("0/2");
  });

  it("renders dimension detail text", () => {
    const eval_ = makeEvaluation();
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain(
      "Goal is well-defined and specific.",
    );
    expect(container.textContent).toContain(
      "No test plan or verification strategy.",
    );
  });

  // ── 7. Strengths ──

  it("renders strengths list", () => {
    const eval_ = makeEvaluation();
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("Strengths (3)");
    expect(container.textContent).toContain("Well-structured sections");
    expect(container.textContent).toContain("Clear goal definition");
    expect(container.textContent).toContain("Strong security mitigation plan");
  });

  // ── 8. Warnings ──

  it("renders warnings list", () => {
    const eval_ = makeEvaluation();
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("Warnings (2)");
    expect(container.textContent).toContain(
      "Missing test verification section",
    );
    expect(container.textContent).toContain("Scope boundaries are fuzzy");
  });

  // ── 9. Missing Elements ──

  it("renders missing elements list", () => {
    const eval_ = makeEvaluation();
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("Missing Elements (3)");
    expect(container.textContent).toContain("Deployment rollback plan");
    expect(container.textContent).toContain("Data migration strategy");
    expect(container.textContent).toContain("Monitoring and alerting section");
  });

  // ── 10. Suggested Improvements ──

  it("renders suggested improvements with priority classes", () => {
    const eval_ = makeEvaluation();
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("Suggested Improvements (4)");
    expect(container.querySelectorAll(".improvement-item")).toHaveLength(3);
    expect(container.textContent).toContain("Show all 4 improvements");
  });

  it("can expand to show all improvements", () => {
    const eval_ = makeEvaluation();
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.querySelectorAll(".improvement-item")).toHaveLength(3);

    const btn = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Show all"),
    );
    expect(btn).toBeDefined();
    if (btn) fireEvent.click(btn);

    expect(container.querySelectorAll(".improvement-item")).toHaveLength(4);
    expect(container.textContent).toContain("Show fewer");
  });

  it("renders priority-high class on high-priority improvement", () => {
    const eval_ = makeEvaluation();
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    const highPrioItem = container.querySelector(
      ".improvement-item.priority-high",
    );
    expect(highPrioItem).not.toBeNull();
    expect(highPrioItem?.textContent).toContain(
      "Add a test plan with concrete verification steps.",
    );
  });

  // ── 11. 9 Sub-scores as MiniScoreBars ──

  it("renders 9 sub-score MiniScoreBars", () => {
    const eval_ = makeEvaluation();
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    const miniBars = container.querySelectorAll(".context-mini-score");
    expect(miniBars.length).toBe(9);
  });

  it("renders Goal Clarity sub-score label", () => {
    const eval_ = makeEvaluation({ goal_clarity_score: 72 });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("Goal Clarity");
    expect(container.textContent).toContain("72");
  });

  // ── 12. Empty arrays do not crash ──

  it("does not crash with empty dimensions array", () => {
    const eval_ = makeEvaluation({ dimensions: [] });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).not.toContain("Detailed Breakdown");
    expect(container.textContent).toContain("Overall Blueprint Score");
  });

  it("does not crash with empty strengths", () => {
    const eval_ = makeEvaluation({ strengths: [] });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).not.toContain("Strengths");
  });

  it("does not crash with empty warnings", () => {
    const eval_ = makeEvaluation({ warnings: [] });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).not.toContain("Warnings");
  });

  it("does not crash with empty missing_elements", () => {
    const eval_ = makeEvaluation({ missing_elements: [] });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).not.toContain("Missing Elements");
  });

  it("does not crash with empty suggested_improvements", () => {
    const eval_ = makeEvaluation({ suggested_improvements: [] });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).not.toContain("Suggested Improvements");
  });

  // ── 13. Missing optional fields do not crash ──

  it("handles undefined confidence gracefully", () => {
    const eval_ = makeEvaluation({
      confidence: undefined as unknown as number,
    });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("0% confidence");
  });

  it("handles NaN overall_score gracefully", () => {
    const eval_ = makeEvaluation({ overall_score: NaN });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("handles negative overall_score gracefully", () => {
    const eval_ = makeEvaluation({ overall_score: -10 });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("0");
  });

  it("handles score above 100 gracefully", () => {
    const eval_ = makeEvaluation({ overall_score: 150 });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    expect(container.textContent).toContain("100");
  });

  // ── 14. No original content or secret values ──

  it("does not render any content field from evaluation", () => {
    const eval_ = makeEvaluation();
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    const html = container.innerHTML.toLowerCase();
    expect(html).not.toContain("api_key");
    expect(html).not.toContain("password");
    expect(html).not.toContain("token");
    expect(html).not.toContain("secret");
    expect(html).not.toContain("credential");
  });

  // ── 15. No store mutation or action calls ──

  it("is a pure display component — no side effects", () => {
    const eval_ = makeEvaluation();
    const { rerender } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    rerender(<BlueprintEvaluationPanel evaluation={eval_} />);
  });

  // ── 16. Score bar fill widths ──

  it("renders score bar fills with correct widths", () => {
    const eval_ = makeEvaluation();
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    const bars = container.querySelectorAll(".score-bar-fill");
    expect(bars.length).toBeGreaterThan(0);
    const fullBars = Array.from(bars).filter(
      (b) => (b as HTMLElement).style.width === "100%",
    );
    expect(fullBars.length).toBeGreaterThanOrEqual(1);
  });

  // ── 17. Score color classes applied ──

  it("applies score-high class to scores >= 70", () => {
    const eval_ = makeEvaluation({ overall_score: 85 });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    const scoreValue = container.querySelector(
      ".circular-score-value.score-high",
    );
    expect(scoreValue).not.toBeNull();
  });

  it("applies score-medium class to scores between 40-69", () => {
    const eval_ = makeEvaluation({ overall_score: 55 });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    const scoreValue = container.querySelector(
      ".circular-score-value.score-medium",
    );
    expect(scoreValue).not.toBeNull();
  });

  it("applies score-low class to scores < 40", () => {
    const eval_ = makeEvaluation({ overall_score: 25 });
    const { container } = render(
      <BlueprintEvaluationPanel evaluation={eval_} />,
    );
    const scoreValue = container.querySelector(
      ".circular-score-value.score-low",
    );
    expect(scoreValue).not.toBeNull();
  });
});
