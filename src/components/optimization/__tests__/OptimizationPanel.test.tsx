import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OptimizationPanel } from "../OptimizationPanel";

// Mock the optimizer to return predictable results
vi.mock("@/lib/promptOptimizer", () => ({
  optimizePrompt: vi.fn((input: string, mode: string) => ({
    original: input,
    optimized: `[${mode}] ${input}`,
    changes: [
      {
        type: "structure",
        description: `Applied ${mode} mode`,
      },
    ],
    warnings: input.length < 10 ? ["Input is very short"] : [],
  })),
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

const mockPromptContent =
  "This is a test prompt for optimization.\n\nIt has multiple lines.";

describe("OptimizationPanel", () => {
  const onClose = vi.fn();
  const defaultProps = {
    promptContent: mockPromptContent,
    onClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Helper: selects a mode radio button by label text */
  const selectMode = (modeLabel: string) => {
    const option = screen.getByText(modeLabel, { selector: "span" });
    const radio = option.closest("label")?.querySelector("input");
    if (radio) fireEvent.click(radio);
  };

  describe("rendering", () => {
    it("renders the modal with title", () => {
      render(<OptimizationPanel {...defaultProps} />);
      // Use getByRole to target the h2 specifically (not the legend)
      expect(screen.getByRole("heading", { name: /Optimier/i })).toBeTruthy();
    });

    it("renders mode selector with three options", () => {
      render(<OptimizationPanel {...defaultProps} />);
      expect(screen.getByText("Conservative")).toBeTruthy();
      expect(screen.getByText("Balanced")).toBeTruthy();
      expect(screen.getByText("Aggressive")).toBeTruthy();
    });

    it("shows before and after sections after mode selection", () => {
      render(<OptimizationPanel {...defaultProps} />);
      // Select a mode to trigger result rendering
      selectMode("Conservative");
      expect(screen.getByText("Vorher")).toBeTruthy();
      expect(screen.getByText("Optimiert")).toBeTruthy();
    });

    it("disables copy button when no optimization has been performed", () => {
      render(<OptimizationPanel {...defaultProps} />);
      // Copy button should be disabled before any mode is selected
      const copyButton = screen
        .getByText(/Ergebnis kopieren/i)
        .closest("button");
      expect(copyButton).toBeDisabled();
    });

    it("renders close button", () => {
      render(<OptimizationPanel {...defaultProps} />);
      expect(screen.getByText("Schließen")).toBeTruthy();
    });
  });

  describe("interactions", () => {
    it("enables copy button after optimization", () => {
      render(<OptimizationPanel {...defaultProps} />);
      selectMode("Conservative");

      const copyButton = screen
        .getByText(/Ergebnis kopieren/i)
        .closest("button");
      expect(copyButton).not.toBeDisabled();
    });

    it("calls onClose when close button is clicked", () => {
      render(<OptimizationPanel {...defaultProps} />);
      const closeButton = screen.getByText("Schließen");
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });

    it("switches optimization result when mode changes", () => {
      render(<OptimizationPanel {...defaultProps} />);

      // Start with conservative
      selectMode("Conservative");
      expect(screen.getByText(/\[conservative\]/)).toBeTruthy();

      // Switch to aggressive
      selectMode("Aggressive");
      expect(screen.getByText(/\[aggressive\]/)).toBeTruthy();
    });

    it("shows warning when prompt is short", () => {
      render(<OptimizationPanel promptContent="Hi" onClose={onClose} />);
      selectMode("Conservative");
      expect(screen.getByText(/short/i)).toBeTruthy();
    });
  });

  describe("original prompt protection", () => {
    it("displays original prompt content after mode selection", () => {
      render(<OptimizationPanel {...defaultProps} />);
      selectMode("Conservative");
      // Original is in a <pre> element inside the first diff pane
      const preElements = document.querySelectorAll(".optimizer-diff-content");
      expect(preElements.length).toBeGreaterThanOrEqual(2);
      expect(preElements[0].textContent).toContain(
        "test prompt for optimization",
      );
    });

    it("does not alter original when optimizing", () => {
      render(<OptimizationPanel {...defaultProps} />);
      selectMode("Conservative");
      // Original text should appear unmodified (first pane = Vorher)
      const preElements = document.querySelectorAll(".optimizer-diff-content");
      expect(preElements[0].textContent).toBe(mockPromptContent);
    });

    it("only copies optimized text, not original", () => {
      const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText");
      render(<OptimizationPanel {...defaultProps} />);

      selectMode("Conservative");

      const copyButton = screen
        .getByText(/Ergebnis kopieren/i)
        .closest("button");
      if (!copyButton) throw new Error("Copy button not found");
      fireEvent.click(copyButton);

      expect(writeTextSpy).toHaveBeenCalledWith(
        expect.stringContaining("[conservative]"),
      );
      expect(writeTextSpy).not.toHaveBeenCalledWith(mockPromptContent);
    });
  });

  describe("empty state", () => {
    it("renders empty state message when no prompt content", () => {
      render(<OptimizationPanel promptContent="" onClose={onClose} />);
      // Should not crash — just shows empty state
      const modal = document.querySelector(".modal-overlay");
      expect(modal).toBeTruthy();
      expect(screen.getByText(/Kein Prompt-Inhalt/i)).toBeTruthy();
    });
  });
});
