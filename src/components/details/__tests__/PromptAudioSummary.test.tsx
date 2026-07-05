// =============================================================================
// Tests: PromptAudioSummary Component
// Issue #200
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PromptAudioSummary } from "@/components/details/PromptAudioSummary";

// ---------------------------------------------------------------------------
// Simple mock state (plain values, no vi.fn wrapping issues)
// ---------------------------------------------------------------------------

let selectedPromptVal: ReturnType<typeof makePrompt> | null = null;
let selectedEvaluationVal: unknown = null;
let selectedHygieneVal: unknown = null;
let selectedBlueprintDetectionVal: unknown = null;
let selectedBlueprintEvaluationVal: unknown = null;

const mockStoreState = {
  get selectedPrompt() {
    return () => selectedPromptVal;
  },
  get selectedEvaluation() {
    return () => selectedEvaluationVal;
  },
  get selectedHygiene() {
    return () => selectedHygieneVal;
  },
  get selectedBlueprintDetection() {
    return () => selectedBlueprintDetectionVal;
  },
  get selectedBlueprintEvaluation() {
    return () => selectedBlueprintEvaluationVal;
  },
};

vi.mock("@/stores/appStore", () => ({
  useAppStore: (selector: (s: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
}));

// ---------------------------------------------------------------------------
// Mock Speech Synthesis
// ---------------------------------------------------------------------------

function mockSpeechSynthesis() {
  const mockSynth = {
    speaking: false,
    pending: false,
    getVoices: vi.fn(() => [
      {
        lang: "de-DE",
        name: "German",
        default: false,
        localService: true,
        voiceURI: "de",
      },
    ]),
    speak: vi.fn(
      (utterance: {
        onstart?: (() => void) | null;
        onend?: (() => void) | null;
      }) => {
        mockSynth.speaking = true;
        utterance.onstart?.();
        mockSynth.speaking = false;
        utterance.onend?.();
      },
    ),
    cancel: vi.fn(() => {
      mockSynth.speaking = false;
    }),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  (window as any).speechSynthesis = mockSynth;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  (globalThis as any).SpeechSynthesisUtterance = vi.fn((text: string) => ({
    lang: "",
    text,
    voice: null,
    onstart: null as (() => void) | null,
    onend: null as (() => void) | null,
    onerror: null as ((e: unknown) => void) | null,
  }));

  return mockSynth;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePrompt(overrides = {}) {
  return {
    id: "test-1",
    file_path: "/vault/test.md",
    file_name: "test.md",
    title: "Test-Prompt",
    description: "Ein Test-Prompt für automatisierte Tests.",
    category: "Test",
    version: "1.0.0",
    tags: ["Test"],
    content: "# Header\nTest content for summary generation.",
    raw_frontmatter: {},
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    is_favorite: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  selectedPromptVal = null;
  selectedEvaluationVal = null;
  selectedHygieneVal = null;
  selectedBlueprintDetectionVal = null;
  selectedBlueprintEvaluationVal = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PromptAudioSummary", () => {
  it("renders nothing when no prompt is selected", () => {
    selectedPromptVal = null;

    const { container } = render(<PromptAudioSummary />);

    expect(container.firstChild).toBeNull();
  });

  it("displays the summary text when a prompt is selected", () => {
    selectedPromptVal = makePrompt();
    mockSpeechSynthesis();

    render(<PromptAudioSummary />);

    // Summary should contain the prompt title and description
    expect(screen.getByText(/Test-Prompt/)).toBeTruthy();
  });

  it('shows "Kurz vorlesen" button when TTS is available', async () => {
    selectedPromptVal = makePrompt();
    mockSpeechSynthesis();

    render(<PromptAudioSummary />);

    // Wait for async TTS detection to complete and React to re-render
    const button = await screen.findByText(
      "🔊 Kurz vorlesen",
      {},
      { timeout: 3000 },
    );
    expect(button).toBeTruthy();
  });

  it("shows stop button after clicking speak", async () => {
    selectedPromptVal = makePrompt();
    mockSpeechSynthesis();

    render(<PromptAudioSummary />);

    const speakButton = await screen.findByText(
      "🔊 Kurz vorlesen",
      {},
      { timeout: 3000 },
    );
    fireEvent.click(speakButton);

    // Button should change to Stop (with synchronous mock, this happens immediately)
    await waitFor(() => {
      expect(screen.getByText("⏹ Stoppen")).toBeTruthy();
    });
  });

  it("shows blocked message when content is critical", () => {
    selectedPromptVal = makePrompt();
    selectedHygieneVal = {
      status: "critical",
      hygiene_score: 10,
    };
    mockSpeechSynthesis();

    render(<PromptAudioSummary />);

    expect(
      screen.getByText(/Audioausgabe aus Sicherheitsgründen deaktiviert/),
    ).toBeTruthy();
    expect(screen.queryByText("🔊 Kurz vorlesen")).toBeNull();
  });

  it("shows TTS unavailable message when no provider", async () => {
    selectedPromptVal = makePrompt();
    // No speech synthesis available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    delete (window as any).speechSynthesis;

    render(<PromptAudioSummary />);

    await waitFor(() => {
      expect(screen.getByText(/Kein TTS-Provider verfügbar/)).toBeTruthy();
    });
  });

  it("has ARIA landmarks", () => {
    selectedPromptVal = makePrompt();
    mockSpeechSynthesis();

    render(<PromptAudioSummary />);

    const region = screen.getByRole("region", {
      name: "Audio-Kurzbeschreibung",
    });
    expect(region).toBeTruthy();
  });

  it("uses prompt description in summary", () => {
    selectedPromptVal = makePrompt({
      description: "Dies ist eine spezielle Test-Beschreibung.",
    });
    mockSpeechSynthesis();

    render(<PromptAudioSummary />);

    expect(screen.getByText(/Test-Beschreibung/)).toBeTruthy();
  });

  it("renders fallback summary even with empty prompt data", () => {
    selectedPromptVal = makePrompt({
      title: "",
      description: "",
      content: "",
    });
    mockSpeechSynthesis();

    render(<PromptAudioSummary />);

    // Component still renders (it has fallback logic)
    expect(screen.getByRole("region")).toBeTruthy();
  });
});
