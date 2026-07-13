import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  DetailsPanel,
  PromptMeta,
  ContaminationWarning,
  BlockingMessage,
  ActionBar,
} from "../DetailsPanel";
import { useAppStore } from "@/stores/appStore";
import type {
  PromptItem,
  BlueprintDetectOutput,
  BlueprintContamination,
  MissingInfoSession,
} from "@/types";

// ---------------------------------------------------------------------------
// Mock missingInfoFeatureFlag — controlled per test
// ---------------------------------------------------------------------------
const mockIsGateEnabled = vi.fn(() => false); // OFF by default for regression safety
vi.mock("@/lib/missingInfoFeatureFlag", () => ({
  isMissingInfoGateEnabled: () => mockIsGateEnabled(),
}));

// ---------------------------------------------------------------------------
// Mock directionFeatureFlag — controlled per test (Batch 6)
// ---------------------------------------------------------------------------
const mockIsDirectionEnabled = vi.fn(() => false); // OFF by default
vi.mock("@/lib/directionFeatureFlag", () => ({
  isDirectionProfilesEnabled: () => mockIsDirectionEnabled(),
}));

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

/** Create a BlueprintDetectOutput for tests */
function makeDetection(
  contentClass: BlueprintDetectOutput["content_class"],
  contamination: BlueprintContamination = "CLEAN",
): BlueprintDetectOutput {
  return {
    content_class: contentClass,
    blueprint_type: null,
    contamination_status: contamination,
    confidence: 0.95,
    prompt_signals: [],
    blueprint_signals: [],
    contamination_signals: [],
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
    currentFolderPath: null,
    isLoading: false,
    isAnalyzing: false,
    error: null,
    // Gate-related fields (Batch 6A)
    missingInfoSessions: {},
    enrichedContexts: {},
    isGateOpen: false,
    activeGatePromptId: null,
    gateSkippedItems: {},
  });
}

/**
 * Set up the store with a selected prompt and optional blueprint detection.
 * Returns the prompt ID.
 */
function setupStore(
  prompt: PromptItem,
  detection?: BlueprintDetectOutput,
): string {
  useAppStore.setState({
    prompts: [prompt],
    selectedPromptId: prompt.id,
  });
  if (detection) {
    useAppStore.getState().setBlueprintDetection(prompt.id, detection);
  }
  return prompt.id;
}

// ---------------------------------------------------------------------------
// T4 — PromptMeta ContentClassBadge integration
// ---------------------------------------------------------------------------

describe("PromptMeta — ContentClassBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("shows ContentClassBadge for BLUEPRINT", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("BLUEPRINT"));

    render(<PromptMeta />);

    expect(screen.getByText("Blueprint")).toBeInTheDocument();
  });

  it("shows ContentClassBadge for PROMPT_BLUEPRINT_HYBRID", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT_BLUEPRINT_HYBRID"));

    render(<PromptMeta />);

    expect(screen.getByText("Hybrid")).toBeInTheDocument();
  });

  it("shows ContentClassBadge for PROMPT (gray badge)", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<PromptMeta />);

    expect(screen.getByText("Prompt")).toBeInTheDocument();
  });

  it("shows ContentClassBadge for UNKNOWN_NEEDS_REVIEW", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("UNKNOWN_NEEDS_REVIEW"));

    render(<PromptMeta />);

    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("shows no badge when no detection exists", () => {
    const prompt = makePrompt();
    setupStore(prompt); // no detection

    render(<PromptMeta />);

    expect(screen.queryByText("Blueprint")).not.toBeInTheDocument();
    expect(screen.queryByText("Hybrid")).not.toBeInTheDocument();
    expect(screen.queryByText("Prompt")).not.toBeInTheDocument();
    expect(screen.queryByText("Review")).not.toBeInTheDocument();
  });

  it("shows no badge when no prompt is selected", () => {
    resetStore();
    render(<PromptMeta />);
    // component returns null — nothing rendered
    expect(screen.queryByText("Version")).not.toBeInTheDocument();
  });

  it("existing category badge still renders alongside ContentClassBadge", () => {
    const prompt = makePrompt({ category: "architecture" });
    setupStore(prompt, makeDetection("BLUEPRINT"));

    render(<PromptMeta />);

    // Existing category badge
    expect(screen.getByText("architecture")).toBeInTheDocument();
    // New ContentClass badge
    expect(screen.getByText("Blueprint")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// T4 — ContaminationWarning
// ---------------------------------------------------------------------------

describe("ContaminationWarning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("shows POSSIBLE_CONTAMINATION warning", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT", "POSSIBLE_CONTAMINATION"));

    render(<ContaminationWarning />);

    expect(
      screen.getByText(/Mögliche Kontamination erkannt/),
    ).toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("contamination-possible");
  });

  it("shows CONTAMINATED_NEEDS_REVIEW warning", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("BLUEPRINT", "CONTAMINATED_NEEDS_REVIEW"));

    render(<ContaminationWarning />);

    expect(
      screen.getByText(/Kontaminiert — manuelle Überprüfung/),
    ).toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("contamination-review");
  });

  it("shows BLOCKING_SENSITIVE_CONTENT warning", () => {
    const prompt = makePrompt();
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<ContaminationWarning />);

    expect(
      screen.getByText(
        /Vertraulicher Inhalt — die Anzeige wurde aus Sicherheitsgründen blockiert/,
      ),
    ).toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("contamination-blocked");
  });

  it("does NOT show warning for CLEAN status", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT", "CLEAN"));

    const { container } = render(<ContaminationWarning />);

    expect(container.firstChild).toBeNull();
  });

  it("does NOT show warning when no detection exists", () => {
    const prompt = makePrompt();
    setupStore(prompt); // no detection

    const { container } = render(<ContaminationWarning />);

    expect(container.firstChild).toBeNull();
  });

  it("does NOT show warning when no prompt selected", () => {
    resetStore();
    const { container } = render(<ContaminationWarning />);
    expect(container.firstChild).toBeNull();
  });

  // SECURITY: Warning must never expose secret values
  it("does NOT render contamination_signals in the DOM", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT", "POSSIBLE_CONTAMINATION"));

    render(<ContaminationWarning />);

    // The warning message is generic — it must not contain signal details
    const alert = screen.getByRole("alert");
    expect(alert.textContent).not.toContain("API_KEY");
    expect(alert.textContent).not.toContain("password");
    expect(alert.textContent).not.toContain("secret");
    expect(alert.textContent).not.toContain("token");
  });
});

