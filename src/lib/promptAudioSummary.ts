// =============================================================================
// PromptVault Lite — Sichere Kurzbeschreibung für Audio-Ausgabe (Issue #200)
// =============================================================================
//
// Erzeugt eine kurze, sichere deutsche Zusammenfassung für einen Prompt.
// Die Zusammenfassung wird vor der Audioausgabe und Anzeige sanitized.
// Keine vollständigen Prompt-Inhalte, keine sensiblen Daten.
// =============================================================================

import type {
  PromptItem,
  PromptEvaluation,
  PromptHygiene,
  BlueprintDetectOutput,
  BlueprintEvaluation,
} from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PromptAudioSummaryInput {
  prompt: PromptItem;
  evaluation?: PromptEvaluation | null;
  hygiene?: PromptHygiene | null;
  blueprintDetection?: BlueprintDetectOutput | null;
  blueprintEvaluation?: BlueprintEvaluation | null;
}

export interface PromptAudioSummaryResult {
  text: string;
  severity: "normal" | "warning" | "blocked";
  source: "description" | "metadata" | "content_fallback" | "safety_fallback";
  canSpeak: boolean;
}

// Maximum length of the summary in characters (German text)
const MAX_SUMMARY_LENGTH = 500;

// ---------------------------------------------------------------------------
// Sanitizing
// ---------------------------------------------------------------------------

/**
 * Patterns to sanitize before audio output.
 * These patterns catch secrets, tokens, paths, and code artifacts
 * that should never be spoken aloud.
 */
const SANITIZE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Private SSH/PGP keys (most specific — match first)
  {
    pattern:
      /-----BEGIN [A-Z ]+ PRIVATE KEY-----[^]*?-----END [A-Z ]+ PRIVATE KEY-----/g,
    replacement: "[Private-Key]",
  },
  // Code fenced blocks
  { pattern: /```[\s\S]*?```/g, replacement: " [Code-Block] " },
  // API keys with known prefix patterns
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, replacement: "[API-Key]" },
  // URLs with token parameters (more specific than general URL)
  {
    pattern:
      /https?:\/\/\S*(?:token|key|secret|auth|password|api_key)=[^&\s]+/gi,
    replacement: "[URL-mit-Token]",
  },
  // Email addresses
  {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: "[E-Mail]",
  },
  // Absolute local paths (Unix and Windows)
  {
    pattern: /(?:\/(?:home|Users|tmp|etc|var|opt|usr)\/\S+)/g,
    replacement: "[Pfad]",
  },
  { pattern: /(?:[A-Z]:\\\S+)/g, replacement: "[Pfad]" },
  // JSON dumps with sensitive fields
  {
    pattern: /\{[^{}]*"(?:id|token|key|secret|password|hash)"[^{}]*\}/gi,
    replacement: "[JSON]",
  },
  // Long hex hashes (40+ hex chars) — before general long tokens
  { pattern: /\b[a-f0-9]{40,}\b/gi, replacement: "[Hash]" },
  // Stacktraces / log lines (common patterns)
  { pattern: /^\s*(?:at |File |\s+at ).*$/gm, replacement: " " },
  {
    pattern: /^\s*(?:ERROR|WARN|INFO|DEBUG|TRACE|FATAL)\b.*$/gm,
    replacement: " ",
  },
  // Very long lines (200+ non-newline) — before general long token pattern
  { pattern: /[^\n]{200,}/g, replacement: " [Langer-Text] " },
  // Generic long tokens (API keys, tokens without prefix)
  { pattern: /[a-zA-Z0-9_-]{32,}/g, replacement: "[Token]" },
];

/**
 * Check if content contains blocking-sensitive information.
 * Returns true if content should be blocked from audio.
 */
function isContentBlocked(
  hygiene?: PromptHygiene | null,
  blueprintDetection?: BlueprintDetectOutput | null,
): boolean {
  // Check hygiene status
  if (hygiene?.status === "critical") return true;

  // Check blueprint contamination
  if (
    blueprintDetection?.contamination_status === "BLOCKING_SENSITIVE_CONTENT"
  ) {
    return true;
  }

  return false;
}

/**
 * Sanitize text for safe audio output.
 * Applies all sanitize patterns and cleans up whitespace.
 * Returns sanitized text.
 */
