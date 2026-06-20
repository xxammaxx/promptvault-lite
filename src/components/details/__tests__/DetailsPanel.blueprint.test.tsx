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
