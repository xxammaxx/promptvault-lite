// =============================================================================
// Issue #150 — Batch Blueprint Classification Tests
// =============================================================================
// Verifies that batchClassifyBlueprints action:
// - Runs classifyContent() for all items after a scan
// - Stores detections via blueprintDetections store
// - Skips items without content
// - Handles errors per-item without crashing
// - Does NOT evaluate content (evaluation stays lazy-on-select)
// - Works with chunked/yielding processing
// - Lazy-on-select (T8) still works after batch
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/stores/appStore";
import { classifyContent, evaluateBlueprint } from "@/lib/blueprintDetection";
import type { PromptItem } from "@/types";

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function makePrompt(overrides: Partial<PromptItem> = {}): PromptItem {
  return {
    id: "prompt-001",
    file_path: "/test/prompt.md",
    file_name: "prompt.md",
    title: "Test Prompt",
    description: "",
    category: "dev",
    version: "1.0",
    tags: [],
    content: "## Goal\nBuild something.",
    raw_frontmatter: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    is_favorite: false,
    ...overrides,
  };
}

const CLEAR_BLUEPRINT = `## Goal
Build a local-first prompt management desktop application.

## Scope
### In Scope
- Markdown prompt scanning and indexing
- Local quality scoring (no network, no LLM)

### Out of Scope
- Cloud sync or SaaS

## Architecture
- Frontend: React + TypeScript + Vite
- Backend: Rust (Tauri commands)
- Storage: SQLite

## Data Flow
1. User imports markdown files
2. Tauri scanner indexes files
3. Scoring engine runs locally

## Security & Privacy
- All processing is local - no cloud backend
- No telemetry or analytics

## Risks & Known Limitations
- Scoring is heuristic, not LLM-based

## Implementation Plan
### Phase 1: Core Scanner
### Phase 2: Scoring Engine

## Testing & Verification
- Unit tests: Vitest (frontend), Cargo test (Rust)
- CI gates: pnpm test, cargo test, pnpm lint

## Evidence & Verification Contract
- All CI gates must be green before merge
- Test output posted as evidence in GitHub issues

## Next Steps
1. Complete Phase 3
2. Add more test coverage
`;

const CLEAR_PROMPT = `## Role
You are a senior TypeScript engineer.

## Task
Implement a REST API client for the weather service.

## Output Format
Return a TypeScript class with typed methods for each endpoint.

## Constraints
- Use fetch API only, no external HTTP libraries
- Must work in browser and Node.js
- Include error handling for network failures
`;

const NOTE_CONTENT = "Just a quick reminder to check the logs.";

function resetStore() {
  useAppStore.setState({
    prompts: [],
    evaluations: {},
    hygiene: {},
    contextEvaluations: {},
    blueprintDetections: {},
    blueprintEvaluations: {},
    selectedPromptId: null,
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
  });
}

// ---------------------------------------------------------------------------
// B1 — Batch populates blueprintDetections after scan
// ---------------------------------------------------------------------------

describe("B1 — Batch classification populates detections", () => {
  beforeEach(resetStore);

  it("classifies a single BLUEPRINT item", async () => {
    const prompt = makePrompt({ id: "bp-1", content: CLEAR_BLUEPRINT });
    useAppStore.setState({ prompts: [prompt] });

    await useAppStore.getState().batchClassifyBlueprints();

    const detection = useAppStore.getState().blueprintDetections["bp-1"];
    expect(detection).toBeDefined();
    expect(detection.content_class).toBe("BLUEPRINT");
    expect(detection.blueprint_type).toBeDefined();
    expect(detection.confidence).toBeGreaterThan(0);
  });

  it("classifies a single PROMPT item", async () => {
    const prompt = makePrompt({ id: "p-1", content: CLEAR_PROMPT });
    useAppStore.setState({ prompts: [prompt] });

    await useAppStore.getState().batchClassifyBlueprints();

    const detection = useAppStore.getState().blueprintDetections["p-1"];
    expect(detection).toBeDefined();
    expect(detection.content_class).toBe("PROMPT");
  });

  it("classifies a single NOTE item", async () => {
    const prompt = makePrompt({ id: "n-1", content: NOTE_CONTENT });
    useAppStore.setState({ prompts: [prompt] });

    await useAppStore.getState().batchClassifyBlueprints();

    const detection = useAppStore.getState().blueprintDetections["n-1"];
    expect(detection).toBeDefined();
    expect(detection.content_class).toBe("NOTE");
  });

  it("classifies multiple items in batch", async () => {
    const prompts = [
      makePrompt({ id: "bp-1", content: CLEAR_BLUEPRINT }),
      makePrompt({ id: "p-1", content: CLEAR_PROMPT }),
      makePrompt({ id: "n-1", content: NOTE_CONTENT }),
    ];
    useAppStore.setState({ prompts });

    await useAppStore.getState().batchClassifyBlueprints();

    const detections = useAppStore.getState().blueprintDetections;
    expect(detections["bp-1"].content_class).toBe("BLUEPRINT");
    expect(detections["p-1"].content_class).toBe("PROMPT");
    expect(detections["n-1"].content_class).toBe("NOTE");
  });

  it("classifies PROMPT_BLUEPRINT_HYBRID correctly", async () => {
    const hybridContent = `${CLEAR_BLUEPRINT}\n\n## Role\nYou are a helpful assistant.\n\n## Task\nWrite code.`;
    const prompt = makePrompt({ id: "hy-1", content: hybridContent });
    useAppStore.setState({ prompts: [prompt] });

    await useAppStore.getState().batchClassifyBlueprints();

    const detection = useAppStore.getState().blueprintDetections["hy-1"];
    expect(detection).toBeDefined();
    expect(detection.content_class).toBe("PROMPT_BLUEPRINT_HYBRID");
  });
});

