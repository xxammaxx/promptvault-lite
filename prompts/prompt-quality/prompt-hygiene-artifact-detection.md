---
title: "Prompt-Hygiene — Artefakt-Erkennung und Sauberkeitsregeln"
description: "Definiert Regeln und Patterns zur Erkennung unerwünschter Artefakte in Prompts. Erkennt Build-Logs, Stacktraces, Secrets, Testausgaben, Git-Diffs und projekt-spezifische Verunreinigungen."
category: "prompt-quality"
version: "1.0.0"
tags:
  - prompt-quality
  - hygiene
  - artifact-detection
  - prompt-engineering
  - security
---

# Prompt-Hygiene — Artefakt-Erkennung und Sauberkeitsregeln

> **Prompt-Typ:** Qualitätsstandard / Prüfregeln
> **Zielgruppe:** Prompt-Ingenieure, KI-Agenten, PromptVault-Lite-Hygiene-Engine
> **Pflicht:** Empfohlen für alle produktiven Prompts

---

## Ziel

Definiere, welche Inhalte in einem produktiven Prompt als "Artefakt" gelten und erkannt werden müssen. Ein sauberer Prompt enthält keine projektspezifischen Spuren, Secrets oder versehentlichen Debug-Output.

---

## Artefakt-Kategorien (12 + 1 neu)

### Bestehende 12 Kategorien (in PromptVault Lite implementiert)

| #   | Kategorie          | Beschreibung                      | Severity |
| --- | ------------------ | --------------------------------- | -------- |
| 1   | `PROJECT_ARTIFACT` | CamelCase/PascalCase-Projektnamen | warning  |
| 2   | `REPO_REFERENCE`   | GitHub/GitLab/Bitbucket-URLs      | warning  |
| 3   | `FILE_PATH`        | Absolute/relative Dateipfade      | warning  |
| 4   | `ISSUE_REFERENCE`  | Issue/PR/Bug #123-Referenzen      | info     |
| 5   | `TEST_REPORT`      | Test-Ergebniszeilen               | info     |
| 6   | `LOG_LINE`         | Log-Einträge (INFO, ERROR, etc.)  | info     |
| 7   | `STACKTRACE`       | Stacktraces/Exception-Zeilen      | info     |
| 8   | `BUILD_OUTPUT`     | Build-/Compile-Befehle            | info     |
| 9   | `JSON_DUMP`        | Große JSON-Blöcke (>500 Zeichen)  | warning  |
| 10  | `CODE_DUMP`        | Code-Blöcke >20 Zeilen            | info     |
| 11  | `PII`              | E-Mails, Telefonnummern           | critical |
| 12  | `SECRET`           | API Keys, Tokens, Passwörter      | critical |

### Neue Kategorie (vorgeschlagen)

| #   | Kategorie        | Beschreibung                                                                                                       | Severity |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| 13  | `EVIDENCE_BLOCK` | Bewusst eingebettete Beispiel-Blöcke (Git-Diffs, Logs, Testausgaben) die als Teil einer Erklärung/Anleitung dienen | info     |

**Wichtig:** `EVIDENCE_BLOCK` ist ein Spezialfall — es markiert Inhalte, die wie Artefakte AUSSEHEN, aber bewusst als Beispiel/Anleitung eingebettet sind. Die Hygiene-Engine sollte diese als `info` markieren und NICHT als Fehler werten.

---

## Erweiterte Erkennungsregeln

### Zusätzlich zu erkennen (nicht in PromptVault Lite implementiert)

#### Build-Logs

````regex
# Webpack/Vite/Rollup Bundle-Ausgaben
(?i)(chunk|bundle|asset)\s+.*?\d+\s*(kb|mb|bytes)
# TypeScript-Compiler-Fehler
error TS\d{4}:
# Rust-Compiler-Fehler
error\[E\d{4}\]:

