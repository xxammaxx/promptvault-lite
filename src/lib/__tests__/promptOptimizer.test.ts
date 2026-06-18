import { describe, it, expect } from "vitest";
import {
  optimizePrompt,
  containsUnresolvedPlaceholder,
  validateOptimizedPromptQuality,
} from "../promptOptimizer";
import type { OptimizationMode } from "@/types";

// =============================================================================
// Helper: extract consistent output for snapshot-like assertions
// =============================================================================

const samplePrompt = `# Meine Rolle

Du bist ein Senior Developer.

## Ziel

Schreibe guten Code.



## Anforderungen

*   Funktion soll sauber sein
+   Tests müssen laufen
-   Code muss dokumentiert sein

`;

const promptWithCodeBlock = `# Analyse-Prompt

Führe folgende Analyse durch:

\`\`\`python
def analyze(data):
    # TODO: implement
    pass
\`\`\`

## Ergebnis

Bitte gib das Ergebnis als JSON aus.`;

const germanPrompt = `# Übersetzungshilfe

Du bist ein Übersetzer für Deutsch.

## Ziel

Übersetze den folgenden Text ins Deutsche. Achte auf Umlaute: ä ö ü ß Ä Ö Ü.

## Anforderungen

* Verwende formelle Anrede (Sie)
* Berücksichtige kulturelle Besonderheiten
* Grüße aus Köln und München`;

const veryShortPrompt = "Hello";

// =============================================================================
// Tests
// =============================================================================

