# Architecture Overview — PromptVault Lite

## System Architecture

PromptVault Lite is a local-first desktop application built with a
React frontend, Rust/Tauri backend, and SQLite storage. All processing
is local with no cloud dependencies.

## Component Architecture

The application consists of three main layers:

- **Frontend Layer**: React (TypeScript, Vite) — UI components, routing,
  state management via Zustand
- **Backend Layer**: Rust (Tauri) — file scanning, prompt scoring,
  optimization, classification
- **Storage Layer**: SQLite — prompt vault, evaluation cache, settings

## Data Flow

1. User imports markdown files via file picker or drag-and-drop
2. Tauri scanner reads files recursively within vault root
3. Classification engine classifies each prompt
4. Scoring engine evaluates quality metrics
5. Results stored in SQLite for persistence

## Deployment Model

Desktop application distributed via GitHub Releases. Windows installer
(NSIS), macOS DMG, Linux AppImage. No server component required.

## Technology Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Rust, Tauri 2.x
- Database: SQLite via Tauri plugin
- Build: pnpm, cargo

## Known Limitations

- Scoring is heuristic-based, not LLM-driven
- Large vaults (>5000 files) may experience performance impact
- No cloud sync or collaborative features
