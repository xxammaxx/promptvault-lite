# Diff Summary — Optimizer Placeholder Hardening

**Pre-run commit:** bf7a003
**Branch:** feature/optimizer-placeholder-hardening

## Changed Files (5 tracked, all modified)

| File | Inserts | Deletions | Net |
|------|---------|-----------|-----|
| src/lib/promptOptimizer.ts | +172 | -31 | +141 |
| src/lib/promptContextEvaluation.ts | +105 | ? | +105 est. |
| src/lib/__tests__/promptOptimizer.test.ts | +305 | ? | +305 est. |
| src/lib/__tests__/promptContextEvaluation.test.ts | +147 | ? | +147 est. |
| src/types/index.ts | +9 | 0 | +9 |

**Total:** ~+738 / -31 / net +707

## What Changed

### promptOptimizer.ts
- Added: `containsUnresolvedPlaceholder()` — detects TODO/TBD/placeholder patterns
- Added: `extractPlaceholders()` — extracts specific placeholder occurrences
- Added: `validateOptimizedPromptQuality()` — quality gate for optimized outputs (checks unresolved placeholders, empty sections, structural improvement)
- Added: `isSectionContentEmpty()` — detects sections with only placeholder content
- Changed: Balanced mode no longer injects TODO comments for missing sections — warns instead
- Changed: Aggressive scaffolding uses "(Bitte ausfüllen)" instead of HTML TODO comments
- Changed: Quality validation section added (508-646)

### promptContextEvaluation.ts
- Added: `stripPlaceholderSections()` — prevents score inflation from placeholder-only sections
- Added: `isPlaceholderOnly()` — detects sections that are only whitespace/comments/placeholders
- Added: PLACEHOLDER_ONLY_PATTERNS regex array
- Changed: Constraint heading detection improved (supports headings without colon)
- Changed: Output format heading detection improved (supports headings without colon)

### types/index.ts
- Added: `OptimizationQualityResult` interface with `passed`, `unresolved_placeholders`, `empty_sections`, `warnings`, `structural_improvement_confirmed`

### Tests
- Added: Placeholder hardening tests for balanced mode (4 tests)
- Added: Placeholder hardening tests for aggressive mode (4 tests)
- Added: Positron regression tests (6 tests)
- Added: BescheidPilot regression tests (5 tests)
- Added: Quality validation function tests (7 tests)
