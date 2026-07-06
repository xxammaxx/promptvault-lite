// =============================================================================
// PromptVault Lite — Paste Prompt Analyzer Component Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PastePromptAnalyzer } from "../PastePromptAnalyzer";

// =============================================================================
// Mocks
// =============================================================================

vi.mock("@/lib/pastePromptAnalysis", () => ({
  analyzePastedPrompt: vi.fn(
    (input: {
      content: string;
    }):
      | import("@/lib/pastePromptAnalysis").PastePromptAnalysisResult
      | import("@/lib/pastePromptAnalysis").PasteValidationError => {
      const trimmed = input.content.trim();

      if (trimmed.length === 0) {
        return {
          type: "VALIDATION_ERROR" as const,
          message: "Bitte füge einen Prompt-Text ein.",
        };
      }

      return {
        contentLength: trimmed.length,
        persisted: false,
        warnings:
          trimmed.length > 50000
            ? [
                `Der eingefügte Text ist sehr lang (${trimmed.length.toLocaleString()} Zeichen).`,
              ]
            : [],
        contentClass: {
          content_class: "PROMPT",
          blueprint_type: null,
          contamination_status: "CLEAN",
          confidence: 0.8,
          tags: ["AGENT_PROMPT"],
          reasons: ["Content is a task prompt."],
          prompt_signals: ["role_definition"],
          blueprint_signals: [],
          guideline_signals: [],
          contamination_signals: [],
        },
        contextEvaluation: {
          detected_prompt_type: "structured_prompt",
          detected_context_profile: "moderate",
          prompt_engineering_score: 70,
          context_engineering_score: 60,
          agent_readiness_score: 0,
          robustness_score: 80,
          overall_score: 68,
          risk_flags: [],
          suggested_improvements: [],
          criteria: [],
          strengths: [],
          warnings: [],
          missing_elements: [],
          confidence: 0.8,
          evaluated_at: new Date().toISOString(),
        },
        blueprintEvaluation: null,
      };
    },
  ),
}));

// =============================================================================
// Helper: find button by partial text content (handles emoji prefix)
// =============================================================================

function getButtonByLabel(label: string): HTMLElement {
  const buttons = screen.getAllByRole("button");
  const found = buttons.find((btn) => btn.textContent?.includes(label));
  if (!found) {
    throw new Error(`Button with label "${label}" not found`);
  }
  return found;
}

// =============================================================================
// Tests
// =============================================================================

