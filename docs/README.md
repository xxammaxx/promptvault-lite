---
title: PromptVault Lite
description: Projektübersicht, Schnellstart und Verweise auf die restliche Dokumentation.
version: 1.0.0
---

# PromptVault Lite

PromptVault Lite ist ein lokales Desktop-Tool zum Einlesen, Durchsuchen und Bewerten von Markdown-Prompts. Die App scannt einen Ordner rekursiv, zeigt Prompts im Drei-Spalten-Layout an und führt regelbasierte Qualitäts- und Hygieneanalysen lokal aus.

## Features

- Rekursiver Scan von `.md`-Dateien
- Drei-Spalten-UI: Explorer, Details, Analyse
- Frontmatter-Parsing mit Fallbacks für fehlende Felder
- Volltextsuche und Filter im Explorer
- Qualitätsanalyse mit Score 0–100
- Hygieneanalyse mit Score 0–100 und Artefakterkennung
- Kopieren und Datei-Öffnen aus der Detailansicht
- Lokale Persistenz-Module für SQLite und JSON-Cache

## Quick Start

```bash
pnpm install
pnpm tauri dev
```

1. Starte die App.
2. Klicke auf **Ordner öffnen**.
3. Wähle einen lokalen Ordner mit Markdown-Prompts.
4. Wähle einen Prompt im Explorer aus.
5. Lies Metadaten, Inhalt und Analyse rechts in der App.

## Screenshots

> Screenshots folgen — siehe Issue #27 für die geplante README-Überarbeitung mit aktuellem Bildmaterial.

## Tech Stack

- Frontend: React, TypeScript, Vite, Zustand, react-markdown
- Backend: Rust, Tauri 2
- Persistenz: SQLite, JSON-Cache
- Analyse: Regex- und heuristikbasierte lokale Auswertung
- Desktop-Plugins: Dialog, Clipboard, Shell, Filesystem

## Weitere Dokumente

- [Installation](INSTALL.md)
- [Architektur](ARCHITECTURE.md)
- [Benutzerhandbuch](USER_GUIDE.md)
- [Tests](TESTING.md)
- [Changelog](CHANGELOG.md)
