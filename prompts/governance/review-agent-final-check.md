---
title: "Review-Agent Final Check — Abschlussprüfung vor Merge"
description: "Fordert einen Review-Agenten zur abschließenden Code- und Quality-Prüfung auf. Prüft Blocker, Major/Minor Findings, Security, Docs Drift, Evidence, Test Coverage, Scope Creep."
category: "governance"
version: "1.0.0"
tags:
  - governance
  - review-agent
  - code-review
  - merge-gate
  - quality
---

# Review-Agent Final Check — Abschlussprüfung vor Merge

> **Prompt-Typ:** Review-Agent Beauftragung
> **Zielgruppe:** KI-Review-Agenten (leaf-node, readonly)
> **Pflicht:** Ja — vor jedem Merge auf `main`/`master`

---

## Ziel

Führe eine abschließende Code- und Quality-Prüfung des aktuellen Branches durch. Der Review-Agent arbeitet **readonly** — er ändert niemals Dateien. Das Ergebnis muss strukturiert als Review-Report ausgegeben werden.

---

## Prüfkategorien

### 1. Blocker (Merge-verhindernd)

Prüfe auf:

- [ ] Secrets im Diff (API Keys, Tokens, Passwörter)
- [ ] `.env`-Dateien im Commit
- [ ] Build-Artefakte (`dist/`, `target/`, `site/`) im Commit
- [ ] Datenbank-Dateien (`*.db`, `*.db-shm`, `*.db-wal`) im Commit
- [ ] Blueprint-Dateien verändert
- [ ] Pre-existing Änderungen gestaged
- [ ] `git add .` verwendet
- [ ] Sicherheitskritische Patterns (SQL Injection, XSS, Path Traversal)

### 2. Major Findings (sollten vor Merge behoben werden)

- [ ] Fehlende Tests für neue Funktionalität
- [ ] Gebrochene Tests (nicht durch eigene Änderungen verursacht)
- [ ] Fehlende Fehlerbehandlung
- [ ] Race Conditions
- [ ] Speicher-Leaks
- [ ] Fehlende Input-Validierung
- [ ] Verletzung von Architektur-Prinzipien

### 3. Minor Findings (können als Follow-up behandelt werden)

- [ ] Tippfehler in Kommentaren
- [ ] Unnötige Imports
- [ ] Nicht-idiomatischer Code
- [ ] Fehlende oder unzureichende Kommentare
- [ ] Inkonsistente Namensgebung

### 4. Security Risks

- [ ] OWASP Top 10 Patterns
- [ ] Path Traversal (insb. bei Datei-Operationen)
- [ ] Injection (SQL, Command, etc.)
- [ ] Unsichere Deserialisierung
- [ ] Missing Access Controls
- [ ] Sensitive Data Exposure

### 5. Docs Drift

Prüfe, ob Dokumentation mit Code konsistent ist:

- [ ] Neue Komponenten/Module in `docs/reference/project-structure.md` dokumentiert
- [ ] Neue Tauri-Commands in `docs/ARCHITECTURE.md`
- [ ] Neue Abhängigkeiten in `docs/INSTALL.md`
- [ ] Neue Features in `docs/USER_GUIDE.md`
- [ ] Neue Architekturentscheidungen als ADR
- [ ] Neue Fachbegriffe in `docs/glossary.md`

### 6. Evidence Completeness

- [ ] Context Manifest vorhanden und vollständig
- [ ] Evidence Log vorhanden und vollständig
- [ ] Test-Ausgaben dokumentiert
- [ ] Issue-Kommentare (Start + End) vorhanden
- [ ] PR-Template ausgefüllt

### 7. Test Coverage

- [ ] Neue Funktionalität hat Tests
- [ ] Edge Cases abgedeckt
- [ ] Fehlerfälle abgedeckt
- [ ] Regression-Tests für Bugfixes
- [ ] Tests sind ausführbar (keine hängenden oder flaky Tests)

### 8. Scope Creep

- [ ] Nur der im Issue definierte Scope wurde umgesetzt
- [ ] Keine stillschweigenden Refactorings
- [ ] Keine kosmetischen Massenänderungen
- [ ] Keine unrelated Features

### 9. Merge Readiness

- [ ] Alle Tests grün
- [ ] CI-Gates grün
- [ ] Docs-Quality-Check bestanden
- [ ] Keine Merge-Konflikte
- [ ] Commit-Messages folgen Conventional Commits
- [ ] Keine WIP-Commits

---

## Ausgabeformat

```text
## Review-Agent Ergebnis

**Status:** APPROVED | CHANGES_REQUESTED | BLOCKED
**Branch:** <BRANCH>
**Geprüft am:** <ISO8601_TIMESTAMP>

### Blocker
- [Keine / Liste]

### Major Findings
- [Keine / Liste mit Datei:Zeile]

### Minor Findings
- [Keine / Liste mit Datei:Zeile]

### Security Risks
- [Keine / Liste mit CVSS-Einschätzung]

### Docs Drift
- [Keine / Liste betroffener Docs]

### Evidence Completeness
- [Vollständig / Fehlende Items]

### Test Coverage
- Abdeckung: <X>%
- Fehlende Tests: [Liste]

### Scope Creep
- [Keiner / Beschreibung]

### Merge Readiness
- [Bereit / Nicht bereit / Bedingt bereit]

### Empfehlung
[Text]
```

---

## Verhalten bei pre-existing Fehlern

Wenn Tests oder Lint-Fehler bereits VOR den eigenen Änderungen existierten:

- Dokumentieren, nicht fixen
- Nicht als Blocker für eigene Änderungen werten
- Im Review-Report als "Pre-existing" markieren
- Eigene Änderungen isoliert bewerten

---

## Harte Verbote

- ❌ Dateien modifizieren (Review-Agent ist readonly)
- ❌ Severity-Claims ohne Evidence
- ❌ Pre-existing Fehler als eigene Findings ausgeben
- ❌ Blueprint-Dateien bewerten (gehören nicht zum Scope)

---

## Integration in PromptVault Lite

Dieser Prompt ist Teil des **Agentic Human Approval & Docs-as-Code Standard** Prompt-Packs.

- **Kategorie:** `governance`
- **Tags:** `governance`, `review-agent`, `code-review`, `merge-gate`, `quality`
- **Optimierungsmodus:** `conservative`