describe("PastePromptAnalyzer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- UI elements ---

  it("renders the panel header", () => {
    render(<PastePromptAnalyzer />);
    expect(screen.getByText("Direktanalyse")).toBeInTheDocument();
  });

  it("renders the textarea", () => {
    render(<PastePromptAnalyzer />);
    expect(
      screen.getByPlaceholderText(/Füge deinen Prompt-Text hier ein/i),
    ).toBeInTheDocument();
  });

  it("renders the clipboard button", () => {
    render(<PastePromptAnalyzer />);
    expect(getButtonByLabel("Aus Zwischenablage einfügen")).toBeInTheDocument();
  });

  it("renders the analyze button", () => {
    render(<PastePromptAnalyzer />);
    expect(getButtonByLabel("Analysieren")).toBeInTheDocument();
  });

  it("renders the clear button", () => {
    render(<PastePromptAnalyzer />);
    expect(getButtonByLabel("Leeren")).toBeInTheDocument();
  });

  it("shows the no-file-required hint", () => {
    render(<PastePromptAnalyzer />);
    const hints = screen.getAllByText(/Keine Datei erforderlich/i);
    expect(hints.length).toBeGreaterThanOrEqual(1);
  });

  it("shows the not-saved notice in the header", () => {
    render(<PastePromptAnalyzer />);
    expect(
      screen.getByText(/nicht automatisch gespeichert/i),
    ).toBeInTheDocument();
  });

  // --- Textarea interaction ---

  it("allows typing into the textarea", () => {
    render(<PastePromptAnalyzer />);
    const textarea = screen.getByPlaceholderText(
      /Füge deinen Prompt-Text hier ein/i,
    );
    fireEvent.change(textarea, {
      target: { value: "Test prompt content" },
    });
    expect(textarea).toHaveValue("Test prompt content");
  });

  // --- Analyze button ---

  it("shows error when analyzing empty input", async () => {
    render(<PastePromptAnalyzer />);
    fireEvent.click(getButtonByLabel("Analysieren"));

    await waitFor(() => {
      expect(
        screen.getByText(/füge einen Prompt-Text ein/i),
      ).toBeInTheDocument();
    });
  });

  it("analyses valid input and shows results", async () => {
    render(<PastePromptAnalyzer />);
    const textarea = screen.getByPlaceholderText(
      /Füge deinen Prompt-Text hier ein/i,
    );

    fireEvent.change(textarea, {
      target: { value: "A test prompt for analysis." },
    });
    fireEvent.click(getButtonByLabel("Analysieren"));

    await waitFor(() => {
      expect(screen.getByText("Klassifikation")).toBeInTheDocument();
    });
  });

  // --- Clear button ---

  it("clears text and resets state when clear is clicked", async () => {
    render(<PastePromptAnalyzer />);
    const textarea = screen.getByPlaceholderText(
      /Füge deinen Prompt-Text hier ein/i,
    );

    fireEvent.change(textarea, {
      target: { value: "Test content" },
    });
    fireEvent.click(getButtonByLabel("Analysieren"));

    await waitFor(() => {
      expect(screen.getByText("Klassifikation")).toBeInTheDocument();
    });

    fireEvent.click(getButtonByLabel("Leeren"));

    expect(textarea).toHaveValue("");
    // Should show idle state again
    expect(screen.getByText(/klicke auf/i)).toBeInTheDocument();
  });

  // --- Clipboard button (simulating unavailable API) ---

  it("shows fallback message when clipboard API is unavailable", async () => {
    const originalClipboard = navigator.clipboard;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    delete (navigator as any).clipboard;

    render(<PastePromptAnalyzer />);
    fireEvent.click(getButtonByLabel("Aus Zwischenablage einfügen"));

    await waitFor(() => {
      expect(
        screen.getByText(/konnte nicht gelesen werden/i),
      ).toBeInTheDocument();
    });

    // Restore
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  // --- Clipboard button (successful read) ---

  it("fills textarea on successful clipboard read", async () => {
    const mockReadText = vi.fn().mockResolvedValue("Clipboard content here.");
    Object.defineProperty(navigator, "clipboard", {
      value: { readText: mockReadText },
      writable: true,
      configurable: true,
    });

    render(<PastePromptAnalyzer />);
    fireEvent.click(getButtonByLabel("Aus Zwischenablage einfügen"));

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(
        /Füge deinen Prompt-Text hier ein/i,
      );
      expect(textarea).toHaveValue("Clipboard content here.");
    });
  });

  // --- Clipboard button (rejected) ---

  it("shows fallback when clipboard read is rejected", async () => {
    const mockReadText = vi
      .fn()
      .mockRejectedValue(new Error("Permission denied"));
    Object.defineProperty(navigator, "clipboard", {
      value: { readText: mockReadText },
      writable: true,
      configurable: true,
    });

    render(<PastePromptAnalyzer />);
    fireEvent.click(getButtonByLabel("Aus Zwischenablage einfügen"));

    await waitFor(() => {
      expect(
        screen.getByText(/konnte nicht gelesen werden/i),
      ).toBeInTheDocument();
    });
  });

  // --- Results display ---

  it("shows classification result after analysis", async () => {
    render(<PastePromptAnalyzer />);
    const textarea = screen.getByPlaceholderText(
      /Füge deinen Prompt-Text hier ein/i,
    );

    fireEvent.change(textarea, {
      target: { value: "A test content for analysis" },
    });
    fireEvent.click(getButtonByLabel("Analysieren"));

    await waitFor(() => {
      expect(
        screen.getByText("Prompt & Context Engineering"),
      ).toBeInTheDocument();
    });
  });
});
