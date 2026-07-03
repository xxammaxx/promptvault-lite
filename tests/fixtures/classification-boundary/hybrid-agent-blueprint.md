# Agent Prompt: Implement Export Feature

## Role

You are a senior full-stack developer implementing the batch export
feature for PromptVault Lite.

## Context

The export feature allows users to select multiple prompts and export
them as Markdown, JSON, or CSV files. See blueprint #BP-2026-07 for
the full specification.

## System Architecture Context

The application has three layers:

- Frontend: React + TypeScript with component tree
- Backend: Rust via Tauri IPC commands
- Storage: SQLite database

## Acceptance Criteria (Blueprint Reference)

- AC1: Multi-select with checkbox column
- AC2: Export dialog with format picker
- AC3: Progress bar with cancel
- AC4: Post-export summary
- AC5: Path traversal safety

## Implementation Plan

### Task 1: Checkbox Selection

Add checkbox column to the prompt list table.

### Task 2: Export Engine

Implement Rust export function that reads from SQLite and writes files.

### Task 3: Export Dialog

Build the React dialog component.

## Verification Contract

- Selection must work with keyboard and mouse
- Export must handle cancellation gracefully
- All exports must pass path traversal validation
- CI gates must pass before merge

## Ergebnisformat

Return the complete implementation with tests, following the
specification above. Include evidence of passing local gates.

## Human Approval Gate

No merge without explicit human approval. The reviewer-agent must
validate path traversal safety before approval.
