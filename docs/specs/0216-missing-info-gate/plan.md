# Plan: Missing-Info-Gate für dynamische Rückfragen im Optimierungsprozess

> **Issue:** [#216](https://github.com/xxammaxx/promptvault-lite/issues/216)
> **Epic:** [#214](https://github.com/xxammaxx/promptvault-lite/issues/214)
> **Spec:** [spec.md](./spec.md)
> **ADR:** ADR-002 in `docs/DECISIONS.md`
> **Speckit Phase:** Plan
> **Status:** Draft
> **Date:** 2026-07-09
> **Author:** Issue Orchestrator (via Speckit Workflow)

---

## 1. Ziel und Nicht-Ziele

### Ziel

Das Missing-Info-Gate als **planbaren, in atomare Tasks zerlegbaren** Implementierungsgegenstand beschreiben. Der Plan definiert:

- Implementierungsreihenfolge mit harten Abhängigkeiten
- Konkrete Datei- und Modulliste (neu + Änderungen)
- Datenfluss und State-Modell
- UI-Integration nach bestehenden Konventionen
- Feature-Flag-Struktur analog Embeddings
- Teststrategie als Pflichtbestandteil späterer Tasks

### Nicht-Ziele

- ❌ **Keine Implementierung** — dieser Plan enthält keinen Produktivcode
- ❌ **Keine Tests schreiben** — Teststrategie wird nur geplant
- ❌ **Keine VariantGenerator-Implementierung** aus #215
- ❌ **Kein Batch-Flow** — Gate nur für selektierten Einzel-Prompt (Q6)
- ❌ **Kein "Als Standard merken"** — Phase 2 (Q2)
- ❌ **Keine eigenen Analyse-Heuristiken** — Gate konsumiert nur existierende Analyse-Daten
- ❌ **Keine Persistenz** von Gate-Antworten über App-Neustarts
- ❌ **Keine Cloud-API oder Remote-LLM-Calls**
- ❌ **Keine GitHub Actions / Remote-CI**

---

## 2. Technische Einordnung

### Pipeline-Position (ADR-002-konform)

```
Prompt-Auswahl / Paste
        │
        ▼
┌───────────────────────────────┐
│  Bestehende Analyse-Pipeline  │  ← unverändert
│  - classifyContent()          │
│  - evaluatePromptContext()    │
│  - evaluateBlueprint()        │
│  - analyzeHygiene()           │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│  MISSING-INFO-GATE (NEU)      │
│                                │
│  ┌─ missingInfoDetector ────┐ │  ← Mapping: Analyse → MissingInfoItem[]
│  └──────────────────────────┘ │
│               │                │
│  ┌─ missingInfoClassifier ──┐ │  ← Klassifizierung: REQUIRED/RECOMMENDED/OPTIONAL
│  └──────────────────────────┘ │
│               │                │
│  ┌─ MissingInfoGate UI ─────┐ │  ← Modal: max. 5 sichtbare Fragen
│  └──────────────────────────┘ │
│               │                │
│  ┌─ gateContentMerger ──────┐ │  ← Sanitization + Markdown-Merge
│  └──────────────────────────┘ │
│               │                │
│  ┌─ constraintChecker ──────┐ │  ← Basis in Phase 1, voll mit #215
│  └──────────────────────────┘ │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│  Transformation (bestehend)   │  ← unverändert
│  - optimizePrompt()           │
│  - optimizeBlueprint()        │
│  - variantGenerator() (#215)  │
└───────────────────────────────┘
```

### Architekturprinzipien

| Prinzip                               | Umsetzung                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| **Kein Eingriff in Analyse-Pipeline** | Detector konsumiert NUR Analyse-Output, analysiert nicht selbst                    |
| **Original-Prompt unverändert**       | Enrichment erzeugt NEUEN String `enrichedContent`; `originalContent` ist read-only |
| **Session-Only**                      | Antworten nur in-memory im Zustand-Store; keine localStorage/SQLite-Persistenz     |
| **Sanitization vor Merge**            | Alle Nutzerantworten werden vor dem Mergen sanitized (kein Markdown-Injection)     |
| **Feature-Flag-gated**                | `PROMPTVAULT_MISSING_INFO_GATE=1` aktiviert; Default: deaktiviert                  |
| **Deterministisch / Lokal**           | Alle Module sind reines TypeScript, keine Netzwerk-Calls                           |
| **Keine neuen npm-Dependencies**      | Nutzt nur existierende Projekt-Imports                                             |

### Sanitization-Regeln

Vor dem Mergen von Nutzerantworten in den Prompt-Inhalt:

1. **Strip Markdown-Headings** (`#`, `##`, `###`) — verhindert Section-Injection
2. **Strip HTML-Tags** (`<script>`, `<img>`, etc.) — XSS-Prävention
3. **Escape Backticks** — verhindert Code-Block-Injection
4. **Trim Whitespace** an Anfang und Ende
5. **Maximale Länge pro Antwort:** 5000 Zeichen

---

## 3. Implementierungsreihenfolge

Die Reihenfolge ist durch harte Abhängigkeiten bestimmt. Jede Stufe baut auf der vorherigen auf.

```
Stufe 1: Types / Datenmodell
  │
  ├──▶ Stufe 2: Feature-Flag
  │
  ├──▶ Stufe 3: missingInfoDetector
  │      │
  │      └──▶ Stufe 4: missingInfoClassifier
  │             │
  │             ├──▶ Stufe 5: constraintChecker (Basis)
  │             │
  │             ├──▶ Stufe 6: gateContentMerger + Sanitization
  │             │
  │             └──▶ Stufe 7: MissingInfoGate UI-Komponente
  │                    │
  │                    ├──▶ Stufe 8: Store-Integration
  │                    │
  │                    ├──▶ Stufe 9: DetailsPanel-Integration + ActionBar-Button
  │                    │
  │                    └──▶ Stufe 10: OptimizationPanel-/BlueprintOptimizationPanel-Integration
  │
  └──▶ Stufe 11: Tests (Unit, UI, Integration)
         │
         └──▶ Stufe 12: Dokumentation / Evidence
```

### Abhängigkeitsgraph (Details)

| Stufe | Modul                            | Abhängigkeiten                                    | Kann parallel zu            |
| ----- | -------------------------------- | ------------------------------------------------- | --------------------------- |
| 1     | `types/index.ts`                 | keine                                             | —                           |
| 2     | `featureFlag.ts`                 | keine (nur `types` für Typ-Referenz)              | Stufe 3 (wenn Typen stabil) |
| 3     | `missingInfoDetector.ts`         | `types`, `promptContextEvaluation.ts` (read-only) | Stufe 2                     |
| 4     | `missingInfoClassifier.ts`       | `types`, `missingInfoDetector.ts`                 | —                           |
| 5     | `constraintChecker.ts`           | `types`                                           | Stufe 6                     |
| 6     | `gateContentMerger.ts`           | `types`                                           | Stufe 5                     |
| 7     | `MissingInfoGate.tsx`            | `types`, `missingInfoClassifier.ts`               | —                           |
| 8     | `appStore.ts` (Erweiterung)      | `types`                                           | —                           |
| 9     | `DetailsPanel.tsx` / `ActionBar` | `appStore`, `MissingInfoGate.tsx`                 | —                           |
| 10    | `OptimizationPanel`-Integration  | `appStore`                                        | —                           |
| 11    | Tests                            | alle vorherigen                                   | —                           |
| 12    | Dokumentation                    | alle vorherigen                                   | —                           |

---

## 4. Modul- und Dateiplan

### 4.1 Neue Dateien

| Datei                                      | Typ        | Beschreibung                                                      | Größen-Schätzung |
| ------------------------------------------ | ---------- | ----------------------------------------------------------------- | ---------------- |
| `src/lib/missingInfoFeatureFlag.ts`        | Modul      | Feature-Flag, analog `embeddings/featureFlag.ts`                  | ~45 Zeilen       |
| `src/lib/missingInfoDetector.ts`           | Modul      | Transformiert Analyse-Output in `MissingInfoItem[]`; dedupliziert | ~200 Zeilen      |
| `src/lib/missingInfoClassifier.ts`         | Modul      | Weist Tiers zu gemäß Klassifizierungsregeln                       | ~120 Zeilen      |
| `src/lib/constraintChecker.ts`             | Modul      | Basis: Extraktion harter Constraints aus Prompt-Text              | ~180 Zeilen      |
| `src/lib/gateContentMerger.ts`             | Modul      | Sanitization + Markdown-Merge der Antworten                       | ~100 Zeilen      |
| `src/components/gates/MissingInfoGate.tsx` | Komponente | Modal-Formular; max. 5 sichtbare Fragen + "Erweiterte Angaben"    | ~350 Zeilen      |
| `src/components/gates/MissingInfoGate.css` | Styles     | Gate-spezifische Styles (analog `OptimizationPanel`-CSS)          | ~80 Zeilen       |

### 4.2 Zu ändernde Dateien

| Datei                                     | Änderung                                                                                                                                                                                                                                                                                                               | Betroffene Zeilen               |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `src/types/index.ts`                      | Neue Interfaces: `MissingInfoItem`, `MissingInfoInputType`, `MissingInfoCategory`, `ClassifiedMissingInfo`, `MissingInfoAnswer`, `GateSessionStatus`, `GateOutcome`, `MissingInfoSession`, `EnrichedPromptContext`, `HardConstraint`, `ConstraintConflict`, `ConstraintConflictResolution`, `ConflictResolutionOption` | +150 Zeilen (am Ende der Datei) |
| `src/stores/appStore.ts`                  | Neue State-Felder: `missingInfoSessions`, `enrichedContexts`, `isGateOpen`, `activeGatePromptId`. Neue Actions: `openGate`, `closeGate`, `answerGateItem`, `completeGate`, `discardGateSession`. Invalidierung in `analyzeSelected()`.                                                                                 | +120 Zeilen                     |
| `src/components/details/DetailsPanel.tsx` | ActionBar: neuer Prop `onMissingInfoGate`. Gate-Trigger vor Optimierung. Neuer `showMissingInfoGate` State.                                                                                                                                                                                                            | +40 Zeilen                      |
| `src/App.tsx`                             | Keine Änderungen nötig (Gate wird innerhalb DetailsPanel orchestriert).                                                                                                                                                                                                                                                | 0 Zeilen                        |

### 4.3 Tests (später zu erstellen)

| Testdatei                                                             | Typ         | Test-Gegenstand                                                                     |
| --------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `src/lib/__tests__/missingInfoFeatureFlag.test.ts`                    | Unit        | Feature-Flag: on/off/default                                                        |
| `src/lib/__tests__/missingInfoDetector.test.ts`                       | Unit        | `detectGaps()` — alle Input-Varianten, Deduplizierung, Edge Cases                   |
| `src/lib/__tests__/missingInfoClassifier.test.ts`                     | Unit        | `classify()` — alle Tiers, Mapping-Regeln                                           |
| `src/lib/__tests__/constraintChecker.test.ts`                         | Unit        | Constraint-Extraktion, Konflikt-Erkennung                                           |
| `src/lib/__tests__/gateContentMerger.test.ts`                         | Unit        | Sanitization, Markdown-Merge, Injection-Prävention                                  |
| `src/stores/__tests__/appStore.missingInfoGate.test.ts`               | Store       | Session pro promptId, Invalidierung, Status-Transitions                             |
| `src/components/gates/__tests__/MissingInfoGate.test.tsx`             | UI          | Rendering, alle Input-Typen, max. 5 sichtbare Fragen, Buttons, "Erweiterte Angaben" |
| `src/components/gates/__tests__/MissingInfoGate.integration.test.tsx` | Integration | Analyse → Gate → Antworten → Enrichment → Optimierung                               |
| `src/components/gates/__tests__/MissingInfoGate.constraint.test.tsx`  | Integration | Konflikt: Antwort vs. Constraint                                                    |

### 4.4 Dokumentation (später zu aktualisieren)

| Datei                                       | Änderung                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `docs/DECISIONS.md`                         | ADR-002.1–002.4 ergänzen (Gate Trigger, Merge Format, Session Lifecycle, korrigierte Reihenfolge) |
| `docs/ROADMAP.md`                           | #216 Status von "Specification" auf "In Progress"                                                 |
| `docs/specs/0216-missing-info-gate/spec.md` | Status von "Draft" auf "Accepted" nach Owner-Review                                               |

---

## 5. Datenfluss

```
┌──────────┐
│  Prompt  │  prompt.content (string, unverändert)
└────┬─────┘
     │
     ▼
┌──────────────────────────────────────────────────┐
│  analyzeSelected()  (appStore.ts)                 │
│                                                    │
│  evaluatePrompt()       → evaluations[promptId]    │
│  analyzeHygiene()       → hygiene[promptId]        │
│  evaluatePromptContext()→ contextEvaluations[...]  │
│  classifyContent()      → blueprintDetections[...] │
│  [evaluateBlueprint()]  → blueprintEvaluations[...]│
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  missingInfoDetector.detectGaps(input)            │
│                                                    │
│  Input: AnalysisOutput {                          │
│    contextEval: PromptContextEvaluation            │
│    hygiene: PromptHygiene                          │
│    blueprintEval?: BlueprintEvaluation             │
│  }                                                 │
│                                                    │
│  Liest:                                            │
│  - contextEval.missing_elements[]                  │
│  - contextEval.risk_flags[]                        │
│  - contextEval.criteria[] (score === 0)            │
│  - contextEval.suggested_improvements[]            │
│  - blueprintEval.missing_elements[]                │
│  - hygiene.hygiene_score < 50                      │
│                                                    │
│  Output: MissingInfoItem[]                         │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  missingInfoClassifier.classify(items)            │
│                                                    │
│  Input: MissingInfoItem[]                          │
│  Output: ClassifiedMissingInfo[]                   │
│    (items + tier + classificationReason)           │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  Store: MissingInfoSession                        │
│                                                    │
│  sessions[promptId] = {                           │
│    sessionId, promptId, startedAt,                 │
│    items: ClassifiedMissingInfo[],                 │
│    answers: Record<itemId, MissingInfoAnswer>,     │
│    status: "ACTIVE",                               │
│    outcome: null,                                  │
│    enrichedContent: null                           │
│  }                                                 │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  MissingInfoGate UI (Modal)                       │
│                                                    │
│  Zeigt:                                            │
│  - REQUIRED-Fragen (max. 5 sichtbar)              │
│  - "Erweiterte Angaben" (RECOMMENDED + OPTIONAL)  │
│                                                    │
│  Nutzer interagiert:                               │
│  - Antworten werden in session.answers gespeichert │
│  - "Fortfahren" → outcome = "COMPLETED"            │
│  - "Alle überspringen" → outcome = "SKIPPED"       │
│  - "Mit Annahmen fortfahren" → "ASSUMPTIONS"       │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  gateContentMerger.merge(content, answers)        │
│                                                    │
│  1. Sanitize jede Antwort (5 Regeln)              │
│  2. Generiere Markdown-Sektion:                   │
│     ## Ergänzte Informationen (Missing-Info-Gate) │
│     - **Frage 1:** Antwort 1                      │
│     - **Frage 2:** Antwort 2                      │
│  3. Konkateniere: originalContent + Sektion        │
│                                                    │
│  Output: enrichedContent: string                   │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  EnrichedPromptContext im Store                   │
│                                                    │
│  enrichedContexts[promptId] = {                   │
│    originalContent,                                │
│    enrichedContent,                                │
│    answers: MissingInfoAnswer[],                   │
│    gateOutcome,                                    │
│    sessionId,                                      │
│    enrichedAt                                      │
│  }                                                 │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  Downstream-Consumer                              │
│                                                    │
│  optimizePrompt(enrichedContent, mode)            │
│  optimizeBlueprint(enrichedContent, mode)          │
│  variantGenerator(enrichedContent, profile) (#215) │
└──────────────────────────────────────────────────┘
```

### Datenfluss — Überspringen / Keine Fragen

```
Gate detektiert 0 REQUIRED-Items?
  │
  ├── JA → Gate öffnet sich NICHT automatisch
  │         ActionBar-Button "❓ Fehlende Infos prüfen" verfügbar
  │
  └── NEIN → Gate öffnet sich automatisch nach analyzeSelected()
              (nur beim ersten Mal pro Analyse-Lauf, Q1)

Gate-Session existiert bereits (COMPLETED / SKIPPED / ASSUMPTIONS)?
  │
  ├── JA → Gate NICHT erneut öffnen
  │         Nutzer kann über ActionBar-Button Antworten editieren (Q7)
  │
  └── NEIN → Neue Session starten

contamination_status === "BLOCKING_SENSITIVE_CONTENT"?
  │
  └── JA → Gate NIEMALS öffnen (Security Boundary)
```

---

## 6. State-Modell

### 6.1 Store-Erweiterung (appStore.ts)

```typescript
// === Neue Imports (in appStore.ts) ===
import type {
  MissingInfoSession,
  MissingInfoAnswer,
  EnrichedPromptContext,
  GateOutcome,
  ClassifiedMissingInfo,
} from "@/types";

// === Neue State-Felder (in AppState Interface) ===

/** Missing-Info-Gate Sessions pro promptId. */
missingInfoSessions: Record<string, MissingInfoSession>;

/** Angereicherte Prompt-Kontexte pro promptId. */
enrichedContexts: Record<string, EnrichedPromptContext>;

/** Ob das Gate-Modal aktuell geöffnet ist. */
isGateOpen: boolean;

/** ID des Prompts, für den das Gate aktuell geöffnet ist. */
activeGatePromptId: string | null;

// === Neue Actions ===

/** Öffnet das Gate für eine promptId. Detektiert Lücken und klassifiziert. */
openGate: (promptId: string) => void;

/** Schließt das Gate-Modal (CANCELLED). Session bleibt im Store. */
closeGate: () => void;

/** Speichert eine Antwort im Session-Store. */
answerGateItem: (promptId: string, answer: MissingInfoAnswer) => void;

/** Schließt das Gate ab: merged Antworten, erzeugt EnrichedPromptContext. */
completeGate: (promptId: string, outcome: GateOutcome) => void;

/** Verwirft die Session für eine promptId (z.B. bei Prompt-Wechsel). */
discardGateSession: (promptId: string) => void;
```

### 6.2 Initialwerte

```typescript
// In create<AppState>():
missingInfoSessions: {},
enrichedContexts: {},
isGateOpen: false,
activeGatePromptId: null,
```

### 6.3 Session-Lifecycle

```
                     ┌─────────┐
                     │  (keine  │
                     │ Session) │
                     └────┬─────┘
                          │ openGate(promptId)
                          ▼
                     ┌─────────┐
                     │ ACTIVE  │◄──────── Antworten editieren (Q7)
                     └────┬─────┘
          ┌───────────────┼──────────────────┐
          │               │                  │
          ▼               ▼                  ▼
    ┌──────────┐   ┌──────────┐      ┌───────────┐
    │COMPLETED │   │ SKIPPED  │      │ASSUMPTIONS│
    └──────────┘   └──────────┘      └───────────┘
          │               │                  │
          └───────────────┴──────────────────┘
                          │
                          │ analyzeSelected() triggert discardGateSession()
                          ▼
                     ┌─────────┐
                     │  (keine  │
                     │ Session) │
                     └─────────┘

    closeGate() → CANCELLED (Session bleibt, Modal schließt)
```

### 6.4 Invalidierungsregeln

| Trigger                                           | Aktion                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `analyzeSelected()` wird ausgeführt               | `discardGateSession(promptId)` — alte Session verwerfen, neue Analyse-Ergebnisse                                                    |
| Nutzer wechselt Prompt (neuer `selectedPromptId`) | `closeGate()` — Modal schließen, Session des alten Prompts bleibt im Store                                                          |
| `batchClassifyBlueprints()` läuft                 | **Keine** Invalidierung — Gate betrifft nur selektierten Einzel-Prompt (Q6)                                                         |
| File-Watcher erkennt externe Änderung             | `scanFolder` läuft, aber `analyzeSelected` wird nicht automatisch getriggert → Session bleibt gültig, bis Nutzer manuell analysiert |

### 6.5 Antworten editierbar (Q7)

```typescript
// openGate() prüft, ob bereits eine Session existiert:
if (state.missingInfoSessions[promptId]) {
  // Session existiert → vorausgefüllte Antworten anzeigen
  set({
    isGateOpen: true,
    activeGatePromptId: promptId,
  });
  return; // Keine erneute Detection/Classification
}
```

---

## 7. UI-Plan

### 7.1 Komponente: MissingInfoGate

**Typ:** Modal (analog `OptimizationPanel.tsx` / `BlueprintOptimizationPanel.tsx`)

**Pfad:** `src/components/gates/MissingInfoGate.tsx`

**Props:**

```typescript
interface MissingInfoGateProps {
  promptId: string;
  onClose: () => void;
  onComplete: (outcome: GateOutcome) => void;
}
```

**Zustand aus Store:**

```typescript
const session = useAppStore((s) => s.missingInfoSessions[promptId]);
const enrichedContext = useAppStore((s) => s.enrichedContexts[promptId]);
```

### 7.2 Layout (konform mit bestehenden UI-Konventionen)

```
┌──────────────────────────────────────────────────────┐
│  ❓ Fehlende Informationen                        ✕   │
│                                                        │
│  ⚠️ 2 Fragen müssen beantwortet werden               │
│  ──────────────────────────────────────────────────   │
│                                                        │
│  ┌─ Frage 1: [REQUIRED] ──────────────────────────┐  │
│  │ Zieldefinition                                  │  │
│  │ ℹ️ Ohne klares Ziel kann die Optimierung keine  │  │
│  │    passende Ausrichtung wählen.                 │  │
│  │ ┌──────────────────────────────────────────────┐│  │
│  │ │ [_____________________________]  placeholder ││  │
│  │ └──────────────────────────────────────────────┘│  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─ Frage 2: [REQUIRED] ──────────────────────────┐  │
│  │ Ausgabeformat                                   │  │
│  │ ℹ️ Bestimmt die Struktur des optimierten        │  │
│  │    Prompts.                                     │  │
│  │ ┌──────────────────────────────────────────────┐│  │
│  │ │ [Dropdown: Fließtext ▼]                      ││  │
│  │ └──────────────────────────────────────────────┘│  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ═══════ Erweiterte Angaben (4 Fragen) ═══════ [+ Ausklappen]
│  ┌─────────────────────────────────────────────────┐  │
│  │ (eingeklappt — RECOMMENDED + OPTIONAL Fragen)   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ──────────────────────────────────────────────────   │
│                                                        │
│  [▶ Fortfahren]  [⏭ Alle überspringen]               │
│  [🤖 Mit Annahmen fortfahren]                         │
└──────────────────────────────────────────────────────┘
```

### 7.3 UI-Zustände

| Zustand               | Darstellung                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| **Keine Fragen**      | "Keine fehlenden Informationen erkannt. Der Prompt ist vollständig." + [Schließen]             |
| **Nur OPTIONAL**      | Gate öffnet sich nicht automatisch; manuell über ActionBar: "Erweiterte Angaben verfügbar"     |
| **1–5 REQUIRED**      | REQUIRED sichtbar, RECOMMENDED/OPTIONAL eingeklappt                                            |
| **> 5 REQUIRED**      | Nur die ersten 5 REQUIRED sichtbar; Rest unter "Weitere erforderliche Angaben (X)" einklappbar |
| **Session existiert** | Antworten vorausgefüllt; Button "Antworten aktualisieren" statt "Fortfahren"                   |

### 7.4 ActionBar-Button (Q4)

```
[ ☆ ]  [ 📋 Kopieren ]  [ 📂 Öffnen ]  [ ✨ Optimieren ]  [ 🔄 Analysieren ]  [ 🔷 BP optimieren ]

                                                                    ┌── NEU ──┐
                                                                    │ ❓ Fehlende Infos prüfen │
                                                                    └──────────┘
```

```typescript
// In ActionBar-Props:
export const ActionBar: React.FC<{
  onOptimize?: () => void;
  onBlueprintOptimize?: () => void;
  onMissingInfoGate?: () => void;   // ← NEU
}> = ({ onOptimize, onBlueprintOptimize, onMissingInfoGate }) => {
  // ...
  const hasRequiredItems = useAppStore((s) => {
    const session = s.missingInfoSessions[prompt.id];
    if (!session) return false;
    return session.items.some((item) => item.tier === "REQUIRED");
  });

  // Button-Label dynamisch:
  const gateLabel = hasRequiredItems
    ? `❓ ${requiredCount} fehlende Infos`
    : "❓ Fehlende Infos prüfen";
```

### 7.5 Integration in DetailsPanel

```typescript
// DetailsPanel.tsx — neue State-Variable:
const [showMissingInfoGate, setShowMissingInfoGate] = useState(false);

// handleOpenOptimizer — ERWEITERT:
const handleOpenOptimizer = useCallback(() => {
  if (!prompt) return;

  // Check: Gate-Session existiert für diesen Prompt?
  const session = useAppStore.getState().missingInfoSessions[prompt.id];
  const hasRequired = session?.items.some(
    (item) => item.tier === "REQUIRED"
  );

  if (hasRequired && session?.status === "ACTIVE") {
    // Gate öffnen statt Optimizer
    setShowMissingInfoGate(true);
  } else if (!session && hasRequired) {
    // Erstanalyse: Gate automatisch öffnen (Q1)
    openGate(prompt.id);
    setShowMissingInfoGate(true);
  } else {
    // Keine REQUIRED → direkt optimieren
    setShowOptimizer(true);
  }
}, [prompt]);

// Rendering:
{showMissingInfoGate && (
  <MissingInfoGate
    promptId={prompt.id}
    onClose={() => setShowMissingInfoGate(false)}
    onComplete={(outcome) => {
      setShowMissingInfoGate(false);
      if (outcome === "COMPLETED" || outcome === "ASSUMPTIONS") {
        setShowOptimizer(true); // Weiter zum Optimizer
      }
    }}
  />
)}
```

---

## 8. Feature-Flag-Plan

### 8.1 Name

`PROMPTVAULT_MISSING_INFO_GATE`

### 8.2 Struktur (analog `embeddings/featureFlag.ts`)

```typescript
// src/lib/missingInfoFeatureFlag.ts

const MISSING_INFO_GATE_ENV_VAR = "PROMPTVAULT_MISSING_INFO_GATE";
const ENABLED_VALUES = new Set<string>(["1", "true"]);

export function isMissingInfoGateEnabled(
  env?: Record<string, string | undefined>,
): boolean {
  if (!env) return false;
  const raw = env[MISSING_INFO_GATE_ENV_VAR];
  if (raw === undefined) return false;
  return ENABLED_VALUES.has(raw);
}
```

### 8.3 Default-Zustand

**Disabled** (Default: `false`). Das Gate ist während der Entwicklung und bis zum Abschluss der Testphase standardmäßig deaktiviert. Aktivierung nur über explizite Umgebungsvariable.

### 8.4 Nutzung in Komponenten

```typescript
// In DetailsPanel.tsx:
import { isMissingInfoGateEnabled } from "@/lib/missingInfoFeatureFlag";

const gateEnabled = isMissingInfoGateEnabled(
  (typeof process !== "undefined" ? process.env : undefined) as
    | Record<string, string | undefined>
    | undefined,
);

// Wenn Feature-Flag aus:
if (!gateEnabled) {
  // Kein Gate-Trigger, kein ActionBar-Button
  setShowOptimizer(true); // direkt zum Optimizer
  return;
}
```

### 8.5 Test

```typescript
// src/lib/__tests__/missingInfoFeatureFlag.test.ts
// Analog zu embeddings/__tests__/featureFlag.test.ts:
// - returns false by default
// - returns false for "0", "false", "", undefined
// - returns true for "1", "true"
// - is a pure function (no side effects)
```

---

## 9. Testplan

### 9.1 Unit-Tests

| #      | Test-Suite                       | Test-Gegenstand                                               | Geschätzte Test Cases |
| ------ | -------------------------------- | ------------------------------------------------------------- | --------------------- |
| **T1** | `missingInfoFeatureFlag.test.ts` | `isMissingInfoGateEnabled()` — alle Werte                     | 12                    |
| **T2** | `missingInfoDetector.test.ts`    | `detectGaps()` — Input-Varianten, Deduplizierung, Edge Cases  | 15                    |
| **T3** | `missingInfoClassifier.test.ts`  | `classify()` — alle Tiers, Mapping-Regeln                     | 12                    |
| **T4** | `constraintChecker.test.ts`      | Constraint-Extraktion, Konflikt-Erkennung                     | 10                    |
| **T5** | `gateContentMerger.test.ts`      | Sanitization (5 Regeln), Markdown-Merge, Injection-Prävention | 10                    |

### 9.2 Store-Tests

| #      | Test-Suite                         | Test-Gegenstand                                      | Geschätzte Test Cases |
| ------ | ---------------------------------- | ---------------------------------------------------- | --------------------- |
| **T6** | `appStore.missingInfoGate.test.ts` | Session-Lifecycle, Invalidierung, Status-Transitions | 8                     |

### 9.3 UI-Komponenten-Tests

| #      | Test-Suite                 | Test-Gegenstand                                                                                                                | Geschätzte Test Cases |
| ------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| **T7** | `MissingInfoGate.test.tsx` | Rendering aller Input-Typen, max. 5 sichtbare Fragen, "Fortfahren" disabled wenn REQUIRED offen, Buttons, "Erweiterte Angaben" | 15                    |

### 9.4 Integrationstests

| #      | Test-Suite                             | Test-Gegenstand                                              |
| ------ | -------------------------------------- | ------------------------------------------------------------ |
| **T8** | `MissingInfoGate.integration.test.tsx` | Analyse → Gate öffnet → Antworten → Enrichment → Optimierung |
| **T9** | `MissingInfoGate.constraint.test.tsx`  | Konflikt: Nutzer-Antwort kollidiert mit Constraint           |

### 9.5 Regressionstests

| Test                        | Assertion                                                       |
| --------------------------- | --------------------------------------------------------------- |
| Original-Prompt unverändert | `enrichedContext.originalContent === prompt.content`            |
| Optimizer ohne Gate         | `optimizePrompt(content, mode)` identisch mit/ohne Feature-Flag |
| Bestehende Tests intakt     | Alle existierenden Tests laufen unverändert durch               |

### 9.6 Edge Cases (in Tests abdecken)

| Szenario                                    | Erwartetes Verhalten                          | Test-Case |
| ------------------------------------------- | --------------------------------------------- | --------- |
| Leerer/Whitespace-Prompt                    | Keine Fragen generiert                        | T2        |
| `BLOCKING_SENSITIVE_CONTENT`                | Gate öffnet sich nie                          | T2, T6    |
| Score 95+ Prompt                            | Keine REQUIRED-Fragen                         | T2, T3    |
| Prompt < 50 Zeichen                         | Weniger Fragen                                | T2        |
| Fremdsprachiger Prompt                      | Viele REQUIRED (erwartet)                     | T2        |
| Alle Input-Typen rendern korrekt            | `free_text`, `single_select`, `boolean`, etc. | T7        |
| REQUIRED blockiert "Fortfahren"             | Button disabled                               | T7        |
| "Alle überspringen" setzt outcome="SKIPPED" | Kein Enrichment                               | T6        |
| "Mit Annahmen fortfahren" füllt Defaults    | outcome="ASSUMPTIONS"                         | T6        |
| Sanitization: `# ` wird gestrippt           | Markdown-Injection verhindert                 | T5        |
| Sanitization: `<script>` wird gestrippt     | XSS verhindert                                | T5        |

---

## 10. Risiken und Mitigations

| #      | Risiko                                                                                                                        | Impact                               | Eintrittswahrsch. | Mitigation                                                                                                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1** | **Gate over-triggers** — zu viele REQUIRED-Fragen bei simplen Prompts                                                         | UX-Frustration, "Skip All"-Reflex    | MEDIUM            | Klassifizierungsregeln unterscheiden nach `PromptType`; simple_prompts erzeugen weniger REQUIRED (nur critical/high risk_flags). Max. 5 sichtbare Fragen.                                   |
| **R2** | **Frageflut** — Klassifizierung produziert > 5 REQUIRED                                                                       | Nutzer wird überfordert              | LOW               | Hard Limit: nur 5 REQUIRED sichtbar; Rest unter "Weitere erforderliche Angaben". Max. Gesamtfragen: 5 + 7 + 10.                                                                             |
| **R3** | **Constraint-Verlust** — Optimierung entfernt Constraints im enrichedContent                                                  | Sicherheitsverletzung                | LOW               | `gateContentMerger` merged NUR unterhalb des Original-Prompts als neue Sektion. Original-Prompt wird nicht verändert. Bestehender `validateOptimizedPromptQuality`-Check läuft unverändert. |
| **R4** | **State-Inkonsistenz** — Prompt extern geändert, Session stale                                                                | Falsche/Fragwürdige Enrichment-Daten | LOW               | `analyzeSelected()` invalidiert Session. File-Watcher triggert `scanFolder`, aber ohne automatische Invalidierung (Nutzer muss manuell analysieren).                                        |
| **R5** | **Sanitization-Lücke** — Nutzer injiziert Markdown/HTML in Antwort                                                            | XSS, Prompt-Manipulation             | LOW               | 5 Sanitization-Regeln greifen vor Merge. Unit-Tests (T5) decken Injection-Vektoren ab.                                                                                                      |
| **R6** | **Scope-Creep zu #215** — constraintChecker wird zu komplex für Phase 1                                                       | Verzögerung von #216                 | MEDIUM            | constraintChecker in Phase 1 NUR Basis (Constraint-Extraktion). Keine Direction-Profile-Logik. Volle Integration in #215.                                                                   |
| **R7** | **Feature-Flag deaktiviert in Produktion** — Gate unsichtbar                                                                  | Feature wird nicht entdeckt          | LOW               | Dokumentation in Release Notes. Default: disabled. Aktivierung über Umgebungsvariable dokumentiert.                                                                                         |
| **R8** | **EnrichedContent vs. Quality Gate** — `validateOptimizedPromptQuality` flagged `## Ergänzte Informationen` als leere Sektion | False Positive                       | LOW               | `isSectionContentEmpty` ignoriert nicht-kanonische Sektionen (nur canonical sections werden geprüft). Trotzdem: Regressionstest in T8.                                                      |

---

## 11. Abhängigkeiten zu #215 (Varianten erzeugen)

### 11.1 Was #216 liefert

| Artefakt                       | Beschreibung                                             | Nutzung durch #215                                                                   |
| ------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `MissingInfoSession`           | Strukturierte Nutzerantworten auf fehlende Informationen | #215 nutzt `answers` für kontextbewusste Variantengenerierung                        |
| `EnrichedPromptContext`        | Angereicherter Prompt-Inhalt mit Antworten als Markdown  | #215 nutzt `enrichedContent` als Input für `variantGenerator()`                      |
| `constraintChecker.ts` (Basis) | Extraktion harter Constraints aus Prompt-Text            | #215 erweitert um Direction-Profile-Konfliktprüfung                                  |
| `MissingInfoGate.tsx`          | UI-Komponente                                            | #215 kann Gate ERNEUT öffnen, wenn Varianten-Generierung zusätzliche Fragen aufwirft |

### 11.2 Was #216 NICHT liefert

- ❌ Direction Profiles (`directionProfiles.ts`)
- ❌ VariantGenerator (`variantGenerator.ts`)
- ❌ VariantPanel (`VariantPanel.tsx`)
- ❌ ActionBar-Button "🔄 Varianten erzeugen"
- ❌ Direction-Profile-Konfliktprüfung in `constraintChecker.ts`

### 11.3 Gemeinsame Module

| Modul                  | Phase 1 (#216)                                                                   | Phase 2 (#215)                                                                 |
| ---------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `constraintChecker.ts` | **Basis:** Extraktion harter Constraints aus Prompt-Text + Basis-Konfliktprüfung | **Voll:** Direction-Profile-Kompatibilitätsmatrix, Profile-Konflikt-Resolution |
| `types/index.ts`       | `HardConstraint`, `ConstraintConflict`, `ConflictResolution`                     | `DirectionProfile`, `DirectionVariant`                                         |
| `appStore.ts`          | `missingInfoSessions`, `enrichedContexts`                                        | `variantResults`, `activeDirectionProfile`                                     |
| `DetailsPanel.tsx`     | `onMissingInfoGate`-Prop                                                         | `onGenerateVariants`-Prop                                                      |

---

## 12. Plan-Abschluss

### 12.1 Zusammenfassung

| Kriterium                       | Wert                                                  |
| ------------------------------- | ----------------------------------------------------- |
| **Neue Dateien**                | 7 (1 Flag + 5 Module + 1 Komponente + 1 CSS)          |
| **Geänderte Dateien**           | 3 (types, appStore, DetailsPanel)                     |
| **Tests (geplant)**             | 9 Test-Suiten, ~100 Test Cases                        |
| **Keine neuen Dependencies**    | ✅ Bestätigt                                          |
| **Feature-Flag**                | `PROMPTVAULT_MISSING_INFO_GATE` (disabled by default) |
| **Implementierungsstufen**      | 12 (sequenziell, 3 parallelisierbar)                  |
| **Geschätzte Codezeilen (neu)** | ~1100 Zeilen (Module + Komponente)                    |

### 12.2 Nächste Phase

**Speckit Phase: Tasks** (`/speckit.tasks`)

Die 12 Stufen in atomare, testbare Tasks zerlegen, geordnet nach Abhängigkeiten. Jeder Task erhält:

- Eindeutige ID
- Beschreibung
- Abhängigkeiten
- Akzeptanzkriterium
- Geschätzte Komplexität

### 12.3 Owner-Entscheidungen (dokumentiert)

| ID  | Entscheidung                              | Status        |
| --- | ----------------------------------------- | ------------- |
| Q1  | Gate nur beim ersten Mal pro Analyse-Lauf | ✅ Akzeptiert |
| Q2  | "Als Standard merken" → Phase 2           | ✅ Akzeptiert |
| Q3  | constraintChecker Basis in Phase 1        | ✅ Akzeptiert |
| Q4  | ActionBar-Button: Ja                      | ✅ Akzeptiert |
| Q5  | Session pro promptId                      | ✅ Akzeptiert |
| Q6  | Kein Batch-Flow                           | ✅ Akzeptiert |
| Q7  | Antworten editierbar                      | ✅ Akzeptiert |
| Q8  | Max. 5 sichtbare Fragen                   | ✅ Akzeptiert |
| Q9  | Sprache: Deutsch                          | ✅ Akzeptiert |
| Q10 | Feature-Flag: Ja                          | ✅ Akzeptiert |

### 12.4 P0-Compliance-Auflagen (erfüllt im Plan)

| Auflage                                      | Umsetzung im Plan                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| Session-only Lifecycle                       | Abschnitt 6.3: Session in-memory, Invalidierung in `analyzeSelected()`      |
| Sanitization vor Merge                       | Abschnitt 2: 5 Sanitization-Regeln; T5: Unit-Tests für Injection-Prävention |
| Max. 5 sichtbare Fragen, Rest einklappbar    | Abschnitt 7.3: UI-Zustände dokumentiert; "Weitere erforderliche Angaben"    |
| Constraint-Tests in Task-Phase verpflichtend | Abschnitt 9: T4 (constraintChecker.test.ts), T9 (constraint integration)    |

---

## Entscheidungszusammenfassung

### Gelesen

- Projektdateien: `spec.md` (725 Zeilen), `appStore.ts` (901 Zeilen), `DetailsPanel.tsx` (399 Zeilen), `featureFlag.ts`, `featureFlag.test.ts`, `App.tsx`, `OptimizationPanel.tsx`, `BlueprintOptimizationPanel.tsx`, `pastePromptAnalysis.ts`, `types/index.ts`, `promptOptimizer.ts`, `constraintChecker` (geplant)
- Issues: #216, #214, #215 (via `gh issue view`)
- Docs: ADR-002 (`DECISIONS.md`), `ROADMAP.md`

### Validierte Fakten

- Feature-Flag-Pattern: `isEmbeddingsEnabled()` — pure function, env-var, disabled by default. Wird 1:1 für Missing-Info-Gate übernommen.
- Store-Pattern: `Record<id, T>` pro promptId für evaluations, hygiene, contextEvaluations, blueprintDetections. missingInfoSessions folgt diesem Muster.
- Modal-Pattern: `useState`-basierte Sichtbarkeit in DetailsPanel (`showOptimizer`, `showBlueprintOptimizer`). showMissingInfoGate folgt diesem Muster.
- ActionBar-Pattern: Callback-Props (`onOptimize`, `onBlueprintOptimize`). onMissingInfoGate folgt diesem Muster.
- analyzeSelected(): Läuft evaluation + hygiene + contextEval in Promise.all + synchron. Gate wird NACH dieser Funktion getriggert.
- Contamination-Check: `isBlocked === BLOCKING_SENSITIVE_CONTENT`. Gate respektiert diesen Check.

### Entscheidung

12-stufiger Implementierungsplan mit harten Abhängigkeiten. Keine Produktivcode-Änderungen in diesem Lauf. Plan ist vollständig, testbar und bereit für `/speckit.tasks`.
