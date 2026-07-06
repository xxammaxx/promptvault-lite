# PromptVault Lite

**Local-first desktop app for managing, analyzing and improving prompt collections.**

PromptVault Lite helps you turn messy prompt folders into a structured, searchable and quality-checked local prompt archive — without cloud upload, accounts, telemetry or remote AI calls.

![Release](https://img.shields.io/badge/release-v1.7.1-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20x64-lightgrey)
![Privacy](https://img.shields.io/badge/privacy-local--first-green)
![Stack](https://img.shields.io/badge/stack-Tauri%20%7C%20React%20%7C%20Rust-4444ff)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## What it does

PromptVault Lite scans local `.md`, `.markdown` and `.txt` prompt files, shows them in a desktop explorer, evaluates their quality and hygiene, detects blueprint-style prompts, and helps you optimize prompt structure in a deterministic, offline workflow.

It is built for people who collect, write and refine many prompts — especially agent prompts, project prompts, workflow prompts and reusable prompt blueprints.

---

## Key Features

- **Local Prompt Archive**
  Recursively scan local folders with `.md`, `.markdown` and `.txt` prompt files (1 MiB limit).

- **Prompt Explorer**
  Browse prompt folders in a clean desktop file tree with search, filters and favorites.

- **Quality Analysis**
  Score prompts across clarity, role definition, goal structure, context quality, output format and reusability.

- **Hygiene Detection**
  Find prompt contamination such as secrets, private paths, logs, OCR residue, foreign project context and evidence clutter.

- **Blueprint Intelligence**
  Detect prompt blueprints, hybrid prompt/spec files and architecture-like agent instructions. Evaluate and optimize blueprint quality across 10 dimensions.

- **Paste Prompt Analyzer**
  Analyze pasted or typed prompt text directly — no file needed, no persistence, fully local.

- **Audio Summary**
  Get an AI-readable text summary of any prompt with optional text-to-speech playback via local Web Speech API.

- **Settings**
  Configure theme (light/dark/auto), export format preferences, developer mode, and keyboard shortcuts via the settings modal.

- **Local Prompt Optimizer**
  Improve prompts in conservative, balanced or aggressive mode — fully local and deterministic.

- **Export Tools**
  Export prompt data and analysis results as JSON, Markdown or ZIP.

- **Embeddings (Phase 1 — Mock)**
  Embedding feature flag and mock provider for future semantic search. Disabled by default. No real ML model.

- **Privacy-first Desktop App**
  No cloud backend. No API calls. No telemetry. No account. No prompt upload.

---

## Current Release

**v1.7.1** is the current stable release.

A Windows x64 installer is available as a GitHub Release asset:

- `PromptVault.Lite_1.7.1_x64-setup.exe`

Note: The installer is currently unsigned. Windows SmartScreen may show an "Unknown publisher" warning.

Since v1.7.1, the `master` branch has received many improvements (not yet in a release):

- **Settings Modal** — theme, export format, dev mode, reset
- **Audio Summary** — TTS via Web Speech API
- **Paste Prompt Analyzer** — direct clipboard/text analysis
- **Embeddings Phase 1** — mock provider + feature flag
- **Classification improvements** — GUIDELINE, BLUEPRINT/DOC boundary, UNKNOWN fallback
- Docs Baseline Sync (#207) completed via PR #208. v1.7.2 release readiness has been reviewed. Release execution still requires separate manual owner approval.

---

## Install

### Recommended for Windows users

Download the Windows x64 installer from the latest GitHub Release and run:

```text
PromptVault.Lite_1.7.1_x64-setup.exe
```

### Developer / source install

```bash
git clone https://github.com/xxammaxx/promptvault-lite.git
cd promptvault-lite
pnpm install
pnpm start
```

---

## Privacy Model

PromptVault Lite is designed as a local-first tool:

- no cloud storage
- no remote LLM calls
- no API-based optimizer
- no telemetry
- no accounts
- no automatic publishing
- prompt files stay on your machine

---

## Built With

- Tauri 2
- React 18
- TypeScript
- Rust
- Zustand
- SQLite
- Vite
- Vitest
- MkDocs

---

## Project Status

PromptVault Lite is in a stable public release state (v1.7.1).

Master branch has significant improvements merged since v1.7.1, including the Docs Baseline Sync (PR #208). v1.7.2 release readiness has been reviewed. Release execution still requires separate manual owner approval.

Known limitations:

- unsigned Windows installer (no code signing certificate)
- no auto-updater
- no macOS/Linux pre-built installers
- Remote-CI is infra-blocked (Issue #154); local CI is authoritative
- Embeddings Phase 1 is mock-only (no real semantic search)
- Docker/Web/LAN deployment is deferred

---

## Best next improvements

- Create v1.7.2 release with accumulated improvements (manual owner approval required before release execution)
- Embeddings Phase 2: DB schema planning (#199)
- Code signing for Windows installer
- macOS `.dmg` build
- Linux `.AppImage` build