// ---------------------------------------------------------------------------
// T4 — BlockingMessage (Secret-safe content masking)
// ---------------------------------------------------------------------------

describe("BlockingMessage", () => {
  it("renders blocking message text", () => {
    render(<BlockingMessage />);

    expect(
      screen.getByText(
        /Dieser Inhalt kann aus Sicherheitsgründen nicht angezeigt werden/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Der Inhalt enthält vertrauliche Daten/),
    ).toBeInTheDocument();
  });

  it("has alert role for accessibility", () => {
    render(<BlockingMessage />);
    const alert = screen.getByRole("alert", { name: undefined });
    expect(alert).toBeInTheDocument();
    expect(alert.getAttribute("aria-live")).toBe("assertive");
  });

  // SECURITY: BlockingMessage must NEVER render secret values
  it("does NOT contain any secret-like strings", () => {
    render(<BlockingMessage />);

    const html = document.body.innerHTML;
    expect(html).not.toContain("API_KEY");
    expect(html).not.toContain("sk-");
    expect(html).not.toContain("password");
    expect(html).not.toContain("secret");
    expect(html).not.toContain("token");
    expect(html).not.toContain("Bearer");
  });
});

// ---------------------------------------------------------------------------
// T4 — ActionBar Blueprint Optimize Button
// ---------------------------------------------------------------------------

