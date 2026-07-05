// =============================================================================
// Tests: promptAudioSummary — Safe Audio Summary Generation
// Issue #200
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  createPromptAudioSummary,
  sanitizeForAudio,
} from "@/lib/promptAudioSummary";
import type { PromptItem, PromptHygiene, BlueprintDetectOutput } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePrompt(overrides?: Partial<PromptItem>): PromptItem {
  return {
    id: "test-1",
    file_path: "/vault/test-prompt.md",
    file_name: "test-prompt.md",
    title: "Test-Prompt",
    description: "Ein Test-Prompt zur Überprüfung der Code-Qualität.",
    category: "Testing",
    version: "1.0.0",
    tags: ["Test", "Qualität", "Review"],
    content:
      "# Test-Prompt\n\nDieser Prompt dient zum Testen von Software-Komponenten.\n\n- Führt automatisierte Tests aus\n- Prüft Code-Qualität\n- Erstellt Test-Report",
    raw_frontmatter: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    is_favorite: false,
    ...overrides,
  };
}

function makeCriticalHygiene(): PromptHygiene {
  return {
    id: "hyg-2",
    prompt_id: "test-1",
    hygiene_score: 10,
    status: "critical",
    artifacts: [
      {
        id: "art-1",
        category: "SECRET",
        severity: "critical",
        match: "sk-abc123...",
        line: 1,
        column: 0,
        replacement_suggestion: null,
      },
    ],
    analyzed_at: "2026-01-01T00:00:00Z",
  };
}

function makeWarningHygiene(): PromptHygiene {
  return {
    id: "hyg-3",
    prompt_id: "test-1",
    hygiene_score: 60,
    status: "warning",
    artifacts: [
      {
        id: "art-2",
        category: "FILE_PATH",
        severity: "warning",
        match: "/home/user/file.txt",
        line: 3,
        column: 0,
        replacement_suggestion: null,
      },
    ],
    analyzed_at: "2026-01-01T00:00:00Z",
  };
}

function makeBlockedDetection(): BlueprintDetectOutput {
  return {
    content_class: "PROMPT",
    blueprint_type: null,
    contamination_status: "BLOCKING_SENSITIVE_CONTENT",
    confidence: 1.0,
    prompt_signals: [],
    blueprint_signals: [],
    contamination_signals: ["secret_found"],
  };
}

// ---------------------------------------------------------------------------
// Tests: Summary Generation
// ---------------------------------------------------------------------------

