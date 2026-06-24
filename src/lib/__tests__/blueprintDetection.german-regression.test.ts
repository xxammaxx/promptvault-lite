import { describe, expect, it } from "vitest";
import { classifyContent, evaluateBlueprint } from "../blueprintDetection";

const GERMAN_AGENT_PROMPT = `# Agentic/Vibe-Coding Baseline 2026

## Rolle

Du bist Senior Software Engineer, Agentic-Coding-Architect und Evidence-orientierter Reviewer.

## Kontextfenster-Empfehlung

Starte diesen Auftrag in einem frischen/leeren Kontextfenster.

## Anforderungen

- Fuehre Red Tests zuerst aus
- Dokumentiere jeden Local Gate Lauf

## Ergebnisformat

Gib einen Bugfix-Report mit Screenshot-Evidence aus.

## Verification Contract

- pnpm test
- pnpm lint
- git diff --check

## Human Approval Gate

- Kein Merge ohne Human Approval
- Reviewer-Agent Ergebnis dokumentieren`;

const DOCUMENTATION_ONLY = `# Projektstatus

Dieses Dokument beschreibt den aktuellen Stand eines Projektes.

## Changelog

- v1.0.0 Initial
- v1.1.0 Dokumentation aktualisiert`;

const CLEAR_BLUEPRINT = `# System Blueprint

## Ziel

Baue eine lokale Desktop-App.

## Architektur

Frontend sendet lokale IPC-Kommandos an ein Rust-Backend.

## Datenfluss

Dateien werden lokal gelesen und in SQLite indexiert.

## Verification Contract

- Unit tests pass
- Integration tests pass
- Manual smoke test pass`;

describe("German blueprint and prompt classification regressions", () => {
  it("classifies German agent prompts as prompt-like content, not pure documentation", () => {
    const result = classifyContent(GERMAN_AGENT_PROMPT);

    expect(result.content_class).not.toBe("DOC");
    expect(result.content_class).toBe("PROMPT_BLUEPRINT_HYBRID");
  });

  it("recognizes agent-workflow blueprint signals for German prompt hybrids", () => {
    const result = evaluateBlueprint(GERMAN_AGENT_PROMPT, "2026-06-24");

    expect(result.content_class).toBe("PROMPT_BLUEPRINT_HYBRID");
    expect(result.blueprint_type).toBe("agent_workflow_blueprint");
    expect(result.classification_tags).toContain("AGENT_PROMPT");
    expect(result.classification_tags).toContain("WORKFLOW");
    expect(result.classification_reasons?.length).toBeGreaterThan(0);
    expect(result.evidence_readiness_score).toBeGreaterThan(0);
    expect(result.testability_score).toBeGreaterThan(0);
  });

  it("explains low confidence with missing blueprint dimensions", () => {
    const result = evaluateBlueprint(
      `# Kurznotiz

## Rolle

Du bist Reviewer.

## Ergebnisformat

Gib eine knappe Antwort aus.`,
      "2026-06-24",
    );

    expect(result.confidence).toBeLessThan(0.6);
    expect(
      result.classification_reasons?.some((reason) =>
        reason.startsWith("Low confidence because:"),
      ),
    ).toBe(true);
  });

  it("keeps plain documentation classified as documentation", () => {
    const result = classifyContent(DOCUMENTATION_ONLY);
    expect(result.content_class).toBe("DOC");
  });

  it("keeps a clear blueprint classified as blueprint", () => {
    const result = classifyContent(CLEAR_BLUEPRINT);
    expect(result.content_class).toBe("BLUEPRINT");
  });
});
