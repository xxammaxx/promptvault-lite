---
title: Architekturüberblick
description: High-Level-Architektur, Systemgrenzen und Design-Prinzipien von PromptVault Lite.
version: 1.5.0
---

# Architekturüberblick

> Ergänzung zur detaillierten [Architekturdokumentation](../ARCHITECTURE.md).
> Dieses Dokument beschreibt die Systemarchitektur aus der Vogelperspektive.

## Systemgrenzen

```
┌──────────────────────────────────────────────────────┐
│                    Benutzer                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │           Tauri Desktop Applikation              │ │
│  │  ┌──────────────────────┐  ┌──────────────────┐  │ │
│  │  │  React / TypeScript  │◀─▶│  Rust Backend    │  │ │
│  │  │  (Vite + Zustand)    │IPC│  (Tauri 2)       │  │ │
│  │  └──────────┬───────────┘  └────────┬─────────┘  │ │
│  │             │                        │            │ │
│  │             ▼                        ▼            │ │
│  │  ┌──────────────────────┐  ┌──────────────────┐  │ │
│  │  │  Lokales Dateisystem │  │  SQLite / JSON    │  │ │
│  │  │  (Vault-Ordner)      │  │  (Persistenz)     │  │ │
│  │  └──────────────────────┘  └──────────────────┘  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│  Keine Netzwerkaufrufe · Keine Telemetrie · Kein Cloud │
└──────────────────────────────────────────────────────┘
```

## Technologie-Stack

| Schicht           | Technologie                      | Zweck                                      |
| ----------------- | -------------------------------- | ------------------------------------------ |
| **Desktop-Hülle** | Tauri 2                          | IPC-Bridge, Fensterverwaltung, native APIs |
| **Frontend**      | React 18 + TypeScript + Vite     | UI, State, Routinglos (Single-View)        |
| **State**         | Zustand 4                        | Globaler Store (AppStore, BlueprintStore)  |
| **UI-Testing**    | Vitest + Testing Library + jsdom | Frontend-Tests                             |
| **Backend**       | Rust (edition 2021)              | Dateiscan, Analyse, Persistenz             |
| **Parser**        | serde_yaml + Regex               | Frontmatter + Markdown-Struktur            |
| **Scanner**       | walkdir                          | Rekursiver Directory-Scan                  |
| **File-Watcher**  | notify (6.x)                     | Änderungsüberwachung                       |
| **DB**            | rusqlite (bundled SQLite)        | Favoriten, Cache                           |
| **Export**        | serde_json + zip                 | JSON/Markdown/ZIP-Export                   |
| **Build-Tool**    | pnpm                             | Paketmanagement, Workspaces                |

## Datenfluss (vereinfacht)

```
1. Benutzer wählt Ordner
       │
       ▼
2. Tauri Command: scan_directory ───→ walkdir-Scan aller .md-Dateien
       │
       ▼
3. Parser verarbeitet Frontmatter + Content
       │
       ▼
4. Daten landen im AppStore (Zustand)
       │
       ▼
5. Explorer-Baum wird aus fileTree()-Selector konstruiert
       │
       ▼
6. Benutzer wählt Prompt aus ───→ DetailsPanel zeigt Metadaten + Content
       │
       ▼
7. Analyse (evaluate_prompt / analyze_hygiene) → Score + Status + Artefakte
       │
       ▼
8. Favoriten-Toggle → SQLite-Persistenz
   Export → JSON/Markdown/ZIP (mit Path-Traversal-Schutz)
```

## Design-Prinzipien

### Local-Only

Kein Netzwerkverkehr. Alle Analysen laufen lokal auf dem Gerät des Benutzers. Keine Telemetrie ohne expliziten Opt-in.

> **Belegt:** Sicherheits-Gates in `docs/SECURITY_GATES.md` verbieten `reqwest`, `hyper`, `fetch`, `XMLHttpRequest` in Analyse-Code.

### Path-Traversal-Safe

Alle Dateioperationen (Scan, Export) verwenden `canonicalize` zur Pfad-Normalisierung. Externe Symlinks werden blockiert.
`".."`- und `"."`-Segmente werden aus Pfaden gefiltert.

> **Belegt:** Integrationstests in `src-tauri/tests/command_errors.rs`.

### Deterministische Analyse

Kein ML, keine externen APIs. Die Qualitäts- und Hygieneanalyse basiert auf fest codierten Regex-Heuristiken. Gleicher Input → gleicher Output.

### Issue → Spec → Code

Jede Änderung folgt dem Workflow: Issue → Spec → Verification Contract → Red Tests → Code.
Siehe [AI Workflow](../AI_WORKFLOW.md) und [AGENTS.md](https://github.com/xxammaxx/promptvault-lite/blob/main/AGENTS.md) für Details.

### Red-Green-Refactor

Tests werden vor der Implementierung geschrieben (Red). Dann wird implementiert (Green). Dann wird refaktorisiert.
Siehe [TESTING.md](../TESTING.md) für die Test-Infrastruktur.

## Detaillierte Architektur

Für eine vollständige Modulbeschreibung, Dateistruktur und Datenflussdiagramm siehe:

- **[ARCHITECTURE.md](../ARCHITECTURE.md)** — Vollständige Architektur mit Diagrammen
- **[docs/reference/project-structure.md](../reference/project-structure.md)** — Vollständige Dateistruktur-Referenz

## Architecture Decision Records

Alle dokumentierten Architekturentscheidungen liegen in `docs/adr/`:

| ADR                                                | Titel                                  | Status   |
| -------------------------------------------------- | -------------------------------------- | -------- |
| [ADR-001](../adr/ADR-001-ai-governance.md)         | AI Governance & GitHub Source-of-Truth | Accepted |
| [ADR-002](../adr/ADR-002-docs-as-code-platform.md) | Documentation-as-Code Platform         | Accepted |
