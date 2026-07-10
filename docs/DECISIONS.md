# Architecture Decisions

## ADR-001: MIT License

**Status:** Accepted

**Date:** 2026-06-13

**Decision:** PromptVault Lite uses the MIT License.

**Reason:**

- Permissive open-source license
- Low barrier for users and contributors
- Matches the intended public release model
- Compatible with the project's dependency ecosystem (Tauri, React, Vite, Zustand, Vitest are all MIT)

**Alternatives considered:**

- Apache-2.0 — permissive with explicit patent grant, but more formal than needed
- GPL-3.0 — copyleft would restrict enterprise adoption

**Consequences:**

- Anyone can use, modify, and distribute the software with minimal restrictions
- Copyright notice must be preserved in all copies
- No warranty is provided

---

## ADR-002: Missing-Info-Gate Pipeline Integration (#216)

**Status:** Accepted

**Date:** 2026-07-10

**Parent Issue:** [#216](https://github.com/xxammaxx/promptvault-lite/issues/216)
**Epic:** [#214](https://github.com/xxammaxx/promptvault-lite/issues/214) — Prompt-Optimierung mit Ergebnisvarianten und dynamischen Rückfragen

### Decision

Das Missing-Info-Gate wird als **Enrichment-Schicht** zwischen der bestehenden Analyse-Pipeline und der Transformation (Optimierung / Variantengenerierung) positioniert. Das Gate ist eine eigenständige, feature-flag-gesteuerte Komponente, die ausschließlich existierende Analyse-Ergebnisse konsumiert und strukturierte Nutzer-Rückfragen ermöglicht — ohne eigene Prompt-Analyse-Heuristiken.

### Pipeline-Position

```
Analyse → Missing-Info-Gate → Optimierung / Variantenbildung
   │              │                        │
   │   (validate) │   (enrich)             │   (transform)
   │              │                        │
   └──────────────┴────────────────────────┘
```

### Sub-Decisions

#### ADR-002.1: Gate Trigger Logic

Das Gate öffnet sich **automatisch nur**, wenn mindestens ein REQUIRED-Item existiert und der Prompt nicht `BLOCKING_SENSITIVE_CONTENT` ist. Bei ausschließlich RECOMMENDED/OPTIONAL-Items ist das Gate nur manuell über den ActionBar-Button erreichbar. Bei ausschließlich OPTIONAL-Items öffnet es sich nicht.

#### ADR-002.2: Answer Merge Format

Nutzerantworten werden als Markdown-Sektion `## Ergänzte Informationen (Missing-Info-Gate)` in den Prompt-Inhalt integriert. Vor dem Merge werden alle Antworten durch 5 Sanitization-Regeln abgesichert (Strip Markdown-Headings, Strip HTML-Tags, Escape Backticks, Trim Whitespace, Max. 5000 Zeichen).

#### ADR-002.3: Gate Session Lifecycle

Gate-Sessions sind **ephemer** (in-memory im Zustand-Store), werden **nicht** persistiert (Session-Only) und werden bei `analyzeSelected()` invalidiert. Sessions sind pro `promptId` organisiert.

#### ADR-002.4: Implementation Order (as-implemented)

```
Types/Datenmodell → Feature-Flag → missingInfoDetector →
missingInfoClassifier → constraintChecker (Basis) →
gateContentMerger + Sanitization → MissingInfoGate UI →
Store-Integration → DetailsPanel-Integration →
Optimizer-Integration → Tests → Dokumentation
```

### Implementierte Batches

| Batch | Commit    | Beschreibung                                                                          |
| ----- | --------- | ------------------------------------------------------------------------------------- |
| 1     | `4e5fedd` | Foundation: Types, Feature-Flag, Detector, Classifier, ConstraintChecker              |
| 2     | `30ab64f` | Safety / Merge Layer: gateContentMerger + Sanitization, constraintChecker Erweiterung |
| 3     | `ea0e712` | Store / Session Lifecycle: appStore-Erweiterung, Session-Store-Tests                  |
| 4     | `6023b26` | MissingInfoGate UI: Modal-Komponente, alle Input-Typen, UI-Tests                      |
| 5     | `16913a8` | Gate Integration: DetailsPanel, Optimizer-Flow, ActionBar-Button                      |
| 6A    | `db0375d` | Gate Integration Tests: Integration, Constraint, Regression                           |

### Testnachweis

- **Unit-Tests:** 5 Suiten (`missingInfoFeatureFlag`, `missingInfoDetector`, `missingInfoClassifier`, `constraintChecker`, `gateContentMerger`), gesamt 161 Tests
- **Store-Tests:** `appStore.missingInfoGate.test.ts` (38 Tests)
- **UI-Tests:** `MissingInfoGate.test.tsx` (33 Tests)
- **Integrationstests:** `MissingInfoGate.integration.test.tsx` (11 Tests), `MissingInfoGate.constraint.test.tsx` (10 Tests)
- **Regressionstests:** `MissingInfoGate.regression.test.tsx` (10 Tests), `DetailsPanel.blueprint.test.tsx` (53 Tests)
- **Gesamt:** 1045 Tests im Workspace, alle grün
- **Lokale Gates:** `tsc --noEmit` ✅, `lint --max-warnings 0` ✅, `pnpm test` ✅, `cargo fmt --check` ✅, `cargo clippy` ✅

### Neue Module

| Modul                       | Pfad                                       |
| --------------------------- | ------------------------------------------ |
| `missingInfoFeatureFlag.ts` | `src/lib/missingInfoFeatureFlag.ts`        |
| `missingInfoDetector.ts`    | `src/lib/missingInfoDetector.ts`           |
| `missingInfoClassifier.ts`  | `src/lib/missingInfoClassifier.ts`         |
| `constraintChecker.ts`      | `src/lib/constraintChecker.ts`             |
| `gateContentMerger.ts`      | `src/lib/gateContentMerger.ts`             |
| `MissingInfoGate.tsx`       | `src/components/gates/MissingInfoGate.tsx` |

### Geänderte Module

| Datei                                     | Änderung                                          |
| ----------------------------------------- | ------------------------------------------------- |
| `src/types/index.ts`                      | Neue Typen (MissingInfoItem, Session, Enrichment) |
| `src/stores/appStore.ts`                  | Gate-State, Sessions, enrichedContexts            |
| `src/components/details/DetailsPanel.tsx` | Gate-Trigger vor Optimierung, ActionBar-Button    |

### Feature-Flag

`PROMPTVAULT_MISSING_INFO_GATE` — disabled by default. Aktivierung via Umgebungsvariable (`=1` oder `=true`).

### Abgrenzung zu #215 (VariantGenerator / Direction Profiles)

- Das Missing-Info-Gate (#216) liefert `MissingInfoSession` und `EnrichedPromptContext` als strukturierte Nutzerantworten für #215
- `constraintChecker.ts` ist als **Basis-Modul** in #216 implementiert (Constraint-Extraktion + Basis-Konfliktprüfung). Die vollständige Direction-Profile-Konfliktprüfung ist Scope von #215
- Keine VariantGenerator-Implementierung, keine Direction Profiles, kein VariantPanel in #216

### Offene bewusste Nicht-Ziele

- Keine Persistenz von Gate-Antworten über App-Neustarts (Session-Only)
- Keine eigenen Prompt-Analyse-Heuristiken im Gate
- Kein "Als Standard für ähnliche Prompts merken" (Phase 2)
- Kein Batch-Flow (Gate nur für selektierten Einzel-Prompt)
- Keine Cloud-API oder Remote-LLM-Calls
- Keine GitHub Actions / Remote-CI

### Consequences

- Der Optimierungs-Flow wurde um eine optionale, interaktive Enrichment-Phase erweitert
- Das Original-Prompt wird nie mutiert — Enrichment erzeugt einen neuen String
- Die bestehende Analyse-Pipeline bleibt unverändert
- Keine neuen externen npm-Dependencies
- Die Architektur erlaubt eine nahtlose Erweiterung durch #215 (VariantGenerator)
