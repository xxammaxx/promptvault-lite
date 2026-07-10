# Tasks: Missing-Info-Gate für dynamische Rückfragen im Optimierungsprozess

> **Issue:** [#216](https://github.com/xxammaxx/promptvault-lite/issues/216)
> **Epic:** [#214](https://github.com/xxammaxx/promptvault-lite/issues/214)
> **Spec:** [spec.md](./spec.md) | **Plan:** [plan.md](./plan.md)
> **ADR:** ADR-002 in `docs/DECISIONS.md`
> **Speckit Phase:** Tasks
> **Status:** Draft
> **Date:** 2026-07-09
> **Author:** Issue Orchestrator (via Speckit Workflow)

---

## Übersicht: 12 Stufen → 30 Tasks

| Stufe                       | Tasks | IDs                   |
| --------------------------- | ----- | --------------------- |
| 1. Types/Datenmodell        | 2     | T-216-001 – T-216-002 |
| 2. Feature-Flag             | 1     | T-216-003             |
| 3. missingInfoDetector      | 2     | T-216-004 – T-216-005 |
| 4. missingInfoClassifier    | 2     | T-216-006 – T-216-007 |
| 5. constraintChecker-Basis  | 2     | T-216-008 – T-216-009 |
| 6. gateContentMerger        | 2     | T-216-010 – T-216-011 |
| 7. MissingInfoGate UI       | 5     | T-216-012 – T-216-016 |
| 8. Store-Integration        | 4     | T-216-017 – T-216-020 |
| 9. DetailsPanel + ActionBar | 3     | T-216-021 – T-216-023 |
| 10. Optimizer-Integration   | 2     | T-216-024 – T-216-025 |
| 11. Tests                   | 3     | T-216-026 – T-216-028 |
| 12. Dokumentation           | 2     | T-216-029 – T-216-030 |

---

## Stufe 1: Types / Datenmodell

### T-216-001: Typdefinitionen in types/index.ts ergänzen

| Feld                   | Wert                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | Alle neuen TypeScript-Interfaces für das Missing-Info-Gate in `src/types/index.ts` definieren.                                                                                                                                                                                                                                                              |
| **Betroffene Dateien** | `src/types/index.ts` (+150 Zeilen am Ende)                                                                                                                                                                                                                                                                                                                  |
| **Abhängigkeiten**     | keine                                                                                                                                                                                                                                                                                                                                                       |
| **Akzeptanzkriterien** | `MissingInfoItem`, `MissingInfoInputType`, `MissingInfoCategory`, `ClassifiedMissingInfo`, `MissingInfoAnswer`, `GateSessionStatus`, `GateOutcome`, `MissingInfoSession`, `EnrichedPromptContext`, `HardConstraint`, `ConstraintConflict`, `ConflictResolutionOption`, `ConflictResolution` sind als `export` definiert und kompilieren mit `tsc --noEmit`. |
| **Testnachweis**       | `pnpm exec tsc --noEmit` besteht; bestehende Typ-Importe in anderen Modulen brechen nicht.                                                                                                                                                                                                                                                                  |
| **Komplexität**        | **M** (13 neue Interfaces/Types, rein deklarativ)                                                                                                                                                                                                                                                                                                           |
| **Risiko**             | **LOW** (additiv, keine bestehenden Typen geändert)                                                                                                                                                                                                                                                                                                         |
| **Empfohlener Agent**  | `architecture-agent` (Type-Design)                                                                                                                                                                                                                                                                                                                          |

### T-216-002: Shared-Constraint-Typen aus Issue #215 abstimmen

| Feld                   | Wert                                                                                                                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | Sicherstellen, dass `HardConstraint`, `ConstraintConflict` und zugehörige Typen mit den Anforderungen aus #215 (Direction Profiles) kompatibel sind. Keine #215-Logik implementieren, nur Typ-Kompatibilität prüfen.             |
| **Betroffene Dateien** | `src/types/index.ts` (Review), Issue #215 (Referenz)                                                                                                                                                                             |
| **Abhängigkeiten**     | T-216-001                                                                                                                                                                                                                        |
| **Akzeptanzkriterien** | Typen sind so definiert, dass sie von `constraintChecker.ts` (Phase 1) UND später von `variantGenerator.ts` (#215) ohne Breaking Changes verwendet werden können. `DirectionProfile`-Referenz ist als optionaler Typ vorgemerkt. |
| **Testnachweis**       | Code-Review durch `architecture-agent`; Typ-Kompatibilitäts-Check gegen #215-Spezifikation                                                                                                                                       |
| **Komplexität**        | **S** (Review-Task, keine neuen Codezeilen)                                                                                                                                                                                      |
| **Risiko**             | **MEDIUM** (falsche Typ-Abstimmung führt zu Refactoring in #215)                                                                                                                                                                 |
| **Empfohlener Agent**  | `architecture-agent`                                                                                                                                                                                                             |

---

## Stufe 2: Feature-Flag

### T-216-003: Feature-Flag missingInfoFeatureFlag.ts implementieren

| Feld                   | Wert                                                                                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | Feature-Flag-Modul `src/lib/missingInfoFeatureFlag.ts` nach dem Vorbild von `src/lib/embeddings/featureFlag.ts` erstellen. Reine Funktion `isMissingInfoGateEnabled()`, disabled by default, enabled by `PROMPTVAULT_MISSING_INFO_GATE=1` oder `=true`.        |
| **Betroffene Dateien** | `src/lib/missingInfoFeatureFlag.ts` (neu, ~45 Zeilen)                                                                                                                                                                                                          |
| **Abhängigkeiten**     | keine (parallele zu T-216-004)                                                                                                                                                                                                                                 |
| **Akzeptanzkriterien** | - `isMissingInfoGateEnabled()` gibt `false` zurück bei: keinem Argument, `{}`, `undefined`, `"0"`, `"false"`, `""`, `"TRUE"` (case-sensitive), `"yes"`, `" 1 "` (whitespace). Gibt `true` zurück bei `"1"` und `"true"`. Ist seiteneffektfrei (pure function). |
| **Testnachweis**       | Unit-Test `missingInfoFeatureFlag.test.ts` mit 12 Cases (wird in T-216-026 geschrieben).                                                                                                                                                                       |
| **Komplexität**        | **S** (~45 Zeilen, reine Funktion)                                                                                                                                                                                                                             |
| **Risiko**             | **LOW** (isoliertes Modul, keine Abhängigkeiten)                                                                                                                                                                                                               |
| **Empfohlener Agent**  | `review-agent` (Code-Qualität, Pattern-Konformität)                                                                                                                                                                                                            |

---

## Stufe 3: missingInfoDetector

### T-216-004: missingInfoDetector.ts — Rohdaten-Extraktion implementieren

| Feld                   | Wert                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `src/lib/missingInfoDetector.ts` implementieren. Die Funktion `detectGaps()` konsumiert `PromptContextEvaluation`, `PromptHygiene` und optional `BlueprintEvaluation` und extrahiert daraus `MissingInfoItem[]`. Keine eigene Prompt-Analyse — nur Transformation existierender Analyse-Daten.                                                                                                                                                                  |
| **Betroffene Dateien** | `src/lib/missingInfoDetector.ts` (neu, ~200 Zeilen)                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Abhängigkeiten**     | T-216-001 (Typen), `src/types/index.ts`, `src/lib/promptContextEvaluation.ts` (read-only Import)                                                                                                                                                                                                                                                                                                                                                                |
| **Akzeptanzkriterien** | - `detectGaps()` liest: `contextEval.missing_elements[]`, `contextEval.risk_flags[]`, `contextEval.criteria[]` (score===0), `contextEval.suggested_improvements[]`, `blueprintEval?.missing_elements[]`, `hygiene.hygiene_score < 50`. Produziert `MissingInfoItem[]` mit gefüllten Feldern `id`, `source`, `label`, `question`, `rationale`, `inputType`. Dedupliziert semantisch identische Lücken anhand des `label`-Felds (case-insensitive, normalisiert). |
| **Testnachweis**       | Unit-Tests in `missingInfoDetector.test.ts` (wird in T-216-026 geschrieben). Manuell: `detectGaps()` aufgerufen mit Mock-Daten aus `promptContextEvaluation.ts`-Fixtures.                                                                                                                                                                                                                                                                                       |
| **Komplexität**        | **M** (~200 Zeilen, mehrere Input-Quellen, Deduplizierung)                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Risiko**             | **MEDIUM** (Deduplizierungslogik muss korrekt sein; falsche Lücken führen zu falschen Fragen)                                                                                                                                                                                                                                                                                                                                                                   |
| **Empfohlener Agent**  | `review-agent` (Implementierung)                                                                                                                                                                                                                                                                                                                                                                                                                                |

### T-216-005: missingInfoDetector — Edge Cases und Fallbacks

| Feld                   | Wert                                                                                                                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | Edge-Case-Behandlung im Detector: leerer Prompt, Prompts mit Score > 95, Prompts < 50 Zeichen, Code-nur-Prompts, `BLOCKING_SENSITIVE_CONTENT`-Erkennung.                                                                                                            |
| **Betroffene Dateien** | `src/lib/missingInfoDetector.ts` (Erweiterung)                                                                                                                                                                                                                      |
| **Abhängigkeiten**     | T-216-004                                                                                                                                                                                                                                                           |
| **Akzeptanzkriterien** | - Bei leerem/Whitespace-Prompt: leeres Array zurückgeben. Bei `contamination_status === "BLOCKING_SENSITIVE_CONTENT"`: leeres Array (keine Fragen). Bei Score > 95: maximal OPTIONAL-Fragen. Bei Prompt < 50 Zeichen: keine Over-Engineering-Fragen (max. 3 Items). |
| **Testnachweis**       | Edge-Case-Tests in `missingInfoDetector.test.ts` (wird in T-216-026 geschrieben).                                                                                                                                                                                   |
| **Komplexität**        | **S** (~50 Zeilen zusätzlich, Guards und Early-Returns)                                                                                                                                                                                                             |
| **Risiko**             | **LOW** (additive Guards)                                                                                                                                                                                                                                           |
| **Empfohlener Agent**  | `review-agent`                                                                                                                                                                                                                                                      |

---

## Stufe 4: missingInfoClassifier

### T-216-006: missingInfoClassifier.ts — Tier-Klassifizierung implementieren

| Feld                   | Wert                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `src/lib/missingInfoClassifier.ts` implementieren. Reine Funktion `classify(items: MissingInfoItem[]): ClassifiedMissingInfo[]`, die jedem Item ein Tier (`REQUIRED` / `RECOMMENDED` / `OPTIONAL`) zuweist gemäß Klassifizierungsregeln aus spec.md Abschnitt 4.2.                                                                                                                                                                                                                          |
| **Betroffene Dateien** | `src/lib/missingInfoClassifier.ts` (neu, ~120 Zeilen)                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Abhängigkeiten**     | T-216-001 (Typen), T-216-004 (MissingInfoItem)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Akzeptanzkriterien** | - `risk_flags[severity=critical]` → REQUIRED. `risk_flags[severity=high]` → REQUIRED. PE-Kriterien `score===0` + `detected_prompt_type !== "simple_prompt"` → REQUIRED. AR-Kriterien `score===0` + `detected_prompt_type === "agentic_prompt"` → REQUIRED. `risk_flags[severity=medium]` → RECOMMENDED. CE-Kriterien `score===0` + `detected_context_profile === "minimal"` → RECOMMENDED. Blueprint `missing_elements` → RECOMMENDED. `hygiene_score < 50` → RECOMMENDED. Rest → OPTIONAL. |
| **Testnachweis**       | Unit-Tests in `missingInfoClassifier.test.ts` (12 Cases, wird in T-216-026 geschrieben). Isolierte Testbarkeit: Input `MissingInfoItem[]`, Output `ClassifiedMissingInfo[]`.                                                                                                                                                                                                                                                                                                                |
| **Komplexität**        | **M** (~120 Zeilen, Mapping-Logik mit versch. Bedingungen)                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Risiko**             | **MEDIUM** (falsche Klassifizierung = falsche Gate-Trigger-Logik)                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Empfohlener Agent**  | `review-agent`                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

### T-216-007: missingInfoClassifier — Maximalgrenzen und Sortierung

| Feld                   | Wert                                                                                                                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | Klassifizierte Items auf Maximalgrenzen beschneiden und sortieren: REQUIRED zuerst, dann RECOMMENDED, dann OPTIONAL. Maximal 5 REQUIRED sichtbar, Rest unter "Weitere erforderliche Angaben (X)".                                                    |
| **Betroffene Dateien** | `src/lib/missingInfoClassifier.ts` (Erweiterung)                                                                                                                                                                                                     |
| **Abhängigkeiten**     | T-216-006                                                                                                                                                                                                                                            |
| **Akzeptanzkriterien** | - `classify()` sortiert Ausgabe: REQUIRED → RECOMMENDED → OPTIONAL. Items mit `tier === "REQUIRED"` werden auf maximal 5 begrenzt (Überschuss als `overflowCount` markiert). Gesamtanzahl: 5 REQUIRED + 7 RECOMMENDED + 10 OPTIONAL als Hard Limits. |
| **Testnachweis**       | Sortier- und Limit-Tests in `missingInfoClassifier.test.ts`.                                                                                                                                                                                         |
| **Komplexität**        | **S** (~40 Zeilen, Sortierung + Limit)                                                                                                                                                                                                               |
| **Risiko**             | **LOW**                                                                                                                                                                                                                                              |
| **Empfohlener Agent**  | `review-agent`                                                                                                                                                                                                                                       |

---

## Stufe 5: constraintChecker-Basis

### T-216-008: constraintChecker.ts — Basis-Extraktion harter Constraints

| Feld                   | Wert                                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `src/lib/constraintChecker.ts` Basis implementieren. Funktion `extractHardConstraints(content: string): HardConstraint[]` erkennt harte Constraints im Prompt-Text (regex/heuristisch). Kategorien: `offline_only`, `max_length`, `no_examples`, `language`, `format_lock`, `tool_restriction`, `approval_required`, `scope_boundary`. |
| **Betroffene Dateien** | `src/lib/constraintChecker.ts` (neu, ~180 Zeilen)                                                                                                                                                                                                                                                                                      |
| **Abhängigkeiten**     | T-216-001 (Typen)                                                                                                                                                                                                                                                                                                                      |
| **Akzeptenzkriterien** | - Erkennt "Keine Cloud verwenden" → `offline_only` (hard). Erkennt "Maximal 200 Wörter" → `max_length` (hard). Erkennt "Nur auf Deutsch" → `language` (hard). Erkennt "Keine Beispiele" → `no_examples` (soft). Leerer Input → leeres Array. Keine False Positives bei normalen deutschen Sätzen.                                      |
| **Testnachweis**       | Unit-Tests `constraintChecker.test.ts` (10 Cases, wird in T-216-026 geschrieben).                                                                                                                                                                                                                                                      |
| **Komplexität**        | **M** (~180 Zeilen, Regex-Patterns für 8 Kategorien)                                                                                                                                                                                                                                                                                   |
| **Risiko**             | **MEDIUM** (Constraint-Erkennung ist sicherheitsrelevant — False Negatives führen zu Constraint-Verlust)                                                                                                                                                                                                                               |
| **Empfohlener Agent**  | `security-agent` (Constraint-Validierung)                                                                                                                                                                                                                                                                                              |

### T-216-009: constraintChecker.ts — Basis-Konfliktprüfung

| Feld                   | Wert                                                                                                                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | Funktion `checkConflicts(constraints: HardConstraint[], answers: MissingInfoAnswer[]): ConstraintConflict[]` implementieren. Prüft, ob Nutzerantworten mit harten Constraints kollidieren. Erzeugt `ConstraintConflict`-Objekte mit Resolution-Optionen. |
| **Betroffene Dateien** | `src/lib/constraintChecker.ts` (Erweiterung)                                                                                                                                                                                                             |
| **Abhängigkeiten**     | T-216-008                                                                                                                                                                                                                                                |
| **Akzeptenzkriterien** | - Antwort "Cloud-LLM für Deep Research" + Constraint "Keine Cloud" → BLOCKING-Konflikt. Antwort "Ausführlich" + Constraint "Max 200 Wörter" → WARNING. Keine Antwort → keine Konflikte.                                                                  |
| **Testnachweis**       | Unit-Tests in `constraintChecker.test.ts` (Konflikt-Cases).                                                                                                                                                                                              |
| **Komplexität**        | **M** (~100 Zeilen, Mapping-Logik Antwort↔Constraint)                                                                                                                                                                                                    |
| **Risiko**             | **MEDIUM**                                                                                                                                                                                                                                               |
| **Empfohlener Agent**  | `security-agent`                                                                                                                                                                                                                                         |

---

## Stufe 6: gateContentMerger mit Sanitization

### T-216-010: gateContentMerger.ts — Sanitization implementieren

| Feld                   | Wert                                                                                                                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ziel**               | `src/lib/gateContentMerger.ts` implementieren. Funktion `sanitizeAnswer(value: string): string` wendet 5 Sanitization-Regeln an: (1) Markdown-Headings strippen, (2) HTML-Tags strippen, (3) Backticks escapen, (4) Whitespace trimmen, (5) maximale Länge 5000 Zeichen. |
| **Betroffene Dateien** | `src/lib/gateContentMerger.ts` (neu, ~60 Zeilen)                                                                                                                                                                                                                         |
| **Abhängigkeiten**     | T-216-001 (Typen)                                                                                                                                                                                                                                                        |
| **Akzeptenzkriterien** | - `"# Injected Heading"` → `"Injected Heading"`. `"<script>alert(1)</script>"` → `"alert(1)"`. ``"`code injection`"`` → ``"\`code injection\`"``. `"  text  "` → `"text"`. Antwort > 5000 Zeichen → auf 5000 gekürzt.                                                    |
| **Testnachweis**       | Unit-Tests `gateContentMerger.test.ts` (Sanitization-Cases, wird in T-216-026 geschrieben).                                                                                                                                                                              |
| **Komplexität**        | **S** (~60 Zeilen, 5 String-Transformationen)                                                                                                                                                                                                                            |
| **Risiko**             | **HIGH** (Sicherheitsrelevant: XSS- und Markdown-Injection-Prävention)                                                                                                                                                                                                   |
| **Empfohlener Agent**  | `security-agent` (Sanitization-Validierung)                                                                                                                                                                                                                              |

### T-216-011: gateContentMerger.ts — Markdown-Merge implementieren

| Feld                   | Wert                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | Funktion `mergeAnswers(originalContent: string, answers: MissingInfoAnswer[], items: ClassifiedMissingInfo[]): string` implementieren. Generiert Markdown-Sektion `## Ergänzte Informationen (Missing-Info-Gate)` mit Antworten als Bullet Points und konkateniert sie mit dem Original-Prompt.                      |
| **Betroffene Dateien** | `src/lib/gateContentMerger.ts` (Erweiterung, ~40 Zeilen)                                                                                                                                                                                                                                                             |
| **Abhängigkeiten**     | T-216-010                                                                                                                                                                                                                                                                                                            |
| **Akzeptenzkriterien** | - `mergeAnswers()` gibt einen String zurück, der mit `originalContent` beginnt und die Sektion `## Ergänzte Informationen (Missing-Info-Gate)` enthält. Jede Antwort erscheint als `- **Frage-Label:** sanitized(value)`. Leere Antworten werden übersprungen. `SKIPPED`-Outcome → kein Merge, Original unverändert. |
| **Testnachweis**       | Unit-Tests in `gateContentMerger.test.ts` (Merge-Cases).                                                                                                                                                                                                                                                             |
| **Komplexität**        | **S** (~40 Zeilen, String-Konkatenation)                                                                                                                                                                                                                                                                             |
| **Risiko**             | **LOW**                                                                                                                                                                                                                                                                                                              |
| **Empfohlener Agent**  | `review-agent`                                                                                                                                                                                                                                                                                                       |

---

## Stufe 7: MissingInfoGate UI

### T-216-012: MissingInfoGate.tsx — Komponenten-Grundgerüst und Modal

| Feld                   | Wert                                                                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `src/components/gates/MissingInfoGate.tsx` als Modal-Komponente analog zu `OptimizationPanel.tsx` erstellen. Grundgerüst: Modal-Overlay, Header ("❓ Fehlende Informationen"), Close-Button, Footer. |
| **Betroffene Dateien** | `src/components/gates/MissingInfoGate.tsx` (neu), `src/components/gates/MissingInfoGate.css` (neu)                                                                                                   |
| **Abhängigkeiten**     | T-216-001 (Typen), React, bestehende CSS-Patterns aus `OptimizationPanel`                                                                                                                            |
| **Akzeptenzkriterien** | - Modal erscheint als Overlay. Klick auf Overlay-Hintergrund schließt NICHT (nur ✕-Button). Rolle `dialog` mit `aria-label`. Komponente nimmt `promptId`, `onClose`, `onComplete` als Props.         |
| **Testnachweis**       | UI-Test `MissingInfoGate.test.tsx` (wird in T-216-027 geschrieben): Modal öffnet/schließt.                                                                                                           |
| **Komplexität**        | **M** (~150 Zeilen JSX + CSS)                                                                                                                                                                        |
| **Risiko**             | **LOW**                                                                                                                                                                                              |
| **Empfohlener Agent**  | `playwright-agent` (UI-Rendering)                                                                                                                                                                    |

### T-216-013: MissingInfoGate.tsx — REQUIRED-Fragen rendern (max. 5 sichtbar)

| Feld                   | Wert                                                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | REQUIRED-Fragen aus `session.items` rendern. Maximal 5 sichtbar. Jede Frage zeigt: Tier-Badge, `label`, `rationale` (ℹ️), Input-Widget basierend auf `inputType`.                 |
| **Betroffene Dateien** | `src/components/gates/MissingInfoGate.tsx` (Erweiterung)                                                                                                                          |
| **Abhängigkeiten**     | T-216-012                                                                                                                                                                         |
| **Akzeptenzkriterien** | - 5 REQUIRED sichtbar. Weitere REQUIRED unter "Weitere erforderliche Angaben (X)" einklappbar. Jede Frage zeigt `[REQUIRED]` Badge. `rationale` als ℹ️-Tooltip oder kleiner Text. |
| **Testnachweis**       | UI-Test: max. 5 REQUIRED sichtbar; "Weitere erforderliche Angaben" einklappbar.                                                                                                   |
| **Komplexität**        | **M** (~100 Zeilen)                                                                                                                                                               |
| **Risiko**             | **MEDIUM** (UI-Komplexität: verschiedene Input-Typen)                                                                                                                             |
| **Empfohlener Agent**  | `playwright-agent`                                                                                                                                                                |

### T-216-014: MissingInfoGate.tsx — Alle Input-Typen implementieren

| Feld                   | Wert                                                                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ziel**               | Alle 5 Input-Typen als funktionale UI-Widgets implementieren: `free_text` → `<input>`, `free_multiline` → `<textarea>`, `single_select` → `<select>`, `multi_select` → Checkboxen/Chips, `boolean` → Toggle.                   |
| **Betroffene Dateien** | `src/components/gates/MissingInfoGate.tsx` (Erweiterung)                                                                                                                                                                       |
| **Abhängigkeiten**     | T-216-013                                                                                                                                                                                                                      |
| **Akzeptenzkriterien** | - Jeder Input-Typ rendert korrekt. Änderungen werden via `answerGateItem()` in den Store geschrieben. `placeholder` und `defaultValue` werden verwendet. `options`-Array für select/multi_select. `maxLength` für Text-Inputs. |
| **Testnachweis**       | UI-Test: alle 5 Input-Typen rendern und akzeptieren Eingaben.                                                                                                                                                                  |
| **Komplexität**        | **M** (~120 Zeilen)                                                                                                                                                                                                            |
| **Risiko**             | **MEDIUM** (UI-Fehler in Input-Typen)                                                                                                                                                                                          |
| **Empfohlener Agent**  | `playwright-agent`                                                                                                                                                                                                             |

### T-216-015: MissingInfoGate.tsx — Aktions-Buttons implementieren

| Feld                   | Wert                                                                                                                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | Footer-Buttons implementieren: "Fortfahren" (nur enabled wenn alle REQUIRED beantwortet), "Alle überspringen" (immer enabled), "Mit Annahmen fortfahren" (immer enabled). Button-Logik ruft `onComplete(outcome)` auf. |
| **Betroffene Dateien** | `src/components/gates/MissingInfoGate.tsx` (Erweiterung)                                                                                                                                                               |
| **Abhängigkeiten**     | T-216-013                                                                                                                                                                                                              |
| **Akzeptenzkriterien** | - "Fortfahren" disabled wenn unbeantwortete REQUIRED existieren. "Alle überspringen" → `onComplete("SKIPPED")`. "Mit Annahmen fortfahren" → füllt REQUIRED mit `defaultValue`, dann `onComplete("ASSUMPTIONS")`.       |
| **Testnachweis**       | UI-Test: Button-Enabled/Disabled-Status, onClick-Handler.                                                                                                                                                              |
| **Komplexität**        | **S** (~50 Zeilen)                                                                                                                                                                                                     |
| **Risiko**             | **LOW**                                                                                                                                                                                                                |
| **Empfohlener Agent**  | `playwright-agent`                                                                                                                                                                                                     |

### T-216-016: MissingInfoGate.tsx — Erweiterte Angaben und Edge Cases

| Feld                   | Wert                                                                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ziel**               | "Erweiterte Angaben"-Sektion implementieren (einklappbar). Zustände: Keine Fragen, Nur OPTIONAL, Session existiert (vorausgefüllte Antworten).                                                               |
| **Betroffene Dateien** | `src/components/gates/MissingInfoGate.tsx` (Erweiterung)                                                                                                                                                     |
| **Abhängigkeiten**     | T-216-014, T-216-015                                                                                                                                                                                         |
| **Akzeptenzkriterien** | - RECOMMENDED + OPTIONAL unter "Erweiterte Angaben" einklappbar. Bei 0 Fragen: "Keine fehlenden Informationen erkannt." Bei bestehender Session: vorausgefüllte Antworten, Button "Antworten aktualisieren". |
| **Testnachweis**       | UI-Test: Einklapp-Verhalten, Vorausfüllung, Leerzustand.                                                                                                                                                     |
| **Komplexität**        | **S** (~60 Zeilen)                                                                                                                                                                                           |
| **Risiko**             | **LOW**                                                                                                                                                                                                      |
| **Empfohlener Agent**  | `playwright-agent`                                                                                                                                                                                           |

---

## Stufe 8: Store-Integration

### T-216-017: appStore.ts — State-Felder und openGate-Action

| Feld                   | Wert                                                                                                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `appStore.ts` um `missingInfoSessions`, `enrichedContexts`, `isGateOpen`, `activeGatePromptId` erweitern. `openGate(promptId)` implementieren: Analyse-Daten aus Store lesen, `detectGaps()` + `classify()` aufrufen, Session anlegen und `isGateOpen = true` setzen.     |
| **Betroffene Dateien** | `src/stores/appStore.ts` (+80 Zeilen)                                                                                                                                                                                                                                     |
| **Abhängigkeiten**     | T-216-001 (Typen), T-216-004 (Detector), T-216-006 (Classifier)                                                                                                                                                                                                           |
| **Akzeptenzkriterien** | - `openGate(promptId)` erzeugt `MissingInfoSession` unter `missingInfoSessions[promptId]`. Session enthält `items: ClassifiedMissingInfo[]`, leeres `answers: {}`, `status: "ACTIVE"`. Bei bestehender Session: nur `isGateOpen = true` setzen (keine erneute Detection). |
| **Testnachweis**       | Store-Test `appStore.missingInfoGate.test.ts` (wird in T-216-028 geschrieben).                                                                                                                                                                                            |
| **Komplexität**        | **M** (~80 Zeilen, Store-Integration)                                                                                                                                                                                                                                     |
| **Risiko**             | **MEDIUM** (State-Integrität)                                                                                                                                                                                                                                             |
| **Empfohlener Agent**  | `architecture-agent` (Store-Design)                                                                                                                                                                                                                                       |

### T-216-018: appStore.ts — answerGateItem, completeGate, closeGate, discardGateSession

| Feld                   | Wert                                                                                                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ziel**               | Restliche Store-Actions implementieren: `answerGateItem()` speichert Antwort, `completeGate()` merged via `gateContentMerger` und erzeugt `EnrichedPromptContext`, `closeGate()` setzt `isGateOpen = false`, `discardGateSession()` löscht Session aus Store.                                    |
| **Betroffene Dateien** | `src/stores/appStore.ts` (+40 Zeilen)                                                                                                                                                                                                                                                            |
| **Abhängigkeiten**     | T-216-017, T-216-011 (Merger)                                                                                                                                                                                                                                                                    |
| **Akzeptenzkriterien** | - `completeGate(promptId, outcome)` nur möglich wenn alle REQUIRED beantwortet ODER outcome `SKIPPED`/`ASSUMPTIONS`. Erzeugt `EnrichedPromptContext` unter `enrichedContexts[promptId]`. `discardGateSession(promptId)` löscht `missingInfoSessions[promptId]` und `enrichedContexts[promptId]`. |
| **Testnachweis**       | Store-Test: Status-Transitions, Enrichment-Erzeugung.                                                                                                                                                                                                                                            |
| **Komplexität**        | **S** (~40 Zeilen)                                                                                                                                                                                                                                                                               |
| **Risiko**             | **MEDIUM** (State-Übergänge müssen atomar sein)                                                                                                                                                                                                                                                  |
| **Empfohlener Agent**  | `architecture-agent`                                                                                                                                                                                                                                                                             |

### T-216-019: appStore.ts — Invalidierung in analyzeSelected()

| Feld                   | Wert                                                                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `analyzeSelected()` so erweitern, dass nach erfolgreicher Analyse `discardGateSession(promptId)` aufgerufen wird. Bestehende Analyse-Logik bleibt unverändert.                            |
| **Betroffene Dateien** | `src/stores/appStore.ts` (+5 Zeilen in `analyzeSelected`)                                                                                                                                 |
| **Abhängigkeiten**     | T-216-018                                                                                                                                                                                 |
| **Akzeptenzkriterien** | - Nach `analyzeSelected()` ist `missingInfoSessions[promptId]` gelöscht. Bestehende Analyse-Ergebnisse (`evaluations`, `hygiene`, `contextEvaluations`) werden weiterhin korrekt gesetzt. |
| **Testnachweis**       | Store-Test: `analyzeSelected` → Session gelöscht. Bestehende `appStore.test.ts`-Tests laufen unverändert.                                                                                 |
| **Komplexität**        | **S** (+5 Zeilen)                                                                                                                                                                         |
| **Risiko**             | **MEDIUM** (darf bestehende Analyse nicht beeinträchtigen)                                                                                                                                |
| **Empfohlener Agent**  | `review-agent`                                                                                                                                                                            |

### T-216-020: appStore.ts — Keine Persistenz (Session-Only)

| Feld                   | Wert                                                                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | Sicherstellen, dass `missingInfoSessions` und `enrichedContexts` NUR in-memory im Zustand-Store existieren. Kein `localStorage`, keine SQLite, keine Datei-Persistenz. |
| **Betroffene Dateien** | `src/stores/appStore.ts` (Review)                                                                                                                                      |
| **Abhängigkeiten**     | T-216-017                                                                                                                                                              |
| **Akzeptenzkriterien** | - Kein `localStorage.setItem` für Gate-Daten. Kein Tauri `invoke` zum Speichern. Nach App-Neustart: `missingInfoSessions = {}`, `enrichedContexts = {}`.               |
| **Testnachweis**       | Store-Test: State-Reset bei `create()`-Aufruf. Code-Review auf Seiteneffekte.                                                                                          |
| **Komplexität**        | **S** (Review-Task)                                                                                                                                                    |
| **Risiko**             | **LOW** (Default-Verhalten von Zustand ist in-memory)                                                                                                                  |
| **Empfohlener Agent**  | `compliance-agent`                                                                                                                                                     |

---

## Stufe 9: DetailsPanel + ActionBar

### T-216-021: ActionBar — onMissingInfoGate-Prop und Button

| Feld                   | Wert                                                                                                                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `ActionBar`-Komponente um `onMissingInfoGate`-Prop erweitern. Neuen Button "❓ Fehlende Infos prüfen" rendern. Button nur sichtbar wenn Feature-Flag aktiv. Dynamisches Label: `X fehlende Infos` wenn Session existiert, sonst `Fehlende Infos prüfen`. |
| **Betroffene Dateien** | `src/components/details/DetailsPanel.tsx` (+30 Zeilen in ActionBar)                                                                                                                                                                                      |
| **Abhängigkeiten**     | T-216-003 (Feature-Flag), T-216-017 (Store)                                                                                                                                                                                                              |
| **Akzeptenzkriterien** | - Button erscheint rechts neben "BP optimieren". Feature-Flag OFF → Button nicht sichtbar. Klick ruft `onMissingInfoGate()` auf. Button zeigt korrektes dynamisches Label basierend auf Store-Session.                                                   |
| **Testnachweis**       | UI-Test: Button-Rendering mit/ohne Flag, Label-Dynamik.                                                                                                                                                                                                  |
| **Komplexität**        | **S** (~30 Zeilen)                                                                                                                                                                                                                                       |
| **Risiko**             | **LOW**                                                                                                                                                                                                                                                  |
| **Empfohlener Agent**  | `playwright-agent`                                                                                                                                                                                                                                       |

### T-216-022: DetailsPanel — Gate-Trigger vor Optimierung

| Feld                   | Wert                                                                                                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `handleOpenOptimizer()` in `DetailsPanel` erweitern: Vor dem Öffnen des OptimizationPanels prüfen, ob Gate-Session mit REQUIRED-Items existiert. Wenn ja: Gate öffnen statt Optimizer (nur beim ersten Mal pro Analyse-Lauf).                                                |
| **Betroffene Dateien** | `src/components/details/DetailsPanel.tsx` (+20 Zeilen)                                                                                                                                                                                                                       |
| **Abhängigkeiten**     | T-216-017 (Store), T-216-012 (Gate-Komponente)                                                                                                                                                                                                                               |
| **Akzeptenzkriterien** | - Wenn `missingInfoSessions[promptId].items` REQUIRED enthält und Session ACTIVE → `setShowMissingInfoGate(true)` statt `setShowOptimizer(true)`. Wenn keine REQUIRED → direkt Optimizer. `BLOCKING_SENSITIVE_CONTENT` → nie Gate, direkt Optimizer (bestehendes Verhalten). |
| **Testnachweis**       | Integrationstest: Analyse → Optimieren-Button → Gate erscheint (nicht Optimizer).                                                                                                                                                                                            |
| **Komplexität**        | **S** (~20 Zeilen)                                                                                                                                                                                                                                                           |
| **Risiko**             | **MEDIUM** (Flow-Änderung im Haupt-UI-Pfad)                                                                                                                                                                                                                                  |
| **Empfohlener Agent**  | `review-agent`                                                                                                                                                                                                                                                               |

### T-216-023: DetailsPanel — Gate-Modal Rendering und onComplete-Flow

| Feld                   | Wert                                                                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `MissingInfoGate`-Komponente in `DetailsPanel` einbinden: Rendering bei `showMissingInfoGate`, `onClose` setzt State zurück, `onComplete` triggert Optimizer (bei COMPLETED/ASSUMPTIONS) oder schließt nur (bei SKIPPED).                                     |
| **Betroffene Dateien** | `src/components/details/DetailsPanel.tsx` (+15 Zeilen)                                                                                                                                                                                                        |
| **Abhängigkeiten**     | T-216-022, T-216-012                                                                                                                                                                                                                                          |
| **Akzeptenzkriterien** | - `onComplete("COMPLETED")` → Gate schließen, Optimizer mit `enrichedContent` öffnen. `onComplete("SKIPPED")` → Gate schließen, Optimizer mit `originalContent` öffnen. `onComplete("ASSUMPTIONS")` → Gate schließen, Optimizer mit `enrichedContent` öffnen. |
| **Testnachweis**       | Integrationstest: Gate → Antworten → Fortfahren → OptimizationPanel erscheint.                                                                                                                                                                                |
| **Komplexität**        | **S** (~15 Zeilen)                                                                                                                                                                                                                                            |
| **Risiko**             | **LOW**                                                                                                                                                                                                                                                       |
| **Empfohlener Agent**  | `review-agent`                                                                                                                                                                                                                                                |

---

## Stufe 10: Optimizer-Integration

### T-216-024: OptimizationPanel — enrichedContent nutzen

| Feld                   | Wert                                                                                                                                                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `OptimizationPanel` so erweitern, dass es `enrichedContent` aus dem Store nutzt statt `prompt.content`, wenn ein `EnrichedPromptContext` existiert. Bestehende Signatur (`promptContent: string`) bleibt unverändert — der Aufrufer (DetailsPanel) übergibt das passende Content. |
| **Betroffene Dateien** | `src/components/details/DetailsPanel.tsx` (Aufrufer-Logik), `src/components/optimization/OptimizationPanel.tsx` (keine Änderung — unverändert)                                                                                                                                    |
| **Abhängigkeiten**     | T-216-023                                                                                                                                                                                                                                                                         |
| **Akzeptenzkriterien** | - Wenn `enrichedContexts[promptId]` existiert: `enrichedContent` wird an `OptimizationPanel` übergeben. Wenn nicht: `prompt.content` (Fallback). Optimizer-Signatur und Verhalten unverändert.                                                                                    |
| **Testnachweis**       | Integrationstest: Optimizer erhält enrichedContent nach Gate-Durchlauf.                                                                                                                                                                                                           |
| **Komplexität**        | **S** (~10 Zeilen, nur Aufrufer-Änderung)                                                                                                                                                                                                                                         |
| **Risiko**             | **LOW**                                                                                                                                                                                                                                                                           |
| **Empfohlener Agent**  | `review-agent`                                                                                                                                                                                                                                                                    |

### T-216-025: BlueprintOptimizationPanel — analog integrieren

| Feld                   | Wert                                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | Gleiches Muster für `BlueprintOptimizationPanel`: `handleBlueprintOptimize()` prüft Gate-Session vor dem Öffnen, übergibt `enrichedContent` wenn verfügbar. |
| **Betroffene Dateien** | `src/components/details/DetailsPanel.tsx` (+10 Zeilen)                                                                                                      |
| **Abhängigkeiten**     | T-216-024                                                                                                                                                   |
| **Akzeptenzkriterien** | - Blueprint-Optimierung triggert Gate (wenn REQUIRED), nutzt enrichedContent. `BLOCKING_SENSITIVE_CONTENT` blockiert beides.                                |
| **Testnachweis**       | Integrationstest: Blueprint → Gate → BP-Optimierung mit enrichedContent.                                                                                    |
| **Komplexität**        | **S** (~10 Zeilen)                                                                                                                                          |
| **Risiko**             | **LOW**                                                                                                                                                     |
| **Empfohlener Agent**  | `review-agent`                                                                                                                                              |

---

## Stufe 11: Tests

### T-216-026: Unit-Tests für alle lib-Module schreiben

| Feld                   | Wert                                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | Alle 5 Unit-Test-Suiten erstellen: `missingInfoFeatureFlag.test.ts` (12 Cases), `missingInfoDetector.test.ts` (15 Cases), `missingInfoClassifier.test.ts` (12 Cases), `constraintChecker.test.ts` (10 Cases), `gateContentMerger.test.ts` (10 Cases).                                                                                  |
| **Betroffene Dateien** | `src/lib/__tests__/missingInfoFeatureFlag.test.ts` (neu), `src/lib/__tests__/missingInfoDetector.test.ts` (neu), `src/lib/__tests__/missingInfoClassifier.test.ts` (neu), `src/lib/__tests__/constraintChecker.test.ts` (neu), `src/lib/__tests__/gateContentMerger.test.ts` (neu)                                                     |
| **Abhängigkeiten**     | T-216-003 (Flag), T-216-005 (Detector), T-216-007 (Classifier), T-216-009 (ConstraintChecker), T-216-011 (Merger)                                                                                                                                                                                                                      |
| **Akzeptenzkriterien** | - Alle Tests laufen mit `pnpm test`. Kein Test schlägt fehl. Coverage: `missingInfoDetector` ≥ 90%, `missingInfoClassifier` ≥ 95%, `constraintChecker` ≥ 90%, `gateContentMerger` ≥ 95%. Edge Cases abgedeckt: leerer Prompt, BLOCKING_SENSITIVE_CONTENT, Score 95+, Prompt < 50 Zeichen, Code-nur, fremdsprachig, Injection-Vektoren. |
| **Testnachweis**       | `pnpm test -- --reporter=verbose` Ausgabe mit PASS für alle Suites.                                                                                                                                                                                                                                                                    |
| **Komplexität**        | **L** (~60 Test Cases, 5 Dateien)                                                                                                                                                                                                                                                                                                      |
| **Risiko**             | **HIGH** (Tests sind Pflicht für Quality Gate)                                                                                                                                                                                                                                                                                         |
| **Empfohlener Agent**  | `review-agent` (Test-Review) + `security-agent` (Constraint/Sanitization-Tests)                                                                                                                                                                                                                                                        |

### T-216-027: UI-Tests für MissingInfoGate schreiben

| Feld                   | Wert                                                                                                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `MissingInfoGate.test.tsx` erstellen: Rendering aller 5 Input-Typen, max. 5 sichtbare Fragen, "Fortfahren" disabled ohne REQUIRED-Antworten, Button-Klicks, "Erweiterte Angaben" einklappbar, Leerzustand, Session-Vorausfüllung. |
| **Betroffene Dateien** | `src/components/gates/__tests__/MissingInfoGate.test.tsx` (neu, ~15 Cases)                                                                                                                                                        |
| **Abhängigkeiten**     | T-216-016 (Gate-Komponente), T-216-017 (Store)                                                                                                                                                                                    |
| **Akzeptenzkriterien** | - 15 UI-Test-Cases, alle PASS. Rendering-Tests für alle Input-Typen. Interaktions-Tests für Buttons.                                                                                                                              |
| **Testnachweis**       | `pnpm test -- --reporter=verbose` PASS für `MissingInfoGate.test.tsx`.                                                                                                                                                            |
| **Komplexität**        | **L** (~15 UI-Test-Cases)                                                                                                                                                                                                         |
| **Risiko**             | **MEDIUM**                                                                                                                                                                                                                        |
| **Empfohlener Agent**  | `playwright-agent`                                                                                                                                                                                                                |

### T-216-028: Store- und Integrationstests schreiben

| Feld                   | Wert                                                                                                                                                                                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `appStore.missingInfoGate.test.ts` (8 Cases: Session-Lifecycle, Invalidierung, Status-Transitions) und `MissingInfoGate.integration.test.tsx` (Analyse→Gate→Antworten→Enrichment→Optimierung) sowie `MissingInfoGate.constraint.test.tsx` (Konflikt: Antwort vs. Constraint) erstellen. |
| **Betroffene Dateien** | `src/stores/__tests__/appStore.missingInfoGate.test.ts` (neu), `src/components/gates/__tests__/MissingInfoGate.integration.test.tsx` (neu), `src/components/gates/__tests__/MissingInfoGate.constraint.test.tsx` (neu)                                                                  |
| **Abhängigkeiten**     | T-216-020 (Store), T-216-025 (Optimizer-Integration)                                                                                                                                                                                                                                    |
| **Akzeptenzkriterien** | - Store-Test: `openGate` erzeugt Session, `completeGate` erzeugt EnrichedPromptContext, `discardGateSession` löscht, `analyzeSelected` invalidiert. Integrationstest: kompletter Flow. Constraint-Test: Konflikt-Warnung erscheint.                                                     |
| **Testnachweis**       | `pnpm test` PASS für alle drei Suites.                                                                                                                                                                                                                                                  |
| **Komplexität**        | **L** (~25 Cases, 3 Dateien)                                                                                                                                                                                                                                                            |
| **Risiko**             | **HIGH** (Integrationstests sind kritisch für Regression)                                                                                                                                                                                                                               |
| **Empfohlener Agent**  | `review-agent` (Store) + `playwright-agent` (Integration)                                                                                                                                                                                                                               |

---

## Stufe 12: Dokumentation / Evidence

### T-216-029: ADR-002 und ROADMAP aktualisieren

| Feld                   | Wert                                                                                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `docs/DECISIONS.md` um ADR-002.1–002.4 ergänzen: Gate Trigger Logic, Answer Merge Format, Session Lifecycle, korrigierte Implementation Order. `docs/ROADMAP.md`: #216 Status von "Specification" auf "In Progress". |
| **Betroffene Dateien** | `docs/DECISIONS.md` (+4 Sub-Decisions), `docs/ROADMAP.md` (Status-Update)                                                                                                                                            |
| **Abhängigkeiten**     | T-216-028 (Tests müssen grün sein für Status-Update)                                                                                                                                                                 |
| **Akzeptenzkriterien** | - ADR-002.1–002.4 sind dokumentiert. ROADMAP zeigt #216 als "In Progress". Keine Widersprüche zu implementiertem Code.                                                                                               |
| **Testnachweis**       | Doku-Review durch `documentation-agent`.                                                                                                                                                                             |
| **Komplexität**        | **S** (Doku-Update)                                                                                                                                                                                                  |
| **Risiko**             | **LOW**                                                                                                                                                                                                              |
| **Empfohlener Agent**  | `documentation-agent`                                                                                                                                                                                                |

### T-216-030: spec.md Status auf Accepted setzen

| Feld                   | Wert                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Ziel**               | `docs/specs/0216-missing-info-gate/spec.md` Status von "Draft" auf "Accepted" nach Owner-Review aktualisieren. |
| **Betroffene Dateien** | `docs/specs/0216-missing-info-gate/spec.md` (+1 Zeile Status-Änderung)                                         |
| **Abhängigkeiten**     | T-216-028 (Tests grün), Owner-Approval                                                                         |
| **Akzeptenzkriterien** | - Spec-Status: "Accepted". Owner hat explizit zugestimmt (Human Approval).                                     |
| **Testnachweis**       | Human Approval Gate.                                                                                           |
| **Komplexität**        | **S** (Status-Update)                                                                                          |
| **Risiko**             | **LOW**                                                                                                        |
| **Empfohlener Agent**  | `documentation-agent`                                                                                          |

---

## Abhängigkeitsgraph (visuell)

```
T-216-001 (Types)
  ├── T-216-002 (Shared Types Review)
  ├── T-216-003 (Feature-Flag) ──────────────────────────────────────┐
  ├── T-216-004 (Detector) ──► T-216-005 (Edge Cases)               │
  │     ├── T-216-006 (Classifier) ──► T-216-007 (Sort/Limit)       │
  │     │     ├── T-216-017 (Store: openGate) ──► T-216-018 (Actions)│
  │     │     │     ├── T-216-019 (Invalidierung)                   │
  │     │     │     ├── T-216-020 (Session-Only)                    │
  │     │     │     ├── T-216-021 (ActionBar) ──────────────────────┤
  │     │     │     ├── T-216-022 (Gate-Trigger) ──► T-216-023 (Modal)│
  │     │     │     │     ├── T-216-024 (Optimizer-Integration) ────┤
  │     │     │     │     └── T-216-025 (BP-Integration)            │
  │     │     │     └──► T-216-012 (Gate UI) ──► T-216-013 (REQUIRED)│
  │     │     │           ├── T-216-014 (Input-Typen)               │
  │     │     │           ├── T-216-015 (Buttons)                   │
  │     │     │           └── T-216-016 (Edge Cases)                │
  │     │     │                                                      │
  ├── T-216-008 (ConstraintChecker) ──► T-216-009 (Konfliktprüfung) │
  │                                                                  │
  └── T-216-010 (Sanitization) ──► T-216-011 (Merge) ───────────────┤
                                                                     │
  ┌──────────────────────────────────────────────────────────────────┘
  │
  ├── T-216-026 (Unit Tests) ───────────────────────────────────────┐
  ├── T-216-027 (UI Tests) ─────────────────────────────────────────┤
  ├── T-216-028 (Store + Integration Tests) ────────────────────────┤
  │                                                                  │
  └── T-216-029 (ADR + ROADMAP) ──► T-216-030 (Spec Accepted)
```

---

## Pflicht-Checkliste

| Pflicht                                   | Abgedeckt in Task(s)                               |
| ----------------------------------------- | -------------------------------------------------- |
| Session-only Lifecycle (keine Persistenz) | T-216-020                                          |
| Sanitization vor Merge (5 Regeln)         | T-216-010                                          |
| Max. 5 sichtbare REQUIRED-Fragen          | T-216-013, T-216-007                               |
| Constraint-Tests als eigene Tasks         | T-216-026 (T4), T-216-028 (Constraint Integration) |
| Feature-Flag default disabled             | T-216-003                                          |
| Keine persistente Speicherung in Phase 1  | T-216-020                                          |
| Antworten editierbar (Session-Reuse)      | T-216-017 (openGate-Check)                         |
| Original-Prompt unverändert               | T-216-011 (Merge hängt NUR an)                     |
| Kein Batch-Flow (nur Einzel-Prompt)       | T-216-019 (nur in analyzeSelected)                 |
| BLOCKING_SENSITIVE_CONTENT sperrt Gate    | T-216-005, T-216-022                               |

---

## Task-Statistik

| Metrik                 | Wert                                                        |
| ---------------------- | ----------------------------------------------------------- |
| **Gesamtanzahl Tasks** | 30                                                          |
| **Komplexität S**      | 15 Tasks                                                    |
| **Komplexität M**      | 11 Tasks                                                    |
| **Komplexität L**      | 4 Tasks (T-216-001, T-216-026, T-216-027, T-216-028)        |
| **Risiko HIGH**        | 3 Tasks (T-216-010, T-216-026, T-216-028)                   |
| **Risiko MEDIUM**      | 13 Tasks                                                    |
| **Risiko LOW**         | 14 Tasks                                                    |
| **Neue Dateien**       | 16 (7 Module + 1 CSS + 8 Testdateien)                       |
| **Geänderte Dateien**  | 4 (types, appStore, DetailsPanel, DECISIONS.md, ROADMAP.md) |

---

## Nächste Phase

**`/speckit.taskstoissues`** — Konvertierung der 30 Tasks in GitHub Issues, verlinkt mit #216 als Parent und #214 als Epic.

---

## Entscheidungszusammenfassung

### Gelesen

- `spec.md` (725 Zeilen), `plan.md` (842 Zeilen), Issue #216, Epic #214, ADR-002, `appStore.ts`, `DetailsPanel.tsx`, `featureFlag.ts`

### Validierte Fakten

- 12 Plan-Stufen aus plan.md Abschnitt 3 sind die Basis für die Task-Zerlegung
- Abhängigkeitsgraph aus plan.md Abschnitt 3 ist korrekt
- Feature-Flag-Pattern aus `embeddings/featureFlag.ts` ist die Vorlage

### Entscheidung

30 atomare Tasks über 12 Stufen. Keine Implementierung. Tasks sind vollständig, testbar und für `/speckit.taskstoissues` vorbereitet.
