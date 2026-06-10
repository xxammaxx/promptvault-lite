---
title: "Human-Approval-Standard — Merge-Freigabe und Qualitäts-Gates"
description: "Standard für Human-Approval-Prozesse in agentischen Workflows. Definiert Prüfpunkte, Klassifikationen und Merge-Kriterien."
category: "governance"
version: "1.0.0"
tags:
  - governance
  - human-approval
  - standard
  - merge-gate
---

# Human-Approval-Standard — Merge-Freigabe und Qualitäts-Gates

> **Klassifikation:** Intern · **Version:** 1.0.0 · **Gültig ab:** 2026-06-10
> **Referenz-Prompt:** `prompts/governance/human-approval-check.md`

## Zweck

Dieser Standard definiert den Human-Approval-Prozess für alle Merges auf `main`/`master`. Er ist bindend für KI-Agenten und menschliche Reviewer.

## Prüfpunkte

1. **Git Status** — `git status --short` mit vollständiger Klassifikation
2. **Diff-Analyse** — `git diff HEAD --stat` mit Scope-Abgleich
3. **Datei-Klassifikation** — Jede Datei einer Kategorie zugeordnet
4. **Blueprint-Schutz** — Bestätigung, dass geschützte Dateien unverändert sind
5. **Secret-Check** — Keine Secrets, `.env`, `.db` im Diff
6. **Test-Gates** — Alle Tests ausgeführt und grün
7. **Review-Agent** — Abschlussprüfung durchgeführt
8. **CI-Gates** — Alle CI-Jobs grün

## Datei-Klassifikationen

Siehe `prompts/governance/git-hygiene-working-tree-check.md` für vollständige Klassifikationstabelle.

## Merge-Kriterien

Merge nur wenn:

- Alle Tests grün
- Keine Blocker vom Review-Agent
- Keine Secrets im Diff
- Blueprint-Dateien unverändert
- CI-Gates grün
- Scope eingehalten
- Human Approval erteilt

## Referenz-Prompts

- `prompts/governance/human-approval-check.md` — Human-Approval-Check-Prompt
- `prompts/governance/review-agent-final-check.md` — Review-Agent-Prompt
- `prompts/governance/git-hygiene-working-tree-check.md` — Git-Hygiene-Prompt
