import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OptimizationPanel } from "../OptimizationPanel";

vi.mock("@/lib/promptOptimizer", () => ({
  optimizePrompt: vi.fn(() => ({
    original: [
      "## Rolle",
      "Du bist Senior Software Engineer.",
      "",
      "## Ziel",
      "Behebe den Bug.",
    ].join("\n"),
    optimized: [
      "## Rolle",
      "Du bist Senior Software Engineer.",
      "",
      "## Ziel",
      "Behebe den Bug.",
      "",
      "## Agenten-Workflow",
      "Issue -> Spec -> Red Tests -> Fix -> Review",
      "",
      "## Verification Contract",
      "- [ ] Tests gruen",
    ].join("\n"),
    changes: [
      {
        type: "add_section",
        description: 'Workflow-Sektion ergänzt: "## Agenten-Workflow"',
      },
      {
        type: "add_section",
        description: 'Workflow-Sektion ergänzt: "## Verification Contract"',
      },
    ],
    warnings: [],
  })),
}));

describe("OptimizationPanel screenshot regressions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a visible added-section preview when changes are appended below the fold", () => {
    render(
      <OptimizationPanel
        promptContent={[
          "## Rolle",
          "Du bist Senior Software Engineer.",
          "",
          "## Ziel",
          "Behebe den Bug.",
        ].join("\n")}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Aggressive/i));

    expect(
      screen.getByText(/Hinzugef(?:ü|ue)gte Abschnitte/i),
    ).toBeInTheDocument();
    expect(screen.getByText("## Agenten-Workflow")).toBeInTheDocument();
    expect(screen.getByText("## Verification Contract")).toBeInTheDocument();
  });
});