describe("createPromptAudioSummary", () => {
  it("should use description when available", () => {
    const prompt = makePrompt({
      description: "Dieser Prompt validiert die Eingabedaten auf Korrektheit.",
    });
    const result = createPromptAudioSummary({ prompt });

    expect(result.text).toContain("Test-Prompt");
    expect(result.text).toContain("validiert die Eingabedaten");
    expect(result.severity).toBe("normal");
    expect(result.source).toBe("description");
    expect(result.canSpeak).toBe(true);
  });

  it("should fallback to metadata when no description", () => {
    const prompt = makePrompt({
      description: "",
      category: "Analyse",
      tags: ["Security", "Audit"],
    });

    const result = createPromptAudioSummary({ prompt });

    expect(result.text).toContain("Test-Prompt");
    expect(result.text).toContain("Kategorie Analyse");
    expect(result.source).toBe("metadata");
    expect(result.canSpeak).toBe(true);
  });

  it("should fallback to content when no metadata available", () => {
    const prompt = makePrompt({
      title: "",
      description: "",
      category: "Unkategorisiert",
      tags: [],
      content: "# Test\nSome content here for testing purposes.",
    });

    const result = createPromptAudioSummary({ prompt });

    expect(result.text).toContain("Inhaltsauszug");
    expect(result.source).toBe("content_fallback");
    expect(result.canSpeak).toBe(true);
  });

  it("should not exceed maximum length", () => {
    const longDesc = "A".repeat(1000);
    const prompt = makePrompt({ description: longDesc });

    const result = createPromptAudioSummary({ prompt });

    expect(result.text.length).toBeLessThanOrEqual(510); // 500 + small buffer
  });

  it("should block audio for critical hygiene", () => {
    const prompt = makePrompt();
    const hygiene = makeCriticalHygiene();

    const result = createPromptAudioSummary({ prompt, hygiene });

    expect(result.severity).toBe("blocked");
    expect(result.canSpeak).toBe(false);
    expect(result.source).toBe("safety_fallback");
    expect(result.text).toContain("Sicherheitsgründen");
  });

  it("should set warning severity for warning hygiene", () => {
    const prompt = makePrompt({ description: "Ein Test-Prompt." });
    const hygiene = makeWarningHygiene();

    const result = createPromptAudioSummary({ prompt, hygiene });

    expect(result.severity).toBe("warning");
    expect(result.canSpeak).toBe(true);
    expect(result.text).toContain("Achtung");
  });

  it("should block audio for BLOCKING_SENSITIVE_CONTENT", () => {
    const prompt = makePrompt();
    const blueprintDetection = makeBlockedDetection();

    const result = createPromptAudioSummary({ prompt, blueprintDetection });

    expect(result.severity).toBe("blocked");
    expect(result.canSpeak).toBe(false);
  });

  it("should handle empty content gracefully", () => {
    const prompt = makePrompt({
      description: "",
      content: "",
      category: "Unkategorisiert",
      tags: [],
    });

    const result = createPromptAudioSummary({ prompt });

    expect(result.text).toBeTruthy();
    expect(result.canSpeak).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests: Sanitizing
// ---------------------------------------------------------------------------

describe("sanitizeForAudio", () => {
  it("should mask API keys (sk- format)", () => {
    const input = "Verwende den Key sk-abc123def456ghi789jkl012mno345pqr678stu";
    const result = sanitizeForAudio(input);
    expect(result).not.toMatch(/sk-abc/);
    expect(result).toContain("[API-Key]");
  });

  it("should mask email addresses", () => {
    const input = "Kontakt: test@example.com für Support.";
    const result = sanitizeForAudio(input);
    expect(result).not.toContain("test@example.com");
    expect(result).toContain("[E-Mail]");
  });

  it("should mask absolute Unix paths", () => {
    const input = "Die Datei liegt unter /home/user/data/config.json.";
    const result = sanitizeForAudio(input);
    expect(result).not.toContain("/home/user");
    expect(result).toContain("[Pfad]");
  });

  it("should mask absolute Windows paths", () => {
    const input = "Pfad: C:\\Users\\Admin\\Documents\\file.txt";
    const result = sanitizeForAudio(input);
    expect(result).toContain("[Pfad]");
  });

  it("should mask URLs with token parameters", () => {
    const input = "API: https://api.example.com/v1?token=abc123&key=secret";
    const result = sanitizeForAudio(input);
    expect(result).toContain("[URL-mit-Token]");
  });

  it("should mask code blocks", () => {
    const input =
      "Text vorher ```js\nconst x = 1;\nconsole.log(x);\n``` Text danach";
    const result = sanitizeForAudio(input);
    expect(result).not.toContain("```");
    expect(result).toContain("[Code-Block]");
  });

  it("should mask long hashes", () => {
    const input = "Commit: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0";
    const result = sanitizeForAudio(input);
    expect(result).toContain("[Hash]");
  });

  it("should mask private keys", () => {
    const input =
      "Key: -----BEGIN RSA PRIVATE KEY-----\nsomekeydata\n-----END RSA PRIVATE KEY-----";
    const result = sanitizeForAudio(input);
    expect(result).not.toContain("BEGIN RSA");
    expect(result).toContain("[Private-Key]");
  });

  it("should mask long lines", () => {
    const longLine = "x".repeat(250);
    const result = sanitizeForAudio(longLine);
    expect(result).toContain("[Langer-Text]");
  });

  it("should remove stacktrace lines", () => {
    const input =
      "Error occurred:\n    at Object.<anonymous> (/app/test.js:10:5)\n    at Module._compile (internal/modules/cjs/loader.js)\nEnd of message.";
    const result = sanitizeForAudio(input);
    expect(result).not.toMatch(/at Object/);
  });

  it("should mask JSON dumps with sensitive fields", () => {
    const input = 'Config: {"id":"123","token":"abc","secret":"xyz"}';
    const result = sanitizeForAudio(input);
    expect(result).toContain("[JSON]");
  });

  it("should truncate very long text", () => {
    const long = "A".repeat(600);
    const result = sanitizeForAudio(long);
    expect(result.length).toBeLessThanOrEqual(500);
  });
});
