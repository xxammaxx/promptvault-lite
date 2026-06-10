---
title: "Context Manifest Template — Kontext-Dokumentation für Agentenläufe"
description: "Template für Context Manifests. Dokumentiert Cold, Warm und Hot Context, geladene Dateien, Tool-Nutzung, Token-Budget, Annahmen, Fakten, Hypothesen, Confidence."
category: "evidence"
version: "1.0.0"
tags:
  - evidence
  - template
  - context-manifest
  - agent-log
  - audit
---

# Context Manifest Template — Kontext-Dokumentation für Agentenläufe

> **Prompt-Typ:** Template / Vorlage
> **Zielgruppe:** KI-Agenten (Pflicht für jeden Agentenlauf)
> **Pflicht:** Ja — vor Beginn der Implementierung

---

## Ziel

Dokumentiere VOR der Implementierung den vollständigen Kontext eines Agentenlaufs. Das Context Manifest trennt Cold, Warm und Hot Context und macht Annahmen, Fakten und Hypothesen transparent.

---

## Template

```markdown
# Context Manifest — Issue #<NUMMER>

> **Agent:** <AGENT-NAME>
> **Session-ID:** <UUID>
> **Datum:** <ISO8601_TIMESTAMP>
> **Branch:** <BRANCH>
> **Start-Commit:** <COMMIT-HASH>

---

## Cold Context (unverhandelbar, bei jedem Lauf neu geladen)

### Geladene harte Regeln

- [ ] `AGENTS.md` — Agent Start/Work/End Gates
- [ ] `docs/SECURITY_GATES.md` — Security-Regeln
- [ ] `.opencode/policies/evidence-gates.json` — Evidence-Pflichten
- [ ] `.opencode/policies/mcp-trust-tiers.json` — Tool-Trust-Tiers
- [ ] `.opencode/policies/data-retention.json` — Datenaufbewahrung

### Sicherheitsregeln (aus Cold Context)

- [ ] Keine Secrets lesen, ausgeben oder committen
- [ ] Keine `.env`-Dateien committen
- [ ] Keine direkten Änderungen auf `main`/`master`
- [ ] Kein Push/Merge ohne grüne Gates
- [ ] Keine Behauptung ohne Evidence

### Output-Schema

- [ ] Strukturierter Issue-Start-Kommentar
- [ ] Strukturierter Issue-End-Kommentar
- [ ] PR-Beschreibung gemäß Template
- [ ] Evidence Log ausgefüllt

---

## Warm Context (beratend, langsam veränderlich)

### Geladene Projektdateien

| Datei                  | Grund                            | Relevanz |
| ---------------------- | -------------------------------- | -------- |
| `docs/ARCHITECTURE.md` | Architektur verstehen            | Hoch     |
| `package.json`         | Stack und Scripts identifizieren | Hoch     |
| `src-tauri/Cargo.toml` | Rust-Dependencies                | Mittel   |
| `src/types/index.ts`   | Datenmodelle                     | Hoch     |

### Architektur-Kontext

- **Stack:** <Technologien>
- **Build-System:** <Build-Tool>
- **Test-Framework:** <Test-Tool>
- **CI:** <CI-System>

### Domain-Wissen

- **Fachdomäne:** <Beschreibung>
- **Schlüsselkonzepte:** <Liste>
- **Bekannte Fallstricke:** <Liste>

---

## Hot Context (aktueller Laufzeitkontext, TTL-begrenzt)

### Aktuelles Issue

- **Issue:** #<NUMMER>
- **Titel:** <TITEL>
- **Scope:** <Beschreibung>
- **Akzeptanzkriterien:** <Liste>

### Aktueller Git-Status

\`\`\`
<Ausgabe git status --short>
\`\`\`

### Geladene Dateien (nur für diese Session)

| Datei   | Zeilen | Grund   |
| ------- | ------ | ------- |
| <Datei> | <N>    | <Grund> |

### Bewusst NICHT geladene Dateien

| Datei                        | Grund                     |
| ---------------------------- | ------------------------- |
| `node_modules/`              | Build-Artefakt            |
| `src/components/blueprints/` | Blueprint, nicht im Scope |
| `src-tauri/target/`          | Build-Artefakt            |

---

## Tool-Nutzung

| Tool    | Zweck                  | Trust-Tier | Anzahl Calls |
| ------- | ---------------------- | ---------- | ------------ |
| `bash`  | Git-Operationen, Tests | Tier 1     | <N>          |
| `read`  | Dateien lesen          | Tier 0     | <N>          |
| `write` | Dateien erstellen      | Tier 2     | <N>          |
| `glob`  | Dateisuche             | Tier 0     | <N>          |

---

## Token-Budget

| Kategorie    | Geschätzte Tokens |
| ------------ | ----------------- |
| Cold Context | <N>               |
| Warm Context | <N>               |
| Hot Context  | <N>               |
| Tool Outputs | <N>               |
| **Gesamt**   | <N>               |

---

## Annahmen vs. Fakten vs. Hypothesen

### Belegte Fakten

| Fakt   | Quelle              | Confidence |
| ------ | ------------------- | ---------- |
| <Fakt> | <Datei:Zeile / URL> | HIGH       |

### Annahmen

| Annahme   | Grund   | Confidence | Verifikation   |
| --------- | ------- | ---------- | -------------- |
| <Annahme> | <Grund> | MEDIUM     | <Wie prüfbar?> |

### Hypothesen

| Hypothese   | Grund   | Confidence | Nächster Schritt |
| ----------- | ------- | ---------- | ---------------- |
| <Hypothese> | <Grund> | LOW        | <Test>           |

### Nicht verifizierte Behauptungen

| Behauptung   | Herkunft | Risiko   |
| ------------ | -------- | -------- |
| <Behauptung> | <Quelle> | <Risiko> |

---

## Confidence (Gesamt)

**Gesamt-Confidence:** HIGH | MEDIUM | LOW

**Begründung:**
<Text>

---

## Offene Risiken

| Risiko   | Impact   | Mitigation |
| -------- | -------- | ---------- |
| <Risiko> | <Impact> | <Maßnahme> |

---

## Entscheidungen

| Entscheidung   | Alternativen   | Begründung |
| -------------- | -------------- | ---------- |
| <Entscheidung> | <Alt 1, Alt 2> | <Warum>    |
```

---

## Ausfüllregeln

1. **Cold Context**: Immer vollständig — harte Regeln sind unverhandelbar
2. **Warm Context**: Nur laden, was für die Aufgabe relevant ist
3. **Hot Context**: TTL-begrenzt — nach Session-Ende veraltet
4. **Annahmen vs. Fakten**: Streng trennen — nicht als Fakten ausgeben, was nur Annahme ist
5. **Confidence**: Ehrlich bewerten — LOW confidence frühzeitig eskalieren
6. **Token-Budget**: Kontext ist eine knappe Ressource — bewusst managen

---

## Harte Regeln

- ❌ Keine Annahmen als Fakten deklarieren
- ❌ Kein Cold Context weglassen
- ❌ Keine Tool-Outputs ungefiltert in Warm Context übernehmen
- ❌ Keine veralteten Informationen aus vorherigen Sessions übernehmen

---

## Integration in PromptVault Lite

Dieses Template ist Teil des **Agentic Human Approval & Docs-as-Code Standard** Prompt-Packs.

- **Kategorie:** `evidence`
- **Tags:** `evidence`, `template`, `context-manifest`, `agent-log`, `audit`
- **Optimierungsmodus:** `conservative` (Template-Struktur muss erhalten bleiben)
