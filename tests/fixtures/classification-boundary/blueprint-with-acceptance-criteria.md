# Blueprint: Prompt Export Enhancement

## Goal

Add batch export functionality to allow users to export multiple
prompts at once in various formats (Markdown, JSON, CSV).

## Acceptance Criteria

- User can select multiple prompts via checkbox selection
- Export dialog supports format selection (Markdown, JSON, CSV)
- Batch export preserves folder structure in output
- Export progress is shown with cancel option
- All exported files are validated for path traversal safety
- Export completes within 5 seconds for 100 prompts

## Requirements

### Functional Requirements

- FR1: Multi-select in prompt list with Shift/Ctrl+click
- FR2: Export dialog with format dropdown and path picker
- FR3: Progress bar with file count and cancel button
- FR4: Post-export summary (files exported, errors, duration)

### Non-Functional Requirements

- NFR1: Memory usage below 200MB for 1000 prompts
- NFR2: Cancel stops within 2 seconds
- NFR3: UTF-8 encoding for all output files

## Implementation Phases

### Phase 1: Core Selection

- Add checkbox column to prompt table
- Implement select-all/none toggle
- Add selection counter to status bar

### Phase 2: Export Engine

- Implement export dispatcher (Markdown, JSON, CSV)
- Add progress tracking with AbortController
- Implement path validation via canonicalize

### Phase 3: Export Dialog

- Build dialog component with format picker
- Add destination folder browser
- Show progress and summary

## Verification Contract

- Selection tests: checkbox toggle, select-all
- Export format tests: correct output for each format
- Security tests: path traversal attempts are blocked
- Performance tests: 100 prompts under 5 seconds
- CI gates: pnpm test, cargo test must pass

## Next Steps

1. Implement checkbox selection in prompt table
2. Create export engine module in Rust
3. Build export dialog component
4. Integration test the full flow
