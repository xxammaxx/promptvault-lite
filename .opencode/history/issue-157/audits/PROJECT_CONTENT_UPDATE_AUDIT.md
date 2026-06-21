# Projektinhalt-Audit — PromptVault Lite

**Datum:** 2026-06-09 | **Branch:** feat/darkmode | **Commit:** 9d5c445

---

## Aktueller Projektzweck

PromptVault Lite ist ein **lokales Desktop-Tool** (Tauri 2, React 18 + TypeScript, Rust) zum Einlesen, Durchsuchen und Bewerten von Markdown-Prompts. Kernfunktionen:

- Rekursiver Scan von `.md`-Dateien aus Benutzerordnern
- Drei-Spalten-UI: Explorer, Details, Analyse
- Qualitäts- und Hygieneanalyse mit Score 0–100
- Export (JSON, Markdown, ZIP), Favoriten, Volltextsuche, Filter
- **Alles läuft lokal** — keine Cloud-Anbindung, keine Telemetrie

---

## Gefundene Informationsquellen

| Quelle                                         | Typ                         | Relevanz            | Aktualität                               |
| ---------------------------------------------- | --------------------------- | ------------------- | ---------------------------------------- |
| `README.md`                                    | Zentrale Doku               | Hoch                | Letzter Commit zu README: Release v1.5.0 |
| `AGENTS.md`                                    | Agentenregeln               | Hoch                | 2026-06-08                               |
| `CLAUDE.md`                                    | Agenten-Referenz            | Mittel              | 2026-06-08                               |
| `Prompt.md`                                    | Ursprüngliche Spezifikation | Mittel (historisch) | Datum unbekannt                          |
| `docs/ARCHITECTURE.md`                         | Architektur                 | Hoch                | Frontmatter v1.0.0                       |
| `docs/CHANGELOG.md`                            | Versionshistorie            | Hoch                | v1.5.0, 2026-06-05                       |
| `docs/AI_HANDBUCH.md`                          | Governance-Standard         | Hoch                | 2026-06-08                               |
| `docs/AI_WORKFLOW.md`                          | Workflow                    | Hoch                | 2026-06-08                               |
| `docs/SECURITY_GATES.md`                       | Sicherheitsregeln           | Hoch                | 2026-06-07                               |
| `docs/EVIDENCE_STANDARD.md`                    | Evidence-Format             | Hoch                | 2026-06-08                               |
| `docs/CONTEXT_ENGINEERING_STANDARD.md`         | Kontext-Management          | Mittel              | 2026-06-08                               |
| `docs/TESTING.md`                              | Testdokumentation           | Mittel              | Frontmatter v1.0.0                       |
| `docs/USER_GUIDE.md`                           | Benutzerhandbuch            | Mittel              | Frontmatter v1.0.0                       |
| `docs/INSTALL.md`                              | Installation                | Mittel              | Frontmatter v1.0.0                       |
| `docs/README.md`                               | Docs-Übersicht              | Niedrig             | Frontmatter v1.0.0                       |
| `docs/GITHUB_REPOSITORY_SETTINGS_CHECKLIST.md` | GitHub-Einstellungen        | Niedrig             | 2026-06-08                               |
| `docs/adr/ADR-001-ai-governance.md`            | ADR                         | Hoch                | 2026-06-08                               |
| `.github/workflows/ci.yml`                     | CI                          | Hoch                | Vorhanden                                |
| `.github/workflows/ai-governance-check.yml`    | CI                          | Hoch                | Vorhanden                                |
| `package.json`                                 | Version/Deps                | Hoch                | v1.5.0                                   |
| `src-tauri/Cargo.toml`                         | Version/Deps                | Hoch                | v1.5.0                                   |
| `src-tauri/tauri.conf.json`                    | Tauri-Konfig                | Hoch                | v1.5.0                                   |
| `.opencode/spec/`                              | Speckit-Specs               | Mittel              | Verschiedene Phasen                      |
| `.opencode/specs/`                             | Phase-Specs                 | Mittel              | Phasen 2–5                               |

---

## Veraltete Inhalte

### 1. README.md — „Fehlende Informationen" (Zeilen 383–392)

| Behauptung                                                                         | Tatsächlicher Zustand                                 | Aktion                      |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------- |
| „Versionsdrift: package.json und Cargo.toml nennen noch 1.4.0"                     | Beide Dateien zeigen 1.5.0                            | **Entfernen/aktualisieren** |
| „CI-Konfiguration vorhanden in ... (GitHub Actions Status nicht verifiziert)"      | CI-Dateien existieren, Status weiterhin unverifiziert | Beibehalten, präzisieren    |
| „Keine Screenshots im Repository vorhanden"                                        | Korrekt                                               | Beibehalten                 |
| „Filter-Defaults sind im hier vorliegenden Quellstand nicht explizit dokumentiert" | Noch TODO                                             | Beibehalten                 |
| „Windows- und macOS-spezifische Native-Dependency-Liste"                           | Noch TODO                                             | Beibehalten                 |
| „Genaue Build-Output-Pfade"                                                        | Noch TODO                                             | Beibehalten                 |

### 2. docs/ARCHITECTURE.md — Frontmatter-Version 1.0.0

Die Architektur-Dokumentation trägt Version 1.0.0, obwohl das Projekt bei v1.5.0 ist. Die Architektur hat sich über die Phasen weiterentwickelt (Database-Mutex in v1.5.0, File-Watcher in v1.2.0, etc.). Sollte auf 1.5.0 aktualisiert werden.

