# Spec: Missing-Info-Gate für dynamische Rückfragen im Optimierungsprozess

> **Issue:** [#216](https://github.com/xxammaxx/promptvault-lite/issues/216)
> **Epic:** [#214](https://github.com/xxammaxx/promptvault-lite/issues/214) — Prompt-Optimierung mit Ergebnisvarianten und dynamischen Rückfragen
> **ADR:** ADR-002 in `docs/DECISIONS.md`
> **Speckit Phase:** Accepted
> **Status:** Accepted
> **Date:** 2026-07-09
> **Accepted Date:** 2026-07-10
> **Author:** Issue Orchestrator (via Speckit Workflow)
> **Last Updated:** 2026-07-10 — Status from Draft to Accepted after implementation completion

---

## 1. Feature-Ziel

Das **Missing-Info-Gate** soll während der Prompt-Analyse, Optimierung und Variantenbildung erkennen, **welche Informationen fehlen**, damit der Prompt präzise, sicher und ausführbar wird. Statt blind zu optimieren, fragt das System **strukturiert nach** fehlenden Angaben — als interaktives UI-Formular, nicht als Fließtext oder Chat-Dialog.

Das Gate versteht sich als **Enrichment-Schicht** zwischen der bestehenden Analyse-Pipeline und der Transformation (Optimierung / Variantengenerierung). Es:

- konsumiert die existierenden Analyseergebnisse (`PromptContextEvaluation`, `BlueprintEvaluation`, `PromptHygiene`)
- transformiert erkannte Lücken in klassifizierte Fragen (`REQUIRED` / `RECOMMENDED` / `OPTIONAL`)
- reichert den Prompt-Inhalt mit Nutzerantworten an
- übergibt das angereicherte Ergebnis an Downstream-Consumer (Optimizer, Variant Generator)

---

## 2. Nutzerproblem

Viele Prompts sind nicht schlecht **formuliert**, sondern **unvollständig**. Die bestehende Analyse-Pipeline erkennt Lücken (z. B. fehlende Zieldefinition, fehlendes Ausgabeformat), zeigt sie aber nur **passiv** als Score-Abzug oder Warnung an. Der Nutzer muss selbst entscheiden, welche Lücke er wie füllt.

Das Missing-Info-Gate schließt diese Lücke: Es **fragt aktiv nach** den fehlenden Informationen, zeigt an, warum sie relevant sind, und erlaubt es dem Nutzer, sie strukturiert zu ergänzen — oder bewusst mit Annahmen fortzufahren.

---

## 3. Kernfluss

```
1. Nutzer wählt Prompt aus oder fügt Prompt ein
         │
2. Analyse-Pipeline läuft (bestehend):
   - classifyContent()         → ContentClass, BlueprintType
   - evaluatePromptContext()   → PromptContextEvaluation
   - evaluateBlueprint()       → BlueprintEvaluation (wenn Blueprint)
   - detectArtifacts()         → PromptHygiene
         │
3. Missing-Info-Detector konsumiert Analyse-Output
   - missing_elements[], risk_flags[], suggested_improvements[]
   - Kriterien mit score === 0
         │
4. Missing-Info-Classifier weist Tiers zu:
   REQUIRED / RECOMMENDED / OPTIONAL
         │
5. Missing-Info-Gate öffnet sich (UI-Formular)
   - Nur wenn REQUIRED-Items existieren
   - Alternativ: als eigener Button "❓ Fehlende Infos prüfen"
         │
6. Nutzer interagiert:
   - Beantwortet Fragen (Freitext, Chips, Dropdowns, Toggle)
   - Überspringt einzelne Fragen (RECOMMENDED / OPTIONAL)
   - Klickt "Mit Annahmen fortfahren" (alle REQUIRED mit Defaults)
   - Klickt "Alle überspringen" (kein Enrichment)
         │
7. Gate schließt → EnrichedPromptContext wird im Store abgelegt
         │
8. Downstream-Consumer:
   - Optimizer (conservative/balanced/aggressive) nutzt enrichedContent
   - VariantGenerator (#215) nutzt enrichedContent + answers
         │
9. Ergebnis zeigt:
   - Verwendete Zusatzinformationen
   - Getroffene Annahmen
   - Offene/unbeantwortete Punkte
   - Option zum erneuten Durchlauf des Gates
```

### Pipeline-Position (ADR-002-konform)

```
Analyse → Missing-Info-Gate → Optimierung / Variantenbildung
  │              │                        │
  │   (validate) │   (enrich)             │   (transform)
  │              │                        │
  └──────────────┴────────────────────────┘
         shared constraintChecker.ts (nur für #215 relevant)
```

---

## 4. Missing-Info-Kategorien

### 4.1 Tier-Definition

| Tier            | Bedeutung                                                                                | Blockierend?                                                                                                          | Nutzeraktion                                                    |
| --------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **REQUIRED**    | Ohne diese Info ist der Prompt sehr wahrscheinlich nicht sinnvoll oder sicher ausführbar | **Ja** — Gate öffnet sich automatisch; alle REQUIRED müssen beantwortet ODER "Mit Annahmen fortfahren" gewählt werden | Muss beantwortet oder explizit mit Annahmen fortgefahren werden |
| **RECOMMENDED** | Verbessert das Ergebnis deutlich, ist aber nicht zwingend nötig                          | **Nein** — unter "Erweiterte Angaben" einklappbar                                                                     | Kann übersprungen werden                                        |
| **OPTIONAL**    | Für Feinschliff, Tonalität, Zielgruppe oder Ausgabeformat                                | **Nein** — eingeklappt, nur bei Bedarf sichtbar                                                                       | Kann übersprungen werden                                        |

### 4.2 Klassifizierungsregeln

Die Klassifizierung von Analyse-Lücken in Tiers folgt diesen Regeln:

| Quelle                                 | Bedingung                                   | Tier            |
| -------------------------------------- | ------------------------------------------- | --------------- |
| `risk_flags[].severity === "critical"` | immer                                       | **REQUIRED**    |
| `risk_flags[].severity === "high"`     | immer                                       | **REQUIRED**    |
| PE-Kriterien `score === 0`             | `detected_prompt_type !== "simple_prompt"`  | **REQUIRED**    |
| AR-Kriterien `score === 0`             | `detected_prompt_type === "agentic_prompt"` | **REQUIRED**    |
| `risk_flags[].severity === "medium"`   | immer                                       | **RECOMMENDED** |
| CE-Kriterien `score === 0`             | `detected_context_profile === "minimal"`    | **RECOMMENDED** |
| Blueprint `missing_elements[]`         | immer                                       | **RECOMMENDED** |
| Hygiene `hygiene_score < 50`           | immer                                       | **RECOMMENDED** |
| PE-Kriterien `score === 1`             | immer                                       | **OPTIONAL**    |
| CE-Kriterien `score === 1`             | immer                                       | **OPTIONAL**    |
| `risk_flags[].severity === "low"`      | immer                                       | **OPTIONAL**    |

### 4.3 Anti-Overload-Regel

Das System darf den Nutzer nicht mit zu vielen Fragen blockieren:

1. **Zuerst nur REQUIRED-Fragen** anzeigen (maximal **5 REQUIRED**)
2. RECOMMENDED + OPTIONAL eingeklappt unter **„Erweiterte Angaben“**
3. **Maximale Gesamtfragenanzahl:** 5 REQUIRED + 7 RECOMMENDED + 10 OPTIONAL
4. Jede Rückfrage enthält eine kurze **Begründung**, warum sie relevant ist
5. Das Gate öffnet sich **nur automatisch**, wenn mindestens 1 REQUIRED-Item existiert
6. Bei ausschließlich RECOMMENDED/OPTIONAL-Items: Gate öffnet sich auf Knopfdruck ("❓ Fehlende Infos prüfen")
7. Bei ausschließlich OPTIONAL-Items: Gate öffnet sich **nicht** (kein Mehrwert)

---

## 5. Datenmodell

### 5.1 MissingInfoItem (Roh erkannte Lücke)

```typescript
interface MissingInfoItem {
  /** Eindeutige ID (z.B. "MISS_PE_001"). */
  id: string;

  /** Ursprungsdimension der Lücke. */
  source:
    | "prompt_engineering"
    | "context_engineering"
    | "agent_readiness"
    | "blueprint"
    | "risk_flag"
    | "hygiene";

  /** Menschenlesbarer Name (z.B. "Zieldefinition"). */
  label: string;

  /** Konkrete Frage an den Nutzer (deutsch). */
  question: string;

  /** Kurze Begründung, warum diese Information relevant ist. */
  rationale: string;

  /** Erwartetes Antwortformat — bestimmt das UI-Widget. */
  inputType: MissingInfoInputType;

  /** Bei select/multiselect: verfügbare Optionen. */
  options?: string[];

  /** Platzhaltertext für das Input-Feld. */
  placeholder?: string;

  /** Vorgeschlagener Default-Wert (für "Mit Annahmen fortfahren"). */
  defaultValue?: string;

  /** Maximale Antwortlänge in Zeichen (0 = unbegrenzt). */
  maxLength?: number;
}
```

### 5.2 MissingInfoInputType

```typescript
type MissingInfoInputType =
  | "free_text" // Einzeiliges Textfeld
  | "free_multiline" // Mehrzeilige Textarea
  | "single_select" // Dropdown / Radio-Buttons
  | "multi_select" // Checkboxen / Auswahlchips
  | "boolean"; // Toggle / Ja-Nein-Schalter
```

### 5.3 MissingInfoCategory (Tier)

```typescript
type MissingInfoCategory = "REQUIRED" | "RECOMMENDED" | "OPTIONAL";
```

### 5.4 ClassifiedMissingInfo (Klassifizierte Lücke)

```typescript
interface ClassifiedMissingInfo extends MissingInfoItem {
  /** Tier-Klassifizierung. */
  tier: MissingInfoCategory;

  /** Begründung für die Klassifizierung (für Dev-Mode). */
  classificationReason: string;
}
```

### 5.5 MissingInfoAnswer (Nutzer-Antwort)

```typescript
interface MissingInfoAnswer {
  /** ID der zugehörigen Frage. */
  itemId: string;

  /** Der vom Nutzer eingegebene/ausgewählte Wert. */
  value: string;

  /** Zeitstempel der Antwort. */
  answeredAt: string;
}
```

### 5.6 MissingInfoSession (Gate-Session-Zustand)

```typescript
type GateSessionStatus =
  | "ACTIVE" // Formular wird angezeigt
  | "COMPLETED" // Alle REQUIRED beantwortet
  | "SKIPPED" // Nutzer klickte "Alle überspringen"
  | "ASSUMPTIONS" // Nutzer klickte "Mit Annahmen fortfahren"
  | "CANCELLED"; // Nutzer schloss das Gate (Modal dismissed)

type GateOutcome = "COMPLETED" | "SKIPPED" | "ASSUMPTIONS";

interface MissingInfoSession {
  sessionId: string;
  promptId: string;
  startedAt: string;

  /** Alle klassifizierten Fragen. */
  items: ClassifiedMissingInfo[];

  /** Nutzer-Antworten (Map itemId → answer). */
  answers: Record<string, MissingInfoAnswer>;

  /** Aktueller Status. */
  status: GateSessionStatus;

  /** Ergebnis, wenn die Session beendet wurde. */
  outcome: GateOutcome | null;

  /** Angereicherter Prompt-Inhalt (original + answers als Markdown). */
  enrichedContent: string | null;
}
```

### 5.7 ConflictState (Konflikterkennung)

```typescript
interface HardConstraint {
  id: string;
  constraintText: string;
  category:
    | "offline_only"
    | "max_length"
    | "no_examples"
    | "language"
    | "format_lock"
    | "tool_restriction"
    | "approval_required"
    | "scope_boundary";
  severity: "hard" | "soft";
  position: { line: number; column: number } | null;
}

interface ConstraintConflict {
  id: string;
  constraint: HardConstraint;
  conflictingSource: string;
  description: string;
  severity: "blocking" | "warning";
  resolutions: ConflictResolutionOption[];
  selectedResolution: ConflictResolution | null;
}

interface ConflictResolutionOption {
  id: string;
  label: string;
  description: string;
  consequence: string;
}

interface ConflictResolution {
  optionId: string;
  resolvedAt: string;
}
```

### 5.8 Store-Erweiterung (appStore.ts)

```typescript
// Neue State-Felder im AppState:
interface MissingInfoState {
  /** Sessions pro promptId. */
  sessions: Record<string, MissingInfoSession>;

  /** Angereicherte Kontexte pro promptId. */
  enrichedContexts: Record<string, EnrichedPromptContext>;

  /** UI-Zustand. */
  isGateOpen: boolean;
  activeGatePromptId: string | null;
}

interface EnrichedPromptContext {
  originalContent: string;
  enrichedContent: string;
  answers: MissingInfoAnswer[];
  gateOutcome: GateOutcome;
  sessionId: string;
  enrichedAt: string;
}
```

---

## 6. UI-Anforderungen

### 6.1 Komponente: MissingInfoGate

Das Gate erscheint als **Modal-Panel** (analog zu `OptimizationPanel.tsx`) und folgt den existierenden UI-Patterns der App.

#### Layout

```
┌──────────────────────────────────────────────────┐
│  ❓ Fehlende Informationen                    ✕   │
│                                                    │
│  ⚠️ 3 Fragen müssen beantwortet werden           │
│  ──────────────────────────────────────────────   │
│                                                    │
│  [REQUIRED] Zieldefinition                        │
│  ℹ️ Ohne klares Ziel kann die Optimierung keine   │
│     passende Ausrichtung wählen.                  │
│  ┌──────────────────────────────────────────────┐ │
│  │ Was soll der Prompt erreichen?               │ │
│  │ [________________________________]          │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  [REQUIRED] Ausgabeformat                         │
│  ℹ️ Das Ausgabeformat bestimmt die Struktur des   │
│     optimierten Prompts.                          │
│  ┌──────────────────────────────────────────────┐ │
│  │ [Dropdown: Fließtext ▼]                     │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ─── Erweiterte Angaben (5 Fragen) ─── [▶ Ausklappen]
│                                                    │
│  [▶ Fortfahren]  [⏭ Alle überspringen]           │
│  [🤖 Mit Annahmen fortfahren]                     │
└──────────────────────────────────────────────────┘
```

### 6.2 Unterstützte Eingabearten

| Typ              | UI-Widget                  | Beispiel                               |
| ---------------- | -------------------------- | -------------------------------------- |
| `free_text`      | `<input type="text">`      | "Zielgruppe: **\*\***\_\_\_\_**\*\***" |
| `free_multiline` | `<textarea>`               | "Beschreiben Sie den Kontext: ..."     |
| `single_select`  | `<select>` / Radio-Buttons | "Format: [Fließtext ▾]"                |
| `multi_select`   | Checkboxen / Chips         | "☑ Version ☐ Autor ☐ Datum"            |
| `boolean`        | Toggle / Schalter          | "Lokal ausführen: [AN ▪ AUS]"          |

### 6.3 Nutzer-Aktionen

| Aktion                            | Verhalten                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| **Frage beantworten**             | Wert wird in `session.answers[itemId]` gespeichert; Formular validiert live           |
| **Frage überspringen** (einzelne) | Nur für RECOMMENDED/OPTIONAL; markiert als skipped, kein Wert gespeichert             |
| **Alle überspringen**             | `outcome = "SKIPPED"`; kein Enrichment; Original-Prompt unverändert                   |
| **Mit Annahmen fortfahren**       | REQUIRED-Fragen werden mit `defaultValue` befüllt; `outcome = "ASSUMPTIONS"`          |
| **Fortfahren**                    | Nur möglich, wenn alle REQUIRED beantwortet sind; `outcome = "COMPLETED"`             |
| **Schließen (✕)**                 | `status = "CANCELLED"`; Session bleibt im Store (kein Datenverlust bei Wiederöffnung) |
| **Erweiterte Angaben ausklappen** | RECOMMENDED + OPTIONAL-Fragen werden sichtbar                                         |

### 6.4 Platzhalter / Defaults

Jedes `MissingInfoItem` kann einen `placeholder` und einen `defaultValue` definieren:

```typescript
{
  id: "MISS_PE_001",
  question: "Was ist das Ziel dieses Prompts?",
  placeholder: "z.B. Einen Pull Request automatisiert reviewen",
  defaultValue: "Generische Optimierung",  // für "Mit Annahmen fortfahren"
  // ...
}
```

### 6.5 Trigger-Logik (Wann öffnet sich das Gate?)

| Bedingung                                               | Verhalten                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Keine Analyse vorhanden                                 | Analyse zuerst ausführen (`analyzeSelected`), dann Gate prüfen                 |
| `contamination_status === "BLOCKING_SENSITIVE_CONTENT"` | Gate **niemals** öffnen (Security Boundary)                                    |
| `classifiedItems` enthält ≥ 1 REQUIRED                  | Gate öffnet sich **automatisch** vor Optimierung/Variantengenerierung          |
| Nur RECOMMENDED + OPTIONAL                              | Gate **nicht** automatisch; optionaler "❓ Fehlende Infos"-Button in ActionBar |
| Nur OPTIONAL                                            | Gate öffnet sich **nicht**                                                     |
| Session bereits `COMPLETED` / `SKIPPED` / `ASSUMPTIONS` | Gate nicht erneut öffnen, bis `analyzeSelected()` erneut läuft                 |
| Nutzer klickt ActionBar "❓ Fehlende Infos prüfen"      | Gate öffnet sich **immer** (unabhängig vom Tier)                               |

---

## 7. Konflikterkennung

### 7.1 Prinzipien

1. **Harte Constraints** (z. B. "Keine Cloud verwenden", "Local-only", "Maximal 200 Wörter") dürfen **niemals stillschweigend** entfernt, abgeschwächt oder überschrieben werden — weder durch Gate-Antworten noch durch Optimierung oder Variantengenerierung.
2. **Nutzerantworten** im Gate dürfen Constraints **nicht automatisch überschreiben**. Bei Kollision muss ein sichtbarer Conflict-State erzeugt werden.
3. **Local-First** und **Privacy** haben Vorrang vor Komfort — keine Funktion darf die Offline-Garantie aufweichen.
4. Jeder Konflikt braucht eine **explizite Nutzerentscheidung** oder eine **Review-Markierung**.

### 7.2 Konflikt-Beispiele

| Constraint im Prompt    | Nutzer-Antwort / Profil       | Konflikt                                                                           |
| ----------------------- | ----------------------------- | ---------------------------------------------------------------------------------- |
| "Keine Cloud verwenden" | "Deep Research mit Cloud-LLM" | **BLOCKING** — Constraint behalten, Richtung ändern oder als Review-Fall speichern |
| "Maximal 200 Wörter"    | "Ausführliche Variante"       | **WARNING** — Ausführlichkeit eingeschränkt; Hinweis im Ergebnis                   |
| "Nur auf Deutsch"       | Sprache: Englisch             | **BLOCKING** — Sprache anpassen oder Constraint aufheben                           |
| "Keine Beispiele"       | Richtung: "verkaufsstark"     | **WARNING** — Ohne Beispiele generieren oder Constraint lockern                    |

### 7.3 Konflikt-UI

```
┌──────────────────────────────────────────────────┐
│  ⚠️ Konflikt erkannt                              │
│                                                    │
│  Der Prompt enthält die Regel:                     │
│  "Keine Cloud verwenden"                          │
│                                                    │
│  Ihre Auswahl "Deep Research mit Cloud-LLM"       │
│  kollidiert mit dieser Regel.                     │
│                                                    │
│  Bitte entscheiden:                                │
│  ◉ Constraint behalten (Richtung wird angepasst)  │
│  ○ Constraint ändern (Cloud-Nutzung erlauben)     │
│  ○ Als Review-Fall speichern (keine Änderung)     │
│                                                    │
│  [Entscheidung übernehmen]                        │
└──────────────────────────────────────────────────┘
```

### 7.4 Scope in Phase 1

In Phase 1 (#216) ist die Konflikterkennung auf **Gate-Antworten vs. harte Constraints** beschränkt. Die vollständige Konflikterkennung für Direction Profiles (#215) wird durch das shared `constraintChecker.ts`-Modul abgedeckt.

---

## 8. Integration Points

### 8.1 Neue Module

| Modul                      | Pfad                               | Aufgabe                                                |
| -------------------------- | ---------------------------------- | ------------------------------------------------------ |
| `missingInfoDetector.ts`   | `src/lib/missingInfoDetector.ts`   | Transformiert Analyse-Output in `MissingInfoItem[]`    |
| `missingInfoClassifier.ts` | `src/lib/missingInfoClassifier.ts` | Weist `MissingInfoCategory` zu                         |
| `gateContentMerger.ts`     | `src/lib/gateContentMerger.ts`     | Merged Antworten als Markdown-Sektion in Prompt-Inhalt |

### 8.2 Neue Komponente

| Komponente            | Pfad                                       | Aufgabe                               |
| --------------------- | ------------------------------------------ | ------------------------------------- |
| `MissingInfoGate.tsx` | `src/components/gates/MissingInfoGate.tsx` | Modal-Formular für Frage-Beantwortung |

### 8.3 Bestehende Komponenten — Änderungen

| Komponente                | Änderung                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `DetailsPanel.tsx`        | ActionBar: neuer Button "❓ Fehlende Infos prüfen" + Gate-Trigger vor Optimierung     |
| `PastePromptAnalyzer.tsx` | Nach Analyse: Button "❓ Fehlende Infos prüfen" anzeigen                              |
| `appStore.ts`             | Neue State-Felder: `sessions`, `enrichedContexts`, `isGateOpen`, `activeGatePromptId` |
| `types/index.ts`          | Neue Typen (siehe Abschnitt 5)                                                        |

### 8.4 Bestehende Module — unverändert

| Modul                        | Grund                                                                 |
| ---------------------------- | --------------------------------------------------------------------- |
| `promptOptimizer.ts`         | Konsumiert `enrichedContent` als String — Signatur bleibt unverändert |
| `blueprintOptimizer.ts`      | Gleiches Muster                                                       |
| `promptContextEvaluation.ts` | Produziert Gap-Daten, die der Detector konsumiert — keine Änderung    |
| `blueprintDetection.ts`      | Produziert Gap-Daten — keine Änderung                                 |
| `pastePromptAnalysis.ts`     | Adapter bleibt unverändert                                            |

---

## 9. Mapping: Analyse-Ergebnis → MissingInfoItem

### 9.1 Primäre Input-Quellen

Das Gate konsumiert **nur existierende Analyse-Ergebnisse** und führt **keine eigene Prompt-Analyse** durch (keine Code-Duplizierung mit `promptContextEvaluation.ts` oder `blueprintDetection.ts`).

| Analyse-Datenstruktur     | Feld                        | Transformation                                                                                         |
| ------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `PromptContextEvaluation` | `.missing_elements[]`       | 1:1 → `MissingInfoItem` (label = Element-Name, rationale = "Fehlt in der Analyse")                     |
| `PromptContextEvaluation` | `.risk_flags[]`             | Jeder Flag → `MissingInfoItem` (tier via severity-Mapping)                                             |
| `PromptContextEvaluation` | `.criteria[]` (score === 0) | Jedes Kriterium mit Score 0 → `MissingInfoItem`                                                        |
| `PromptContextEvaluation` | `.suggested_improvements[]` | Jede Improvement → OPTIONAL `MissingInfoItem`                                                          |
| `BlueprintEvaluation`     | `.missing_elements[]`       | 1:1 → `MissingInfoItem`                                                                                |
| `PromptHygiene`           | `.hygiene_score < 50`       | Eine RECOMMENDED-Frage: "Prompt enthält Artefakte. Sollen diese vor der Optimierung bereinigt werden?" |

### 9.2 Deduplizierung

Mehrere Analyse-Quellen können dieselbe semantische Lücke erkennen (z. B. `missing_elements[PE]` und `risk_flags[missing_goal]` beide: "Zieldefinition fehlt"). Der `missingInfoDetector` dedupliziert anhand des `label`-Felds (case-insensitive, normalisiert).

### 9.3 Keine eigenen Heuristiken in Phase 1

Phase 1 des Gates verwendet **ausschließlich** die existierenden Analyse-Ergebnisse. Eigene Heuristiken (z. B. "Prompt < 100 Zeichen → frage nach Zielgruppe") sind für Phase 2 vorgesehen und werden als eigene Issues getrackt.

---

## 10. Nicht-Ziele (Out of Scope)

> **Implementierungsstand (2026-07-10):** Das Missing-Info-Gate ist vollständig implementiert (6 Batches, Commits `4e5fedd`–`db0375d`). Alle Akzeptanzkriterien sind erfüllt und getestet (1045 Tests im Workspace grün). Siehe auch [evidence.md](./evidence.md) und ADR-002 in `docs/DECISIONS.md`.

- ❌ **Keine Implementierung** in diesem Spec-Lauf (Anm.: Implementierung ist abgeschlossen)
- ❌ **Keine Cloud-Pflicht** — alles bleibt lokal/deterministisch
- ❌ **Keine automatische Entfernung** harter Constraints
- ❌ **Keine stille Änderung** des Ursprungsprompts
- ❌ **Keine unendliche Fragekette** — maximale Fragenanzahl begrenzt
- ❌ **Keine vollständige VariantGenerator-Implementierung** aus #215
- ❌ **Keine Persistenz** von Nutzerantworten über App-Neustarts (Session-Only)
- ❌ **Keine eigenen Prompt-Analyse-Heuristiken** — Gate konsumiert nur existierende Analyse-Daten
- ❌ **Kein "als Standard für ähnliche Prompts merken"** — auf Phase 2 verschoben (benötigt Ähnlichkeitsdefinition)
- ❌ **Keine Remote-LLM-API-Calls**
- ❌ **Keine Telemetrie oder Analytics**

---

## 11. Akzeptanzkriterien

### Detection & Classification

- [ ] **AC-01:** Fehlende Informationen werden während der Analyse erkannt (Input: `PromptContextEvaluation`, `BlueprintEvaluation`, `PromptHygiene`)
- [ ] **AC-02:** Erkannte Lücken werden als `REQUIRED`, `RECOMMENDED` oder `OPTIONAL` klassifiziert (gemäß Klassifizierungsregeln in 4.2)
- [ ] **AC-03:** Die `missingInfoClassifier`-Regeln sind als reine Funktion testbar (Input: `MissingInfoItem[]` → Output: `ClassifiedMissingInfo[]`)
- [ ] **AC-04:** Deduplizierung: semantisch identische Lücken aus verschiedenen Quellen werden zusammengeführt

### UI

- [ ] **AC-05:** Das Gate erscheint als **strukturierte Modal-Komponente** (kein Chat-Text, kein Inline-Fließtext)
- [ ] **AC-06:** REQUIRED-Fragen erscheinen zuerst, RECOMMENDED/OPTIONAL unter "Erweiterte Angaben" einklappbar
- [ ] **AC-07:** Jede Frage zeigt eine **Begründung** (`rationale`), warum sie relevant ist
- [ ] **AC-08:** Der Nutzer kann Fragen **beantworten** (Freitext, Select, Boolean, Multi-Select)
- [ ] **AC-09:** Der Nutzer kann einzelne RECOMMENDED/OPTIONAL-Fragen **überspringen**
- [ ] **AC-10:** Der Nutzer kann **"Alle überspringen"** (kein Enrichment, Original-Prompt unverändert)
- [ ] **AC-11:** Der Nutzer kann **"Mit Annahmen fortfahren"** (REQUIRED werden mit `defaultValue` befüllt)
- [ ] **AC-12:** "Fortfahren" ist nur möglich, wenn alle REQUIRED beantwortet sind

### Constraint Preservation

- [ ] **AC-13:** Harte Constraints aus dem Original-Prompt bleiben in der angereicherten Version **unverändert** erhalten
- [ ] **AC-14:** Konflikte zwischen Nutzerantworten und harten Constraints werden **sichtbar gemeldet** (nicht stillschweigend gelöst)
- [ ] **AC-15:** Der **Original-Prompt bleibt unverändert** (keine Mutation)

### Ergebnis

- [ ] **AC-16:** Nach dem Gate-Durchlauf zeigt das Ergebnis: verwendete Antworten, getroffene Annahmen, offene Punkte
- [ ] **AC-17:** Die angereicherte Version wird als `EnrichedPromptContext` im Store abgelegt
- [ ] **AC-18:** Das Gate kann **erneut geöffnet** werden, um Antworten zu ändern

### Integration

- [ ] **AC-19:** Das Gate funktioniert vor **"Prompt optimieren"** (conservative/balanced/aggressive)
- [ ] **AC-20:** Das Gate funktioniert vor **"Blueprint optimieren"** (wenn Blueprint erkannt)
- [ ] **AC-21:** Das Gate funktioniert im **Paste-Flow** (PastePromptAnalyzer)
- [ ] **AC-22:** Die Funktion ist mit #215 **Direction Profiles** kombinierbar (gemeinsames `constraintChecker.ts`)

### Compliance

- [ ] **AC-23:** Das Gate arbeitet **vollständig lokal** — keine externen API-Calls, kein Netzwerk
- [ ] **AC-24:** Nutzerantworten werden **nicht persistiert** über App-Neustarts (Session-Only im Store)
- [ ] **AC-25:** Keine neuen externen npm-Dependencies erforderlich

---

## 12. Teststrategie (Planung — nicht implementieren)

### 12.1 Unit-Tests

| Test-Suite                      | Test-Gegenstand                                         | Key Scenarios                                                                         |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `missingInfoDetector.test.ts`   | `detectGaps(AnalysisOutput) → MissingInfoItem[]`        | Leerer Input, perfekter Score (keine Lücken), alle Risk-Flags present, Deduplizierung |
| `missingInfoClassifier.test.ts` | `classify(MissingInfoItem[]) → ClassifiedMissingInfo[]` | Jeder Tier isoliert, Grenzfälle (mixed), leeres Array                                 |
| `gateContentMerger.test.ts`     | `mergeAnswers(content, answers[]) → enrichedContent`    | Leere Antworten, Default-Werte, Markdown-Format validieren                            |

### 12.2 UI-Komponenten-Tests

| Test-Suite                 | Test-Gegenstand             | Key Scenarios                                                                                                   |
| -------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `MissingInfoGate.test.tsx` | Rendering, User-Interaktion | Alle Input-Typen, REQUIRED blockiert "Fortfahren", Skip-Button, Annahmen-Button, leeres Formular (keine Fragen) |

### 12.3 Integrationstests

| Test-Suite                             | Test-Gegenstand                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `MissingInfoGate.integration.test.tsx` | Kompletter Flow: Analyse → Gate öffnet → Antworten → Enrichment → Optimierung mit enriched Content |
| `MissingInfoGate.constraint.test.tsx`  | Konflikt-Erkennung: Nutzerantwort kollidiert mit Constraint → Warnung erscheint                    |

### 12.4 Regressionstests

| Test                               | Assertion                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Original-Prompt unverändert        | `enrichedContext.originalContent === prompt.content`                                                                                      |
| Optimizer mit leerem Enrichment    | `optimizePrompt(prompt.content, mode)` verhält sich identisch mit und ohne Gate                                                           |
| Bestehende Analyse-Pipeline intakt | Alle existierenden Tests in `promptOptimizer.test.ts`, `promptContextEvaluation.test.ts`, `blueprintDetection.test.ts` laufen unverändert |

### 12.5 Edge Cases (in Tests abdecken)

| Szenario                                       | Erwartetes Verhalten                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Leerer/Whitespace-Prompt                       | Gate generiert keine Fragen; zeigt "Keine Analyse möglich"                                              |
| Prompt mit Score 95+                           | Keine REQUIRED-Fragen; möglicherweise OPTIONAL                                                          |
| Prompt < 50 Zeichen                            | Weniger Fragen; keine Over-Engineering-Fragen                                                           |
| Prompt nur aus Code-Blöcken                    | Detector erkennt `contentLengthWithoutCode ≈ 0` → eingeschränkte Analyse                                |
| Fremdsprachiger Prompt (Französisch)           | Analyse-Pipeline erkennt nur DE/EN → alle Scores niedrig → viele REQUIRED (erwartet, aber dokumentiert) |
| `contamination === BLOCKING_SENSITIVE_CONTENT` | Gate öffnet sich **nie**                                                                                |
| Nutzer ändert Prompt während Gate offen        | Session wird invalidiert, wenn `analyzeSelected` ausgelöst wird                                         |

---

## 13. Abhängigkeiten

### 13.1 Interne Abhängigkeiten

| Abhängigkeit                 | Typ                     | Beschreibung                                                               |
| ---------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| `promptContextEvaluation.ts` | **Data Producer**       | Liefert `PromptContextEvaluation` (missing_elements, risk_flags, criteria) |
| `blueprintDetection.ts`      | **Data Producer**       | Liefert `BlueprintEvaluation` (missing_elements, warnings)                 |
| `promptOptimizer.ts`         | **Downstream Consumer** | Optimiert `enrichedContent` statt `originalContent`                        |
| `blueprintOptimizer.ts`      | **Downstream Consumer** | Gleiches Muster                                                            |
| `appStore.ts`                | **State Management**    | Hält Sessions und enrichedContexts                                         |
| `DetailsPanel.tsx`           | **UI Orchestrator**     | Triggert Gate vor Optimierung                                              |
| `types/index.ts`             | **Type Definitions**    | Neue Typen (siehe Abschnitt 5)                                             |

### 13.2 Externe Abhängigkeiten

| Abhängigkeit | Typ                       | Beschreibung                                                                 |
| ------------ | ------------------------- | ---------------------------------------------------------------------------- |
| ADR-002      | **Architecture Decision** | Definiert Pipeline-Position und Klassifizierungs-Tiers                       |
| Epic #214    | **Parent Epic**           | Definiert den Gesamtrahmen                                                   |
| Issue #215   | **Schwester-Feature**     | Teilt `constraintChecker.ts` (nur relevant für Konflikterkennung in Phase 1) |

### 13.3 Keine neuen externen Dependencies

Das Gate benötigt **keine neuen npm-Packages**. Alle neuen Module sind reines TypeScript ohne externe Imports (außer bestehenden Projekt-Typen).

---

## 14. Offene Fragen (Owner-Entscheidungen vor Implementierung)

| #       | Frage                                                                                       | Relevanz   | Vorschlag                                                                                                       |
| ------- | ------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| **Q1**  | Soll das Gate bei JEDEM Klick auf "Optimieren" automatisch öffnen oder nur beim ersten Mal? | UX         | Nur beim ersten Mal pro Analyse-Lauf; erneutes Öffnen über separaten Button "❓ Fehlende Infos".                |
| **Q2**  | "Als Standard für ähnliche Prompts merken" — Phase 1 oder Phase 2?                          | Scope      | Auf **Phase 2** verschieben (benötigt Ähnlichkeitsdefinition, Persistenz).                                      |
| **Q3**  | Soll `constraintChecker.ts` in Phase 1 gebaut werden oder erst mit #215?                    | Dependency | In **Phase 1** als Standalone-Modul (mit Tests), aber nur mit Basis-Funktionalität. Volle Integration mit #215. |
| **Q4**  | ActionBar-Button "❓ Fehlende Infos prüfen" — in diesem Epic oder separatem Issue?          | Scope      | In **diesem Epic** — Teil von #216.                                                                             |
| **Q5**  | Gate-Session-Caching im Store: pro promptId oder global?                                    | State      | Pro `promptId` (wiederverwendbar bei erneutem Klick auf denselben Prompt).                                      |
| **Q6**  | Soll das Gate auch im Batch-Flow (`analyzeAll`) erscheinen?                                 | UX         | **Nein** — Batch ist nicht-interaktiv. Gate nur bei selektiertem Einzel-Prompt.                                 |
| **Q7**  | Soll der Nutzer Antworten nach dem Gate-Durchlauf editieren können?                         | UX         | **Ja** — Gate erneut öffnen, bestehende Antworten sind vorausgefüllt.                                           |
| **Q8**  | Maximale Fragenanzahl: 5 REQUIRED / 7 RECOMMENDED / 10 OPTIONAL — akzeptabel?               | UX         | Vorschlag zur Diskussion; Werte können nach Usability-Tests angepasst werden.                                   |
| **Q9**  | Sprache der Fragen: immer Deutsch oder abhängig vom Prompt-Inhalt?                          | i18n       | **Immer Deutsch** (Matches die restliche App-UI). Englische Analyse-Felder werden übersetzt.                    |
| **Q10** | Feature-Flag `PROMPTVAULT_MISSING_INFO_GATE` — analog zu Embeddings?                        | Dev        | **Ja** — erlaubt Bypass während Entwicklung und Test.                                                           |

---

## 15. ADR-002 Erweiterungen (vorgeschlagen)

Folgende Sub-Decisions sollten zu ADR-002 in `docs/DECISIONS.md` hinzugefügt werden:

### ADR-002.1: Gate Trigger Logic

Das Gate öffnet sich automatisch nur, wenn mindestens ein REQUIRED-Item existiert und der Prompt nicht `BLOCKING_SENSITIVE_CONTENT` ist.

### ADR-002.2: Answer Merge Format

Nutzerantworten werden als Markdown-Sektion `## Ergänzte Informationen (Missing-Info-Gate)` in den Prompt-Inhalt integriert.

### ADR-002.3: Gate Session Lifecycle

Gate-Sessions sind ephemer (in-memory im Zustand-Store), werden nicht persistiert und werden bei `analyzeSelected()` invalidiert.

### ADR-002.4: Implementation Order (korrigiert)

`directionProfiles → missingInfoDetector → missingInfoClassifier → MissingInfoGate UI → constraintChecker → variantGenerator`. Der `constraintChecker` ist eine Shared Dependency, kein Prerequisite für das Gate.

---

## 16. Risiken

| Risiko                                                                                                     | Impact               | Mitigation                                                                                       |
| ---------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------ |
| **R1: Gate over-triggers** — zu viele REQUIRED-Fragen bei simplen Prompts                                  | UX-Frustration       | Klassifizierungsregeln unterscheiden nach `PromptType`; simple_prompts erzeugen weniger REQUIRED |
| **R2: False negatives** — Detector erkennt echte Lücke nicht                                               | Optimierungsqualität | `risk_flags` dienen als Safety Net (werden immer angezeigt)                                      |
| **R3: State inconsistency** — Prompt extern geändert, Session stale                                        | Datenintegrität      | `analyzeSelected()` invalidiert alle Sessions                                                    |
| **R4: Performance regression** — Detection bei jedem Klick                                                 | Latenz               | Detection ist reines Mapping (< 2ms); Caching im Store                                           |
| **R5: Enriched Content vs. Quality Gate** — `validateOptimizedPromptQuality` erkennt neue Sektion als leer | False Positive       | `isSectionContentEmpty` ignoriert nicht-kanonische Sektionen                                     |
| **R6: Fremdsprachige Prompts** produzieren viele False-Positive-Lücken                                     | Analyse-Qualität     | Bekannte Einschränkung (Analyse-Pipeline ist DE/EN). Kein Scope für #216.                        |

---

## 17. Speckit-Phasen

| Phase                  | Befehl                   | Beschreibung                                                               | Status                     |
| ---------------------- | ------------------------ | -------------------------------------------------------------------------- | -------------------------- |
| ✅ **Specify**         | `/speckit.specify`       | Diese Spezifikation                                                        | Abgeschlossen (2026-07-09) |
| ✅ **Plan**            | `/speckit.plan`          | Implementierungsplan: Module, Komponenten, Store-Änderungen, Reihenfolge   | Abgeschlossen (2026-07-09) |
| ✅ **Tasks**           | `/speckit.tasks`         | Atomare, testbare Tasks in Abhängigkeitsreihenfolge                        | Abgeschlossen (2026-07-09) |
| ✅ **Tasks to Issues** | `/speckit.taskstoissues` | Tasks als GitHub Issues angelegt — #242–#256                               | Abgeschlossen (2026-07-09) |
| ✅ **Implement**       | `/speckit.implement`     | Implementation in 6 Batches (Commits `4e5fedd`–`db0375d`)                  | Abgeschlossen (2026-07-10) |
| ✅ **Accept**          | Dokumentation & Evidence | ADR-002 accepted, ROADMAP updated, spec accepted, evidence report erstellt | Abgeschlossen (2026-07-10) |

### Implementierte Batches

| Batch | Commit    | Datum      | Beschreibung                                                             |
| ----- | --------- | ---------- | ------------------------------------------------------------------------ |
| 1     | `4e5fedd` | 2026-07-09 | Foundation: Types, Feature-Flag, Detector, Classifier, ConstraintChecker |
| 2     | `30ab64f` | 2026-07-09 | Safety / Merge Layer: gateContentMerger + Sanitization                   |
| 3     | `ea0e712` | 2026-07-09 | Store / Session Lifecycle: appStore-Erweiterung, Session-Store-Tests     |
| 4     | `6023b26` | 2026-07-09 | MissingInfoGate UI: Modal-Komponente, Input-Typen, UI-Tests              |
| 5     | `16913a8` | 2026-07-10 | Gate Integration: DetailsPanel, Optimizer-Flow, ActionBar                |
| 6A    | `db0375d` | 2026-07-10 | Integration Tests: Flow, Constraint, Regression                          |

---

## 18. Referenzen

- **Issue #216:** https://github.com/xxammaxx/promptvault-lite/issues/216
- **Epic #214:** https://github.com/xxammaxx/promptvault-lite/issues/214
- **Issue #215:** https://github.com/xxammaxx/promptvault-lite/issues/215
- **ADR-002:** `docs/DECISIONS.md` (Zeilen 31–100)
- **Roadmap:** `docs/ROADMAP.md` (Zeilen 40–55)
- **Architektur:** `docs/ARCHITECTURE.md`
- **Security Policy:** `SECURITY.md`
