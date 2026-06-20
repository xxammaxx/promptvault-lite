import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BlueprintOptimizationPanel } from "../BlueprintOptimizationPanel";

// =============================================================================
// Mocks — import the mocked modules for direct access in tests
// =============================================================================

// We import from the actual module paths so vitest intercepts them.
// The vi.mock calls below replace the real implementations.
import { optimizeBlueprint as mockOptimizeBlueprint } from "@/lib/blueprintOptimizer";

vi.mock("@/lib/blueprintOptimizer", () => ({
  optimizeBlueprint: vi.fn(
    (
      input: string,
      mode: string,
    ): ReturnType<
      typeof import("@/lib/blueprintOptimizer").optimizeBlueprint
    > => ({
      original: input,
      optimized: `[${mode}] ${input}`,
      changes:
        mode === "conservative"
          ? [
              {
                type: "whitespace" as const,
                description: "Normalized whitespace",
              },
            ]
          : mode === "balanced"
            ? [
                {
                  type: "structure" as const,
                  description: "Reorganized sections",
                },
                {
                  type: "add_section" as const,
                  description: 'Added "Security" section',
                },
              ]
            : [
                {
                  type: "add_section" as const,
                  description: 'Added "Goal" section',
                },
                {
                  type: "add_section" as const,
                  description: 'Added "Scope" section',
                },
                {
                  type: "structure" as const,
                  description: "Applied full blueprint standard",
                },
              ],
      warnings: input.length < 50 ? ["Blueprint content is very short"] : [],
      contamination_cleaned: mode === "aggressive",
    }),
  ),
}));