export function sanitizeForAudio(text: string): string {
  let sanitized = text;

  for (const { pattern, replacement } of SANITIZE_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  // Collapse multiple spaces and trim
  sanitized = sanitized.replace(/\s{2,}/g, " ").trim();

  // Truncate if still too long
  if (sanitized.length > MAX_SUMMARY_LENGTH) {
    sanitized = sanitized.slice(0, MAX_SUMMARY_LENGTH - 3) + "...";
  }

  return sanitized;
}

// ---------------------------------------------------------------------------
// Summary Generation
// ---------------------------------------------------------------------------

/**
 * Build a description-based summary from PromptItem metadata.
 * This is the preferred source — it uses the prompt's own description.
 */
function buildDescriptionSummary(prompt: PromptItem): string {
  const desc = prompt.description.trim();
  if (desc && desc.length >= 10) {
    return `${prompt.title} – ${desc}`;
  }
  return "";
}

/**
 * Build a metadata-based summary from title, category, and tags.
 * Fallback when no description is available.
 */
function buildMetadataSummary(prompt: PromptItem): string {
  const parts: string[] = [];

  if (prompt.title) {
    parts.push(prompt.title);
  }

  if (prompt.category && prompt.category !== "Unkategorisiert") {
    parts.push(`aus der Kategorie ${prompt.category}`);
  }

  const cleanTags = prompt.tags.filter((t) => t && !t.match(/^[a-f0-9]{8,}$/i));
  if (cleanTags.length > 0) {
    parts.push(`mit Schlagworten: ${cleanTags.slice(0, 3).join(", ")}`);
  }

  if (parts.length === 0) {
    return "";
  }

  return parts.join(", ") + ".";
}

/**
 * Build a minimal content-based summary from the first meaningful lines.
 * Last-resort fallback. Never includes full content.
 */
function buildContentFallbackSummary(prompt: PromptItem): string {
  const content = prompt.content;
  const lines = content.split("\n").filter((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.startsWith("```")) return false;
    if (trimmed.startsWith("#")) return true;
    if (trimmed.startsWith("- ")) return true;
    if (trimmed.length > 5 && trimmed.length < 200) return true;
    return false;
  });

  if (lines.length === 0) {
    return `Prompt "${prompt.title}" – Inhalt bitte manuell prüfen.`;
  }

  const snippet = lines.slice(0, 2).join(" ").trim();
  const truncated =
    snippet.length > 200 ? snippet.slice(0, 197) + "..." : snippet;
  return `Prompt "${prompt.title}" – Inhaltsauszug: ${truncated}`;
}

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Create a safe, short German audio summary for a prompt.
 *
 * Priority:
 * 1. Description (if present and meaningful)
 * 2. Metadata (title, category, tags)
 * 3. Content fallback (first safe lines of content)
 * 4. Safety fallback (generic blocked message)
 *
 * The result is always sanitized before being returned.
 * Sensitive content is blocked or masked.
 */
export function createPromptAudioSummary(
  input: PromptAudioSummaryInput,
): PromptAudioSummaryResult {
  const { prompt, hygiene, blueprintDetection } = input;

  // --- Gate: blocked content ---
  if (isContentBlocked(hygiene, blueprintDetection)) {
    return {
      text: "Dieser Inhalt wird aus Sicherheitsgründen nicht vorgelesen. Bitte prüfen Sie die Quelldatei manuell.",
      severity: "blocked",
      source: "safety_fallback",
      canSpeak: false,
    };
  }

  // --- Gate: warning-level hygiene ---
  const hasWarning =
    hygiene?.status === "warning" ||
    blueprintDetection?.contamination_status === "CONTAMINATED_NEEDS_REVIEW" ||
    blueprintDetection?.contamination_status === "POSSIBLE_CONTAMINATION";

  // --- Build summary from best available source ---
  let text: string;
  let source: PromptAudioSummaryResult["source"];

  // Prefer description
  const descSummary = buildDescriptionSummary(prompt);
  if (descSummary) {
    text = descSummary;
    source = "description";
  } else {
    // Try metadata
    const metaSummary = buildMetadataSummary(prompt);
    if (metaSummary) {
      text = metaSummary;
      source = "metadata";
    } else {
      // Last resort: content fallback
      const contentFallback = buildContentFallbackSummary(prompt);
      if (contentFallback) {
        text = contentFallback;
        source = "content_fallback";
      } else {
        // Ultimate fallback — nothing useful available
        text = "Keine Beschreibung vorhanden – bitte manuell prüfen.";
        source = "metadata";
      }
    }
  }

  // --- Sanitize ---
  text = sanitizeForAudio(text);

  // --- Truncate to max length ---
  if (text.length > MAX_SUMMARY_LENGTH) {
    text = text.slice(0, MAX_SUMMARY_LENGTH - 3) + "...";
  }

  // --- Warning prefix ---
  if (hasWarning) {
    const warningPrefix =
      "Achtung: Dieser Prompt enthält mögliche Fremdartefakte oder sensible technische Details. ";
    // Only add prefix if it fits within max length
    if ((warningPrefix + text).length <= MAX_SUMMARY_LENGTH) {
      text = warningPrefix + text;
    }
  }

  return {
    text,
    severity: hasWarning ? "warning" : "normal",
    source,
    canSpeak: true,
  };
}