describe("ActionBar — Blueprint Optimize Button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("shows 'BP optimieren' button for BLUEPRINT content", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("BLUEPRINT"));

    render(<ActionBar />);

    expect(screen.getByText("🔷 BP optimieren")).toBeInTheDocument();
  });

  it("shows 'BP optimieren' button for PROMPT_BLUEPRINT_HYBRID", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT_BLUEPRINT_HYBRID"));

    render(<ActionBar />);

    expect(screen.getByText("🔷 BP optimieren")).toBeInTheDocument();
  });

  it("hides 'BP optimieren' button for PROMPT", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<ActionBar />);

    expect(screen.queryByText("🔷 BP optimieren")).not.toBeInTheDocument();
  });

  it("hides 'BP optimieren' button for UNKNOWN_NEEDS_REVIEW", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("UNKNOWN_NEEDS_REVIEW"));

    render(<ActionBar />);

    expect(screen.queryByText("🔷 BP optimieren")).not.toBeInTheDocument();
  });

  it("hides 'BP optimieren' button when no detection exists", () => {
    const prompt = makePrompt();
    setupStore(prompt);

    render(<ActionBar />);

    expect(screen.queryByText("🔷 BP optimieren")).not.toBeInTheDocument();
  });

  it("disables blueprint button when BLOCKING_SENSITIVE_CONTENT", () => {
    const prompt = makePrompt();
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<ActionBar />);

    const btn = screen.getByText("🔷 BP optimieren");
    expect(btn).toBeDisabled();
    expect(btn.getAttribute("title")).toContain("nicht verfügbar");
  });

  it("blueprint button is disabled when no onBlueprintOptimize callback provided", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("BLUEPRINT", "CLEAN"));

    render(<ActionBar />); // no onBlueprintOptimize prop

    const btn = screen.getByText("🔷 BP optimieren");
    expect(btn).toBeDisabled();
    expect(btn.getAttribute("title")).toContain("Blueprint optimieren");
  });

  it("blueprint button is ENABLED when onBlueprintOptimize callback provided for BLUEPRINT", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("BLUEPRINT", "CLEAN"));

    render(<ActionBar onBlueprintOptimize={vi.fn()} />);

    const btn = screen.getByText("🔷 BP optimieren");
    expect(btn).not.toBeDisabled();
    expect(btn.getAttribute("title")).toContain("Blueprint optimieren");
  });

  it("blueprint button is ENABLED when onBlueprintOptimize callback provided for HYBRID", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT_BLUEPRINT_HYBRID", "CLEAN"));

    render(<ActionBar onBlueprintOptimize={vi.fn()} />);

    const btn = screen.getByText("🔷 BP optimieren");
    expect(btn).not.toBeDisabled();
  });

  it("blueprint button remains disabled for BLOCKING_SENSITIVE_CONTENT even with callback", () => {
    const prompt = makePrompt();
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<ActionBar onBlueprintOptimize={vi.fn()} />);

    const btn = screen.getByText("🔷 BP optimieren");
    expect(btn).toBeDisabled();
    expect(btn.getAttribute("title")).toContain("nicht verfügbar");
  });

  it("existing 'Optimieren' button still visible", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("BLUEPRINT"));

    render(<ActionBar onOptimize={vi.fn()} />);

    expect(screen.getByText("✨ Optimieren")).toBeInTheDocument();
  });

  it("existing 'Analysieren' button still visible", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("BLUEPRINT"));

    render(<ActionBar />);

    expect(screen.getByText(/Analysieren/)).toBeInTheDocument();
  });

  it("existing 'Kopieren' button still visible", () => {
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("BLUEPRINT"));

    render(<ActionBar />);

    expect(screen.getByText("📋 Kopieren")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// T4 — DetailsPanel content masking (BLOCKING_SENSITIVE_CONTENT)
// ---------------------------------------------------------------------------

describe("DetailsPanel — BLOCKING_SENSITIVE_CONTENT masking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("renders PromptContent normally when not blocked", () => {
    const prompt = makePrompt({
      content: "Normal safe content",
    });
    setupStore(prompt, makeDetection("PROMPT", "CLEAN"));

    render(<DetailsPanel />);

    expect(screen.getByText("Normal safe content")).toBeInTheDocument();
  });

  it("masks content and shows BlockingMessage for BLOCKING_SENSITIVE_CONTENT", () => {
    const prompt = makePrompt({
      content: "API_KEY=sk-1234567890abcdef SECRET_TOKEN=supersecret",
    });
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<DetailsPanel />);

    // Blocking message must appear
    expect(
      screen.getByText(
        /Dieser Inhalt kann aus Sicherheitsgründen nicht angezeigt werden/,
      ),
    ).toBeInTheDocument();
  });

  it("does NOT render raw content when BLOCKING_SENSITIVE_CONTENT", () => {
    const sensitiveContent =
      "API_KEY=sk-1234567890abcdef\nSECRET_TOKEN=supersecret\npassword=hunter2";
    const prompt = makePrompt({
      content: sensitiveContent,
    });
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<DetailsPanel />);

    // The raw content must NOT appear in the DOM
    expect(
      screen.queryByText("API_KEY=sk-1234567890abcdef"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("supersecret")).not.toBeInTheDocument();
    expect(screen.queryByText("hunter2")).not.toBeInTheDocument();
    expect(screen.queryByText("SECRET_TOKEN")).not.toBeInTheDocument();

    // But the blocking message IS present
    expect(
      screen.getByText(
        /Dieser Inhalt kann aus Sicherheitsgründen nicht angezeigt werden/,
      ),
    ).toBeInTheDocument();
  });

  it("shows blocking message without exposing any secret-like patterns", () => {
    const prompt = makePrompt({
      content: "sk-proj-abc123xyz token=ghp_fakegithubtoken",
    });
    setupStore(
      prompt,
      makeDetection("PROMPT_BLUEPRINT_HYBRID", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<DetailsPanel />);

    const html = document.body.innerHTML;

    // No secret-like values in DOM at all
    expect(html).not.toContain("sk-proj-");
    expect(html).not.toContain("ghp_");
    expect(html).not.toContain("abc123xyz");
  });

  it("shows ContaminationWarning + BlockingMessage when BLOCKING_SENSITIVE_CONTENT", () => {
    const prompt = makePrompt({
      content: "sensitive data here",
    });
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<DetailsPanel />);

    // Both contamination warning and blocking message present
    expect(
      screen.getByText(
        /Vertraulicher Inhalt — die Anzeige wurde aus Sicherheitsgründen blockiert/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Dieser Inhalt kann aus Sicherheitsgründen nicht angezeigt werden/,
      ),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// T4 — DetailsPanel regression: existing prompt functionality
// ---------------------------------------------------------------------------

describe("DetailsPanel — no regression for existing Prompt behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("renders empty state when no prompt selected", () => {
    resetStore();
    render(<DetailsPanel />);

    expect(screen.getByText("Kein Prompt ausgewählt.")).toBeInTheDocument();
  });

  it("renders prompt title in header", () => {
    const prompt = makePrompt({ title: "My Prompt Title" });
    setupStore(prompt);

    render(<DetailsPanel />);

    expect(screen.getByText("My Prompt Title")).toBeInTheDocument();
  });

  it("renders prompt description in header", () => {
    const prompt = makePrompt({ description: "A helpful description" });
    setupStore(prompt);

    render(<DetailsPanel />);

    expect(screen.getByText("A helpful description")).toBeInTheDocument();
  });

  it("renders existing ActionBar buttons without blueprint", () => {
    const prompt = makePrompt();
    setupStore(prompt); // no blueprint detection

    render(<DetailsPanel />);

    // Standard buttons must be visible
    expect(screen.getByText("📋 Kopieren")).toBeInTheDocument();
    expect(screen.getByText("📂 Öffnen")).toBeInTheDocument();
    expect(screen.getByText(/Analysieren/)).toBeInTheDocument();
  });

  it("renders content normally when no blueprint detection", () => {
    const prompt = makePrompt({ content: "Hello World" });
    setupStore(prompt); // no detection

    render(<DetailsPanel />);

    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders tags when present", () => {
    const prompt = makePrompt({ tags: ["react", "typescript"] });
    setupStore(prompt);

    render(<DetailsPanel />);

    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("typescript")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// T7 — DetailsPanel BlueprintOptimizationPanel Modal Integration
// ---------------------------------------------------------------------------

describe("DetailsPanel — BlueprintOptimizationPanel Modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("opens BlueprintOptimizationPanel modal when BP optimieren is clicked", () => {
    const prompt = makePrompt({
      content: "Blueprint content for optimization",
    });
    setupStore(prompt, makeDetection("BLUEPRINT", "CLEAN"));

    render(<DetailsPanel />);

    // Click the BP optimieren button
    const bpBtn = screen.getByText("🔷 BP optimieren");
    expect(bpBtn).not.toBeDisabled();
    fireEvent.click(bpBtn);

    // BlueprintOptimizationPanel modal should be visible
    expect(screen.getByText("🔷 Blueprint-Optimierung")).toBeInTheDocument();
    // Mode selector should be visible
    expect(screen.getByText("Conservative")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(screen.getByText("Aggressive")).toBeInTheDocument();
  });

  it("closes BlueprintOptimizationPanel modal via close button", () => {
    const prompt = makePrompt({ content: "Blueprint content" });
    setupStore(prompt, makeDetection("BLUEPRINT", "CLEAN"));

    render(<DetailsPanel />);

    // Open the modal
    const bpBtn = screen.getByText("🔷 BP optimieren");
    fireEvent.click(bpBtn);

    // Modal should be visible
    expect(screen.getByText("🔷 Blueprint-Optimierung")).toBeInTheDocument();

    // Click the close button (✕)
    const closeBtn = screen.getByLabelText("Schließen");
    fireEvent.click(closeBtn);

    // Modal should be gone
    expect(
      screen.queryByText("🔷 Blueprint-Optimierung"),
    ).not.toBeInTheDocument();
  });

  it("closes BlueprintOptimizationPanel modal via overlay click", () => {
    const prompt = makePrompt({ content: "Blueprint content" });
    setupStore(prompt, makeDetection("BLUEPRINT", "CLEAN"));

    render(<DetailsPanel />);

    // Open the modal
    fireEvent.click(screen.getByText("🔷 BP optimieren"));
    expect(screen.getByText("🔷 Blueprint-Optimierung")).toBeInTheDocument();

    // Click the modal overlay (the outermost div with className "modal-overlay")
    const overlay = document.querySelector(".modal-overlay");
    expect(overlay).not.toBeNull();
    if (overlay) {
      fireEvent.click(overlay);
    }

    // Modal should be gone
    expect(
      screen.queryByText("🔷 Blueprint-Optimierung"),
    ).not.toBeInTheDocument();
  });

  it("does NOT open blueprint optimizer for PROMPT content", () => {
    const prompt = makePrompt({ content: "A regular prompt" });
    setupStore(prompt, makeDetection("PROMPT", "CLEAN"));

    render(<DetailsPanel />);

    // BP optimieren button should not exist for PROMPT
    expect(screen.queryByText("🔷 BP optimieren")).not.toBeInTheDocument();
  });

  it("BP optimieren button disabled when BLOCKING_SENSITIVE_CONTENT", () => {
    const prompt = makePrompt({ content: "SENSITIVE DATA" });
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<DetailsPanel />);

    const bpBtn = screen.getByText("🔷 BP optimieren");
    expect(bpBtn).toBeDisabled();

    // Clicking should NOT open the modal
    fireEvent.click(bpBtn);
    expect(
      screen.queryByText("🔷 Blueprint-Optimierung"),
    ).not.toBeInTheDocument();
  });
});

// =============================================================================
// Batch 6A — Missing-Info-Gate Trigger Tests (#243)
// =============================================================================

describe("DetailsPanel — Gate Trigger (Batch 6A)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    mockIsGateEnabled.mockReturnValue(false); // Default: OFF for regression
  });

  // -------------------------------------------------------------------------
  // ActionBar Gate Button Visibility
  // -------------------------------------------------------------------------

  it("ActionBar does NOT show gate button when feature flag is disabled", () => {
    mockIsGateEnabled.mockReturnValue(false);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<ActionBar onOptimize={vi.fn()} onMissingInfoGate={vi.fn()} />);

    expect(screen.queryByTestId("gate-actionbar-btn")).toBeNull();
  });

  it("ActionBar shows gate button when feature flag is enabled", () => {
    mockIsGateEnabled.mockReturnValue(true);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<ActionBar onOptimize={vi.fn()} onMissingInfoGate={vi.fn()} />);

    expect(screen.getByTestId("gate-actionbar-btn")).toBeTruthy();
  });

  it("gate button calls onMissingInfoGate on click", () => {
    mockIsGateEnabled.mockReturnValue(true);
    const onGate = vi.fn();
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<ActionBar onOptimize={vi.fn()} onMissingInfoGate={onGate} />);

    const gateBtn = screen.getByTestId("gate-actionbar-btn");
    fireEvent.click(gateBtn);

    expect(onGate).toHaveBeenCalled();
  });

  it("gate button is NOT rendered when onMissingInfoGate prop is absent", () => {
    mockIsGateEnabled.mockReturnValue(true);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    // NO onMissingInfoGate prop
    render(<ActionBar onOptimize={vi.fn()} />);

    expect(screen.queryByTestId("gate-actionbar-btn")).toBeNull();
  });

  it("existing buttons remain visible when gate button is present", () => {
    mockIsGateEnabled.mockReturnValue(true);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<ActionBar onOptimize={vi.fn()} onMissingInfoGate={vi.fn()} />);

    // All existing buttons should still be visible
    expect(screen.getByText("✨ Optimieren")).toBeTruthy();
    expect(screen.getByText("📋 Kopieren")).toBeTruthy();
    expect(screen.getByText("📂 Öffnen")).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // DetailsPanel Gate Rendering
  // -------------------------------------------------------------------------

  it("DetailsPanel does NOT render gate when feature flag is disabled", () => {
    mockIsGateEnabled.mockReturnValue(false);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<DetailsPanel />);

    // Gate modal should NOT be rendered
    expect(
      screen.queryByText("❓ Fehlende Informationen"),
    ).not.toBeInTheDocument();
  });

  it("DetailsPanel renders ActionBar with gate button when feature flag enabled", () => {
    mockIsGateEnabled.mockReturnValue(true);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<DetailsPanel />);

    expect(screen.getByTestId("gate-actionbar-btn")).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // #289 — Null-safe gate session access in optimizer handlers
  // -------------------------------------------------------------------------

  it("handleOpenOptimizer does not crash when gateEnabled but no session exists", () => {
    // Regression test for #289: handleOpenOptimizer used to read session.items
    // without null-check when missingInfoSessions[prompt.id] was undefined.
    mockIsGateEnabled.mockReturnValue(true);
    const prompt = makePrompt({ id: "no-session-prompt" });
    setupStore(prompt, makeDetection("PROMPT"));
    // Explicitly ensure no missing info session exists for this prompt
    useAppStore.setState({ missingInfoSessions: {} });

    render(<DetailsPanel />);

    // Clicking "✨ Optimieren" must NOT throw TypeError
    const optimizeBtn = screen.getByText("✨ Optimieren");
    expect(() => {
      fireEvent.click(optimizeBtn);
    }).not.toThrow();

    // Optimizer should have opened (gate should NOT have opened)
    expect(screen.getByText("✨ Prompt-Optimierung")).toBeInTheDocument();
  });

  it("handleBlueprintOptimize does not crash when gateEnabled but no session exists", () => {
    mockIsGateEnabled.mockReturnValue(true);
    const prompt = makePrompt({ id: "no-session-bp" });
    setupStore(prompt, makeDetection("BLUEPRINT"));
    useAppStore.setState({ missingInfoSessions: {} });

    render(<DetailsPanel />);

    // Clicking "🔷 BP optimieren" must NOT throw TypeError
    const bpBtn = screen.getByText("🔷 BP optimieren");
    expect(() => {
      fireEvent.click(bpBtn);
    }).not.toThrow();

    // Blueprint optimizer should have opened
    expect(screen.getByText("🔷 Blueprint-Optimierung")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // #289 — Handler-level: REQUIRED session → Gate opens (regression coverage)
  // -------------------------------------------------------------------------

  it("handleOpenOptimizer opens Gate when REQUIRED session with non-skipped items exists", () => {
    mockIsGateEnabled.mockReturnValue(true);
    const prompt = makePrompt({ id: "req-session-prompt" });
    setupStore(prompt, makeDetection("PROMPT", "CLEAN"));

    // Seed a session with a non-skipped REQUIRED item
    const session: MissingInfoSession = {
      sessionId: "test-session-req-1",
      promptId: prompt.id,
      startedAt: "2024-01-01T00:00:00Z",
      items: [
        {
          id: "REQ_C_001",
          source: "prompt_engineering",
          label: "Zieldefinition",
          question: "Was ist das Ziel des Prompts?",
          rationale: "Ohne Zieldefinition keine zielgerichtete Optimierung.",
          inputType: "free_text",
          tier: "REQUIRED",
          classificationReason: "Critical for optimization",
        },
      ],
      answers: {},
      status: "ACTIVE" as const,
      outcome: null,
      enrichedContent: null,
    };
    useAppStore.setState({
      missingInfoSessions: { [prompt.id]: session },
    });

    render(<DetailsPanel />);

    const optimizeBtn = screen.getByText("✨ Optimieren");
    fireEvent.click(optimizeBtn);

    // Gate must open, NOT the plain optimizer
    expect(screen.getByText("❓ Fehlende Informationen")).toBeInTheDocument();
    expect(screen.queryByText("✨ Prompt-Optimierung")).not.toBeInTheDocument();
  });

  it("handleBlueprintOptimize opens Gate when REQUIRED session with non-skipped items exists", () => {
    mockIsGateEnabled.mockReturnValue(true);
    const prompt = makePrompt({ id: "req-session-bp" });
    setupStore(prompt, makeDetection("BLUEPRINT", "CLEAN"));

    const session: MissingInfoSession = {
      sessionId: "test-session-bp-req-1",
      promptId: prompt.id,
      startedAt: "2024-01-01T00:00:00Z",
      items: [
        {
          id: "REQ_D_001",
          source: "prompt_engineering",
          label: "Zieldefinition",
          question: "Was ist das Ziel des Prompts?",
          rationale: "Ohne Zieldefinition keine zielgerichtete Optimierung.",
          inputType: "free_text",
          tier: "REQUIRED",
          classificationReason: "Critical for optimization",
        },
      ],
      answers: {},
      status: "ACTIVE" as const,
      outcome: null,
      enrichedContent: null,
    };
    useAppStore.setState({
      missingInfoSessions: { [prompt.id]: session },
    });

    render(<DetailsPanel />);

    const bpBtn = screen.getByText("🔷 BP optimieren");
    fireEvent.click(bpBtn);

    // Gate must open, NOT the blueprint optimizer
    expect(screen.getByText("❓ Fehlende Informationen")).toBeInTheDocument();
    expect(
      screen.queryByText("🔷 Blueprint-Optimierung"),
    ).not.toBeInTheDocument();
  });
});

// =============================================================================
// Batch 6 — Variant Button & VariantPanel Integration Tests (#270, #271)
// =============================================================================

describe("ActionBar — Variant Button (Batch 6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    mockIsDirectionEnabled.mockReturnValue(false); // Default: OFF
    mockIsGateEnabled.mockReturnValue(false); // Default: OFF
  });

  it("does NOT show variant button when feature flag is disabled", () => {
    mockIsDirectionEnabled.mockReturnValue(false);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<ActionBar onOpenVariantPanel={vi.fn()} />);

    expect(screen.queryByTestId("variant-actionbar-btn")).toBeNull();
  });

  it("shows variant button when feature flag is enabled", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<ActionBar onOpenVariantPanel={vi.fn()} />);

    expect(screen.getByTestId("variant-actionbar-btn")).toBeTruthy();
    expect(screen.getByText("🧭 Varianten erzeugen")).toBeTruthy();
  });

  it("variant button has correct accessibility attributes", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<ActionBar onOpenVariantPanel={vi.fn()} />);

    const btn = screen.getByTestId("variant-actionbar-btn");
    expect(btn.getAttribute("aria-label")).toBe("Varianten erzeugen");
    expect(btn.getAttribute("title")).toBe(
      "Varianten mit Richtungsprofilen erzeugen",
    );
  });

  it("variant button is NOT rendered when onOpenVariantPanel prop is absent", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    // NO onOpenVariantPanel prop
    render(<ActionBar onOptimize={vi.fn()} />);

    expect(screen.queryByTestId("variant-actionbar-btn")).toBeNull();
  });

  it("variant button calls onOpenVariantPanel on click", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    const onVariant = vi.fn();
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<ActionBar onOpenVariantPanel={onVariant} />);

    const btn = screen.getByTestId("variant-actionbar-btn");
    fireEvent.click(btn);

    expect(onVariant).toHaveBeenCalledTimes(1);
  });

  it("existing buttons remain visible when variant button is present", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<ActionBar onOptimize={vi.fn()} onOpenVariantPanel={vi.fn()} />);

    // All existing standard buttons should still be visible
    expect(screen.getByText("✨ Optimieren")).toBeTruthy();
    expect(screen.getByText("📋 Kopieren")).toBeTruthy();
    expect(screen.getByText("📂 Öffnen")).toBeTruthy();
    expect(screen.getByText(/Analysieren/)).toBeTruthy();
    // And the variant button
    expect(screen.getByText("🧭 Varianten erzeugen")).toBeTruthy();
  });

  it("variant button works alongside gate button when both flags enabled", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    mockIsGateEnabled.mockReturnValue(true);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(
      <ActionBar
        onOptimize={vi.fn()}
        onMissingInfoGate={vi.fn()}
        onOpenVariantPanel={vi.fn()}
      />,
    );

    // Both buttons should be visible
    expect(screen.getByTestId("variant-actionbar-btn")).toBeTruthy();
    expect(screen.getByTestId("gate-actionbar-btn")).toBeTruthy();
    expect(screen.getByText("✨ Optimieren")).toBeTruthy();
  });
});

