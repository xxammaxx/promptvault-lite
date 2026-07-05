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
  Recursively scan local folders with `.md`, `.markdown` and `.txt` prompt files.

- **Prompt Explorer**
  Browse prompt folders in a clean desktop file tree with search, filters and favorites.

- **Quality Analysis**
  Score prompts across clarity, role definition, goal structure, context quality, output format and reusability.

- **Hygiene Detection**
  Find prompt contamination such as secrets, private paths, logs, OCR residue, foreign project context and evidence clutter.

- **Blueprint Intelligence**
  Detect prompt blueprints, hybrid prompt/spec files and architecture-like agent instructions.

- **Settings**
  Configure theme (light/dark/auto), export format preferences, developer mode, and keyboard shortcuts via the settings modal.

- **Local Prompt Optimizer**
  Improve prompts in conservative, balanced or aggressive mode — fully local and deterministic.

- **Export Tools**
  Export prompt data and analysis results as JSON, Markdown or ZIP.

- **Privacy-first Desktop App**
  No cloud backend. No API calls. No telemetry. No account. No prompt upload.

---

## Current Release

**v1.7.1** is the current stable release.

This patch release fixes the Windows startup crash that could happen on first launch after installation when the app data directory did not exist yet.

A Windows x64 installer is available as a GitHub Release asset:

- `PromptVault.Lite_1.7.1_x64-setup.exe`

Note: The installer is currently unsigned. Windows SmartScreen may show an "Unknown publisher" warning.

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
- SQLite
- Vite
- Vitest
- MkDocs

---

## Project Status

PromptVault Lite is in a stable public release state.

The real corpus pilot is complete, the Windows startup crash is fixed, the v1.7.1 installer is published, and active documentation now matches the current release state.

Since v1.7.1, the `master` branch has received significant classification improvements:

- **Settings Modal** (PR #186) with theme, export format, dev mode, and reset
- **GUIDELINE classification** (PR #190) for policy and guideline-style prompts
- **Real-corpus classification reasons** (PR #192) with regression fixtures
- **Regex/backtracking hardening** (PR #196) in prompt quality analysis
- **BLUEPRINT/DOCUMENTATION boundary refinement** (PR #197)
- **UNKNOWN confidence and fallback explanations** (PR #198)
- **UI/Optimizer/Classification/Layout fixes** (PR #185)

These are on master but not yet in a release build. The final real-corpus validation recheck (Issue #191) passed on 2026-07-04.

Remaining known limitations:

- unsigned Windows installer
- no code signing certificate yet
- no auto-updater
- no macOS/Linux installers yet
- Remote-CI is currently infra-blocked; local CI is authoritative

---

## Best next improvements

- Code signing for Windows installer
- macOS `.dmg` build
- Linux `.AppImage` build
- Create v1.7.2 release with classification improvements (GUIDELINE, BLUEPRINT/DOC boundary, UNKNOWN fallback) plus Settings Modal and UI/optimizer fixes
- optional Web/LAN/Docker deployment later
