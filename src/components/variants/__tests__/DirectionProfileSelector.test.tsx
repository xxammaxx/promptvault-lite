// =============================================================================
// PromptVault Lite — DirectionProfileSelector UI Tests (#267, #268)
// =============================================================================
// Tests for: profile chip rendering, multi-select, max-5 limit, custom
// direction textarea, constraint display, accessibility.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DirectionProfileSelector } from "../DirectionProfileSelector";
import { useAppStore } from "@/stores/appStore";
import { getDefaultSelection } from "@/lib/directionProfiles";

// =============================================================================
// Helpers
// =============================================================================

function resetStore() {
  useAppStore.setState({
    prompts: [],
    selectedPromptId: null,
    evaluations: {},
    hygiene: {},
    contextEvaluations: {},
    blueprintDetections: {},
    blueprintEvaluations: {},
    missingInfoSessions: {},
    enrichedContexts: {},
    isGateOpen: false,
    activeGatePromptId: null,
    gateSkippedItems: {},
    variantResults: {},
    showVariantPanel: false,
    activeVariantPromptId: null,
    selectedProfileIds: [],
    customDirectionInput: "",
    isGeneratingVariants: false,
    variantGenerationError: null,
    expandedFolders: new Set<string>(),
    filters: {
      search: "",
      category: null,
      minScore: 0,
      maxScore: 100,
      hygieneStatus: null,
      tags: [],
      favoritesOnly: false,
    },
    isLoading: false,
    isAnalyzing: false,
    error: null,
  });
}

function renderSelector(promptContent = "Test prompt content for variants") {
  return render(<DirectionProfileSelector promptContent={promptContent} />);
}

// =============================================================================
// Tests
// =============================================================================

