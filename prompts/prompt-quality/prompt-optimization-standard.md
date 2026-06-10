---
title: "Prompt-Optimierung — Standard für konservative, balancierte und aggressive Optimierung"
description: "Definiert drei Optimierungsmodi für Prompts: conservative (nur Artefakte entfernen), balanced (Verbesserungsvorschläge), aggressive (tiefgreifende Umstrukturierung). Schützt Originale."
category: "prompt-quality"
version: "1.0.0"
tags:
  - prompt-quality
  - optimization
  - prompt-engineering
  - conservative
  - balanced
  - aggressive
---

# Prompt-Optimierung — Standard für drei Optimierungsmodi

> **Prompt-Typ:** Qualitätsstandard / Optimierungsregeln
> **Zielgruppe:** PromptVault-Lite-Optimierungs-Engine, Prompt-Ingenieure
> **Pflicht:** Empfohlen für Prompt-Bibliotheken

---

## Ziel

Definiere drei Optimierungsmodi für Prompts, die abgestuft von "nur aufräumen" (conservative) bis "tiefgreifend verbessern" (aggressive) reichen. Das Original darf NIE überschrieben werden.

---

## Optimierungsmodi

### 1. Conservative (Konservativ)

**Ziel:** Nur Artefakte entfernen, Inhalt unverändert lassen.

**Was wird getan:**

- [ ] Secrets ersetzen durch `{SECRET}`
- [ ] PII ersetzen durch `{EMAIL}`, `{PHONE}`
- [ ] Projektnamen ersetzen durch `{PROJECT_NAME}`
- [ ] Dateipfade ersetzen durch `{FILE_PATH}`
- [ ] Repository-URLs ersetzen durch `{REPOSITORY_URL}`
- [ ] Build-Output entfernen
- [ ] Stacktraces entfernen
- [ ] Testausgaben entfernen
- [ ] Große JSON-Blöcke komprimieren

**Was NICHT getan wird:**

- [ ] Keine Umformulierungen
- [ ] Keine Strukturänderungen
- [ ] Keine Prompt-Verbesserungen
- [ ] Keine Ergänzungen
- [ ] Keine Kürzungen (außer Artefakt-Entfernung)

**Markierung:** Optimierte Stellen mit `{PLACEHOLDER}` markieren.

### 2. Balanced (Balanciert)

**Ziel:** Artefakte entfernen UND leichte Verbesserungen vorschlagen.

Zusätzlich zu Conservative:

- [ ] Unklare Anweisungen präzisieren
- [ ] Fehlende Constraints ergänzen
- [ ] Ausgabeformat spezifizieren (falls fehlt)
- [ ] Ziel und Scope klarer formulieren
- [ ] Prompt-Struktur verbessern (Abschnitte, Listen)
- [ ] Redundanzen entfernen
- [ ] Widersprüche auflösen

**Was NICHT getan wird:**

- [ ] Keine tiefgreifende Umstrukturierung
- [ ] Keine Änderung des Prompt-Zwecks
- [ ] Keine Entfernung harter Constraints
- [ ] Keine spekulativen Ergänzungen

**Markierung:** Änderungen mit `<!-- OPTIMIZED: Grund -->` kommentieren.

### 3. Aggressive (Aggressiv)

**Ziel:** Tiefgreifende Optimierung für maximale Prompt-Qualität.

Zusätzlich zu Balanced:

- [ ] Prompt umstrukturieren nach Best Practices
- [ ] Role-Prompting ergänzen (falls sinnvoll)
- [ ] Chain-of-Thought-Anweisungen ergänzen
- [ ] Few-Shot-Beispiele ergänzen
- [ ] Output-Schema definieren
- [ ] Edge-Case-Handling ergänzen
- [ ] Alternative Prompt-Versionen vorschlagen
- [ ] Token-Effizienz optimieren

**Was NICHT getan wird:**

- [ ] Keine Änderung des fundamentalen Prompt-Zwecks
- [ ] Keine Entfernung domänenspezifischer Fachbegriffe
- [ ] Keine Änderung harter Sicherheits-Constraints

**Markierung:** Umstrukturierte Abschnitte mit `<!-- RESTRUCTURED -->` markieren.

---

## Harte Regeln für ALLE Modi

1. **Original nie überschreiben** — Die optimierte Version wird separat gespeichert
2. **Vorher/Nachher-Vergleich** — Muss angezeigt werden
3. **Changelog erzeugen** — Dokumentiert, WAS optimiert wurde und WARUM
4. **Entfernte Artefakte dokumentieren** — Liste aller ersetzten/entfernten Artefakte
5. **Annahmen markieren** — Wenn eine Optimierung auf einer Annahme basiert, diese kennzeichnen
6. **Harte Constraints beibehalten** — Verbote (`❌`), Sicherheitsregeln, Pflichtformate bleiben erhalten
7. **Projektspezifische Details nur entfernen, wenn sie nicht zum Zielprompt gehören**
8. **Prompt-Kategorien nie ohne Migration ändern**