describe("DetailsPanel — VariantPanel Integration (Batch 6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    mockIsDirectionEnabled.mockReturnValue(false); // Default: OFF
    mockIsGateEnabled.mockReturnValue(false); // Default: OFF
  });

  it("does NOT render VariantPanel when feature flag is disabled", () => {
    mockIsDirectionEnabled.mockReturnValue(false);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<DetailsPanel />);

    expect(screen.queryByTestId("variant-panel-overlay")).toBeNull();
    expect(screen.queryByTestId("variant-actionbar-btn")).toBeNull();
  });

  it("renders ActionBar with variant button when feature flag enabled", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    const prompt = makePrompt();
    setupStore(prompt, makeDetection("PROMPT"));

    render(<DetailsPanel />);

    expect(screen.getByTestId("variant-actionbar-btn")).toBeTruthy();
  });

  it("clicking variant button opens VariantPanel modal", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    const prompt = makePrompt({ content: "Test prompt content" });
    setupStore(prompt, makeDetection("PROMPT"));

    render(<DetailsPanel />);

    // Click the variant button
    const variantBtn = screen.getByTestId("variant-actionbar-btn");
    fireEvent.click(variantBtn);

    // VariantPanel modal should be visible
    expect(screen.getByTestId("variant-panel-overlay")).toBeTruthy();
    expect(screen.getByTestId("variant-panel")).toBeTruthy();
    expect(
      screen.getByText(/🧭 Varianten erzeugen — Richtungsprofile/),
    ).toBeTruthy();
  });

  it("DetailsPanel calls openVariantPanel with correct prompt ID", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    const prompt = makePrompt({
      id: "direction-test-prompt-123",
      content: "Test",
    });
    setupStore(prompt, makeDetection("PROMPT"));

    render(<DetailsPanel />);

    // Click the variant button
    const variantBtn = screen.getByTestId("variant-actionbar-btn");
    fireEvent.click(variantBtn);

    // Check store state: activeVariantPromptId should be set
    const store = useAppStore.getState();
    expect(store.showVariantPanel).toBe(true);
    expect(store.activeVariantPromptId).toBe("direction-test-prompt-123");
  });

  it("uses enrichedContent as variant source when available", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    const prompt = makePrompt({
      id: "enriched-prompt-1",
      content: "Original prompt content",
    });
    setupStore(prompt, makeDetection("PROMPT"));

    // Set up enriched content in store
    useAppStore.setState({
      enrichedContexts: {
        "enriched-prompt-1": {
          originalContent: "Original prompt content",
          enrichedContent: "Enriched content with extra info",
          answers: [],
          gateOutcome: "COMPLETED",
          sessionId: "session-1",
          enrichedAt: "2024-01-01T00:00:00Z",
        },
      },
    });

    render(<DetailsPanel />);

    // Click the variant button
    fireEvent.click(screen.getByTestId("variant-actionbar-btn"));

    // The source info banner should show enrichedContent
    expect(screen.getByTestId("variant-source-info")).toBeTruthy();
    expect(screen.getByText(/enrichedContent/)).toBeTruthy();
  });

  it("falls back to original prompt when no enriched content", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    const prompt = makePrompt({
      id: "plain-prompt-1",
      content: "Plain original content",
    });
    setupStore(prompt, makeDetection("PROMPT"));

    // No enriched content
    useAppStore.setState({ enrichedContexts: {} });

    render(<DetailsPanel />);

    // Click the variant button
    fireEvent.click(screen.getByTestId("variant-actionbar-btn"));

    // The source info banner should show "Original-Prompt"
    const sourceInfo = screen.getByTestId("variant-source-info");
    expect(sourceInfo.textContent).toContain("Original-Prompt");
  });

  it("does NOT modify MissingInfoGate state when opening variant panel", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    mockIsGateEnabled.mockReturnValue(true);
    const prompt = makePrompt({
      id: "gate-prompt-1",
      content: "Content for gate test",
    });
    setupStore(prompt, makeDetection("PROMPT"));

    // Set up initial gate state
    useAppStore.setState({
      isGateOpen: false,
      activeGatePromptId: null,
      missingInfoSessions: {},
      enrichedContexts: {},
    });

    render(<DetailsPanel />);

    // Click the variant button
    fireEvent.click(screen.getByTestId("variant-actionbar-btn"));

    // Gate state should be untouched
    const store = useAppStore.getState();
    expect(store.isGateOpen).toBe(false);
    expect(store.activeGatePromptId).toBeNull();
    expect(store.missingInfoSessions).toEqual({});
    expect(store.enrichedContexts).toEqual({});
  });

  it("closing VariantPanel via onClose cleans up local state", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    const prompt = makePrompt({ content: "Test" });
    setupStore(prompt, makeDetection("PROMPT"));

    render(<DetailsPanel />);

    // Open the panel
    fireEvent.click(screen.getByTestId("variant-actionbar-btn"));
    expect(screen.getByTestId("variant-panel-overlay")).toBeTruthy();

    // Close via the X icon in the Panel header
    const closeIcon = screen.getByTestId("variant-panel-close-icon");
    fireEvent.click(closeIcon);

    // Panel should be gone
    expect(screen.queryByTestId("variant-panel-overlay")).toBeNull();
  });

  it("no compare/save buttons are present in ActionBar or VariantPanel", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    const prompt = makePrompt({ content: "Test" });
    setupStore(prompt, makeDetection("PROMPT"));

    render(<DetailsPanel />);

    // ActionBar must not have Compare or Save buttons
    expect(screen.queryByText(/Vergleichen/i)).toBeNull();
    expect(screen.queryByText(/Speichern/i)).toBeNull();

    // Open variant panel
    fireEvent.click(screen.getByTestId("variant-actionbar-btn"));

    // VariantPanel must not have Compare or Save buttons
    const panel = screen.getByTestId("variant-panel");
    expect(panel.textContent).not.toContain("Vergleichen");
    expect(panel.textContent).not.toContain("Speichern");
  });

  it("optimizer and gate flow remain regression-free with variant button present", () => {
    mockIsDirectionEnabled.mockReturnValue(true);
    // Keep gate disabled for this regression test to avoid triggering
    // the gate pre-check in handleOpenOptimizer (requires a session to exist).
    mockIsGateEnabled.mockReturnValue(false);
    const prompt = makePrompt({
      content: "Test content for regression",
    });
    setupStore(prompt, makeDetection("PROMPT"));

    render(<DetailsPanel />);

    // All standard buttons must still be visible
    expect(screen.getByText("✨ Optimieren")).toBeTruthy();
    expect(screen.getByText("📋 Kopieren")).toBeTruthy();
    expect(screen.getByText("📂 Öffnen")).toBeTruthy();
    expect(screen.getByText(/Analysieren/)).toBeTruthy();
    // Variant button visible
    expect(screen.getByTestId("variant-actionbar-btn")).toBeTruthy();

    // Gate button should NOT be visible (flag OFF)
    expect(screen.queryByTestId("gate-actionbar-btn")).toBeNull();
  });
});

