## Summary

This PR hardens PromptVault Lite's placeholder optimization flow.

The optimizer now prevents unresolved placeholders from being treated as completed optimized prompts. Balanced mode warns instead of injecting TODO comments, aggressive mode uses safer fill-in hints, and context evaluation strips placeholder sections to avoid score inflation.

## Changed Files

- `src/lib/promptOptimizer.ts`
- `src/lib/promptContextEvaluation.ts`
- `src/types/index.ts`
- `src/lib/__tests__/promptOptimizer.test.ts`
- `src/lib/__tests__/promptContextEvaluation.test.ts`
- `docs/PROJECT_STATUS.md`
- `docs/EVIDENCE_PORTFOLIO.md`
- `docs/evidence/optimizer-placeholder-hardening/*`

## Verification

| Gate | Command | Result |
|------|---------|--------|
| Frontend Tests | `pnpm test` | PASS (376/376) |
| Rust Tests | `cargo test` | PASS (119/119) |
| Lint | `pnpm lint` | PASS (0 warnings) |
| TypeScript Build | `pnpm build` | PASS |
| Rust Format | `cargo fmt --check` | PASS |
| Clippy | `cargo clippy --all-targets -- -D warnings` | PASS |
| Rust Build | `cargo build` | PASS |

Total: 495 tests passing, 7/7 local gates green.

## Evidence

See:
- `docs/evidence/optimizer-placeholder-hardening/RUN_REPORT.md`
- `docs/evidence/optimizer-placeholder-hardening/test-results.md`
- `docs/evidence/optimizer-placeholder-hardening/diff-summary.md`

## Safety

- No external services.
- No telemetry.
- No cloud sync.
- No original prompt overwrite.
- No auto-merge.
- No release action.

## Non-goals

- Binary release pipeline.
- macOS/Windows CI.
- Docker deployment.
- GitHub topics/homepage/social preview.
- PR #145 NAS folder support.

## Human Approval

Merge requires explicit Human Approval after review.
