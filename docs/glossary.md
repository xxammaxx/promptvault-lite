---
title: Glossar
description: Zentrale Begriffe des PromptVault-Lite-Projekts, nach Domäne organisiert.
version: 1.7.0
---

# Glossar

> Fachbegriffe und Abkürzungen aus dem Projektkontext.
> Sprache: Deutsch (Projektsprache).

## Allgemein

| Begriff         | Definition                                                                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prompt**      | Eine in Markdown verfasste Anweisung oder Aufforderung an ein KI-System, strukturiert mit YAML-Frontmatter und正文. Die zentrale Arbeitseinheit des Vaults. |
| **Vault**       | Ein lokaler Ordner, der eine Sammlung von Markdown-Prompt-Dateien enthält. Wird von PromptVault Lite geöffnet und rekursiv gescannt.                        |
| **Frontmatter** | YAML-Block am Anfang einer Markdown-Datei, der Metadaten enthält (Titel, Kategorie, Tags, Version). Wird von `frontmatter.rs` mit Fallbacks geparst.        |
| **Markdown**    | Auszeichnungssprache für den Prompt-Inhalt. PromptVault Lite analysiert Überschriften und Code-Blöcke mittels Regex (`markdown.rs`).                        |

## Frontend (React / TypeScript)

| Begriff           | Definition                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zustand**       | State-Management-Bibliothek für React. Wird für `appStore` und `blueprintStore` verwendet.                                                      |
| **AppStore**      | Zentrale Zustand-Store-Instanz (`stores/appStore.ts`). Hält UI-State, Filterlogik und FileTree-Konstruktion.                                    |
| **Explorer**      | Linke Spalte der Drei-Spalten-UI. Enthält die Baumansicht (`FileTree`), die Suche (`SearchBar`) und das Filter-Panel (`FilterPanel`).           |
| **FilterPanel**   | UI-Komponente zum Filtern von Prompts (Textsuche, Kategorie, Score-Range, Hygiene-Status, Tags, Favoriten).                                     |
| **FileTree**      | Rekursive Baumkomponente, die Ordner und Dateien als expandierbare Knoten darstellt. Mittels `React.memo` optimiert.                            |
| **ARIA**          | Accessible Rich Internet Applications. PromptVault Lite setzt `aria-label`, `aria-pressed` und `aria-expanded` für Screenreader-Zugänglichkeit. |
| **Optimistic UI** | UI-Update vor der Server/Backend-Antwort. Wird beim Favoriten-Toggle verwendet; bei Fehlern erfolgt automatischer Revert.                       |

## Backend / Rust

| Begriff           | Definition                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tauri 2**       | Rust-basiertes Desktop-Framework. Stellt IPC-Brücke zwischen React-Frontend und Rust-Backend bereit.                                         |
| **Tauri Command** | IPC-Endpunkt, der vom Frontend per `invoke()` aufgerufen wird. Definiert in `commands/`-Modulen (z. B. `scan_directory`, `evaluate_prompt`). |
| **walkdir**       | Rust-Crate für rekursives Directory-Walk. Wird im Scanner für die Dateisuche verwendet (max. 50 Ebenen Tiefe).                               |
| **rusqlite**      | Rust-Bindings für SQLite. Wird für Favoriten-Persistenz und Cache genutzt.                                                                   |
| **canonicalize**  | Standard-Rust-Funktion zur Pfad-Auflösung. Zentrale Sicherheitsmaßnahme gegen Path-Traversal-Angriffe in Export und Scan.                    |
| **notify**        | Rust-Crate für Dateisystem-Events. Treibt den File-Watcher mit 500-ms-Debounce an.                                                           |
| **serde**         | Serialisierungsframework für Rust. Wird für JSON-Exporte und Frontmatter-Parsing verwendet.                                                  |
| **AppState**      | In `lib.rs` registrierter Tauri-State (`tauri::State`). Hält die Datenbank-Instanz und globale Konfiguration.                                |

## Analyse

| Begriff              | Definition                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Qualitätsanalyse** | Regelbasierte Bewertung eines Prompts anhand von 10 gewichteten Kriterien (Rolle, Ziel, Kontext, Eingaben, Vorgehen, etc.). Ergebnis: Score 0–100.            |
| **Hygieneanalyse**   | Analyse auf unerwünschte Artefakte in Prompts (PII, Secrets, Logs, Stacktraces, Build-Output). Ergebnis: Score 0–100 + Status (`clean`/`warning`/`critical`). |
| **Artefakt**         | Ein in der Hygieneanalyse detektierter unerwünschter Inhalt. 12 Kategorien (z. B. `PII`, `SECRET`, `LOG_LINE`, `STACKTRACE`).                                 |
| **Score**            | Numerisches Bewertungsergebnis (0–100). Wird für Qualität und Hygiene separat berechnet.                                                                      |
| **Evaluierung**      | Prozess der Qualitätsanalyse für einen einzelnen Prompt (Ergebnis: `PromptEvaluation` mit Kriterien-Scores).                                                  |

## Infrastruktur / Prozesse

| Begriff                                | Definition                                                                                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CI (Continuous Integration)**        | GitHub Actions-Workflow `ci.yml`. Prüft Typecheck, Lint, Frontend-Tests, Rust-Tests und Build vor Merge.                                                                             |
| **ADR (Architecture Decision Record)** | Dokumentierte Architekturentscheidung. Abgelegt in `docs/adr/`. Aktuell: ADR-001 (AI Governance), ADR-002 (Docs-as-Code).                                                            |
| **Diátaxis**                           | Dokumentations-Systematik von Daniele Procida: Tutorials, How-to Guides, Reference, Explanation. PromptVault Lite strukturiert `docs/` nach diesem Schema.                           |
| **Docs-as-Code**                       | Dokumentation wird wie Code behandelt: versioniert, reviewed, getestet. ADR-002 definiert die Plattform.                                                                             |
| **Cold / Warm / Hot Context**          | Kontext-Zonen-Modell aus `CONTEXT_ENGINEERING_STANDARD.md`: Cold = unverhandelbare Regeln, Warm = beratendes Projektwissen, Hot = aktueller Laufzeitkontext mit TTL.                 |
| **Evidence-Gate**                      | Prüfpunkt, der belegte Nachweise fordert. Kategorien: severity_claim, architecture_decision, bug_fix, feature_complete, migration_ready. Policy-Dateien sind als `planned` markiert. |
| **Speckit-Workflow**                   | Spezifikationsgetriebener Workflow: Constitution → Specify → Plan → Tasks → TaskstoIssues → Implement. Vorgeschaltet vor jeder Implementierung.                                      |
| **MCP (Model Context Protocol)**       | Protokoll für KI-Tool-Zugriff. Trust-Tiers (0/1/2) definieren Zugriffsrechte. Policy-Dateien sind als `planned` markiert.                                                            |

## Blueprint (in Entwicklung)

| Begriff                        | Definition                                                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Blueprint**                  | Strukturierte Beschreibung einer Software-Komponente oder eines Systems. Wird in Markdown mit spezifischem Schema verfasst. |
| **Blueprint-Scanner**          | Scanner für Blueprint-Dateien (`scanner/blueprint_scanner.rs`). In Entwicklung.                                             |
| **Blueprint-Qualitätsanalyse** | Qualitätsbewertung für Blueprints (`analysis/blueprint_quality.rs`). In Entwicklung.                                        |
| **BlueprintStore**             | Zustand-Store für Blueprint-Daten (`stores/blueprintStore.ts`). In Entwicklung.                                             |
