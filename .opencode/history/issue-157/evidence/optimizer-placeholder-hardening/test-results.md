# Test Results — Optimizer Placeholder Hardening

**Date:** 2026-06-18
**Runner:** Vitest v1.6.0 + Cargo test

## Frontend Tests (Vitest)

```
✓ src/lib/__tests__/promptContextEvaluation.test.ts  (67 tests)
✓ src/actions/__tests__/red-tests.test.ts            (44 tests)
✓ src/stores/__tests__/appStore.test.ts              (48 tests)
✓ .opencode/corpus-qa/evaluation-corpus.test.ts      (68 tests)
✓ src/lib/__tests__/promptOptimizer.test.ts          (54 tests)
✓ .../AnalysisPanel.test.tsx                         (22 tests)
✓ .../FileTree.test.tsx                              (13 tests)
✓ .../TreeNode.test.tsx                              (17 tests)
✓ .../FilterPanel.test.tsx                           (20 tests)
✓ .../OptimizationPanel.test.tsx                     (13 tests)
✓ .../ThemeToggle.test.tsx                           (10 tests)

Test Files  11 passed (11)
     Tests  376 passed (376)
  Duration  14.30s
```

## Rust Tests (Cargo)

```
Unit tests:     102 passed, 0 failed, 1 ignored
Integration:     17 passed, 0 failed
Doc tests:        0 passed

Total Rust: 119 tests PASS
```

## Gates

| Gate | Command | Result |
|------|---------|--------|
| Frontend Tests | pnpm test | PASS (376/376) |
| Rust Tests | cargo test | PASS (119/119) |
| Lint | pnpm lint | PASS (0 errors, 0 warnings) |
| Build | pnpm build | PASS |
| Rust Format | cargo fmt --check | PASS |
| Rust Clippy | cargo clippy --all-targets -- -D warnings | PASS |
| Rust Build | cargo build | PASS |
| CI (remote) | gh pr view 145 check | 3/3 green on master |

**Total: 8/8 gates PASS**