describe("optimizePrompt", () => {
  describe("input validation", () => {
    it("returns warning for empty input", () => {
      const result = optimizePrompt("", "conservative");
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toMatch(/leer|empty/i);
      expect(result.optimized).toBe("");
    });

    it("returns warning for very short input", () => {
      const result = optimizePrompt(veryShortPrompt, "conservative");
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toMatch(/kurz|short|brief/i);
    });

    it("handles whitespace-only input", () => {
      const result = optimizePrompt("   \n\n   \n", "conservative");
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.optimized.trim()).toBe("");
    });
  });

  describe("conservative mode", () => {
    it("collapses multiple blank lines to single blank line", () => {
      const result = optimizePrompt("Line 1\n\n\n\n\nLine 2", "conservative");
      expect(result.optimized).toBe("Line 1\n\nLine 2\n");
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it("trims trailing whitespace per line", () => {
      const result = optimizePrompt("text here   \nmore   \n", "conservative");
      expect(result.optimized).not.toMatch(/ +\n/);
    });

    it("normalizes list bullet markers to dash", () => {
      const result = optimizePrompt(
        "* item one\n+ item two\n- item three",
        "conservative",
      );
      const lines = result.optimized.split("\n");
      const bulletLines = lines.filter((l) => l.match(/^[-*+]\s/));
      for (const line of bulletLines) {
        expect(line).toMatch(/^- /);
      }
    });

    it("preserves fenced code blocks unchanged", () => {
      const input = "Before\n\n```js\nconst x = 1;\n```\n\nAfter";
      const result = optimizePrompt(input, "conservative");
      expect(result.optimized).toContain("const x = 1;");
      expect(result.optimized).toContain("```js");
    });

    it("preserves German umlauts", () => {
      const result = optimizePrompt(
        "Grüße aus Köln — äöüß ÄÖÜ",
        "conservative",
      );
      expect(result.optimized).toContain("Grüße");
      expect(result.optimized).toContain("Köln");
      expect(result.optimized).toContain("äöüß");
      expect(result.optimized).toContain("ÄÖÜ");
    });

    it("does not invent new content", () => {
      const result = optimizePrompt(samplePrompt, "conservative");
      // No section headers should appear that weren't in the original
      expect(result.optimized).not.toContain("<!-- TODO");
      // Original content should still be present
      expect(result.optimized).toContain("Senior Developer");
    });

    it("adds blank line before headings if missing", () => {
      const result = optimizePrompt("text\n## Heading", "conservative");
      expect(result.optimized).toContain("\n\n## Heading");
    });
  });

  describe("balanced mode", () => {
    it("includes all conservative changes plus structural additions", () => {
      const consResult = optimizePrompt(samplePrompt, "conservative");
      const balResult = optimizePrompt(samplePrompt, "balanced");
      // balanced should be a superset: everything conservative fixes plus more
      expect(balResult.changes.length).toBeGreaterThanOrEqual(
        consResult.changes.length,
      );
    });

    it("does NOT inject TODO placeholders for missing sections", () => {
      const input = "Write code for me";
      const result = optimizePrompt(input, "balanced");
      // balanced mode should NOT add structural placeholder sections with TODO
      expect(containsUnresolvedPlaceholder(result.optimized)).toBe(false);
      // Instead, it should warn about missing sections
      const sectionWarnings = result.warnings.filter((w) =>
        w.includes("Fehlende Sektion"),
      );
      expect(sectionWarnings.length).toBeGreaterThan(0);
    });

    it("reorders sections into canonical order", () => {
      // Input with sections in reverse order: Output first, Role last
      const input = `## Output Format
JSON

## Ziel
Analyze data

## Rolle
Data Scientist`;

      const result = optimizePrompt(input, "balanced");
      const roleIdx = result.optimized.indexOf("Rolle");
      const goalIdx = result.optimized.indexOf("Ziel");
      const outputIdx = result.optimized.indexOf("Output");

      // After reordering, Role should appear before Ziel, and Ziel before Output
      expect(roleIdx).toBeLessThan(goalIdx);
      expect(goalIdx).toBeLessThan(outputIdx);
    });

    it("standardizes heading levels to H2", () => {
      const input = "# Top Level\n### Deep Level";
      const result = optimizePrompt(input, "balanced");
      // Headings should be normalized to ##
      expect(result.optimized).toContain("## Top Level");
      expect(result.optimized).toContain("## Deep Level");
    });

    it("preserves fenced code blocks", () => {
      const result = optimizePrompt(promptWithCodeBlock, "balanced");
      expect(result.optimized).toContain("```python");
      expect(result.optimized).toContain("def analyze");
      expect(result.optimized).toContain("```");
    });

    it("preserves German umlauts during restructuring", () => {
      const result = optimizePrompt(germanPrompt, "balanced");
      expect(result.optimized).toContain("Übersetzer");
      expect(result.optimized).toContain("Grüße");
      expect(result.optimized).toContain("Köln");
      expect(result.optimized).toContain("München");
    });
  });

  describe("aggressive mode", () => {
    it("includes all balanced changes plus agentic scaffolding", () => {
      const balResult = optimizePrompt(samplePrompt, "balanced");
      const aggResult = optimizePrompt(samplePrompt, "aggressive");
      expect(aggResult.changes.length).toBeGreaterThanOrEqual(
        balResult.changes.length,
      );
    });

    it("adds agent workflow scaffolding", () => {
      const result = optimizePrompt("Write good code", "aggressive");
      // Should contain workflow steps
      expect(result.optimized).toMatch(/Issue|Spec|Verification/i);
    });

    it("adds context-engineering sections", () => {
      const result = optimizePrompt("Help me with my project", "aggressive");
      // Context engineering markers
      expect(result.optimized).toMatch(
        /Cold Context|Warm Context|Hot Context/i,
      );
    });

    it("includes Source of Truth section", () => {
      const result = optimizePrompt("Build a feature", "aggressive");
      expect(result.optimized).toMatch(/Source of Truth|source of truth/i);
    });

    it("includes Evidence / Verification Contract section", () => {
      const result = optimizePrompt("Fix a bug", "aggressive");
      expect(result.optimized).toMatch(/Evidence|Verification/i);
    });

    it("includes Human Approval gate", () => {
      const result = optimizePrompt("Deploy to production", "aggressive");
      expect(result.optimized).toMatch(/Human Approval|human approval/i);
    });

    it("preserves original content", () => {
      const input = "This is my specific instruction about database migration";
      const result = optimizePrompt(input, "aggressive");
      // Original text must be preserved somewhere
      expect(result.optimized).toContain("database migration");
    });

    it("preserves fenced code blocks", () => {
      const result = optimizePrompt(promptWithCodeBlock, "aggressive");
      expect(result.optimized).toContain("```python");
      expect(result.optimized).toContain("def analyze");
      expect(result.optimized).toContain("pass");
    });

    it("preserves German umlauts in complex restructuring", () => {
      const result = optimizePrompt(germanPrompt, "aggressive");
      expect(result.optimized).toContain("Übersetzungshilfe");
      expect(result.optimized).toContain("ä ö ü ß");
    });
  });

  describe("cross-mode behaviors", () => {
    it("produces three distinct results for the same input", () => {
      const input = "Help me write better documentation";
      const conservative = optimizePrompt(input, "conservative").optimized;
      const balanced = optimizePrompt(input, "balanced").optimized;
      const aggressive = optimizePrompt(input, "aggressive").optimized;

      expect(conservative).not.toBe(balanced);
      expect(balanced).not.toBe(aggressive);
      expect(conservative).not.toBe(aggressive);
    });

    it("preserves markdown structure in all modes", () => {
      const modes: OptimizationMode[] = [
        "conservative",
        "balanced",
        "aggressive",
      ];
      for (const mode of modes) {
        const result = optimizePrompt(samplePrompt, mode);
        // Order may change but headings should still exist
        expect(result.optimized).toMatch(/Senior Developer/);
      }
    });

    it("handles very long prompts without performance issues", () => {
      const longContent = "Line " + "x".repeat(100) + "\n".repeat(1000);
      const start = performance.now();
      const result = optimizePrompt(longContent, "conservative");
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // Must complete in < 1s
      expect(result.optimized.length).toBeGreaterThan(0);
    });

    it("always returns a valid OptimizationDiff shape", () => {
      const modes: OptimizationMode[] = [
        "conservative",
        "balanced",
        "aggressive",
      ];
      for (const mode of modes) {
        const result = optimizePrompt(samplePrompt, mode);
        expect(result).toHaveProperty("original");
        expect(result).toHaveProperty("optimized");
        expect(result).toHaveProperty("changes");
        expect(result).toHaveProperty("warnings");
        expect(Array.isArray(result.changes)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(result.original).toBe(samplePrompt);
      }
    });
  });

  // ===========================================================================
  // Placeholder Hardening Tests
  // ===========================================================================

  describe("placeholder hardening — balanced mode", () => {
    it("does NOT inject TODO comments in balanced mode", () => {
      const input = "Write code for me";
      const result = optimizePrompt(input, "balanced");
      expect(containsUnresolvedPlaceholder(result.optimized)).toBe(false);
      expect(result.optimized).not.toMatch(/<!--\s*TODO/);
    });

    it("emits warnings instead of placeholder sections", () => {
      const input = "Just a simple prompt";
      const result = optimizePrompt(input, "balanced");
      // Should warn about missing sections
      const sectionWarnings = result.warnings.filter((w) =>
        w.includes("Fehlende Sektion"),
      );
      expect(sectionWarnings.length).toBeGreaterThanOrEqual(3); // role, requirements, verify, etc.
    });

    it("does NOT contain 'requirements ergänzen' or 'verify ergänzen'", () => {
      const input = "A basic prompt with no structure";
      const result = optimizePrompt(input, "balanced");
      expect(result.optimized).not.toMatch(/requirements?\s+ergänzen/i);
      expect(result.optimized).not.toMatch(/verify\s+ergänzen/i);
    });
  });

  describe("placeholder hardening — aggressive mode", () => {
    it("does NOT inject TODO comments in aggressive scaffolding", () => {
      const input = "Write good code";
      const result = optimizePrompt(input, "aggressive");
      expect(containsUnresolvedPlaceholder(result.optimized)).toBe(false);
      expect(result.optimized).not.toMatch(/<!--\s*TODO/);
    });

    it("scaffolding sections do not contain TODO markers", () => {
      const input = "Help me with my project";
      const result = optimizePrompt(input, "aggressive");
      // Context engineering sections should exist but without TODO
      expect(result.optimized).toMatch(
        /Cold Context|Warm Context|Hot Context/i,
      );
      expect(result.optimized).not.toMatch(/TODO.*ergänzen/);
      expect(result.optimized).not.toMatch(/TODO.*beschreiben/);
    });

    it("does NOT contain 'requirements ergänzen' or 'verify ergänzen'", () => {
      const input = "Build a feature";
      const result = optimizePrompt(input, "aggressive");
      expect(result.optimized).not.toMatch(/requirements?\s+ergänzen/i);
      expect(result.optimized).not.toMatch(/verify\s+ergänzen/i);
    });

    it("scaffolding uses fill-in prompts instead of TODO comments", () => {
      const input = "Build a feature";
      const result = optimizePrompt(input, "aggressive");
      // Should have "Bitte ausfüllen" style hints instead of TODO
      expect(result.optimized).toMatch(/Bitte ausfüllen/i);
    });
  });

  // ===========================================================================
  // Regression: Positron-artiger Agentic Prompt
  // ===========================================================================

  describe("regression: Positron-style agentic prompt", () => {
    // Simulates a prompt like "Agentic/Vibe-Coding Baseline 2026 — Positron"
    const positronPrompt = [
      "## Rolle",
      "Du bist ein Senior Fullstack-Entwickler mit Fokus auf Tauri + React.",
      "",
      "## Kontextfenster-Empfehlung",
      "Nutze ein frisches Kontextfenster.",
      "",
      "## Hard Constraints",
      "- Keine Dockerisierung",
      "- Keine externen API-Calls",
      "- Keine neuen Abhängigkeiten",
      "- Kein Direct-Push auf master",
      "",
      "## Projektfokus",
      "PromptVault Lite — eine lokale Desktop-Anwendung.",
      "",
      "## Ziel",
      "Implementiere den Batch-Optimizer für Markdown-Ordner.",
      "",
      "## Priorisierte Arbeitsphasen",
      "1. Planungslogik (pure, kein I/O)",
      "2. Rust-Backend-Befehl",
      "3. Node-FS-Adapter für Tests",
      "4. Integrationstests mit Desktop-Ordner",
      "5. E2E-Test mit 12 echten Dateien",
      "",
      "## Red Tests",
      "- `planBatchOptimization` muss leere Ordner korrekt behandeln",
      "- Batch darf keine bestehenden `.optimized.md`-Dateien überschreiben",
      "- Batch muss Pfadinjektion blockieren (null bytes, `..`)",
      "- Originale müssen unverändert bleiben (Hash-Check)",
      "- Tauri-FS-Adapter muss korrekt cachen",
      "",
      "## Ergebnisformat",
      "`.optimized.md`-Dateien neben den Originalen.",
    ].join("\n");

    it("preserves concrete Red Tests after aggressive optimization", () => {
      const result = optimizePrompt(positronPrompt, "aggressive");
      // Red Tests must survive
      expect(result.optimized).toMatch(/planBatchOptimization.*leere Ordner/);
      expect(result.optimized).toMatch(/überschreiben/);
      expect(result.optimized).toMatch(/Pfadinjektion/);
      expect(result.optimized).toMatch(/Hash-Check/);
    });

    it("preserves Hard Constraints after aggressive optimization", () => {
      const result = optimizePrompt(positronPrompt, "aggressive");
      expect(result.optimized).toMatch(/Keine Dockerisierung/);
      expect(result.optimized).toMatch(/Keine externen API-Calls/);
      expect(result.optimized).toMatch(/Kein Direct-Push auf master/);
    });

    it("preserves Projektfokus after aggressive optimization", () => {
      const result = optimizePrompt(positronPrompt, "aggressive");
      expect(result.optimized).toMatch(/PromptVault Lite/);
    });

    it("balanced mode does NOT inject TODO placeholders for missing sections", () => {
      const result = optimizePrompt(positronPrompt, "balanced");
      expect(containsUnresolvedPlaceholder(result.optimized)).toBe(false);
    });

    it("aggressive mode does NOT inject TODO placeholders", () => {
      const result = optimizePrompt(positronPrompt, "aggressive");
      expect(containsUnresolvedPlaceholder(result.optimized)).toBe(false);
    });
  });

  // ===========================================================================
  // Regression: BescheidPilot-artiger Local-only/Privacy Prompt
  // ===========================================================================

  describe("regression: BescheidPilot-style local-only prompt", () => {
    // Simulates a local-first privacy-sensitive prompt
    const bescheidPilotPrompt = [
      "## Rolle",
      "Du bist ein DSGVO-Compliance-Engineer mit Fokus auf lokale Verarbeitung.",
      "",
      "## Kontextfenster-Empfehlung",
      "Starte in einem leeren Kontextfenster.",
      "",
      "## Hard Constraints",
      "- KEINE Daten verlassen den lokalen Rechner",
      "- KEINE Cloud-API, KEIN Telemetrie",
      "- ALLE Verarbeitung muss offline funktionieren",
      "- KEINE echten personenbezogenen Daten testen",
      "- KEINE Secrets committen",
      "",
      "## Projektfokus",
      "CiviPet OS — lokale Tierheimverwaltung ohne Cloud.",
      "",
      "## Ziel",
      "Erstelle einen DSGVO-konformen Datenexport.",
      "",
      "## Priorisierte Arbeitsphasen",
      "1. Datenflussdiagramm erstellen",
      "2. Consent-Tracking validieren",
      "3. Retention-Policy in Code prüfen",
      "4. Export-Funktion ohne personenbezogene Daten testen",
      "5. Audit-Log für Export-Operationen",
      "",
      "## Red Tests",
      "- Export darf KEINE echten Namen enthalten",
      "- Export darf KEINE Adressdaten enthalten",
      "- Export-Pfad muss auf Vault-Root beschränkt sein",
      "- Symlink-Escape muss blockiert werden",
      "- Audit-Log muss jede Export-Operation dokumentieren",
      "",
      "## Ergebnisformat",
      "JSON-Export mit Pseudonymisierung aller personenbezogenen Felder.",
    ].join("\n");

    it("preserves Hard Constraints after aggressive optimization", () => {
      const result = optimizePrompt(bescheidPilotPrompt, "aggressive");
      expect(result.optimized).toMatch(/KEINE Daten verlassen/);
      expect(result.optimized).toMatch(/KEINE Cloud-API/);
      expect(result.optimized).toMatch(/KEINE echten personenbezogenen/);
    });

    it("preserves Red Tests after balanced optimization", () => {
      const result = optimizePrompt(bescheidPilotPrompt, "balanced");
      expect(result.optimized).toMatch(/Export darf KEINE echten Namen/);
      expect(result.optimized).toMatch(/Symlink-Escape/);
      expect(result.optimized).toMatch(/Audit-Log/);
    });

    it("balanced mode does NOT inject TODO placeholders", () => {
      const result = optimizePrompt(bescheidPilotPrompt, "balanced");
      expect(containsUnresolvedPlaceholder(result.optimized)).toBe(false);
    });

    it("aggressive mode does NOT inject TODO placeholders", () => {
      const result = optimizePrompt(bescheidPilotPrompt, "aggressive");
      expect(containsUnresolvedPlaceholder(result.optimized)).toBe(false);
    });

    it("Projektfokus is preserved after optimization", () => {
      const result = optimizePrompt(bescheidPilotPrompt, "aggressive");
      expect(result.optimized).toMatch(/CiviPet OS/);
    });
  });

  // ===========================================================================
  // Quality Validation Function Tests
  // ===========================================================================

  describe("validateOptimizedPromptQuality", () => {
    it("passes clean output", () => {
      const result = validateOptimizedPromptQuality(
        "Original",
        "## Rolle\n\nKonkreter Inhalt\n\n## Ziel\n\nKlares Ziel",
      );
      expect(result.passed).toBe(true);
      expect(result.unresolved_placeholders).toHaveLength(0);
    });

    it("fails on TODO comment", () => {
      const result = validateOptimizedPromptQuality(
        "Original",
        "## Anforderungen\n\n<!-- TODO: requirements ergänzen -->",
      );
      expect(result.passed).toBe(false);
      expect(result.unresolved_placeholders.length).toBeGreaterThan(0);
    });

    it("fails on TBD placeholder", () => {
      const result = validateOptimizedPromptQuality(
        "Original",
        "## Acceptance Criteria\n\nTBD",
      );
      expect(result.passed).toBe(false);
    });

    it("fails on 'requirements ergänzen' text", () => {
      const result = validateOptimizedPromptQuality(
        "Original",
        "## Anforderungen\n\nrequirements ergänzen",
      );
      expect(result.passed).toBe(false);
    });

    it("fails on 'verify ergänzen' text", () => {
      const result = validateOptimizedPromptQuality(
        "Original",
        "## Verifikation\n\nverify ergänzen",
      );
      expect(result.passed).toBe(false);
    });

    it("fails on empty sections", () => {
      const result = validateOptimizedPromptQuality(
        "Original",
        "## Anforderungen\n\n\n\n## Ziel\n\n",
      );
      expect(result.passed).toBe(false);
      expect(result.empty_sections.length).toBeGreaterThan(0);
    });

    it("passes sections with actual content", () => {
      const result = validateOptimizedPromptQuality(
        "Original",
        "## Anforderungen\n\n- Funktion muss sauber sein\n- Tests müssen laufen",
      );
      expect(result.passed).toBe(true);
      expect(result.empty_sections).toHaveLength(0);
    });

    it("passes output without any placeholder patterns", () => {
      const result = validateOptimizedPromptQuality(
        "Original",
        "## Rolle\n\nDu bist ein Entwickler.\n\n## Ziel\n\nSchreibe Code.\n\n## Anforderungen\n\n- Anforderung 1\n- Anforderung 2",
      );
      expect(result.passed).toBe(true);
    });
  });
});
