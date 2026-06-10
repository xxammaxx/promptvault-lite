---
title: "Prompt-Hygiene-Standard — Saubere, wiederverwendbare Prompts"
description: "Standard für Prompt-Sauberkeit. Definiert Artefakt-Kategorien, Hygiene-Score-Berechnung und Regeln für Prompt-Autoren."
category: "prompt-quality"
version: "1.0.0"
tags:
  - prompt-quality
  - hygiene
  - standard
  - artifact-detection
---

# Prompt-Hygiene-Standard — Saubere, wiederverwendbare Prompts

> **Klassifikation:** Intern · **Version:** 1.0.0 · **Gültig ab:** 2026-06-10
> **Referenz-Prompt:** `prompts/prompt-quality/prompt-hygiene-artifact-detection.md`

## Zweck

Dieser Standard definiert, was einen "sauberen" Prompt ausmacht und welche Artefakte entfernt werden müssen, bevor ein Prompt als wiederverwendbar gilt.

## Artefakt-Kategorien

12 Kategorien in PromptVault Lite implementiert, plus 1 vorgeschlagene:

| #   | Kategorie        | Severity             |
| --- | ---------------- | -------------------- |
| 1   | PROJECT_ARTIFACT | warning              |
| 2   | REPO_REFERENCE   | warning              |
| 3   | FILE_PATH        | warning              |
| 4   | ISSUE_REFERENCE  | info                 |
| 5   | TEST_REPORT      | info                 |
| 6   | LOG_LINE         | info                 |
| 7   | STACKTRACE       | info                 |
| 8   | BUILD_OUTPUT     | info                 |
| 9   | JSON_DUMP        | warning              |
| 10  | CODE_DUMP        | info                 |
| 11  | PII              | critical             |
| 12  | SECRET           | critical             |
| 13  | EVIDENCE_BLOCK   | info (vorgeschlagen) |

## Hygiene-Score

```
Score = 100 - Σ(Abzüge)
Abzüge: critical=20, warning=8, info=3
Schwellwerte: Clean≥80, Warning≥50, Critical<50
```

## Autor-Regeln

1. Keine Secrets, PII, Build-Logs, Stacktraces in Prompts
2. Beispiel-Blöcke als `<!-- EXAMPLE -->` kennzeichnen
3. Platzhalter statt echter Werte verwenden

## Referenz-Prompts

- `prompts/prompt-quality/prompt-hygiene-artifact-detection.md` — Prompt-Hygiene-Regeln
- `prompts/prompt-quality/prompt-optimization-standard.md` — Prompt-Optimierung