### 3. docs/TESTING.md — Frontmatter-Version 1.0.0

Testanzahl (94 Frontend) ist aktuell, aber die Version sollte 1.5.0 sein.

### 4. docs/USER_GUIDE.md, docs/INSTALL.md, docs/README.md — Frontmatter-Version 1.0.0

Alle drei Dateien haben Frontmatter-Version 1.0.0, sollten aber mindestens 1.5.0 sein.

### 5. README.md — Projektstruktur-Darstellung (Zeilen 232–264)

Zeigt keine `blueprints/`-Komponenten, keine `src/types/`-Erwähnung, keine `src/stores/__tests__/`. Ist aber aktuell, da Blueprints noch untracked sind. Sollte `src/types/` und Test-Verzeichnisse ergänzen.

---

## Widersprüche

| Widerspruch                                       | Details                                                                                                                               | Auflösung                                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Testanzahl: CHANGELOG (93) vs README/TESTING (94) | CHANGELOG v1.5.0: 93 Frontend-Tests. README Badge + TESTING.md: 94.                                                                   | Testausführung würde klären. README ist aktueller (Badge).                                                                               |
| docs/ARCHITECTURE.md v1.0.0 vs Projekt v1.5.0     | Frontmatter-Version veraltet                                                                                                          | Auf 1.5.0 aktualisieren                                                                                                                  |
| Instruktionen-Header-Duplizierung                 | AGENTS.md enthält System-Prompt-Regeln + GitHub-Governance-Block. Der System-Prompt-Teil wiederholt Regeln aus `.opencode/policies/`. | Absichtlich (Re-Injection). Governance-Block ist absichtlich dupliziert (GitHub AI Governance Standard). Kein Widerspruch — beibehalten. |

---

## Fehlende Inhalte

| Fehlendes Element          | Begründung                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `CONTRIBUTING.md`          | README enthält Contributing-Sektion — separate Datei wäre redundant                                 |
| `LICENSE`-Datei            | README verweist auf Issue #39 — bewusst offen                                                       |
| Screenshots                | README kennzeichnet als TODO — bewusst offen                                                        |
| Code of Conduct            | Kein separates Dokument — für lokales Tool möglicherweise überdimensioniert                         |
| `ROADMAP.md`               | Keine separate Roadmap-Datei vorhanden. CHANGELOG und `.opencode/specs/` enthalten Phasen-Planung.  |
| `docs/EVIDENCE.md`         | Kein separates Evidence-Sammeldokument. Evidence-Standard existiert in `docs/EVIDENCE_STANDARD.md`. |
| `docs/PROJECT_OVERVIEW.md` | Nicht vorhanden. README.md erfüllt diese Funktion.                                                  |
| `docs/AGENT_WORKFLOW.md`   | Nicht vorhanden. `docs/AI_WORKFLOW.md` erfüllt diese Funktion.                                      |

---

## Risiken

| Risiko                                       | Schwere | Beschreibung                                                                           |
| -------------------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| Versions-Drift zwischen Docs                 | Low     | docs/\*.md Frontmatter-Versionen hängen bei 1.0.0 — kosmetisch, aber inkonsistent      |
| README-Badge zu Testanzahl nicht verifiziert | Low     | „94 passing" könnte nach weiteren Änderungen veraltet sein                             |
| Blueprint-Feature unfertig im Working Tree   | Medium  | 8 untracked Dateien für Blueprint-Feature. Könnten versehentlich committed werden      |
| Python-Test-Cache in tests/                  | Low     | `tests/__pycache__/` ohne Quell-Python-Dateien — toter Code                            |
| CI-Status unbekannt                          | Medium  | Workflow-Dateien vorhanden, aber letzter CI-Run nicht lokal verifizierbar              |
| Prompt.md vs Implementierung                 | Low     | Ursprüngliche Spec könnte von der aktuellen Implementierung abweichen                  |
| .tmp/ Verzeichnis                            | Low     | Enthält Worktree und Governance-Kit — sollte in .gitignore sein oder aufgeräumt werden |

---

## Empfohlene Aktualisierungen

### Priorität Hoch

1. **README.md „Fehlende Informationen"** — Versionsdrift-Behauptung korrigieren (beide Dateien sind 1.5.0). CI-Status präzisieren.
2. **docs/ARCHITECTURE.md** — Frontmatter-Version auf 1.5.0, Blueprint-Module dokumentieren (wenn stabil).

### Priorität Mittel

3. **docs/TESTING.md, docs/USER_GUIDE.md, docs/INSTALL.md, docs/README.md** — Frontmatter-Version auf 1.5.0.
4. **README.md Projektstruktur** — `src/types/` und Test-Verzeichnisse ergänzen.
5. **docs/CHANGELOG.md** — Testanzahl für v1.5.0 prüfen (93 vs 94).

### Priorität Niedrig

6. **AGENTS.md / CLAUDE.md** — Letzte-Aktualisierung-Datum prüfen (aktuell 2026-06-08, korrekt).
7. **Prompt.md** — Als historisches Dokument kennzeichnen, ggf. Verweis auf aktuelle README/ARCHITECTURE ergänzen.
8. **.tmp/ und tests/**pycache**/** — Aufräumen oder in .gitignore aufnehmen.
