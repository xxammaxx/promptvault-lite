# Project Status and Roadmap — PromptVault Lite

## Current Status

v1.7.1 released with Windows installer. Core features stable.
All CI gates green on master branch.

## Recent Milestones

- v1.7.0: Blueprint detection, classification, evaluation, optimization
- v1.6.0: Prompt scoring, quality analysis, settings
- v1.5.0: Initial release with vault management

## Roadmap

### Phase 1: Core Stability (completed)

- Vault file scanning and indexing
- Basic prompt quality scoring
- Search and filter

### Phase 2: Classification (completed)

- Blueprint vs prompt vs documentation classification
- Guideline detection
- Contamination detection

### Phase 3: Optimization (in progress)

- Blueprint optimization with multiple modes
- Prompt quality improvement suggestions

### Phase 4: Advanced Features (planned)

- Template management
- Batch operations
- Export enhancements

## Architecture Decisions

The application uses a hybrid Rust/TypeScript architecture where
performance-critical operations (file scanning, scoring) run in Rust
via Tauri commands, while UI rendering and user interaction run in
the React frontend.

## System Components

- Scanner Module: Rust, handles recursive file discovery
- Classifier: TypeScript, content classification engine
- Optimizer: TypeScript, blueprint and prompt optimization
- Storage: SQLite for persistence
