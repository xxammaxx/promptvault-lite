---
title: "Evidence Log Template — Nachvollziehbare Agentenarbeit"
description: "Template für Evidence Logs von KI-Agenten. Dokumentiert Issue, Scope, Änderungen, Tests, CI-Gates, Risiken, Human-Approval-Status. Pflicht für jeden Agentenlauf."
category: "evidence"
version: "1.0.0"
tags:
  - evidence
  - template
  - agent-log
  - audit
  - compliance
---

# Evidence Log Template — Nachvollziehbare Agentenarbeit

> **Prompt-Typ:** Template / Vorlage
> **Zielgruppe:** KI-Agenten (Pflicht für jeden Agentenlauf)
> **Pflicht:** Ja — für jede abgeschlossene Aufgabe

---

## Ziel

Dokumentiere JEDEN Agentenlauf mit einem vollständigen Evidence Log. Das Log dient als Nachweis für:

- Was wurde getan?
- Welche Dateien wurden geändert?
- Welche Tests wurden ausgeführt?
- Welche Risiken bestehen?
- Ist Human Approval erforderlich?

---

## Template

```markdown
# Evidence Log — Issue #<NUMMER>

> **Session-ID:** <UUID>
> **Agent:** <AGENT-NAME>
> **Start:** <ISO8601_TIMESTAMP>
> **Ende:** <ISO8601_TIMESTAMP>
> **Branch:** <BRANCH>
> **Start-Commit:** <COMMIT-HASH>
> **End-Commit:** <COMMIT-HASH>

---

## 1. Ziel

<Ein-Satz-Beschreibung des Ziels>

## 2. Scope

### Im Scope

- <Aufgabe 1>
- <Aufgabe 2>

### Nicht im Scope

- <Explizit ausgeschlossen>
- <Blueprint-Dateien>
- <Pre-existing Änderungen>

## 3. Startzustand

### Git Status vor Änderungen

\`\`\`
<Ausgabe git status --short>
\`\`\`

### Pre-existing Änderungen

| Datei   | Klassifikation            | Behandlung     |
| ------- | ------------------------- | -------------- |
| <Datei> | Pre-existing Modification | Nicht gestaged |
| <Datei> | Blueprint                 | Nicht berührt  |

## 4. Geänderte Dateien

### Neu erstellt

| Datei                                      | Zweck                 |
| ------------------------------------------ | --------------------- |
| prompts/governance/human-approval-check.md | Human-Approval-Prompt |

### Modifiziert

| Datei   | Änderung | Grund                     |
| ------- | -------- | ------------------------- |
| (keine) | —        | Reine additive Änderungen |

### Gelöscht

| Datei   | Grund |
| ------- | ----- |
| (keine) | —     |

## 5. Untracked Dateien (nach Änderungen)

\`\`\`
<Ausgabe git ls-files --others --exclude-standard>
\`\`\`

| Datei   | Klassifikation      | Behandlung    |
| ------- | ------------------- | ------------- |
| <Datei> | Relevant (im Scope) | Gestaged      |
| <Datei> | Blueprint           | Nicht berührt |
| <Datei> | Build-Artefakt      | Ignoriert     |

## 6. Tests

### Vorher

| Test       | Ergebnis   | Anmerkung   |
| ---------- | ---------- | ----------- |
| pnpm test  | <Ergebnis> | <Anmerkung> |
| cargo test | <Ergebnis> | <Anmerkung> |

### Nachher

| Test         | Ergebnis   | Anmerkung   |
| ------------ | ---------- | ----------- |
| pnpm test    | <Ergebnis> | <Anmerkung> |
| cargo test   | <Ergebnis> | <Anmerkung> |
| pnpm lint    | <Ergebnis> | <Anmerkung> |
| tsc --noEmit | <Ergebnis> | <Anmerkung> |

### Nicht ausgeführte Tests

| Test   | Grund        |
| ------ | ------------ |
| <Test> | <Begründung> |

## 7. CI-/Security-/Docs-Gates

| Gate          | Status       | Link/Anmerkung |
| ------------- | ------------ | -------------- |
| CI (Frontend) | ✅ / ❌ / ⏭️ | <Link>         |
| CI (Rust)     | ✅ / ❌ / ⏭️ | <Link>         |
| Secret Scan   | ✅ / ❌ / ⏭️ | <Link>         |
| Docs Quality  | ✅ / ❌ / ⏭️ | <Link>         |

## 8. Geschützte Dateien

### Blueprint-Dateien (unverändert)

\`\`\`
<Beweis: git diff HEAD --name-only | grep blueprint || echo "Keine Blueprint-Änderungen">
\`\`\`

### Pre-existing Änderungen (nicht gestaged)

| Datei   | Status            |
| ------- | ----------------- |
| <Datei> | Nicht gestaged ✅ |

## 9. Risiken

| Risiko   | Wahrscheinlichkeit  | Auswirkung          | Mitigation |
| -------- | ------------------- | ------------------- | ---------- |
| <Risiko> | Niedrig/Mittel/Hoch | Niedrig/Mittel/Hoch | <Maßnahme> |

## 10. Human Approval

| Erforderlich?   | Grund   | Status                 |
| --------------- | ------- | ---------------------- |
| ✅ Ja / ❌ Nein | <Grund> | <Ausstehend / Erteilt> |

## 11. Merge-Empfehlung

**Empfehlung:** FREIGABE | BLOCKED | BEDINGT

**Begründung:**
<Text>

**Blocker (falls BLOCKED):**

- <Blocker 1>
- <Blocker 2>

---

## Anhang: Vollständiger Diff

\`\`\`diff
<git diff HEAD>
\`\`\`
```

---

## Ausfüllregeln

1. **Session-ID**: Eindeutige UUID pro Agentenlauf
2. **Timestamp**: ISO8601-Format (`2026-06-10T14:30:00Z`)
3. **Tests**: Immer IST-Zustand dokumentieren, nicht Wunschzustand
4. **Risiken**: Ehrlich bewerten, nicht schönreden
5. **Human Approval**: Immer markieren, ob erforderlich
6. **Pre-existing**: Nie als eigene Arbeit ausgeben

---

## Harte Regeln

- ❌ Evidence Log NACH Abschluss ausfüllen, nicht vorher
- ❌ Keine falschen Test-Ergebnisse dokumentieren
- ❌ Pre-existing Änderungen nicht als eigene deklarieren
- ❌ Keine Secrets in Evidence Logs
- ❌ Keine Produktionsdaten in Logs

---

## Integration in PromptVault Lite

Dieses Template ist Teil des **Agentic Human Approval & Docs-as-Code Standard** Prompt-Packs.

- **Kategorie:** `evidence`
- **Tags:** `evidence`, `template`, `agent-log`, `audit`, `compliance`
- **Optimierungsmodus:** `conservative` (Template-Struktur muss erhalten bleiben)