---

## Optimierungs-Changelog-Format

```markdown
## Optimierungs-Changelog

**Original:** `prompts/governance/human-approval-check.md`
**Optimiert:** `prompts/governance/human-approval-check--optimized.md`
**Modus:** balanced
**Datum:** 2026-06-10T14:30:00Z

### Entfernte Artefakte

| #   | Typ            | Fundstelle | Ersetzt durch      |
| --- | -------------- | ---------- | ------------------ |
| 1   | FILE_PATH      | Zeile 42   | `{FILE_PATH}`      |
| 2   | REPO_REFERENCE | Zeile 15   | `{REPOSITORY_URL}` |

### Verbesserungen

| #   | Typ      | Beschreibung                     |
| --- | -------- | -------------------------------- |
| 1   | Klarheit | Ausgabeformat präzisiert         |
| 2   | Struktur | Fehlende Sektion "Scope" ergänzt |

### Annahmen

| #   | Annahme                                    | Confidence |
| --- | ------------------------------------------ | ---------- |
| 1   | Prompt wird für OpenCode-Agenten verwendet | HIGH       |

### Nicht geändert (harte Constraints)

- Alle `❌`-Verbote beibehalten
- Test-Gates unverändert
- Ausgabeformat unverändert
```

---

## Vorher/Nachher-Vergleich

```text
┌─────────────────────────────────────────────────────────────┐
│ ORIGINAL                          │ OPTIMIERT                │
├─────────────────────────────────────────────────────────────┤
│ git status --short                │ git status --short       │
│ M src/stores/blueprintStore.ts    │ M {FILE_PATH}            │
│ ?? prompts/governance/            │ ?? {NEW_DIR}/            │
│                                   │                          │
│ [Artefakt: Blueprint-Datei]       │ [Bereinigt]              │
└─────────────────────────────────────────────────────────────┘
```

---

## Testbarkeit

Jeder Optimierungsmodus muss testbar sein:

| Test                  | Conservative | Balanced | Aggressive                |
| --------------------- | ------------ | -------- | ------------------------- |
| Original unverändert  | ✅           | ✅       | ✅                        |
| Secrets ersetzt       | ✅           | ✅       | ✅                        |
| Struktur erhalten     | ✅           | ✅       | ❌ (darf geändert werden) |
| Neue Sektionen        | ❌           | ✅       | ✅                        |
| Prompt-Zweck erhalten | ✅           | ✅       | ✅                        |
| Changelog vorhanden   | ✅           | ✅       | ✅                        |

---

## Implementierungsstatus

### Aktueller Stand

Die Hygiene-Engine (`src-tauri/src/analysis/hygiene.rs`) erkennt bereits 12 Artefakt-Kategorien und generiert Ersetzungsvorschläge (`replacement_suggestion`). Eine vollständige Optimierungs-Pipeline (Erkennung → Ersetzung → neue Datei → Changelog) ist noch nicht implementiert.

### Empfohlene Erweiterung

1. **Optimierungs-Engine**: `src-tauri/src/analysis/optimization.rs`
   - `optimize_conservative(content) -> OptimizedPrompt`
   - `optimize_balanced(content) -> OptimizedPrompt`
   - `optimize_aggressive(content) -> OptimizedPrompt`

2. **OptimizedPrompt-Modell**: `src-tauri/src/models/optimization.rs`
   - `original_content: String`
   - `optimized_content: String`
   - `mode: OptimizationMode`
   - `changelog: Vec<OptimizationChange>`
   - `artifacts_removed: Vec<DetectedArtifact>`

3. **Tauri-Command**: `src-tauri/src/commands/optimize.rs`
   - `optimize_prompt(prompt_id, mode) -> OptimizedPrompt`

4. **UI-Komponente**: Vorher/Nachher-Diff-Ansicht

---

## Integration in PromptVault Lite

Dieser Prompt ist Teil des **Agentic Human Approval & Docs-as-Code Standard** Prompt-Packs.

- **Kategorie:** `prompt-quality`
- **Tags:** `prompt-quality`, `optimization`, `prompt-engineering`, `conservative`, `balanced`, `aggressive`
- **Optimierungsmodus:** `conservative` (dieser Standard selbst sollte bei Optimierung konservativ behandelt werden)