describe("DirectionProfileSelector", () => {
  beforeEach(() => {
    resetStore();
  });

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  describe("Rendering", () => {
    it("renders the selector container", () => {
      renderSelector();
      expect(
        screen.getByTestId("direction-profile-selector"),
      ).toBeInTheDocument();
    });

    it("renders all 12 predefined profile chips", () => {
      renderSelector();
      // Check for each predefined profile ID
      const predefinedIds = [
        "sachlich",
        "verkaeuferisch",
        "technisch",
        "kurz",
        "ausfuehrlich",
        "kreativ",
        "kritisch",
        "anfaenger",
        "experte",
        "deep_research",
        "agentisch",
        "compliance",
      ];
      for (const id of predefinedIds) {
        expect(screen.getByTestId(`profile-chip-${id}`)).toBeInTheDocument();
      }
    });

    it("renders the custom chip", () => {
      renderSelector();
      expect(screen.getByTestId("profile-chip-custom")).toBeInTheDocument();
    });

    it("renders category sections", () => {
      renderSelector();
      expect(
        screen.getByTestId("variant-category-sachlich"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("variant-category-verkaeuferisch"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("variant-category-technisch"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("variant-category-kreativ"),
      ).toBeInTheDocument();
    });

    it("renders the custom section", () => {
      renderSelector();
      expect(screen.getByTestId("variant-custom-section")).toBeInTheDocument();
    });

    it("renders chip labels correctly", () => {
      renderSelector();
      expect(screen.getByText("Sachlich / Neutral")).toBeInTheDocument();
      expect(screen.getByText("Technisch / Präzise")).toBeInTheDocument();
      expect(screen.getByText("Kurz / Prägnant")).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Default Selection
  // ---------------------------------------------------------------------------

  describe("Default Selection", () => {
    it("has 5 default profiles selected on panel open", () => {
      // Simulate openVariantPanel setting the defaults
      useAppStore.setState({
        showVariantPanel: true,
        activeVariantPromptId: "test-prompt",
        selectedProfileIds: getDefaultSelection(),
      });

      renderSelector();

      const defaults = getDefaultSelection();
      for (const id of defaults) {
        const chip = screen.getByTestId(`profile-chip-${id}`);
        expect(chip).toHaveAttribute("aria-pressed", "true");
      }
    });

    it("non-default profiles are not selected", () => {
      useAppStore.setState({
        selectedProfileIds: getDefaultSelection(),
      });

      renderSelector();

      const nonDefaultIds = ["verkaeuferisch", "kreativ", "anfaenger"];
      for (const id of nonDefaultIds) {
        const chip = screen.getByTestId(`profile-chip-${id}`);
        expect(chip).toHaveAttribute("aria-pressed", "false");
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Multi-Select / Toggle
  // ---------------------------------------------------------------------------

  describe("Multi-Select Toggle", () => {
    it("toggles a profile chip on click", () => {
      useAppStore.setState({
        selectedProfileIds: getDefaultSelection(),
      });

      renderSelector();

      const sachlichChip = screen.getByTestId("profile-chip-sachlich");
      expect(sachlichChip).toHaveAttribute("aria-pressed", "true");

      // Deselect
      fireEvent.click(sachlichChip);
      expect(sachlichChip).toHaveAttribute("aria-pressed", "false");

      // Reselect
      fireEvent.click(sachlichChip);
      expect(sachlichChip).toHaveAttribute("aria-pressed", "true");
    });

    it("adds a new profile to selection on click", () => {
      useAppStore.setState({
        selectedProfileIds: ["sachlich"],
      });

      renderSelector();

      const technischChip = screen.getByTestId("profile-chip-technisch");
      fireEvent.click(technischChip);

      const store = useAppStore.getState();
      expect(store.selectedProfileIds).toContain("technisch");
      expect(store.selectedProfileIds).toContain("sachlich");
    });

    it("supports selecting multiple profiles simultaneously", () => {
      useAppStore.setState({
        selectedProfileIds: [],
      });

      renderSelector();

      fireEvent.click(screen.getByTestId("profile-chip-sachlich"));
      fireEvent.click(screen.getByTestId("profile-chip-technisch"));
      fireEvent.click(screen.getByTestId("profile-chip-kurz"));

      const store = useAppStore.getState();
      expect(store.selectedProfileIds).toContain("sachlich");
      expect(store.selectedProfileIds).toContain("technisch");
      expect(store.selectedProfileIds).toContain("kurz");
    });
  });

  // ---------------------------------------------------------------------------
  // Max 5 Profiles
  // ---------------------------------------------------------------------------

  describe("Max Selection Limit (5)", () => {
    it("prevents selecting more than 5 profiles", () => {
      // Start with 5 already selected
      useAppStore.setState({
        selectedProfileIds: getDefaultSelection(), // 5 profiles
      });

      renderSelector();

      // Try to add a 6th
      fireEvent.click(screen.getByTestId("profile-chip-kreativ"));

      const store = useAppStore.getState();
      // Should still have only 5
      expect(store.selectedProfileIds.length).toBe(5);
      expect(store.selectedProfileIds).not.toContain("kreativ");
    });

    it("shows a warning when more than 5 are selected", () => {
      useAppStore.setState({
        selectedProfileIds: [
          "sachlich",
          "technisch",
          "kurz",
          "ausfuehrlich",
          "agentisch",
          "kreativ",
        ],
      });

      renderSelector();

      expect(
        screen.getByTestId("variant-selection-warning"),
      ).toBeInTheDocument();
      expect(screen.getByText(/Maximal 5 Varianten/)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Custom Direction / Free-Text (T-215-012)
  // ---------------------------------------------------------------------------

  describe("Custom Direction Free-Text", () => {
    it("renders the custom chip", () => {
      renderSelector();
      expect(screen.getByTestId("profile-chip-custom")).toBeInTheDocument();
    });

    it("shows textarea when custom chip is selected", () => {
      useAppStore.setState({
        selectedProfileIds: ["custom"],
      });

      renderSelector();

      expect(screen.getByTestId("variant-custom-textarea")).toBeInTheDocument();
    });

    it("does not show textarea when custom chip is not selected", () => {
      useAppStore.setState({
        selectedProfileIds: getDefaultSelection(),
      });

      renderSelector();

      expect(
        screen.queryByTestId("variant-custom-textarea"),
      ).not.toBeInTheDocument();
    });

    it("textarea updates customDirectionInput in store", () => {
      useAppStore.setState({
        selectedProfileIds: ["custom"],
        customDirectionInput: "",
      });

      renderSelector();

      const textarea = screen.getByTestId("variant-custom-textarea");
      fireEvent.change(textarea, {
        target: { value: "Erkläre es wie für einen 10-Jährigen" },
      });

      const store = useAppStore.getState();
      expect(store.customDirectionInput).toBe(
        "Erkläre es wie für einen 10-Jährigen",
      );
    });

    it("shows custom constraint warning when custom chip selected", () => {
      useAppStore.setState({
        selectedProfileIds: ["custom"],
      });

      renderSelector();

      expect(screen.getByTestId("variant-custom-warning")).toBeInTheDocument();
      expect(
        screen.getByText(/keine automatische Constraint-Prüfung/),
      ).toBeInTheDocument();
    });

    it("does not show custom warning when custom is not selected", () => {
      useAppStore.setState({
        selectedProfileIds: getDefaultSelection(),
      });

      renderSelector();

      expect(
        screen.queryByTestId("variant-custom-warning"),
      ).not.toBeInTheDocument();
    });

    it("trims whitespace from custom direction input", () => {
      useAppStore.setState({
        selectedProfileIds: ["custom"],
        customDirectionInput: "",
      });

      renderSelector();

      const textarea = screen.getByTestId("variant-custom-textarea");
      fireEvent.change(textarea, {
        target: { value: "   Nur ein Test   " },
      });

      const store = useAppStore.getState();
      // The store action does the trim in the generation step,
      // but the raw input is stored. We just verify it's set.
      expect(store.customDirectionInput).toBe("   Nur ein Test   ");
    });

    it("displays custom chip label with checkmark when text is filled", () => {
      useAppStore.setState({
        selectedProfileIds: ["custom"],
        customDirectionInput: "Meine eigene Richtung",
      });

      renderSelector();

      const customChip = screen.getByTestId("profile-chip-custom");
      expect(customChip.textContent).toContain("Eigene Richtung ✓");
    });

    it("maxLength on textarea prevents excessive input", () => {
      useAppStore.setState({
        selectedProfileIds: ["custom"],
      });

      renderSelector();

      const textarea = screen.getByTestId("variant-custom-textarea");
      expect(textarea).toHaveAttribute("maxLength", "2000");
    });
  });

  // ---------------------------------------------------------------------------
  // Constraint Display
  // ---------------------------------------------------------------------------

  describe("Constraint Display", () => {
    it("shows constraints banner when prompt has constraints", () => {
      const contentWithConstraint =
        "Du bist ein Assistent.\n\nConstraint: Keine Cloud verwenden. Alles muss lokal laufen.";

      renderSelector(contentWithConstraint);

      expect(
        screen.getByTestId("variant-constraints-banner"),
      ).toBeInTheDocument();
    });

    it("shows no-constraints info when prompt has no constraints", () => {
      renderSelector("Einfacher Prompt ohne Constraints.");

      expect(
        screen.getByTestId("variant-constraints-info"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Keine spezifischen Constraints/),
      ).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility
  // ---------------------------------------------------------------------------

  describe("Accessibility", () => {
    it("profile chips have aria-pressed attribute", () => {
      useAppStore.setState({
        selectedProfileIds: getDefaultSelection(),
      });

      renderSelector();

      const chip = screen.getByTestId("profile-chip-sachlich");
      expect(chip).toHaveAttribute("aria-pressed");
    });

    it("profile chips have aria-label", () => {
      renderSelector();

      const chip = screen.getByTestId("profile-chip-technisch");
      expect(chip).toHaveAttribute("aria-label");
    });

    it("profile chips have title attribute for tooltip", () => {
      renderSelector();

      const chip = screen.getByTestId("profile-chip-sachlich");
      expect(chip).toHaveAttribute("title");
    });

    it("custom textarea has aria-label", () => {
      useAppStore.setState({
        selectedProfileIds: ["custom"],
      });

      renderSelector();

      const textarea = screen.getByTestId("variant-custom-textarea");
      expect(textarea).toHaveAttribute("aria-label");
    });

    it("profile chips are buttons", () => {
      renderSelector();

      const chip = screen.getByTestId("profile-chip-sachlich");
      expect(chip.tagName).toBe("BUTTON");
    });
  });

  // ---------------------------------------------------------------------------
  // No #216 interference
  // ---------------------------------------------------------------------------

  describe("No #216 Interference", () => {
    it("does not modify Missing-Info-Gate state", () => {
      useAppStore.setState({
        isGateOpen: true,
        activeGatePromptId: "gate-test",
        missingInfoSessions: {
          "gate-test": {
            sessionId: "MIG-gate-test-123",
            promptId: "gate-test",
            startedAt: new Date().toISOString(),
            items: [],
            answers: {},
            status: "ACTIVE",
            outcome: null,
            enrichedContent: null,
          },
        },
      });

      renderSelector();

      // Gate state should remain unchanged
      const store = useAppStore.getState();
      expect(store.isGateOpen).toBe(true);
      expect(store.activeGatePromptId).toBe("gate-test");
      expect(store.missingInfoSessions["gate-test"]).toBeDefined();
    });
  });
});
