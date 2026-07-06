// =============================================================================
// PromptVault Lite — Paste Prompt Analysis Adapter Tests
// =============================================================================

import { describe, it, expect } from "vitest";
import { analyzePastedPrompt } from "../pastePromptAnalysis";

// =============================================================================
// Test Fixtures — synthetic content only, no real prompts
// =============================================================================

const SYNTHETIC_PROMPT = `## Role
You are a code review assistant.

## Task
Review the given TypeScript code for security issues.

## Output Format
Return a JSON object with findings, severity, and fix suggestions.

## Constraints
- Only report confirmed issues
- Do not use external APIs`;

const SYNTHETIC_PROMPT_WITH_SECRET = `## Role
You are a helpful assistant.

## Task
Deploy the application to production.

## Credentials
API_KEY: "sk-abcdef1234567890abcdef1234567890"
secret: "my-super-secret-token"
`;

// =============================================================================
// Unit Tests
// =============================================================================

describe("analyzePastedPrompt", () => {
  // --- Validation ---

  it("returns validation error for empty input", () => {
    const result = analyzePastedPrompt({ content: "" });
    expect(result).toHaveProperty("type", "VALIDATION_ERROR");
    if ("type" in result) {
      expect(result.message).toContain("füge");
    }
  });

  it("returns validation error for whitespace-only input", () => {
    const result = analyzePastedPrompt({ content: "   \n  \t  " });
    expect(result).toHaveProperty("type", "VALIDATION_ERROR");
  });

  it("returns validation error for newline-only input", () => {
    const result = analyzePastedPrompt({ content: "\n\n\n" });
    expect(result).toHaveProperty("type", "VALIDATION_ERROR");
  });

  // --- Normal analysis ---

  it("analyses a valid synthetic prompt", () => {
    const result = analyzePastedPrompt({ content: SYNTHETIC_PROMPT });
    expect(result).not.toHaveProperty("type");
    if (!("type" in result)) {
      expect(result.contentLength).toBeGreaterThan(0);
      expect(result.contentClass).toBeDefined();
      expect(result.contextEvaluation).toBeDefined();
      expect(result.persisted).toBe(false);
    }
  });

  it("returns a content class for a synthetic prompt", () => {
    const result = analyzePastedPrompt({ content: SYNTHETIC_PROMPT });
    if (!("type" in result)) {
      expect(result.contentClass.content_class).toBeDefined();
      expect(typeof result.contentClass.content_class).toBe("string");
    }
  });

  it("returns a context evaluation with score fields", () => {
    const result = analyzePastedPrompt({ content: SYNTHETIC_PROMPT });
    if (!("type" in result)) {
      const ctx = result.contextEvaluation;
      expect(typeof ctx.prompt_engineering_score).toBe("number");
      expect(typeof ctx.context_engineering_score).toBe("number");
      expect(typeof ctx.robustness_score).toBe("number");
      expect(typeof ctx.overall_score).toBe("number");
      expect(ctx.detected_prompt_type).toBeDefined();
    }
  });

  // --- Secret-like content ---

  it("detects potential secrets in synthetic content", () => {
    const result = analyzePastedPrompt({
      content: SYNTHETIC_PROMPT_WITH_SECRET,
    });
    if (!("type" in result)) {
      // Should have contamination signals due to API_KEY and secret patterns
      const warnings = result.warnings.filter((w) =>
        w.toLowerCase().includes("sensib"),
      );
      expect(warnings.length).toBeGreaterThan(0);
    }
  });

  // --- Persistence assertion ---

  it("always returns persisted: false", () => {
    const result = analyzePastedPrompt({ content: SYNTHETIC_PROMPT });
    if (!("type" in result)) {
      expect(result.persisted).toBe(false);
    }

    const result2 = analyzePastedPrompt({ content: "hello world" });
    if (!("type" in result2)) {
      expect(result2.persisted).toBe(false);
    }
  });

  it("does not require any file ID", () => {
    // The function only takes content — no file path, no prompt ID
    const result = analyzePastedPrompt({
      content: "This is a standalone synthetic test prompt for analysis.",
    });
    // Should succeed without any ID field
    if (!("type" in result)) {
      expect(result.contentLength).toBeGreaterThan(0);
    }
  });

  // --- Large input ---

  it("handles large synthetic input safely", () => {
    const largeContent = "This is a test sentence. ".repeat(2500); // ~65,000 chars
    const result = analyzePastedPrompt({ content: largeContent });
    if (!("type" in result)) {
      expect(result.contentLength).toBeGreaterThan(50000);
      // Warning about size should be present
      const sizeWarnings = result.warnings.filter((w) =>
        w.toLowerCase().includes("lang"),
      );
      expect(sizeWarnings.length).toBeGreaterThan(0);
    }
  });

  // --- Warnings count ---

  it("returns no contamination warnings for clean synthetic content", () => {
    const result = analyzePastedPrompt({
      content: "This is a simple standalone test sentence.",
    });
    if (!("type" in result)) {
      const contaminationWarnings = result.warnings.filter(
        (w) =>
          w.toLowerCase().includes("kontaminat") ||
          w.toLowerCase().includes("sensib"),
      );
      expect(contaminationWarnings.length).toBe(0);
    }
  });
});
