import { describe, it, expect } from "vitest";
import { optimizePrompt } from "../promptOptimizer";
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

    it("adds missing section placeholders with TODO markers", () => {
      const input = "Write code for me";
      const result = optimizePrompt(input, "balanced");
      // balanced mode should add structural sections when they're missing
      expect(result.optimized.length).toBeGreaterThan(input.length);
      expect(result.optimized).toMatch(/TODO|ergänzen/i);
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
});
