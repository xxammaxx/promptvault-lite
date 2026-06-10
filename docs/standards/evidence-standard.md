---
title: "Evidence-Standard — Nachvollziehbare Agentenarbeit"
description: "Standard für Evidence Logs und Context Manifests in agentischen Workflows. Definiert Pflichtfelder, Formate und Aufbewahrungsregeln."
category: "evidence"
version: "1.0.0"
tags:
  - evidence
  - standard
  - agent-log
  - audit
  - compliance
---

# Evidence-Standard — Nachvollziehbare Agentenarbeit

> **Klassifikation:** Intern · **Version:** 1.0.0 · **Gültig ab:** 2026-06-10
> **Referenz-Templates:** `prompts/evidence/evidence-log-template.md`, `prompts/evidence/context-manifest-template.md`

## Zweck

Dieser Standard definiert, wie KI-Agenten ihre Arbeit dokumentieren müssen. Jeder Agentenlauf hinterlässt einen Evidence Log und ein Context Manifest.

## Pflicht-Dokumente

### Evidence Log

- Issue-ID, Session-ID, Agent-Name, Timestamps
- Ziel, Scope, Nicht-Scope
- Startzustand (Git-Status, Pre-existing Changes)
- Geänderte Dateien (neu, modifiziert, gelöscht)
- Test-Ergebnisse (vorher/nachher)
- CI-Gates-Status
- Risiken und Human-Approval-Status
- Merge-Empfehlung

### Context Manifest

- Cold Context (harte Regeln)
- Warm Context (Projektwissen)
- Hot Context (aktuelles Issue, geladene Dateien)
- Tool-Nutzung und Token-Budget
- Annahmen vs. Fakten vs. Hypothesen
- Confidence-Bewertung

## Aufbewahrung

- Evidence Logs: `docs/agent/evidence-log-<ISSUE>.md`
- Context Manifests: `docs/agent/context-manifest-<ISSUE>.md`
- Session-Logs: `.opencode/logs/sessions/` (30 Tage)
- Audit-Logs: `.opencode/logs/audit/` (10 Jahre)

## Referenz-Prompts

- `prompts/evidence/evidence-log-template.md` — Evidence-Log-Template
- `prompts/evidence/context-manifest-template.md` — Context-Manifest-Template
