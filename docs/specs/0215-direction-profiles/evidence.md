# Evidence Report: Direction Profiles (#215)

> **Issue:** [#215](https://github.com/xxammaxx/promptvault-lite/issues/215)
> **Epic:** [#214](https://github.com/xxammaxx/promptvault-lite/issues/214) — Prompt-Optimierung mit Ergebnisvarianten und dynamischen Rückfragen
> **ADR:** ADR-003 in `docs/DECISIONS.md` (Status: Accepted)
> **Date:** 2026-07-11
> **Agent:** Issue Orchestrator (Documentation & Evidence — Batch 9)

---

## 1. Feature-Zusammenfassung

Das Feature **Direction Profiles** ermöglicht es, aus einem bestehenden Prompt mehrere strategische Ergebnisvarianten mit unterschiedlichen Zielrichtungen zu erzeugen — ohne harte Constraints zu entfernen oder zu schwächen. Es ist eine **parallele, unabhängige Transformationsschicht** zum bestehenden Optimizer, die 13 vordefinierte Richtungsprofile sowie benutzerdefinierte Richtungen (Freitext) unterstützt.

- **Pipeline-Position:** Analyse → Missing-Info-Gate → Variantenbildung (parallel zum Optimizer)
- **Generator-Ansatz:** Template-basiert (PromptPrefix + Tonalitäts-Anpassung), Phase 1
- **Feature-Flag:** `PROMPTVAULT_DIRECTION_PROFILES`, default disabled
- **Constraint-Integration:** Constraint Preservation mit sichtbaren Konflikten (BLOCKING/WARNING)
- **#216-Integration:** Nutzt `enrichedContent` aus Missing-Info-Gate als optionalen Input

---

## 2. Batch-Übersicht

| Batch | Commit    | Datum      | Beschreibung                                                      | Dateien (± Zeilen)                                                           |
| ----- | --------- | ---------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| B1    | `9c17c8c` | 2026-07-10 | Foundation: Types + Feature-Flag                                  | A: `directionFeatureFlag.ts`; M: `types/index.ts`                            |
| B2    | `cb2a3e4` | 2026-07-10 | Profiles + Generator: directionProfiles, variantGenerator         | A: `directionProfiles.ts`, `variantGenerator.ts`                             |
| B3    | `2e77409` | 2026-07-10 | Safety: Constraint Preservation, Security Hardening               | M: `constraintChecker.ts` (+73 Zeilen)                                       |
| B4    | `2633513` | 2026-07-10 | Store: variantResults State + Actions                             | M: `appStore.ts` (+306 Zeilen)                                               |
| B5    | `3daa988` | 2026-07-10 | UI: VariantPanel, DirectionProfileSelector, VariantResultList     | A: 3x Komponenten (~1000 Zeilen)                                             |
| B6    | `e13ae04` | 2026-07-10 | Integration: ActionBar Button, handleOpenVariantPanel             | M: `DetailsPanel.tsx` (+62 Zeilen)                                           |
| B7    | `48b973b` | 2026-07-10 | Compare + Save: VariantCompare, Save-as-New-Version               | A: `VariantCompare.tsx`; M: `appStore.ts`                                    |
| B8A   | `8648f43` | 2026-07-10 | Tests: Unit-Tests (FeatureFlag, Profiles, Generator, Constraints) | A: 4x Testdateien (~2100 Zeilen)                                             |
| B8B   | `efd0d7d` | 2026-07-10 | Tests: UI-Tests (Selector, Panel, ResultList, Compare)            | A: 4x Testdateien (~2450 Zeilen)                                             |
| B8C   | `9dd3c10` | 2026-07-11 | Tests: Integration + Regression                                   | A: `VariantPanel.integration.test.tsx`; M: `DetailsPanel.blueprint.test.tsx` |
| B9    | (pending) | 2026-07-11 | Docs / Evidence / Final Gates                                     | M: DECISIONS.md, ROADMAP.md; A: evidence.md                                  |

---

## 3. Commit-Liste

```
9dd3c10 test(direction-profiles): cover variant integration and regressions
efd0d7d test(direction-profiles): harden variant ui coverage
8648f43 test(direction-profiles): harden unit coverage
48b973b feat(direction-profiles): add variant compare and save
e13ae04 feat(direction-profiles): wire variant panel into details
3daa988 feat(direction-profiles): add variant panel ui
2633513 feat(direction-profiles): add variant store state and actions
2e77409 feat(direction-profiles): preserve constraints during generation
cb2a3e4 feat(direction-profiles): add profiles and template generator
9c17c8c feat(direction-profiles): add foundation types and flag
```

**Diff-Stat vs. origin/master:** 22 files changed, 10470 insertions(+), 1 deletion(-)

---

## 4. Umgesetzte Issues (#257–#288)

| Issue | Task-ID   | Beschreibung                                          | Status           |
| ----- | --------- | ----------------------------------------------------- | ---------------- |
| #257  | T-215-001 | Typdefinitionen in types/index.ts                     | Implemented      |
| #258  | T-215-002 | Feature-Flag directionFeatureFlag.ts                  | Implemented      |
| #259  | T-215-003 | directionProfiles.ts — 13 Standardprofile             | Implemented      |
| #260  | T-215-004 | variantGenerator.ts — applyDirectionProfile           | Implemented      |
| #261  | T-215-005 | variantGenerator.ts — mapToPromptVariant              | Implemented      |
| #262  | T-215-006 | constraintChecker.ts — checkDirectionProfileConflicts | Implemented      |
| #263  | T-215-007 | Security-Hardening — System-Invarianten A1–A5         | Implemented      |
| #264  | T-215-008 | VariantStore State-Felder anlegen                     | Implemented      |
| #265  | T-215-009 | VariantStore Actions implementieren                   | Implemented      |
| #266  | T-215-010 | VariantPanel Modal-Container                          | Implemented      |
| #267  | T-215-011 | DirectionProfileSelector — Profil-Chip-Grid           | Implemented      |
| #268  | T-215-012 | Benutzerdefinierte Richtung (Freitext)                | Implemented      |
| #269  | T-215-013 | VariantResultList — Varianten-Ergebnisliste           | Implemented      |
| #270  | T-215-014 | ActionBar — Button „Varianten erzeugen"               | Implemented      |
| #271  | T-215-015 | DetailsPanel — VariantPanel-Handler                   | Implemented      |
| #272  | T-215-016 | VariantCompare — Side-by-Side-Vergleich               | Implemented      |
| #273  | T-215-017 | VariantCompare — Edge Cases                           | Implemented      |
| #274  | T-215-018 | Save-as-New-Version — saveVariantAsPrompt             | Implemented      |
| #275  | T-215-019 | Unit-Tests: directionFeatureFlag                      | Implemented      |
| #276  | T-215-020 | Unit-Tests: directionProfiles                         | Implemented      |
| #277  | T-215-021 | Unit-Tests: variantGenerator                          | Implemented      |
| #278  | T-215-022 | Unit-Tests: constraintChecker.direction               | Implemented      |
| #279  | T-215-023 | Store-Tests: appStore.variantResults                  | Implemented      |
| #280  | T-215-024 | UI-Tests: DirectionProfileSelector                    | Implemented      |
| #281  | T-215-025 | UI-Tests: VariantPanel                                | Implemented      |
| #282  | T-215-026 | UI-Tests: VariantResultList                           | Implemented      |
| #283  | T-215-027 | UI-Tests: VariantCompare                              | Implemented      |
| #284  | T-215-028 | Integrationstests: VariantPanel Full Flow             | Implemented      |
| #285  | T-215-029 | Integrationstests: enriched Content Flow              | Implemented      |
| #286  | T-215-030 | Integrationstests: Constraint Conflict Flow           | Implemented      |
| #287  | T-215-031 | Dokumentation — ADR-003, ROADMAP, Evidence            | In Progress (B9) |
| #288  | T-215-032 | Final Local Gate Run                                  | In Progress (B9) |

---

## 5. Testentwicklung

| Meilenstein            | Tests |
| ---------------------- | ----- |
| Start (nach #216)      | 1045  |
| Batch 1 (B1)           | 1062  |
| Batch 2 (B2)           | 1146  |
| Batch 3 (B3)           | 1219  |
| Batch 4 (B4)           | 1254  |
| Batch 5 (B5)           | 1337  |
| Batch 6 (B6)           | 1354  |
| Batch 7 (B7)           | 1381  |
| Batch 8A (Unit)        | 1386  |
| Batch 8B (UI)          | 1390  |
| Batch 8C (Integration) | 1438  |

### Neue Testdateien (8 Dateien)

| Testdatei                                                             | Tests | Kategorie   |
| --------------------------------------------------------------------- | ----- | ----------- |
| `src/lib/__tests__/directionFeatureFlag.test.ts`                      | 17    | Unit        |
| `src/lib/__tests__/directionProfiles.test.ts`                         | 47    | Unit        |
| `src/lib/__tests__/variantGenerator.test.ts`                          | 80    | Unit        |
| `src/lib/__tests__/constraintChecker.direction.test.ts`               | 35    | Unit        |
| `src/stores/__tests__/appStore.variantResults.test.ts`                | 35    | Store       |
| `src/components/variants/__tests__/DirectionProfileSelector.test.tsx` | 30    | UI          |
| `src/components/variants/__tests__/VariantPanel.test.tsx`             | 32    | UI          |
| `src/components/variants/__tests__/VariantResultList.test.tsx`        | 34    | UI          |
| `src/components/variants/__tests__/VariantCompare.test.tsx`           | 18    | UI          |
| `src/components/variants/__tests__/VariantPanel.integration.test.tsx` | 48    | Integration |

### Erweiterte Testdateien

| Testdatei                                                          | Neue Tests | Kategorie                |
| ------------------------------------------------------------------ | ---------- | ------------------------ |
| `src/components/details/__tests__/DetailsPanel.blueprint.test.tsx` | +10        | VariantPanel Integration |

---

## 6. Security- und Constraint-Nachweis

### System-Invarianten (A1–A5)

| #   | Invariante                              | Test-Nachweis                                                                             |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| A1  | Original-Prompt unverändert             | `variantGenerator.test.ts`: Original-Inhalt bleibt nach Generierung erhalten              |
| A2  | Harte Constraints erhalten              | `constraintChecker.direction.test.ts`: Alle Constraints in preservedConstraints           |
| A3  | Keine Cloud-Referenzen bei offline_only | `constraintChecker.direction.test.ts`: BLOCKING-Konflikt für deep_research + offline_only |
| A4  | Keine stille Constraint-Entfernung      | `variantGenerator.test.ts` + `constraintChecker.direction.test.ts`                        |
| A5  | Varianten sind neue Strings             | `variantGenerator.test.ts`: `variant.content !== sourceContent`                           |

### Security-Kategorien (nicht abschwächbar)

| Kategorie           | Profil          | Behandlung                        | Test                                |
| ------------------- | --------------- | --------------------------------- | ----------------------------------- |
| `offline_only`      | `deep_research` | BLOCKING, Cloud-Hinweise entfernt | constraintChecker.direction.test.ts |
| `approval_required` | `agentisch`     | BLOCKING, Human Approval erhalten | constraintChecker.direction.test.ts |
| `scope_boundary`    | `agentisch`     | BLOCKING, Scope erhalten          | constraintChecker.direction.test.ts |

---

## 7. #216-Abgrenzung

### Korrekt — keine Duplizierung

| #216-Modul                   | In #215 dupliziert? | Kommentar                                      |
| ---------------------------- | ------------------- | ---------------------------------------------- |
| `missingInfoDetector.ts`     | ❌ Nein             | Gap-Detection exklusiv in #216                 |
| `missingInfoClassifier.ts`   | ❌ Nein             | Klassifizierung exklusiv in #216               |
| `gateContentMerger.ts`       | ❌ Nein             | Content-Merging exklusiv in #216               |
| `MissingInfoGate.tsx`        | ❌ Nein             | Gate-UI exklusiv in #216                       |
| `missingInfoFeatureFlag.ts`  | ❌ Nein             | Eigenes Flag (`directionFeatureFlag.ts`)       |
| `MissingInfoSession`         | ❌ Nein             | Session-Management exklusiv in #216            |
| `enrichedContexts` Store-Key | ❌ Nein             | Wird read-only konsumiert, nicht überschrieben |

### Korrekt — shared readonly-Infrastruktur

| #216-Modul             | #215-Nutzung                                             |
| ---------------------- | -------------------------------------------------------- |
| `constraintChecker.ts` | `checkDirectionProfileConflicts()` als neuer Export      |
| `types/index.ts`       | `DirectionProfile` erweitert `DirectionProfileReference` |

---

## 8. Feature-Flag-Verhalten

| Zustand            | Erwartung                              | Test-Nachweis                     |
| ------------------ | -------------------------------------- | --------------------------------- |
| Flag OFF (default) | Button nicht sichtbar                  | `directionFeatureFlag.test.ts`    |
| Flag ON (`=1`)     | Button sichtbar, VariantPanel öffnet   | `DetailsPanel.blueprint.test.tsx` |
| Flag ON (`=true`)  | Button sichtbar                        | `directionFeatureFlag.test.ts`    |
| Flag ON (`=TRUE`)  | Button NICHT sichtbar (case-sensitive) | `directionFeatureFlag.test.ts`    |
| Flag ohne Prompt   | Button disabled                        | `DetailsPanel.blueprint.test.tsx` |
| Flag + isAnalyzing | Button disabled                        | `DetailsPanel.blueprint.test.tsx` |
| Flag + isGateOpen  | Button disabled                        | `DetailsPanel.blueprint.test.tsx` |

---

## 9. Save-as-New-Version-Nachweis

- Variante wird via `saveVariantAsPrompt()` als neue Prompt-Datei im Vault gespeichert
- Original-Prompt bleibt unverändert
- Keine Auto-Speicherung — Nutzer muss explizit „💾 Als neue Version speichern" klicken
- Getestet in `appStore.variantResults.test.ts` (Store-Level)

---

## 10. Lokale Gates (Final Run — 2026-07-11)

| Gate                    | Befehl                                                  | Ergebnis |
| ----------------------- | ------------------------------------------------------- | -------- |
| TypeScript Type Check   | `pnpm exec tsc --noEmit`                                | PASS ✅  |
| ESLint (max-warnings 0) | `pnpm lint --max-warnings 0`                            | PASS ✅  |
| Frontend Tests (Vitest) | `pnpm test`                                             | PASS ✅  |
| Rust Format Check       | `cargo fmt --check --all`                               | PASS ✅  |
| Rust Clippy             | `cargo clippy --workspace --all-targets -- -D warnings` | PASS ✅  |
| Whitespace Check        | `git diff --check`                                      | PASS ✅  |

**Gesamt-Tests:** 1438 passed, 54 test files — alle grün. Null Fehlschläge.

---

## 11. Bekannte offene Risiken

| Risiko                                     | Status                                            |
| ------------------------------------------ | ------------------------------------------------- |
| `handleOpenOptimizer` Null-Check-Bug       | Separat behandeln (existiert unabhängig von #215) |
| Remote-CI (#154) weiterhin blockiert       | `REMOTE_CI_INFRA_BLOCKED` — kein Remote-CI        |
| Custom-Profile nicht persistiert (Phase 1) | Design-Entscheidung — Phase 2: localStorage       |
| Kein Batch-Flow (nur Einzel-Prompt)        | Design-Entscheidung — Phase 2                     |
| Feature-Flag default disabled              | Dokumentiert — Nutzer muss explizit aktivieren    |

---

## 12. Finale Entscheidung

| Feld                   | Wert                                                                          |
| ---------------------- | ----------------------------------------------------------------------------- |
| **Status**             | ✅ **Ready for Owner Review / Ready for Merge Gate**                          |
| **Branch**             | `feat/0215-direction-profiles`                                                |
| **Head Commit**        | `9dd3c10` test(direction-profiles): cover variant integration and regressions |
| **Diff vs. master**    | 22 files, +10470/−1                                                           |
| **Tests**              | 1438 passed, 0 failed                                                         |
| **Lokale Gates**       | ALL GREEN                                                                     |
| **ADR**                | ADR-003 Accepted                                                              |
| **Speckit-Artefakte**  | spec.md, plan.md, tasks.md → Accepted                                         |
| **Scope-Prüfung #216** | Keine Duplizierung bestätigt                                                  |
| **Issue-Closure**      | Ausstehend — erst nach Owner Review / Merge Gate                              |

---

## 13. Referenzen

- Issue #215: https://github.com/xxammaxx/promptvault-lite/issues/215
- Epic #214: https://github.com/xxammaxx/promptvault-lite/issues/214
- Issue #216 (Missing-Info-Gate): https://github.com/xxammaxx/promptvault-lite/issues/216
- Spec: `docs/specs/0215-direction-profiles/spec.md`
- Plan: `docs/specs/0215-direction-profiles/plan.md`
- Tasks: `docs/specs/0215-direction-profiles/tasks.md`
- ADR-003: `docs/DECISIONS.md`
- ROADMAP: `docs/ROADMAP.md`