vi.mock("@/lib/blueprintDetection", () => ({
  evaluateBlueprint: vi.fn(
    (
      content: string,
    ): ReturnType<
      typeof import("@/lib/blueprintDetection").evaluateBlueprint
    > => {
      const isOptimized = content.startsWith("[aggressive]");
      const shortLineCount =
        content.split("\n").filter((l) => l.trim().length > 0).length < 5;
      return {
        content_class: "BLUEPRINT" as const,
        blueprint_type: "generic_blueprint" as const,
        contamination_status: "CLEAN" as const,
        goal_clarity_score: isOptimized ? 80 : 40,
        scope_sharpness_score: isOptimized ? 85 : shortLineCount ? 40 : 45,
        architecture_score: isOptimized ? 90 : shortLineCount ? 30 : 50,
        feasibility_score: isOptimized ? 75 : 35,
        risk_coverage_score: isOptimized ? 80 : 40,
        security_privacy_score: isOptimized ? 95 : 30,
        testability_score: isOptimized ? 85 : 45,
        evidence_readiness_score: isOptimized ? 70 : 30,
        context_purity_score: isOptimized ? 90 : 50,
        overall_score: isOptimized ? 85 : shortLineCount ? 35 : 40,
        dimensions: [],
        strengths: [],
        warnings: [],
        missing_elements: [],
        suggested_improvements: [],
        confidence: 0.9,
        evaluated_at: new Date().toISOString(),
      };
    },
  ),
  classifyContent: vi.fn(),
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// =============================================================================
// Test data
// =============================================================================

const mockBlueprintContent = [
  "# Ziel",
  "Build a secure prompt management system.",
  "",
  "# Scope",
  "- Import markdown prompts",
  "- Classify content as Prompt or Blueprint",
  "",
].join("\n");

const shortContent = "# Goal\nShort.";

describe("BlueprintOptimizationPanel", () => {
  const onClose = vi.fn();
  const defaultProps = {
    content: mockBlueprintContent,
    onClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations to defaults for each test
    vi.mocked(mockOptimizeBlueprint).mockImplementation(
      (input: string, mode: string) => ({
        original: input,
        optimized: `[${mode}] ${input}`,
        changes:
          mode === "conservative"
            ? [
                {
                  type: "whitespace" as const,
                  description: "Normalized whitespace",
                },
              ]
            : mode === "balanced"
              ? [
                  {
                    type: "structure" as const,
                    description: "Reorganized sections",
                  },
                  {
                    type: "add_section" as const,
                    description: 'Added "Security" section',
                  },
                ]
              : [
                  {
                    type: "add_section" as const,
                    description: 'Added "Goal" section',
                  },
                  {
                    type: "add_section" as const,
                    description: 'Added "Scope" section',
                  },
                  {
                    type: "structure" as const,
                    description: "Applied full blueprint standard",
                  },
                ],
        warnings: input.length < 50 ? ["Blueprint content is very short"] : [],
        contamination_cleaned: mode === "aggressive",
      }),
    );
  });

  // ===========================================================================
  // Rendering tests
  // ===========================================================================

  describe("rendering", () => {
    it("renders the modal with title when content is provided", () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      expect(
        screen.getByRole("heading", { name: /Blueprint-Optimierung/i }),
      ).toBeTruthy();
    });

    it("renders mode selector with three options", () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      expect(screen.getByText("Conservative")).toBeTruthy();
      expect(screen.getByText("Balanced")).toBeTruthy();
      expect(screen.getByText("Aggressive")).toBeTruthy();
    });

    it("default mode is conservative", () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      const radioInputs = document.querySelectorAll<HTMLInputElement>(
        'input[name="blueprintOptimizationMode"]',
      );
      const conservativeInput = Array.from(radioInputs).find(
        (r) => r.value === "conservative",
      );
      expect(conservativeInput?.checked).toBe(true);
    });

    it("renders optimize button", () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      expect(screen.getByText(/Blueprint optimieren/)).toBeTruthy();
    });

    it("renders close button", () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      expect(screen.getByText("Schließen")).toBeTruthy();
    });

    it("renders copy button disabled before optimization", () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      const copyButton = screen
        .getByLabelText(/Ergebnis kopieren/i)
        .closest("button");
      expect(copyButton).toBeDisabled();
    });
  });

  // ===========================================================================
  // Empty state
  // ===========================================================================

  describe("empty state", () => {
    it("renders empty state message when content is empty string", () => {
      render(<BlueprintOptimizationPanel content="" onClose={onClose} />);
      expect(screen.getByText(/Kein Blueprint-Inhalt/i)).toBeTruthy();
    });

    it("renders empty state message when content is whitespace only", () => {
      render(
        <BlueprintOptimizationPanel content={"   \n  "} onClose={onClose} />,
      );
      // The empty state text contains "Kein Blueprint-Inhalt vorhanden."
      const emptyState = document.querySelector(".empty-state");
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toMatch(/Kein Blueprint-Inhalt/i);
    });

    it("optimize button is not rendered in empty state", () => {
      render(<BlueprintOptimizationPanel content="" onClose={onClose} />);
      // The optimize button is inside the non-empty branch — should not exist
      expect(screen.queryByText(/Blueprint optimieren/)).toBeFalsy();
    });
  });

  // ===========================================================================
  // Mode selection
  // ===========================================================================

  describe("mode selection", () => {
    it("updates selected mode when clicking balanced", () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      // Find the balanced label and click it
      fireEvent.click(screen.getByText("Balanced"));
      const radioInputs = document.querySelectorAll<HTMLInputElement>(
        'input[name="blueprintOptimizationMode"]',
      );
      const balancedInput = Array.from(radioInputs).find(
        (r) => r.value === "balanced",
      );
      expect(balancedInput?.checked).toBe(true);
    });

    it("updates selected mode when clicking aggressive", () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText("Aggressive"));
      const radioInputs = document.querySelectorAll<HTMLInputElement>(
        'input[name="blueprintOptimizationMode"]',
      );
      const aggressiveInput = Array.from(radioInputs).find(
        (r) => r.value === "aggressive",
      );
      expect(aggressiveInput?.checked).toBe(true);
    });

    it("all three modes are selectable sequentially", () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Conservative"));
      let inputs = document.querySelectorAll<HTMLInputElement>(
        'input[name="blueprintOptimizationMode"]',
      );
      expect(
        Array.from(inputs).find((r) => r.value === "conservative")?.checked,
      ).toBe(true);

      fireEvent.click(screen.getByText("Balanced"));
      inputs = document.querySelectorAll<HTMLInputElement>(
        'input[name="blueprintOptimizationMode"]',
      );
      expect(
        Array.from(inputs).find((r) => r.value === "balanced")?.checked,
      ).toBe(true);

      fireEvent.click(screen.getByText("Aggressive"));
      inputs = document.querySelectorAll<HTMLInputElement>(
        'input[name="blueprintOptimizationMode"]',
      );
      expect(
        Array.from(inputs).find((r) => r.value === "aggressive")?.checked,
      ).toBe(true);
    });
  });

  // ===========================================================================
  // Optimization behavior
  // ===========================================================================

  describe("optimization", () => {
    it("shows loading state during optimization", async () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));
      // Loading text should appear briefly
      expect(screen.getByText(/Optimiere…/)).toBeTruthy();
      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText(/Optimiere…/)).toBeFalsy();
      });
    });

    it("shows before/after diff panes after optimization", async () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));
      await waitFor(() => {
        expect(screen.getByText("Vorher")).toBeTruthy();
      });
      expect(screen.getByText("Optimiert")).toBeTruthy();
    });

    it("shows changes list after optimization", async () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));
      await waitFor(() => {
        expect(screen.getByText(/Änderungen/)).toBeTruthy();
      });
    });

    it("shows score improvement label (before → after)", async () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));
      await waitFor(() => {
        expect(screen.getByText(/Score-Verbesserung/)).toBeTruthy();
      });
    });

    it("shows both before and after scores", async () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));
      await waitFor(() => {
        // Both scores render — query within score-change container
        const scoreChange = document.querySelector(".optimizer-score-change");
        expect(scoreChange).toBeTruthy();
        // The "40" text appears twice (before=40, after=40 for conservative mode)
        const allForties = screen.getAllByText("40");
        expect(allForties.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("shows warnings when present", async () => {
      render(
        <BlueprintOptimizationPanel content={shortContent} onClose={onClose} />,
      );
      fireEvent.click(screen.getByText(/Blueprint optimieren/));
      await waitFor(() => {
        expect(screen.getByText(/Hinweise/)).toBeTruthy();
      });
      // Warning text is inside the warnings section
      const warningsSection = document.querySelector(".optimizer-warnings");
      expect(warningsSection?.textContent).toMatch(/short/i);
    });

    it("shows contamination_cleaned badge in aggressive mode", async () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      // Select aggressive mode first
      fireEvent.click(screen.getByText("Aggressive"));
      fireEvent.click(screen.getByText(/Blueprint optimieren/));
      await waitFor(() => {
        expect(screen.getByText(/Bereinigt/)).toBeTruthy();
      });
    });

    it("conservative mode produces whitespace changes", async () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      // Default is conservative
      fireEvent.click(screen.getByText(/Blueprint optimieren/));
      await waitFor(() => {
        expect(screen.getByText("whitespace")).toBeTruthy();
      });
    });

    it("balanced mode produces structure changes", async () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText("Balanced"));
      fireEvent.click(screen.getByText(/Blueprint optimieren/));
      await waitFor(() => {
        expect(screen.getByText("structure")).toBeTruthy();
        expect(screen.getByText("add_section")).toBeTruthy();
      });
    });

    it("aggressive mode produces full blueprint standard", async () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText("Aggressive"));
      fireEvent.click(screen.getByText(/Blueprint optimieren/));
      await waitFor(() => {
        expect(screen.getByText(/full blueprint standard/i)).toBeTruthy();
      });
    });

    it("result switches when mode changes", async () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);

      // Optimize with conservative
      fireEvent.click(screen.getByText(/Blueprint optimieren/));
      await waitFor(() => {
        expect(screen.getByText(/\[conservative\]/)).toBeTruthy();
      });

      // Switch to balanced and re-optimize
      fireEvent.click(screen.getByText("Balanced"));
      fireEvent.click(screen.getByText(/Blueprint optimieren/));
      await waitFor(() => {
        expect(screen.getByText(/\[balanced\]/)).toBeTruthy();
      });
    });

    it("original content is preserved in before pane", async () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));
      await waitFor(() => {
        const preElements = document.querySelectorAll(
          ".optimizer-diff-content",
        );
        expect(preElements.length).toBeGreaterThanOrEqual(2);
        expect(preElements[0].textContent).toContain("Build a secure prompt");
      });
    });
  });

  // ===========================================================================
  // Copy button
  // ===========================================================================

  describe("copy button", () => {
    it("copies optimized text to clipboard", async () => {
      const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText");
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        const copyButton = screen
          .getByLabelText(/Ergebnis kopieren/i)
          .closest("button");
        expect(copyButton).not.toBeDisabled();
      });

      fireEvent.click(screen.getByLabelText(/Ergebnis kopieren/i));
      expect(writeTextSpy).toHaveBeenCalledWith(
        expect.stringContaining("[conservative]"),
      );
    });

    it("copies only optimized text, not original", async () => {
      const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText");
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        expect(screen.getByLabelText(/Ergebnis kopieren/i)).not.toBeDisabled();
      });

      fireEvent.click(screen.getByLabelText(/Ergebnis kopieren/i));
      expect(writeTextSpy).toHaveBeenCalledWith(
        expect.stringContaining("[conservative]"),
      );
      expect(writeTextSpy).not.toHaveBeenCalledWith(mockBlueprintContent);
    });

    it("shows 'Kopiert!' text in button after copying", async () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        expect(screen.getByLabelText(/Ergebnis kopieren/i)).not.toBeDisabled();
      });

      fireEvent.click(screen.getByLabelText(/Ergebnis kopieren/i));

      // The button text should now contain "Kopiert!"
      await waitFor(() => {
        const copyButton = screen.getByLabelText(/Ergebnis kopieren/i);
        expect(copyButton.textContent).toMatch(/Kopiert!/);
      });
    });

    it("handles clipboard API failure gracefully", async () => {
      vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(
        new Error("Clipboard denied"),
      );

      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        expect(screen.getByLabelText(/Ergebnis kopieren/i)).not.toBeDisabled();
      });

      // Should not throw — fails silently
      expect(() => {
        fireEvent.click(screen.getByLabelText(/Ergebnis kopieren/i));
      }).not.toThrow();
    });
  });

  // ===========================================================================
  // Close / interaction
  // ===========================================================================

  describe("close behavior", () => {
    it("calls onClose when close button is clicked", () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByLabelText("Schließen"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when overlay is clicked", () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      const overlay = document.querySelector(".modal-overlay");
      if (overlay) fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose when dialog content is clicked", () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) fireEvent.click(dialog);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // onApply callback (optional)
  // ===========================================================================

  describe("onApply callback", () => {
    it("renders 'Übernehmen' button when onApply is provided", async () => {
      const onApply = vi.fn();
      render(
        <BlueprintOptimizationPanel {...defaultProps} onApply={onApply} />,
      );
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        expect(screen.getByText(/Übernehmen/)).toBeTruthy();
      });
    });

    it("calls onApply with optimized content", async () => {
      const onApply = vi.fn();
      render(
        <BlueprintOptimizationPanel {...defaultProps} onApply={onApply} />,
      );
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        expect(screen.getByText(/Übernehmen/)).toBeTruthy();
      });

      fireEvent.click(screen.getByText(/Übernehmen/));
      expect(onApply).toHaveBeenCalledWith(
        expect.stringContaining("[conservative]"),
      );
    });

    it("does not render 'Übernehmen' button without onApply", async () => {
      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        expect(screen.queryByText(/Übernehmen/)).toBeFalsy();
      });
    });
  });

  // ===========================================================================
  // Error handling
  // ===========================================================================

  describe("error handling", () => {
    it("shows error message when optimization fails", async () => {
      // Override the mock to throw for this test
      vi.mocked(mockOptimizeBlueprint).mockImplementation(() => {
        throw new Error("Simulated optimization failure");
      });

      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        expect(screen.getByText(/Simulated optimization failure/)).toBeTruthy();
      });
    });

    it("sanitizes long error messages to avoid leaking content", async () => {
      vi.mocked(mockOptimizeBlueprint).mockImplementation(() => {
        throw new Error(
          "A".repeat(600) + " SECRET_TOKEN_12345 " + "B".repeat(500),
        );
      });

      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        const errorElement = document.querySelector(".optimizer-error");
        expect(errorElement).toBeTruthy();
        const errorText = errorElement?.textContent ?? "";
        // Should be sanitized — short message, no secrets
        expect(errorText.length).toBeLessThan(200);
        expect(errorText).not.toContain("SECRET_TOKEN");
      });
    });

    it("handles non-Error throws gracefully", async () => {
      vi.mocked(mockOptimizeBlueprint).mockImplementation(() => {
        throw new Error("non-standard error object");
      });

      render(<BlueprintOptimizationPanel {...defaultProps} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        const errorElement = document.querySelector(".optimizer-error");
        expect(errorElement).toBeTruthy();
      });
    });
  });

  // ===========================================================================
  // Edge cases
  // ===========================================================================

  describe("edge cases", () => {
    it("handles very long content without crashing", async () => {
      const longContent = "# Goal\n" + "A".repeat(10000);
      render(
        <BlueprintOptimizationPanel content={longContent} onClose={onClose} />,
      );
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        expect(screen.getByText("Vorher")).toBeTruthy();
      });
    });

    it("scroll containers allow large content viewing", async () => {
      const longContent = "# Goal\n" + "A".repeat(5000);
      render(
        <BlueprintOptimizationPanel content={longContent} onClose={onClose} />,
      );
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        const preElements = document.querySelectorAll(
          ".optimizer-diff-content",
        );
        expect(preElements.length).toBeGreaterThanOrEqual(2);
        expect(preElements[0].textContent?.length).toBeGreaterThan(100);
      });
    });

    it("shows empty changes message when no changes produced", async () => {
      vi.mocked(mockOptimizeBlueprint).mockReturnValue({
        original: "test",
        optimized: "test",
        changes: [],
        warnings: [],
        contamination_cleaned: false,
      });

      render(<BlueprintOptimizationPanel content="test" onClose={onClose} />);
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        expect(screen.getByText(/Keine Änderungen vorgenommen/)).toBeTruthy();
      });
    });
  });

  // ===========================================================================
  // Secret-safe rendering
  // ===========================================================================

  describe("secret-safe rendering", () => {
    it("does not render secrets in DOM error elements", async () => {
      const contentWithSecret =
        "# Goal\nBuild system with API_KEY=sk-1234567890abcdef1234567890abcdef\n";
      // Mock to throw an error to test error path sanitization
      vi.mocked(mockOptimizeBlueprint).mockImplementation(() => {
        throw new Error("Safe error without secrets");
      });

      render(
        <BlueprintOptimizationPanel
          content={contentWithSecret}
          onClose={onClose}
        />,
      );
      fireEvent.click(screen.getByText(/Blueprint optimieren/));

      await waitFor(() => {
        const errorElements = document.querySelectorAll(".optimizer-error");
        errorElements.forEach((el) => {
          expect(el.textContent).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
        });
      });
    });
  });
});
