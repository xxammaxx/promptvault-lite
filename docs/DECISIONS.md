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

---

## ADR-003: Direction Profiles — Template-basierte Variantengeneration (#215)

**Status:** Accepted

**Date:** 2026-07-11

**Parent Issue:** [#215](https://github.com/xxammaxx/promptvault-lite/issues/215)
**Epic:** [#214](https://github.com/xxammaxx/promptvault-lite/issues/214) — Prompt-Optimierung mit Ergebnisvarianten und dynamischen Rückfragen
**Evidence:** [`docs/specs/0215-direction-profiles/evidence.md`](./specs/0215-direction-profiles/evidence.md)

### Kontext

Der Nutzer benötigt die Fähigkeit, aus einem bestehenden Prompt mehrere strategische Ergebnisvarianten mit unterschiedlichen Zielrichtungen zu erzeugen (sachlich, verkaufsstark, technisch, kurz, ausführlich, kreativ, etc.), **ohne harte Constraints zu entfernen oder zu schwächen**. Der bestehende Optimizer verbessert die Prompt-Qualität, kann aber die Ergebnisrichtung nicht gezielt steuern.

### Entscheidung

Direction Profiles (#215) wird als **parallele, unabhängige Transformationsschicht** zum bestehenden Optimizer positioniert. Beide konsumieren die gleiche Quelldaten (`enrichedContent` oder Original-Prompt), arbeiten aber mit unterschiedlichen Zielen:

```
Analyse → Missing-Info-Gate → ┬→ Optimierung (bestehend: conservative/balanced/aggressive)
                               └→ Variantenbildung (#215: Direction Profiles)
```

### Sub-Decisions

#### ADR-003.1: Template-basierter Generator (Phase 1)

Der `variantGenerator.ts` arbeitet **rein template-basiert** (PromptPrefix + Tonalitäts-Anpassung). Keine strukturellen Änderungen (Sektionen hinzufügen/entfernen) in Phase 1. Keine Remote-LLM-Calls. Begründung: Einfacher zu testen, weniger Risiko, kein Duplikat des bestehenden Optimizers.

#### ADR-003.2: Constraint Preservation vor UI/Save

Harte Constraints aus dem Original-Prompt bleiben in **jeder** Variante **unverändert** erhalten. Security-Kategorien (`offline_only`, `approval_required`, `scope_boundary`) werden **niemals** durch ein Profil abgeschwächt. Konflikte zwischen Profil und Constraint werden **sichtbar** gemeldet (BLOCKING/WARNING), aber **nicht automatisch** gelöst — der Nutzer entscheidet.

#### ADR-003.3: Feature-Flag default disabled

Das Direction-Profiles-Feature ist standardmäßig deaktiviert (`PROMPTVAULT_DIRECTION_PROFILES` env var, default `false`). Aktivierung nur via `=1` oder `=true` (case-sensitive, identisches Pattern zu `PROMPTVAULT_MISSING_INFO_GATE`).

#### ADR-003.4: VariantStore getrennt von enrichedContexts

Der Store-Key `variantResults: Record<string, VariantGenerationResult>` ist strikt getrennt von `enrichedContexts: Record<string, EnrichedPromptContext>`. Keine Vermischung der beiden Datenstrukturen. Separate UI-Flags (`showVariantPanel` ≠ `isGateOpen`).

#### ADR-003.5: Custom Direction session-only

Benutzerdefinierte Richtungen (Freitext) werden **nicht** persistiert. Der Text wird nur im lokalen State des `DirectionProfileSelector` gehalten und bei `closeVariantPanel()` verworfen. Phase 2 kann localStorage-Persistenz hinzufügen.

#### ADR-003.6: Save-as-New-Version nur explizit

Varianten werden **nie** automatisch gespeichert. Der Nutzer speichert eine Variante explizit via „💾 Als neue Version speichern“-Button. Die Variante wird als neue Prompt-Datei im Vault-Ordner gespeichert, ersetzt NICHT den Original-Prompt.

#### ADR-003.7: Keine #216-Duplizierung

#215 dupliziert **keine** Missing-Info-Gate-Funktionalität:

- Keine eigene Gap-Detection (`missingInfoDetector.ts`)
- Keine eigene Klassifizierung (`missingInfoClassifier.ts`)
- Kein eigenes Content-Merging (`gateContentMerger.ts`)
- Keine eigene Missing-Info-Gate-UI (`MissingInfoGate.tsx`)

Der `constraintChecker.ts` wird als **readonly shared-Infrastruktur** genutzt (bestehende API unverändert, neuer Export `checkDirectionProfileConflicts`).

### Konsequenzen

- **Positiv:** Nutzer kann gezielt Ergebnisrichtungen steuern, ohne den Original-Prompt zu verändern. 13 vordefinierte Profile + benutzerdefinierte Richtung. Volle Constraint-Transparenz.
- **Negativ:** Keine Persistenz von Custom-Profilen in Phase 1. Kein Batch-Flow (nur Einzel-Prompt). Kein Varianten-Scoring/Ranking vor Phase 2.
- **Risiko:** `handleOpenOptimizer` Null-Check-Bug existiert unabhängig von #215 und muss separat behandelt werden. Remote-CI (#154) weiterhin blockiert.

### Implementierte Batches

| Batch | Commit    | Beschreibung                                                  |
| ----- | --------- | ------------------------------------------------------------- |
| B1    | `9c17c8c` | Foundation: Types + Feature-Flag                              |
| B2    | `cb2a3e4` | Profiles + Generator: directionProfiles, variantGenerator     |
| B3    | `2e77409` | Safety: Constraint Preservation, Security Hardening           |
| B4    | `2633513` | Store: variantResults State + Actions                         |
| B5    | `3daa988` | UI: VariantPanel, DirectionProfileSelector, VariantResultList |
| B6    | `e13ae04` | Integration: ActionBar Button, handleOpenVariantPanel         |
| B7    | `48b973b` | Compare + Save: VariantCompare, Save-as-New-Version           |
| B8A   | `8648f43` | Tests: Unit-Tests                                             |
| B8B   | `efd0d7d` | Tests: UI-Tests                                               |
| B8C   | `9dd3c10` | Tests: Integration + Regression                               |
| B9    | (pending) | Docs / Evidence / Final Gates                                 |

### Testnachweis

- **Unit-Tests:** 4 Suiten (featureFlag: 17, profiles: 47, generator: 80, constraintChecker: 35) — gesamt 179
- **Store-Tests:** `appStore.variantResults.test.ts` (35 Tests)
- **UI-Tests:** 4 Suiten (Selector: 30, Panel: 32, ResultList: 34, Compare: 18) — gesamt 114
- **Integrationstests:** `VariantPanel.integration.test.tsx` (48 Tests)
- **DetailsPanel-Tests:** `DetailsPanel.blueprint.test.tsx` (70 Tests inkl. 10 VariantPanel-Integration)
- **Gesamt:** 1438 Tests im Workspace, alle grün
- **Lokale Gates:** `tsc --noEmit` ✅, `lint --max-warnings 0` ✅, `pnpm test` ✅, `cargo fmt --check` ✅, `cargo clippy` ✅

### Neue Module

| Modul                          | Pfad                                                   |
| ------------------------------ | ------------------------------------------------------ |
| `directionFeatureFlag.ts`      | `src/lib/directionFeatureFlag.ts`                      |
| `directionProfiles.ts`         | `src/lib/directionProfiles.ts`                         |
| `variantGenerator.ts`          | `src/lib/variantGenerator.ts`                          |
| `VariantPanel.tsx`             | `src/components/variants/VariantPanel.tsx`             |
| `DirectionProfileSelector.tsx` | `src/components/variants/DirectionProfileSelector.tsx` |
| `VariantResultList.tsx`        | `src/components/variants/VariantResultList.tsx`        |
| `VariantCompare.tsx`           | `src/components/variants/VariantCompare.tsx`           |

### Geänderte Module

| Datei                                     | Änderung                                          |
| ----------------------------------------- | ------------------------------------------------- |
| `src/types/index.ts`                      | 8 neue Interfaces/Types (+204 Zeilen)             |
| `src/lib/constraintChecker.ts`            | `checkDirectionProfileConflicts` (+73 Zeilen)     |
| `src/stores/appStore.ts`                  | Variant Store State + Actions (+306 Zeilen)       |
| `src/components/details/DetailsPanel.tsx` | ActionBar-Button + VariantPanel-Integration (+62) |

### Verweise

- Issue #215: https://github.com/xxammaxx/promptvault-lite/issues/215
- Epic #214: https://github.com/xxammaxx/promptvault-lite/issues/214
- Issue #216 (Missing-Info-Gate): https://github.com/xxammaxx/promptvault-lite/issues/216
- Spec: `docs/specs/0215-direction-profiles/spec.md`
- Plan: `docs/specs/0215-direction-profiles/plan.md`
- Tasks: `docs/specs/0215-direction-profiles/tasks.md`
- Evidence: `docs/specs/0215-direction-profiles/evidence.md`