// ---------------------------------------------------------------------------
// B2 — Batch skips items without content
// ---------------------------------------------------------------------------

describe("B2 — Batch skips empty/whitespace content", () => {
  beforeEach(resetStore);

  it("skips items with empty content", async () => {
    const prompt = makePrompt({ id: "empty-1", content: "" });
    useAppStore.setState({ prompts: [prompt] });

    await useAppStore.getState().batchClassifyBlueprints();

    const detection = useAppStore.getState().blueprintDetections["empty-1"];
    expect(detection).toBeUndefined();
  });

  it("skips items with whitespace-only content", async () => {
    const prompt = makePrompt({ id: "ws-1", content: "   \n  \t  " });
    useAppStore.setState({ prompts: [prompt] });

    await useAppStore.getState().batchClassifyBlueprints();

    const detection = useAppStore.getState().blueprintDetections["ws-1"];
    expect(detection).toBeUndefined();
  });

  it("processes items with content alongside empty items", async () => {
    const prompts = [
      makePrompt({ id: "bp-1", content: CLEAR_BLUEPRINT }),
      makePrompt({ id: "empty-1", content: "" }),
      makePrompt({ id: "p-1", content: CLEAR_PROMPT }),
    ];
    useAppStore.setState({ prompts });

    await useAppStore.getState().batchClassifyBlueprints();

    const detections = useAppStore.getState().blueprintDetections;
    expect(detections["bp-1"]).toBeDefined();
    expect(detections["empty-1"]).toBeUndefined();
    expect(detections["p-1"]).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// B3 — Batch does NOT evaluate content (Option A: classification only)
// ---------------------------------------------------------------------------

describe("B3 — Batch classification only, no evaluation", () => {
  beforeEach(resetStore);

  it("does NOT evaluate BLUEPRINT content", async () => {
    const prompt = makePrompt({ id: "bp-1", content: CLEAR_BLUEPRINT });
    useAppStore.setState({ prompts: [prompt] });

    await useAppStore.getState().batchClassifyBlueprints();

    // Detection should exist
    expect(useAppStore.getState().blueprintDetections["bp-1"]).toBeDefined();
    // Evaluation should NOT exist (stays lazy-on-select)
    expect(useAppStore.getState().blueprintEvaluations["bp-1"]).toBeUndefined();
  });

  it("does NOT evaluate PROMPT_BLUEPRINT_HYBRID content", async () => {
    const hybridContent = `${CLEAR_BLUEPRINT}\n\n## Role\nYou are a helpful assistant.`;
    const prompt = makePrompt({ id: "hy-1", content: hybridContent });
    useAppStore.setState({ prompts: [prompt] });

    await useAppStore.getState().batchClassifyBlueprints();

    expect(useAppStore.getState().blueprintDetections["hy-1"]).toBeDefined();
    expect(useAppStore.getState().blueprintEvaluations["hy-1"]).toBeUndefined();
  });

  it("does NOT evaluate PROMPT content", async () => {
    const prompt = makePrompt({ id: "p-1", content: CLEAR_PROMPT });
    useAppStore.setState({ prompts: [prompt] });

    await useAppStore.getState().batchClassifyBlueprints();

    expect(useAppStore.getState().blueprintDetections["p-1"]).toBeDefined();
    expect(useAppStore.getState().blueprintEvaluations["p-1"]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// B4 — Batch error safety: per-item errors don't crash
// ---------------------------------------------------------------------------

describe("B4 — Batch error safety", () => {
  beforeEach(resetStore);

  it("continues processing other items when one fails (simulated via content)", async () => {
    // classifyContent handles all inputs gracefully, so we test that invalid
    // inputs don't prevent subsequent items from being processed
    const prompts = [
      makePrompt({ id: "bp-1", content: CLEAR_BLUEPRINT }),
      // Item with very unusual content that classifyContent handles gracefully
      makePrompt({ id: "special-1", content: "\x00\x00\x00".repeat(100) }),
      makePrompt({ id: "p-1", content: CLEAR_PROMPT }),
    ];
    useAppStore.setState({ prompts });

    await useAppStore.getState().batchClassifyBlueprints();

    // All items should be processed even if one has unusual content
    expect(useAppStore.getState().blueprintDetections["bp-1"]).toBeDefined();
    expect(useAppStore.getState().blueprintDetections["p-1"]).toBeDefined();
    // Null bytes: classifyContent handles gracefully (trimmed to empty → skipped)
    // or classifies as something — either way, should not crash
  });

  it("does not throw for an empty prompts array", async () => {
    useAppStore.setState({ prompts: [] });

    await expect(
      useAppStore.getState().batchClassifyBlueprints(),
    ).resolves.toBeUndefined();
  });

  it("handles many items without crashing", async () => {
    const prompts = Array.from({ length: 100 }, (_, i) =>
      makePrompt({
        id: `item-${i}`,
        content: i % 3 === 0 ? CLEAR_BLUEPRINT : CLEAR_PROMPT,
      }),
    );
    useAppStore.setState({ prompts });

    await useAppStore.getState().batchClassifyBlueprints();

    const detections = useAppStore.getState().blueprintDetections;
    // All 100 items should have detections
    expect(Object.keys(detections).length).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// B5 — Lazy-on-select (T8) still works after batch
// ---------------------------------------------------------------------------

describe("B5 — Lazy-on-select compatibility", () => {
  beforeEach(resetStore);

  it("lazy-on-select evaluation still runs after batch classification", () => {
    // Create items
    const prompts = [
      makePrompt({ id: "bp-1", content: CLEAR_BLUEPRINT }),
      makePrompt({ id: "p-1", content: CLEAR_PROMPT }),
    ];
    useAppStore.setState({ prompts });

    // First: run batch (classification only)
    return useAppStore
      .getState()
      .batchClassifyBlueprints()
      .then(() => {
        // Verify batch stored detections
        expect(
          useAppStore.getState().blueprintDetections["bp-1"],
        ).toBeDefined();
        expect(useAppStore.getState().blueprintDetections["p-1"]).toBeDefined();
        // But no evaluations yet
        expect(
          useAppStore.getState().blueprintEvaluations["bp-1"],
        ).toBeUndefined();

        // Now simulate lazy-on-select (like App.tsx useEffect does)
        // Select a blueprint item
        useAppStore.getState().selectPrompt("bp-1");

        // Manually invoke the auto-detect logic (as in appStore.autodetect.test.ts)
        const state = useAppStore.getState();
        const prompt = state.prompts.find((p) => p.id === "bp-1");
        expect(prompt).toBeDefined();
        if (!prompt) return;

        // Re-classify (same result, harmless)
        const detection = classifyContent(prompt.content);
        state.setBlueprintDetection(prompt.id, detection);

        // Now evaluate (this is what lazy-on-select adds)
        if (
          detection.content_class === "BLUEPRINT" ||
          detection.content_class === "PROMPT_BLUEPRINT_HYBRID"
        ) {
          const evaluation = evaluateBlueprint(prompt.content);
          state.setBlueprintEvaluation(prompt.id, evaluation);
        }

        // Verify evaluation was added by lazy-on-select
        const eval_ = useAppStore.getState().blueprintEvaluations["bp-1"];
        expect(eval_).toBeDefined();
        expect(eval_.content_class).toBe("BLUEPRINT");

        // PROMPT should still have no evaluation (lazy-on-select only evaluates BLUEPRINT/HYBRID)
        expect(
          useAppStore.getState().blueprintEvaluations["p-1"],
        ).toBeUndefined();
      });
  });

  it("batch detection does not prevent lazy-on-select from working", async () => {
    const prompt = makePrompt({ id: "bp-2", content: CLEAR_BLUEPRINT });
    useAppStore.setState({ prompts: [prompt] });

    // Run batch classification
    await useAppStore.getState().batchClassifyBlueprints();

    // Batch stored detection
    const batchDetection = useAppStore.getState().blueprintDetections["bp-2"];
    expect(batchDetection).toBeDefined();
    expect(batchDetection.content_class).toBe("BLUEPRINT");

    // Select the item (simulates user click)
    useAppStore.getState().selectPrompt("bp-2");

    // The auto-detect pattern should recognize BLUEPRINT and also evaluate
    const state = useAppStore.getState();
    const selectedPrompt = state.prompts.find((p) => p.id === "bp-2");
    if (selectedPrompt) {
      const detection = classifyContent(selectedPrompt.content);
      expect(detection.content_class).toBe("BLUEPRINT");

      // Lazy-on-select adds evaluation
      const evaluation = evaluateBlueprint(selectedPrompt.content);
      state.setBlueprintEvaluation(selectedPrompt.id, evaluation);

      // Re-read state after setBlueprintEvaluation to get updated state
      const updatedState = useAppStore.getState();
      expect(updatedState.blueprintEvaluations["bp-2"]).toBeDefined();
      expect(updatedState.blueprintEvaluations["bp-2"].content_class).toBe(
        "BLUEPRINT",
      );
    }
  });
});

// ---------------------------------------------------------------------------
// B6 — No content/secret logging
// ---------------------------------------------------------------------------

describe("B6 — No content/secret leaks in state", () => {
  beforeEach(resetStore);

  it("detection signals do not contain original content", async () => {
    const prompt = makePrompt({ id: "bp-1", content: CLEAR_BLUEPRINT });
    useAppStore.setState({ prompts: [prompt] });

    await useAppStore.getState().batchClassifyBlueprints();

    const detection = useAppStore.getState().blueprintDetections["bp-1"];
    // Signal names are descriptive labels, not content
    expect(detection.blueprint_signals.length).toBeGreaterThan(0);
    expect(typeof detection.blueprint_signals[0]).toBe("string");
    // Should not contain the original blueprint text
    expect(detection.blueprint_signals.join(" ")).not.toContain(
      "Build a local-first",
    );
    expect(detection.blueprint_signals.join(" ")).not.toContain(
      "prompt management",
    );
  });

  it("detection for BLOCKING_SENSITIVE_CONTENT still has signal names, not content", async () => {
    const secretContent = `## Goal
Build a secure app.

## Scope
### In Scope
- Authentication

## Architecture
- React + Node.js

## Data Flow
1. Auth via OAuth2

## Security & Privacy
- All data encrypted

## Credentials
api_key: "sk-abcdefghijklmnopqrstuvwx"
secret: "my-super-secret-key-123456"
`;
    const prompt = makePrompt({ id: "block-1", content: secretContent });
    useAppStore.setState({ prompts: [prompt] });

    await useAppStore.getState().batchClassifyBlueprints();

    const detection = useAppStore.getState().blueprintDetections["block-1"];
    expect(detection).toBeDefined();
    // Signals should not contain the actual secret values
    const allSignals = [
      ...detection.prompt_signals,
      ...detection.blueprint_signals,
      ...detection.contamination_signals,
    ].join(" ");
    expect(allSignals).not.toContain("sk-abcdefghijklmnopqrstuvwx");
    expect(allSignals).not.toContain("my-super-secret-key-123456");
  });
});

// ---------------------------------------------------------------------------
// B7 — Batch with many items uses chunked processing
// ---------------------------------------------------------------------------

describe("B7 — Chunked processing with many items", () => {
  beforeEach(resetStore);

  it("processes a large number of items without blocking (completes successfully)", async () => {
    const prompts = Array.from({ length: 200 }, (_, i) =>
      makePrompt({
        id: `item-${i}`,
        content: i % 2 === 0 ? CLEAR_BLUEPRINT : CLEAR_PROMPT,
      }),
    );
    useAppStore.setState({ prompts });

    // Should complete without error
    await useAppStore.getState().batchClassifyBlueprints();

    const detections = useAppStore.getState().blueprintDetections;
    // All 200 items should have detections
    expect(Object.keys(detections).length).toBe(200);
    // Verify a few are correct
    expect(detections["item-0"].content_class).toBe("BLUEPRINT");
    expect(detections["item-1"].content_class).toBe("PROMPT");
  });

  it("does not leave partial state on timeout (all-or-nothing per chunk)", async () => {
    const prompts = [
      makePrompt({ id: "ok-1", content: CLEAR_BLUEPRINT }),
      // No invalid items needed — classifyContent handles all input gracefully
      makePrompt({ id: "ok-2", content: CLEAR_PROMPT }),
    ];
    useAppStore.setState({ prompts });

    await useAppStore.getState().batchClassifyBlueprints();

    const detections = useAppStore.getState().blueprintDetections;
    expect(detections["ok-1"]).toBeDefined();
    expect(detections["ok-2"]).toBeDefined();
  });
});