// =============================================================================
// #291 — Normal Optimizer Blocking for Sensitive Content
// =============================================================================

// These tests reproduce the asymmetric guard gap between the normal
// "✨ Optimieren" button/handler and the blueprint "🔷 BP optimieren"
// button/handler when contamination_status === BLOCKING_SENSITIVE_CONTENT.
//
// Expected: All #291 tests FAIL before the fix (confirming the gap),
// and PASS after the symmetric UI + handler guards are applied.
//
// Protection tests D/E/F must PASS both before and after the fix.

describe("#291 — Normal Optimizer Blocking (Red Tests)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    mockIsGateEnabled.mockReturnValue(false);
    mockIsDirectionEnabled.mockReturnValue(false);
  });

  // -------------------------------------------------------------------------
  // Reproduktion A — Button State
  // -------------------------------------------------------------------------

  it("RED-A: normal optimizer button is NOT disabled for BLOCKING_SENSITIVE_CONTENT", () => {
    // REPRODUCTION: The current ActionBar does NOT pass isBlocked to the
    // normal "✨ Optimieren" button. It should be disabled like the BP button.
    const prompt = makePrompt({ content: "SENSITIVE_TEST_MARKER_291" });
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<ActionBar onOptimize={vi.fn()} />);

    const normalBtn = screen.getByText("✨ Optimieren");
    // RED: The button is currently NOT disabled — the test asserts it IS.
    expect(normalBtn).toBeDisabled();
  });

  it("RED-A2: normal optimizer button title should indicate blocked content", () => {
    const prompt = makePrompt({ content: "SENSITIVE_TEST_MARKER_291" });
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<ActionBar onOptimize={vi.fn()} />);

    const normalBtn = screen.getByText("✨ Optimieren");
    // The title should indicate the reason for blocking
    expect(normalBtn.getAttribute("title")).toContain("nicht verfügbar");
  });

  // -------------------------------------------------------------------------
  // Reproduktion B — Modal Opening via DetailsPanel
  // -------------------------------------------------------------------------

  it("RED-B: clicking normal optimizer does NOT open optimization modal for blocked content", () => {
    // REPRODUCTION: handleOpenOptimizer lacks an early return for isBlocked.
    // When clicked, setShowOptimizer(true) executes despite blocked content.
    const prompt = makePrompt({ content: "SENSITIVE_TEST_MARKER_291" });
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<DetailsPanel />);

    // BlockingMessage is shown (content display is masked)
    expect(
      screen.getByText(
        /Dieser Inhalt kann aus Sicherheitsgründen nicht angezeigt werden/,
      ),
    ).toBeInTheDocument();

    // Try clicking the normal optimizer button
    const normalBtn = screen.getByText("✨ Optimieren");
    fireEvent.click(normalBtn);

    // RED: The optimizer modal should NOT have opened
    expect(screen.queryByText("✨ Prompt-Optimierung")).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Reproduktion C — Content NOT passed to optimizer
  // -------------------------------------------------------------------------

  it("RED-C: blocked content marker does NOT appear in optimization panel", () => {
    // REPRODUCTION: optimizerContent is derived from prompt.content without
    // an isBlocked guard. If the modal opens, the marker is passed as prop.
    const prompt = makePrompt({
      content: "SENSITIVE_TEST_MARKER_291 secret data here",
    });
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<DetailsPanel />);

    // Click the normal optimizer button
    const normalBtn = screen.getByText("✨ Optimieren");
    fireEvent.click(normalBtn);

    // RED: No OptimizationPanel should be rendered — therefore
    // SENSITIVE_TEST_MARKER_291 must NOT appear anywhere in the DOM
    const html = document.body.innerHTML;
    expect(html).not.toContain("SENSITIVE_TEST_MARKER_291");
  });

  it("RED-C2: blocked content is never passed as promptContent prop to OptimizationPanel", () => {
    // When content is blocked, no OptimizationPanel should render at all.
    const prompt = makePrompt({
      content: "SENSITIVE_TEST_MARKER_291 extra secret content",
    });
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<DetailsPanel />);

    fireEvent.click(screen.getByText("✨ Optimieren"));

    // OptimizationPanel must not be in the DOM
    expect(
      document.querySelector(".optimization-panel"),
    ).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Protection Test D — CLEAN prompt: no regression
  // -------------------------------------------------------------------------

  it("PROTECTION-D: CLEAN prompt — normal optimizer button remains enabled", () => {
    const prompt = makePrompt({ content: "Clean, safe content." });
    setupStore(prompt, makeDetection("PROMPT", "CLEAN"));

    render(<ActionBar onOptimize={vi.fn()} />);

    const normalBtn = screen.getByText("✨ Optimieren");
    expect(normalBtn).not.toBeDisabled();
  });

  it("PROTECTION-D2: CLEAN prompt — normal optimizer opens as before", () => {
    const prompt = makePrompt({ content: "Clean, safe content." });
    setupStore(prompt, makeDetection("PROMPT", "CLEAN"));

    render(<DetailsPanel />);

    const normalBtn = screen.getByText("✨ Optimieren");
    fireEvent.click(normalBtn);

    // Optimizer modal should open normally
    expect(screen.getByText("✨ Prompt-Optimierung")).toBeInTheDocument();
  });

  it("PROTECTION-D3: CLEAN prompt — content is processed normally", () => {
    const prompt = makePrompt({ content: "This is clean content." });
    setupStore(prompt, makeDetection("PROMPT", "CLEAN"));

    render(<DetailsPanel />);

    fireEvent.click(screen.getByText("✨ Optimieren"));

    // The clean prompt content should appear in the DOM
    const html = document.body.innerHTML;
    expect(html).toContain("This is clean content.");
  });

  // -------------------------------------------------------------------------
  // Protection Test E — Blueprint remains unchanged
  // -------------------------------------------------------------------------

  it("PROTECTION-E: BP button remains disabled for BLOCKING_SENSITIVE_CONTENT", () => {
    const prompt = makePrompt({ content: "SENSITIVE_TEST_MARKER_291" });
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<ActionBar onBlueprintOptimize={vi.fn()} />);

    const bpBtn = screen.getByText("🔷 BP optimieren");
    expect(bpBtn).toBeDisabled();
    expect(bpBtn.getAttribute("title")).toContain("nicht verfügbar");
  });

  it("PROTECTION-E2: BP handler does NOT open modal for blocked content", () => {
    const prompt = makePrompt({ content: "SENSITIVE_TEST_MARKER_291" });
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    render(<DetailsPanel />);

    const bpBtn = screen.getByText("🔷 BP optimieren");
    fireEvent.click(bpBtn);

    // BP optimizer should NOT open
    expect(
      screen.queryByText("🔷 Blueprint-Optimierung"),
    ).not.toBeInTheDocument();
  });

  it("PROTECTION-E3: BP button works normally for CLEAN content", () => {
    const prompt = makePrompt({ content: "Clean blueprint content." });
    setupStore(prompt, makeDetection("BLUEPRINT", "CLEAN"));

    render(<DetailsPanel />);

    const bpBtn = screen.getByText("🔷 BP optimieren");
    expect(bpBtn).not.toBeDisabled();

    fireEvent.click(bpBtn);
    expect(screen.getByText("🔷 Blueprint-Optimierung")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Protection Test F — Gate Regression (#289)
  // -------------------------------------------------------------------------

  it("PROTECTION-F: REQUIRED gate still opens for CLEAN content when session has non-skipped items", () => {
    mockIsGateEnabled.mockReturnValue(true);
    const prompt = makePrompt({
      id: "regression-gate-test",
      content: "Gate regression test content",
    });
    setupStore(prompt, makeDetection("PROMPT", "CLEAN"));

    const session = {
      sessionId: "gate-regression-1",
      promptId: prompt.id,
      startedAt: "2024-01-01T00:00:00Z",
      items: [
        {
          id: "REQ_F_001",
          source: "prompt_engineering" as const,
          label: "Zieldefinition",
          question: "Was ist das Ziel?",
          rationale: "Erforderlich für Optimierung.",
          inputType: "free_text" as const,
          tier: "REQUIRED" as const,
          classificationReason: "Critical",
        },
      ],
      answers: {},
      status: "ACTIVE" as const,
      outcome: null,
      enrichedContent: null,
    };
    useAppStore.setState({
      missingInfoSessions: { [prompt.id]: session },
    });

    render(<DetailsPanel />);

    fireEvent.click(screen.getByText("✨ Optimieren"));

    // Gate must open, NOT optimizer
    expect(screen.getByText("❓ Fehlende Informationen")).toBeInTheDocument();
    expect(screen.queryByText("✨ Prompt-Optimierung")).not.toBeInTheDocument();
  });

  it("PROTECTION-F2: blocked content opens neither gate nor optimizer", () => {
    mockIsGateEnabled.mockReturnValue(true);
    const prompt = makePrompt({
      id: "blocked-gate-test",
      content: "SENSITIVE_TEST_MARKER_291",
    });
    setupStore(
      prompt,
      makeDetection("BLUEPRINT", "BLOCKING_SENSITIVE_CONTENT"),
    );

    // Even with a REQUIRED session present, blocked content should prevent both
    const session = {
      sessionId: "blocked-gate-1",
      promptId: prompt.id,
      startedAt: "2024-01-01T00:00:00Z",
      items: [
        {
          id: "REQ_G_001",
          source: "prompt_engineering" as const,
          label: "Zieldefinition",
          question: "Was ist das Ziel?",
          rationale: "Erforderlich.",
          inputType: "free_text" as const,
          tier: "REQUIRED" as const,
          classificationReason: "Critical",
        },
      ],
      answers: {},
      status: "ACTIVE" as const,
      outcome: null,
      enrichedContent: null,
    };
    useAppStore.setState({
      missingInfoSessions: { [prompt.id]: session },
    });

    render(<DetailsPanel />);

    fireEvent.click(screen.getByText("✨ Optimieren"));

    // Neither gate nor optimizer should open
    expect(
      screen.queryByText("❓ Fehlende Informationen"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("✨ Prompt-Optimierung")).not.toBeInTheDocument();
  });
});