#### Zufällige Git-Diffs
```regex
# Git-Diff-Header
^diff --git a/
^@@ -\d+,\d+ \+\d+,\d+ @@
^--- a/
^\+\+\+ b/

# Merge-Konflikt-Marker
^<<<<<<<
^=======
^>>>>>>>
````

#### Secrets (erweitert)

```regex
# OpenAI API Keys
sk-[A-Za-z0-9]{32,}
# Anthropic API Keys
sk-ant-[A-Za-z0-9]{32,}
# Generic Base64-encoded secrets (lange zufällige Strings)
eyJ[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}
```

#### Abschlussberichte

```regex
# Agent-Abschlussberichte
(?i)(task\s+completed|abschlussbericht|issue\s+#\d+\s+(geschlossen|abgeschlossen))
(?i)(files\s+changed|geänderte\s+dateien)
(?i)(tests?\s+run|ausgeführte\s+tests?)
```

#### Vermischung von Prompt und Evidence

```regex
# Evidence-Log-Einbettungen
(?i)(evidence\s+log|context\s+manifest)
(?i)(session-id|agent-name|start-commit)
(?i)(cold\s+context|warm\s+context|hot\s+context)
```

---

## Was KEIN Artefakt ist (False-Positive-Vermeidung)

Folgende Inhalte sollten NICHT als Artefakt markiert werden:

1. **Bewusste Beispiel-Blöcke** — Wenn ein Prompt eine Beispiel-Struktur zeigt (z.B. `git status --short` als Befehl, nicht als Ist-Ausgabe)
2. **Dokumentations-Prompts** — Prompts die selbst Dokumentation oder Templates sind
3. **Code-Anleitungen** — Code-Blöcke die als Lernbeispiel dienen
4. **Platzhalter** — `{PROJECT_NAME}`, `{FILE_PATH}` etc. sind bereits anonymisiert
5. **Allgemeine Technologie-Namen** — "React", "TypeScript", "Docker" sind keine Projektartefakte

---

## Hygiene-Score-Berechnung

```
Score = 100 - Σ(Abzüge pro Artefakt)

Abzüge:
  critical: 20 Punkte
  warning:   8 Punkte
  info:      3 Punkte

Schwellwerte:
  80-100: Clean    ✅
  50-79:  Warning  ⚠️
  0-49:   Critical 🔴
```

---

## Prompt ohne Ziel, Scope oder Verification Contract

Ein Prompt ohne klare Struktur ist selbst ein Hygiene-Problem. Prüfe:

- [ ] Hat der Prompt ein klares Ziel?
- [ ] Ist der Scope definiert?
- [ ] Sind Akzeptanzkriterien vorhanden?
- [ ] Ist das Ausgabeformat definiert?
- [ ] Sind harte Verbote dokumentiert?

Fehlen diese Elemente, sollte der Prompt als `warning` markiert werden mit Empfehlung: "Prompt-Struktur ergänzen (Ziel, Scope, Verification Contract)."

---

## Implementierungsstatus und Erweiterungspunkte

Dieser Standard definiert die Regeln für die PromptVault-Lite-Hygiene-Engine. Die 12 bestehenden Kategorien sind in `src-tauri/src/analysis/hygiene.rs` implementiert.

### Erweiterungspunkte

1. **Kategorie 13 (`EVIDENCE_BLOCK`)**: In `ArtifactCategory` enum ergänzen
2. **Erweiterte Regex-Patterns**: In `detect_*` Funktionen ergänzen
3. **Prompt-Struktur-Prüfung**: Neue Funktion `detect_missing_structure()`
4. **False-Positive-Filter**: `is_documentation_prompt()` Heuristik

---

## Prompt-Hygiene-Regeln für Prompt-Autoren

1. ❌ Keine Build-Logs in Prompts
2. ❌ Keine Stacktraces in Prompts
3. ❌ Keine Testausgaben in Prompts
4. ❌ Keine zufälligen Git-Diffs in Prompts
5. ❌ Keine Secrets in Prompts
6. ❌ Keine `.env`-Inhalte in Prompts
7. ❌ Keine API Keys in Prompts
8. ❌ Keine zu projektspezifischen Artefakte
9. ❌ Keine versehentlichen Abschlussberichte
10. ❌ Keine unklare Vermischung von Prompt und Evidence
11. ✅ Beispiel-Blöcke als solche kennzeichnen (`<!-- EXAMPLE -->`)
12. ✅ Platzhalter statt echter Werte verwenden

---

## Integration in PromptVault Lite

Dieser Prompt ist Teil des **Agentic Human Approval & Docs-as-Code Standard** Prompt-Packs.

- **Kategorie:** `prompt-quality`
- **Tags:** `prompt-quality`, `hygiene`, `artifact-detection`, `prompt-engineering`, `security`
- **Optimierungsmodus:** `balanced` (Erkennungsregeln sind hart, Empfehlungen weich)
