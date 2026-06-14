import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
  EvaluationCriterion,
  DetectedArtifact,
} from "@/types";

describe("AnalysisPanel", () => {
  const mockAnalyzeSelected = vi.fn();

  // Helper: build mock store state
  function mockStore(overrides: {
    prompt?: PromptItem | null;
    evaluation?: PromptEvaluation | null;
    hygiene?: PromptHygiene | null;
    contextEval?: PromptContextEvaluation | null;
    isAnalyzing?: boolean;
  }) {
    const {
      prompt = null,
      evaluation = null,
      hygiene = null,
      contextEval = null,
      isAnalyzing = false,
    } = overrides;

    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: unknown) => unknown) => {
        const state = {
          selectedPrompt: () => prompt,
          selectedEvaluation: () => evaluation,
          selectedHygiene: () => hygiene,
          selectedContextEvaluation: () => contextEval,
          isAnalyzing,
          analyzeSelected: mockAnalyzeSelected,
        };
        return selector(state);
      },
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- AC-1: No selected prompt ---

  it("shows empty state when no prompt is selected", () => {
    mockStore({ prompt: null });

    render(<AnalysisPanel />);

    expect(screen.getByText("Keine Analyse verfügbar.")).toBeInTheDocument();
    expect(
      screen.getByText(/Wähle einen Prompt und klicke auf »Analysieren«/),
    ).toBeInTheDocument();
  });

  // --- AC-2: Prompt selected but not analyzed ---

  it('shows "not yet analyzed" state with analyze button when prompt exists but no evaluation', () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test Prompt",
      description: "A test",
      category: "testing",
      version: "1.0",
      tags: [],
      content: "Test content",
      raw_frontmatter: {},
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      is_favorite: false,
    };

    mockStore({ prompt: mockPrompt, evaluation: null });

    render(<AnalysisPanel />);

    expect(screen.getByText("Noch nicht analysiert.")).toBeInTheDocument();
    expect(screen.getByText("Jetzt analysieren")).toBeInTheDocument();
  });

  it("calls analyzeSelected when the analyze button is clicked", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    mockStore({ prompt: mockPrompt, evaluation: null });

    render(<AnalysisPanel />);

    fireEvent.click(screen.getByText("Jetzt analysieren"));
    expect(mockAnalyzeSelected).toHaveBeenCalledTimes(1);
  });

  // --- AC-3: Loading spinner ---

  it("shows loading spinner when analyzing", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    mockStore({ prompt: mockPrompt, isAnalyzing: true });

    render(<AnalysisPanel />);

    expect(screen.getByText("Analysiere...")).toBeInTheDocument();
  });

  // --- AC-4: Evaluation display ---

  it("shows overall quality score with correct color class", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    const mockEvaluation: PromptEvaluation = {
      id: "eval-1",
      prompt_id: "1",
      overall_score: 85,
      criteria: [],
      missing_sections: [],
      recommendations: [],
      evaluated_at: "2024-01-01",
    };

    mockStore({ prompt: mockPrompt, evaluation: mockEvaluation });

    render(<AnalysisPanel />);

    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("Gesamtwertung")).toBeInTheDocument();
    expect(screen.getByText("Qualitätsanalyse")).toBeInTheDocument();
    // Score 85 >= 70 → score-high on the circular score value
    const scoreEl = screen.getByText("85");
    expect(scoreEl.className).toContain("score-high");
  });

  it("shows score-medium for scores between 40 and 69", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    const mockEvaluation: PromptEvaluation = {
      id: "eval-1",
      prompt_id: "1",
      overall_score: 55,
      criteria: [],
      missing_sections: [],
      recommendations: [],
      evaluated_at: "2024-01-01",
    };

    mockStore({ prompt: mockPrompt, evaluation: mockEvaluation });

    render(<AnalysisPanel />);

    const scoreEl = screen.getByText("55");
    expect(scoreEl.className).toContain("score-medium");
  });

  it("shows score-low for scores below 40", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    const mockEvaluation: PromptEvaluation = {
      id: "eval-1",
      prompt_id: "1",
      overall_score: 25,
      criteria: [],
      missing_sections: [],
      recommendations: [],
      evaluated_at: "2024-01-01",
    };

    mockStore({ prompt: mockPrompt, evaluation: mockEvaluation });

    render(<AnalysisPanel />);

    const scoreEl = screen.getByText("25");
    expect(scoreEl.className).toContain("score-low");
  });

  // --- AC-5: Criteria list with score bars ---

  it("renders criteria with names, scores, and details", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    const criteria: EvaluationCriterion[] = [
      {
        name: "Clarity",
        score: 8,
        max_score: 10,
        weight: 1,
        details: "Good clarity",
      },
      {
        name: "Specificity",
        score: 5,
        max_score: 10,
        weight: 1,
        details: "Could be more specific",
      },
    ];

    const mockEvaluation: PromptEvaluation = {
      id: "eval-1",
      prompt_id: "1",
      overall_score: 80,
      criteria,
      missing_sections: [],
      recommendations: [],
      evaluated_at: "2024-01-01",
    };

    mockStore({ prompt: mockPrompt, evaluation: mockEvaluation });

    render(<AnalysisPanel />);

    expect(screen.getByText("Clarity")).toBeInTheDocument();
    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.getByText("Good clarity")).toBeInTheDocument();
    expect(screen.getByText("Specificity")).toBeInTheDocument();
    expect(screen.getByText("5/10")).toBeInTheDocument();
    expect(screen.getByText("Could be more specific")).toBeInTheDocument();
  });

  it("renders score bar with correct width percentage", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    const criteria: EvaluationCriterion[] = [
      {
        name: "Clarity",
        score: 7,
        max_score: 10,
        weight: 1,
        details: "OK",
      },
    ];

    const mockEvaluation: PromptEvaluation = {
      id: "eval-1",
      prompt_id: "1",
      overall_score: 80,
      criteria,
      missing_sections: [],
      recommendations: [],
      evaluated_at: "2024-01-01",
    };

    mockStore({ prompt: mockPrompt, evaluation: mockEvaluation });

    render(<AnalysisPanel />);

    // The bar should have width: 70% (7/10 * 100)
    const barFill = document.querySelector(".score-bar-fill") as HTMLElement;
    expect(barFill).not.toBeNull();
    expect(barFill.style.width).toBe("70%");
  });

  // --- AC-6: Hygiene display ---

  it("shows hygiene status badge for clean status", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    const evalBase: PromptEvaluation = {
      id: "eval-1",
      prompt_id: "1",
      overall_score: 85,
      criteria: [],
      missing_sections: [],
      recommendations: [],
      evaluated_at: "2024-01-01",
    };

    const mockHygiene: PromptHygiene = {
      id: "hyg-1",
      prompt_id: "1",
      hygiene_score: 95,
      status: "clean",
      artifacts: [],
      analyzed_at: "2024-01-01",
    };

    mockStore({
      prompt: mockPrompt,
      evaluation: evalBase,
      hygiene: mockHygiene,
    });

    render(<AnalysisPanel />);

    expect(screen.getByText("Hygieneanalyse")).toBeInTheDocument();
    expect(screen.getByText("✅ Sauber")).toBeInTheDocument();
    // Hygiene score display
    expect(screen.getByText("95")).toBeInTheDocument();
  });

  it("shows warning badge for warning status", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    const evalBase: PromptEvaluation = {
      id: "eval-1",
      prompt_id: "1",
      overall_score: 85,
      criteria: [],
      missing_sections: [],
      recommendations: [],
      evaluated_at: "2024-01-01",
    };

    const mockHygiene: PromptHygiene = {
      id: "hyg-2",
      prompt_id: "1",
      hygiene_score: 60,
      status: "warning",
      artifacts: [],
      analyzed_at: "2024-01-01",
    };

    mockStore({
      prompt: mockPrompt,
      evaluation: evalBase,
      hygiene: mockHygiene,
    });

    render(<AnalysisPanel />);

    expect(screen.getByText("⚠️ Warnung")).toBeInTheDocument();
  });

  it("shows critical badge for critical status", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    const evalBase: PromptEvaluation = {
      id: "eval-1",
      prompt_id: "1",
      overall_score: 85,
      criteria: [],
      missing_sections: [],
      recommendations: [],
      evaluated_at: "2024-01-01",
    };

    const mockHygiene: PromptHygiene = {
      id: "hyg-3",
      prompt_id: "1",
      hygiene_score: 20,
      status: "critical",
      artifacts: [],
      analyzed_at: "2024-01-01",
    };

    mockStore({
      prompt: mockPrompt,
      evaluation: evalBase,
      hygiene: mockHygiene,
    });

    render(<AnalysisPanel />);

    expect(screen.getByText("🔴 Kritisch")).toBeInTheDocument();
  });

  // --- AC-7: Artifact list ---

  it("renders artifact list with category, severity, match, and replacement", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    const evalBase: PromptEvaluation = {
      id: "eval-1",
      prompt_id: "1",
      overall_score: 85,
      criteria: [],
      missing_sections: [],
      recommendations: [],
      evaluated_at: "2024-01-01",
    };

    const artifacts: DetectedArtifact[] = [
      {
        id: "a1",
        category: "FILE_PATH",
        severity: "info",
        match: "/home/user/config.json",
        line: 1,
        column: 10,
        replacement_suggestion: null,
      },
      {
        id: "a2",
        category: "SECRET",
        severity: "critical",
        match: "sk-abc123def456",
        line: 3,
        column: 1,
        replacement_suggestion: "[REDACTED]",
      },
    ];

    const mockHygiene: PromptHygiene = {
      id: "hyg-4",
      prompt_id: "1",
      hygiene_score: 40,
      status: "critical",
      artifacts,
      analyzed_at: "2024-01-01",
    };

    mockStore({
      prompt: mockPrompt,
      evaluation: evalBase,
      hygiene: mockHygiene,
    });

    render(<AnalysisPanel />);

    expect(screen.getByText("Gefundene Artefakte (2)")).toBeInTheDocument();
    // Artifact categories
    expect(screen.getByText("FILE_PATH")).toBeInTheDocument();
    expect(screen.getByText("SECRET")).toBeInTheDocument();
    // Matches
    expect(screen.getByText("/home/user/config.json")).toBeInTheDocument();
    expect(screen.getByText("sk-abc123def456")).toBeInTheDocument();
    // Replacement suggestion
    expect(screen.getByText("→ [REDACTED]")).toBeInTheDocument();
    // Severity icons
    expect(screen.getByText("ℹ️")).toBeInTheDocument();
    expect(screen.getByText("🔴")).toBeInTheDocument();
  });

  it("does not render artifact list when no artifacts exist", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    const evalBase: PromptEvaluation = {
      id: "eval-1",
      prompt_id: "1",
      overall_score: 85,
      criteria: [],
      missing_sections: [],
      recommendations: [],
      evaluated_at: "2024-01-01",
    };

    const mockHygiene: PromptHygiene = {
      id: "hyg-5",
      prompt_id: "1",
      hygiene_score: 100,
      status: "clean",
      artifacts: [],
      analyzed_at: "2024-01-01",
    };

    mockStore({
      prompt: mockPrompt,
      evaluation: evalBase,
      hygiene: mockHygiene,
    });

    render(<AnalysisPanel />);

    expect(screen.queryByText(/Gefundene Artefakte/)).not.toBeInTheDocument();
  });

  // --- AC-8: Recommendations ---

  it("renders recommendations list when evaluation has recommendations", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    const mockEvaluation: PromptEvaluation = {
      id: "eval-1",
      prompt_id: "1",
      overall_score: 70,
      criteria: [],
      missing_sections: [],
      recommendations: [
        "Add more context",
        "Improve specificity",
        "Remove ambiguous language",
      ],
      evaluated_at: "2024-01-01",
    };

    mockStore({ prompt: mockPrompt, evaluation: mockEvaluation });

    render(<AnalysisPanel />);

    expect(screen.getByText("Empfehlungen")).toBeInTheDocument();
    expect(screen.getByText("Add more context")).toBeInTheDocument();
    expect(screen.getByText("Improve specificity")).toBeInTheDocument();
    expect(screen.getByText("Remove ambiguous language")).toBeInTheDocument();
  });

  it("does not render recommendations when list is empty", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    const mockEvaluation: PromptEvaluation = {
      id: "eval-1",
      prompt_id: "1",
      overall_score: 85,
      criteria: [],
      missing_sections: [],
      recommendations: [],
      evaluated_at: "2024-01-01",
    };

    mockStore({ prompt: mockPrompt, evaluation: mockEvaluation });

    render(<AnalysisPanel />);

    expect(screen.queryByText("Empfehlungen")).not.toBeInTheDocument();
  });

  // --- Edge case: hygiene without evaluation ---

  it("shows hygiene section even when evaluation is not present", () => {
    const mockPrompt: PromptItem = {
      id: "1",
      file_path: "/test.md",
      file_name: "test.md",
      title: "Test",
      description: "",
      category: "test",
      version: "1",
      tags: [],
      content: "",
      raw_frontmatter: {},
      created_at: "",
      updated_at: "",
      is_favorite: false,
    };

    const mockHygiene: PromptHygiene = {
      id: "hyg-6",
      prompt_id: "1",
      hygiene_score: 90,
      status: "clean",
      artifacts: [],
      analyzed_at: "2024-01-01",
    };

    mockStore({
      prompt: mockPrompt,
      evaluation: null,
      hygiene: mockHygiene,
    });

    render(<AnalysisPanel />);

    expect(screen.getByText("Hygieneanalyse")).toBeInTheDocument();
    expect(screen.queryByText("Qualitätsanalyse")).not.toBeInTheDocument();
  });

  // --- AC-9: CircularScore clamping (Finding 3) ---

  describe("CircularScore clamping", () => {
    function promptWithScore(overallScore: number) {
      const mockPrompt: PromptItem = {
        id: "1",
        file_path: "/test.md",
        file_name: "test.md",
        title: "Test",
        description: "",
        category: "test",
        version: "1",
        tags: [],
        content: "",
        raw_frontmatter: {},
        created_at: "",
        updated_at: "",
        is_favorite: false,
      };

      const mockEvaluation: PromptEvaluation = {
        id: "eval-1",
        prompt_id: "1",
        overall_score: overallScore,
        criteria: [],
        missing_sections: [],
        recommendations: [],
        evaluated_at: "2024-01-01",
      };

      mockStore({ prompt: mockPrompt, evaluation: mockEvaluation });
    }

    it("clamps negative score (-10) to 0", () => {
      promptWithScore(-10);

      render(<AnalysisPanel />);

      // Should display 0, not -10
      const scoreEl = screen.getByText("0");
      expect(scoreEl).toBeInTheDocument();
      expect(scoreEl.className).toContain("score-low");
      expect(screen.queryByText("-10")).not.toBeInTheDocument();
    });

    it("clamps score above 100 (150) to 100", () => {
      promptWithScore(150);

      render(<AnalysisPanel />);

      // Should display 100, not 150
      const scoreEl = screen.getByText("100");
      expect(scoreEl).toBeInTheDocument();
      expect(scoreEl.className).toContain("score-high");
      expect(screen.queryByText("150")).not.toBeInTheDocument();
    });

    it("preserves score=0 correctly (edge boundary)", () => {
      promptWithScore(0);

      render(<AnalysisPanel />);

      const scoreEl = screen.getByText("0");
      expect(scoreEl).toBeInTheDocument();
      expect(scoreEl.className).toContain("score-low");
    });

    it("preserves score=100 correctly (edge boundary)", () => {
      promptWithScore(100);

      render(<AnalysisPanel />);

      const scoreEl = screen.getByText("100");
      expect(scoreEl).toBeInTheDocument();
      expect(scoreEl.className).toContain("score-high");
    });

    it("preserves normal score 55 in [0,100] range", () => {
      promptWithScore(55);

      render(<AnalysisPanel />);

      const scoreEl = screen.getByText("55");
      expect(scoreEl).toBeInTheDocument();
      expect(scoreEl.className).toContain("score-medium");
    });
  });
});
