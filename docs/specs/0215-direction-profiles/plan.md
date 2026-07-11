# Plan: Direction Profiles — Varianten erzeugen / Richtung des Ergebnisses variieren

> **Issue:** [#215](https://github.com/xxammaxx/promptvault-lite/issues/215)
> **Epic:** [#214](https://github.com/xxammaxx/promptvault-lite/issues/214) — Prompt-Optimierung mit Ergebnisvarianten und dynamischen Rückfragen
> **Spec:** [`docs/specs/0215-direction-profiles/spec.md`](./spec.md)
> **ADR:** ADR-003 in `docs/DECISIONS.md`
> **Speckit Phase:** Plan
> **Status:** Accepted
> **Date:** 2026-07-11
> **Author:** Issue Orchestrator (via Speckit Workflow)
> **Builds on:** [#216](https://github.com/xxammaxx/promptvault-lite/issues/216) — Missing-Info-Gate (abgeschlossen, Commit `568cd2b`)
> **Owner-Entscheidungen:** Alle 10 offenen Fragen aus der Spec-Phase bestätigt

---

## 1. Ziel und Nicht-Ziele

### Ziel

Diese Planungsphase übersetzt die [Specification](./spec.md) (27 Akzeptanzkriterien, 16 Abschnitte) in einen **kontrollierten, sequentiellen technischen Umsetzungsplan**. Der Plan definiert:

- Exakte Dateien und Module
- Reihenfolge der Implementierungsschritte
- Abhängigkeiten zwischen den Schritten
- Teststrategie pro Schritt
- Feature-Flag-Integration
- Abgrenzung zu #216

### Nicht-Ziele

- ❌ **Keine #216-Duplikation** — Missing-Info-Gate bleibt unverändert
- ❌ **Keine Custom-Profile-Persistenz** in Phase 1 (Session-Only)
- ❌ **Kein Cloud-LLM-Zwang** — VariantGenerator ist template-basiert
- ❌ **Kein Batch-Flow** — Varianten nur für selektierten Einzel-Prompt
- ❌ **Keine automatische Constraint-Überschreibung**
- ❌ **Keine Implementierung** in diesem Lauf — dies ist `/speckit.plan`

### Owner-Entscheidungen (bestätigt)

| #   | Frage                       | Entscheidung                                          |
| --- | --------------------------- | ----------------------------------------------------- |
| Q1  | Button-Label                | **„🧭 Varianten erzeugen“**                           |
| Q2  | Maximale Varianten pro Lauf | **5**                                                 |
| Q3  | Vorausgewählte Profile      | **sachlich, technisch, kurz, ausführlich, agentisch** |
| Q4  | Custom-Profile speichern    | **Nein** in Phase 1                                   |
| Q5  | Auto-Save oder Preview      | **Erst previewen**                                    |
| Q6  | enrichedContent-Nutzung     | **Bevorzugt, aber optional**                          |
| Q7  | Eigener Handler             | **Ja**, `handleOpenVariantPanel`                      |
| Q8  | Generator-Ansatz            | **Template-basiert** (PromptPrefix + Tonalität)       |
| Q9  | Feature-Flag                | **`PROMPTVAULT_DIRECTION_PROFILES`**                  |
| Q10 | Button-Icon                 | **🧭**                                                |

---

## 2. Technische Einordnung

### 2.1 Position in der Architektur

```
Analyse → Missing-Info-Gate (#216) → ┬→ Optimierung (bestehend)
                                      └→ Variantenbildung (#215) ← NEU
```

Direction Profiles (#215) ist eine **parallele, unabhängige Transformationsschicht** zum bestehenden Optimizer. Beide konsumieren die gleiche Quelldaten (`enrichedContent` oder Original-Prompt), arbeiten aber mit unterschiedlichen Zielen:

|                 | Optimierung (#bestehend)                               | Varianten (#215)                                     |
| --------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| **Input**       | `optimizerContent` = enrichedContent ?? prompt.content | `variantContent` = enrichedContent ?? prompt.content |
| **Operation**   | Struktur verbessern, Sektionen hinzufügen              | PromptPrefix + Tonalitäts-Anpassung                  |
| **Output**      | Ein optimierter Prompt                                 | 1–5 Varianten-Prompts                                |
| **Modi**        | conservative / balanced / aggressive                   | 13 Direction Profiles                                |
| **Constraints** | Respektiert                                            | Aktiv geprüft + Konflikte gemeldet                   |

### 2.2 Input-Quelle

```
const variantContent = useAppStore.getState().enrichedContexts[prompt.id]
  ?.enrichedContent ?? prompt.content;
```

- **Mit Gate:** enrichedContent (Nutzer hat Infos ergänzt) → bessere Varianten
- **Ohne Gate:** Original-Prompt → Varianten aus Rohmaterial
- **Anzeige:** Nutzer sieht Info, welche Quelle verwendet wurde

### 2.3 Constraint Integration

Der `constraintChecker.ts` wird **readonly** genutzt:

| Funktion                                               | Aufruf durch          | Zweck                                    |
| ------------------------------------------------------ | --------------------- | ---------------------------------------- |
| `extractHardConstraints(content)`                      | `variantGenerator.ts` | Constraints aus Prompt extrahieren       |
| `checkDirectionProfileConflicts(profile, constraints)` | `variantGenerator.ts` | Profil-gegen-Constraint-Konflikte prüfen |
| `buildResolutionOptions(constraint, source)`           | (bestehend)           | Resolutions-Optionen für Konflikte       |

**Keine Änderung** an bestehenden `constraintChecker.ts`-Funktionen. Die neue `checkDirectionProfileConflicts` wird als zusätzlicher Export hinzugefügt.

### 2.4 Varianten-Lebenszyklus

```
Prompt wählen → Button klicken → Profil(e) wählen → Generieren → Preview → Speichern/Vergleichen/Kopieren
                                                                          │
                                                          Keine Auto-Persistenz
                                                          Session-Only im Store
```

---

## 3. Implementierungsreihenfolge

### Übersicht der Stufen

```
Stage  1: Types-Erweiterung              (src/types/index.ts)
Stage  2: Feature-Flag                    (src/lib/directionFeatureFlag.ts)
Stage  3: directionProfiles.ts            (src/lib/directionProfiles.ts)
Stage  4: variantGenerator.ts             (src/lib/variantGenerator.ts)
Stage  5: Constraint Checker Phase 2      (src/lib/constraintChecker.ts)
Stage  6: VariantStore State              (src/stores/appStore.ts)
Stage  7: VariantPanel UI                 (src/components/variants/)
Stage  8: ActionBar / DetailsPanel        (src/components/details/DetailsPanel.tsx)
Stage  9: VariantCompare Diff             (src/components/variants/VariantCompare.tsx)
Stage 10: Save-as-New-Version             (src/stores/appStore.ts + tauri.ts)
Stage 11: Unit-Tests                      (src/lib/__tests__/)
Stage 12: UI-Tests                        (src/components/variants/__tests__/)
Stage 13: Integrationstests               (src/components/variants/__tests__/)
Stage 14: Docs / Evidence                 (docs/specs/0215-direction-profiles/)
Stage 15: Final Local Gate Run            (alle Gates grün)
```

### Stage 1: Types-Erweiterung

**Datei:** `src/types/index.ts` (append am Ende der Datei)

**Neue Typen (siehe Spec Abschnitt 6):**

- `DirectionProfile` (erweitert `DirectionProfileReference`)
- `DirectionProfileId` (Union-Type, 13 Werte)
- `DirectionProfileSelection` (Nutzer-Auswahl)
- `PromptVariant` (einzelne Variante)
- `VariantGenerationResult` (Gesamtergebnis)
- `VariantConflict` (Profil-gegen-Constraint-Konflikt)
- `VariantRecommendation` (Empfehlung für Einsatzzweck)
- `PreservedConstraintReference` (erhaltener Constraint)

**Keine Änderung an bestehenden Typen.** Der `DirectionProfileReference`-Typ (Zeilen 761–772) bleibt erhalten und wird NICHT gelöscht — `DirectionProfile` erweitert dessen Konzept.

**Abhängigkeiten:** Keine

**Geschätzte Zeilen:** ~150

---

### Stage 2: Feature-Flag

**Neue Datei:** `src/lib/directionFeatureFlag.ts`

**Pattern:** Identisch zu `src/lib/missingInfoFeatureFlag.ts` (45 Zeilen):

```typescript
// Aufbau:
// 1. Konstante: DIRECTION_PROFILES_ENV_VAR = "PROMPTVAULT_DIRECTION_PROFILES"
// 2. Set: ENABLED_VALUES = new Set(["1", "true"])
// 3. Export: isDirectionProfilesEnabled(env?) → boolean
// 4. Rules: default false; enabled only when env var = "1" or "true"
```

**Abhängigkeiten:** Stage 1 (Types sind nicht nötig, aber Konvention)

**Geschätzte Zeilen:** ~45

---

### Stage 3: directionProfiles.ts

**Neue Datei:** `src/lib/directionProfiles.ts`

**Inhalt:**

1. Import `DirectionProfile` aus `@/types`
2. Array `DIRECTION_PROFILES: DirectionProfile[]` mit allen 13 Profilen
3. Jedes Profil enthält: `profileId`, `label`, `description`, `category`, `promptPrefix`, `compatibleConstraintCategories`, `conflictingConstraintCategories`, `recommendation`
4. Exportierte Hilfsfunktionen:
   - `getProfile(id: string): DirectionProfile | undefined`
   - `getAllProfiles(): DirectionProfile[]`
   - `getDefaultSelection(): DirectionProfileId[]` → `["sachlich", "technisch", "kurz", "ausfuehrlich", "agentisch"]`
   - `getProfilesByCategory(category): DirectionProfile[]`

**PromptPrefix-Beispiele für die 13 Profile:**

| Profil-ID        | promptPrefix (Deutsch)                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sachlich`       | `Du bist ein Assistent für sachliche, neutrale Darstellungen. Formuliere den folgenden Prompt so um, dass das Ergebnis neutral, objektiv und faktenbasiert ist.`                                |
| `verkaeuferisch` | `Du bist ein Experte für überzeugende Kommunikation. Formuliere den folgenden Prompt so um, dass das Ergebnis verkaufsstark, handlungsorientiert und überzeugend wirkt.`                        |
| `technisch`      | `Du bist ein technischer Experte. Formuliere den folgenden Prompt so um, dass das Ergebnis technisch präzise ist, Fachbegriffe korrekt verwendet und für ein Entwickler-Publikum geeignet ist.` |
| `kurz`           | `Formuliere den folgenden Prompt so um, dass das Ergebnis maximal komprimiert und auf das Wesentliche reduziert ist. Keine Ausschweifungen, keine Füllwörter.`                                  |
| `ausfuehrlich`   | `Formuliere den folgenden Prompt so um, dass das Ergebnis umfassend, detailliert und mit vollständigem Kontext dargestellt wird.`                                                               |
| `kreativ`        | `Du bist ein kreativer Ideengeber. Formuliere den folgenden Prompt so um, dass das Ergebnis kreativ, inspirierend und assoziativ ist.`                                                          |
| `kritisch`       | `Du bist ein kritischer Prüfer. Formuliere den folgenden Prompt so um, dass das Ergebnis Risiken, Schwachstellen und Alternativen aktiv hinterfragt.`                                           |
| `anfaenger`      | `Du erklärst komplexe Themen für Einsteiger. Formuliere den folgenden Prompt so um, dass das Ergebnis in einfacher Sprache gehalten ist und Fachbegriffe erklärt werden.`                       |
| `experte`        | `Du kommunizierst mit Fachexperten. Formuliere den folgenden Prompt so um, dass das Ergebnis Fachwissen voraussetzt und keine Grundbegriffe erklärt.`                                           |
| `deep_research`  | `Du führst tiefgehende Recherchen durch. Formuliere den folgenden Prompt so um, dass das Ergebnis Quellen referenziert, Methodik beschreibt und Unsicherheiten transparent macht.`              |
| `agentisch`      | `Du erstellst ausführbare Anweisungen für autonome Agenten. Formuliere den folgenden Prompt so um, dass das Ergebnis klare, schrittweise und überprüfbare Anweisungen enthält.`                 |
| `compliance`     | `Du prüfst auf regulatorische Korrektheit. Formuliere den folgenden Prompt so um, dass das Ergebnis DSGVO-konform, sicherheitsbewusst und auditierbar ist.`                                     |
| `custom`         | (Kein fester Prefix — wird vom Nutzer als Freitext eingegeben)                                                                                                                                  |

**Abhängigkeiten:** Stage 1 (Types)

**Geschätzte Zeilen:** ~450

---

### Stage 4: variantGenerator.ts

**Neue Datei:** `src/lib/variantGenerator.ts`

**Exportierte Funktionen:**

```typescript
// Kernfunktion: Wendet ein Direction Profile auf Content an
export function applyDirectionProfile(
  content: string,
  profile: DirectionProfile,
): string;

// Generiert Varianten für mehrere Profile + Constraint-Check
export function generateVariants(
  sourceContent: string,
  selection: DirectionProfileSelection,
  options?: { maxVariants?: number },
): VariantGenerationResult;

// Erzeugt ein PromptVariant-Objekt aus rohem generierten Content
export function mapToPromptVariant(
  generatedContent: string,
  profile: DirectionProfile,
  preservedConstraints: PreservedConstraintReference[],
  conflicts: VariantConflict[],
  source: "original" | "enriched",
): PromptVariant;
```

**`applyDirectionProfile` Algorithmus (template-basiert):**

1. Input validieren (leerer Content → leerer Return)
2. Profil-`promptPrefix` extrahieren
3. Content mit Prefix kombinieren: `[Rolle/Anweisung]\n\n[Originaler Prompt-Inhalt]`
4. Result zurückgeben (neuer String, keine Mutation)

**`generateVariants` Algorithmus:**

1. Constraints aus sourceContent extrahieren: `extractHardConstraints(sourceContent)`
2. Für jedes ausgewählte Profil:
   a. Profil-Konflikte prüfen: `checkDirectionProfileConflicts(profile, constraints)`
   b. Variante generieren: `applyDirectionProfile(sourceContent, profile)`
   c. Erhaltene Constraints referenzieren
   d. `PromptVariant`-Objekt bauen
3. Begrenzung auf `maxVariants` (default: 5)
4. `VariantGenerationResult` zurückgeben

**Abhängigkeiten:** Stage 1 (Types), Stage 3 (directionProfiles), Stage 5 (constraintChecker — für `checkDirectionProfileConflicts`)

**Geschätzte Zeilen:** ~250

---

### Stage 5: Constraint Checker Phase 2

**Datei:** `src/lib/constraintChecker.ts` (Erweiterung — bestehende API bleibt unverändert)

**Neuer Export:**

```typescript
/**
 * Check direction profile compatibility against extracted hard constraints.
 *
 * Verwendet die profile.conflictingConstraintCategories als Primär-Check,
 * SECURITY_CATEGORIES als sekundären Schutz.
 *
 * @param profile       Das ausgewählte Direction Profile.
 * @param constraints   Aus dem Prompt extrahierte harte Constraints.
 * @returns Array von ConstraintConflict-Objekten. Leer wenn vollständig kompatibel.
 */
export function checkDirectionProfileConflicts(
  profile: DirectionProfile,
  constraints: HardConstraint[],
): ConstraintConflict[];
```

**Algorithmus:**

1. Input validieren (leere Arrays → leeres Ergebnis)
2. Iteriere über alle `constraints`
3. Wenn `constraint.category` in `profile.conflictingConstraintCategories`:
   → Erzeuge BLOCKING-`ConstraintConflict` mit `conflictingSource: profile.label`
4. Wenn `constraint.category` in `SECURITY_CATEGORIES` und das Profil kollidiert:
   → `require_human_approval` in Resolution-Optionen (via `buildResolutionOptions`)
5. Für alle anderen Constraints: kein Konflikt
6. Rückgabe: `ConstraintConflict[]`

**Änderungen an bestehenden Funktionen:** **KEINE.** `extractHardConstraints()`, `checkConflicts()`, `buildResolutionOptions()` bleiben unverändert. Lediglich ein neuer Import `DirectionProfile` aus `@/types` wird benötigt.

**Abhängigkeiten:** Stage 1 (Types — `DirectionProfile` muss definiert sein)

**Geschätzte Zeilen:** ~100 (nur neuer Code)

---

### Stage 6: VariantStore State

**Datei:** `src/stores/appStore.ts` (Erweiterung)

**Neue State-Felder:**

```typescript
// Direction Profiles / Variant Panel State (Stage 6)
variantResults: Record<string, VariantGenerationResult>;       // promptId → Ergebnis
showVariantPanel: boolean;                                      // UI-Zustand
activeVariantPromptId: string | null;                           // Welcher Prompt im Panel?
selectedProfileIds: DirectionProfileId[];                       // Nutzer-Auswahl
isGeneratingVariants: boolean;                                  // Ladezustand
```

**Neue Actions:**

```typescript
// Variant Panel Actions (Stage 6)
openVariantPanel: (promptId: string) => void;
closeVariantPanel: () => void;
generateVariants: (promptId: string, selection: DirectionProfileSelection) => void;
selectProfile: (profileId: DirectionProfileId) => void;
toggleProfileSelection: (profileId: DirectionProfileId) => void;
clearVariantResults: (promptId: string) => void;
```

**`openVariantPanel(promptId)`:**

1. Setze `showVariantPanel = true`, `activeVariantPromptId = promptId`
2. `selectedProfileIds = getDefaultSelection()` (5 vorausgewählte Profile)
3. `isGeneratingVariants = false`

**`generateVariants(promptId, selection)`:**

1. Setze `isGeneratingVariants = true`
2. Bestimme Input: `enrichedContexts[promptId]?.enrichedContent ?? prompts.find(p => p.id === promptId)?.content`
3. Rufe `generateVariants(sourceContent, selection)` aus `variantGenerator.ts` auf
4. Speichere Ergebnis in `variantResults[promptId]`
5. Setze `isGeneratingVariants = false`

**`clearVariantResults(promptId)`:**

- Entfernt `variantResults[promptId]`
- Setzt `selectedProfileIds = getDefaultSelection()`

**Abgrenzung zu bestehenden Store-Keys:**

- `variantResults` ≠ `enrichedContexts` — separate Keys, kein Blending
- `showVariantPanel` ≠ `isGateOpen` — unabhängige UI-Flags
- `activeVariantPromptId` ≠ `activeGatePromptId` — separate aktive Prompt-Referenzen

**Abhängigkeiten:** Stage 1 (Types), Stage 4 (variantGenerator), Stage 2 (directionFeatureFlag)

**Geschätzte Zeilen:** ~120 (neuer Code)

---

### Stage 7: VariantPanel UI

**Neue Dateien:**

| Datei                                                  | Zweck                                               |
| ------------------------------------------------------ | --------------------------------------------------- |
| `src/components/variants/VariantPanel.tsx`             | Modal-Container (analog zu `OptimizationPanel.tsx`) |
| `src/components/variants/DirectionProfileSelector.tsx` | Chip-Grid zur Profilauswahl                         |
| `src/components/variants/VariantResultList.tsx`        | Liste der generierten Varianten                     |

**VariantPanel (Modal-Container):**

```
Props:
  - promptId: string
  - sourceContent: string            // original oder enriched
  - enrichedContentUsed: boolean     // Anzeige: Quelle
  - onClose: () => void

Interner State:
  - phase: "select" | "generating" | "results"

Phasen:
  select → DirectionProfileSelector + "Varianten generieren"-Button
  generating → Lade-Spinner
  results → VariantResultList + Aktionen
```

**DirectionProfileSelector (Chip-Grid):**

- Liest `DIRECTION_PROFILES` aus `directionProfiles.ts`
- Grid: 4 Spalten (responsive)
- Chips mit Icon, Label, Tooltip
- Multi-Select (toggle bei Klick)
- Custom-Chip triggert Freitext-Textarea
- Anzeige aktiver Constraints (extrahiert via `extractHardConstraints`)
- Warnung bei Konflikt-Profilen (vor Generierung)

**VariantResultList:**

- Liest `variantResults[promptId]` aus dem Store
- Iteriert über `variant.variants[]`
- Pro Variante:
  - Titel + Label
  - Kurzbeschreibung (directionExplanation)
  - Erhaltene Constraints (preservedConstraints)
  - Konflikte (conflicts) mit Badge (blau=WARNING, rot=BLOCKING)
  - Annahmen (assumptions)
  - Empfehlung (recommendation)
  - Buttons: 💾 Speichern, ↔️ Vergleichen, 📋 Kopieren

**Abhängigkeiten:** Stage 1 (Types), Stage 3 (directionProfiles), Stage 6 (Store)

**Geschätzte Zeilen:** ~900 (VariantPanel: ~350, DirectionProfileSelector: ~250, VariantResultList: ~300)

---

### Stage 8: ActionBar / DetailsPanel-Integration

**Datei:** `src/components/details/DetailsPanel.tsx` (Erweiterung)

**Änderungen:**

1. **Neuer Import:**

```typescript
import { isDirectionProfilesEnabled } from "@/lib/directionFeatureFlag";
import { VariantPanel } from "@/components/variants/VariantPanel";
```

2. **Neuer State:**

```typescript
const [showVariantPanel, setShowVariantPanel] = useState(false);
```

3. **Neuer Handler `handleOpenVariantPanel`:**

```typescript
const handleOpenVariantPanel = useCallback(() => {
  if (!prompt) return;

  // Gleicher Gate-Check wie handleOpenOptimizer (Batch 5 Pattern)
  if (gateEnabled && !isBlocked) {
    const store = useAppStore.getState();
    const session = store.missingInfoSessions[prompt.id];
    const skipped = store.gateSkippedItems[prompt.id] ?? [];
    const hasRequired =
      session.items.length > 0 &&
      session.items.some(
        (item) => item.tier === "REQUIRED" && !skipped.includes(item.id),
      );
    if (hasRequired) {
      setShowGate(true);
      return;
    }
  }

  // VariantPanel öffnen
  const store = useAppStore.getState();
  store.openVariantPanel(prompt.id);
  setShowVariantPanel(true);
}, [prompt, gateEnabled, isBlocked]);
```

4. **ActionBar-Erweiterung:**

```typescript
// Neuer Prop: onVariantGenerate?: () => void
// Neuer Button (vor MissingInfoGate-Button):
{directionProfilesEnabled && onVariantGenerate && (
  <button className="btn" onClick={onVariantGenerate}
          title="Verschiedene Ergebnisrichtungen erzeugen"
          data-testid="variant-actionbar-btn">
    🧭 Varianten erzeugen
  </button>
)}
```

5. **VariantPanel-Rendering (analog zu OptimizationPanel):**

```typescript
{showVariantPanel && (
  <VariantPanel
    promptId={prompt.id}
    sourceContent={optimizerContent}  // gleiche Quelle wie Optimizer
    enrichedContentUsed={!!useAppStore.getState().enrichedContexts[prompt.id]}
    onClose={() => {
      setShowVariantPanel(false);
      useAppStore.getState().closeVariantPanel();
    }}
  />
)}
```

6. **ActionBar-Aufruf:**

```typescript
<ActionBar
  onOptimize={handleOpenOptimizer}
  onBlueprintOptimize={handleBlueprintOptimize}
  onVariantGenerate={handleOpenVariantPanel}  // NEU
  onMissingInfoGate={handleOpenGate}
/>
```

**Abhängigkeiten:** Stage 2 (Feature-Flag), Stage 6 (Store), Stage 7 (VariantPanel)

**Geschätzte Zeilen:** ~100 (Änderungen/Erweiterungen)

---

### Stage 9: VariantCompare Diff

**Neue Datei:** `src/components/variants/VariantCompare.tsx`

**Funktion:**

- Side-by-Side-Vergleich zwischen Original (oder enriched) und Variante
- Linke Spalte: Source-Content
- Rechte Spalte: Varianten-Content
- Darstellung der Unterschiede (Text-Diff oder Highlight)
- Anzeige: Constraints-Vergleich (Original vs. Variante)
- Button: 💾 Variante speichern

**Props:**

```typescript
interface VariantCompareProps {
  sourceContent: string;
  variant: PromptVariant;
  onSave?: (variant: PromptVariant) => void;
  onClose: () => void;
}
```

**Abhängigkeiten:** Stage 1 (Types)

**Geschätzte Zeilen:** ~200

---

### Stage 10: Save-as-New-Version

**Dateien:** `src/stores/appStore.ts` (neue Action), ggf. `src/lib/tauri.ts` (bestehendes `createPrompt` nutzen)

**Neue Action:**

```typescript
saveVariantAsPrompt: (variant: PromptVariant) => Promise<void>;
```

**Algorithmus:**

1. `variant.content` als Prompt-Inhalt verwenden
2. `createPrompt({ title: variant.label, content: variant.content, category: "Variante", tags: ["variant", variant.profileId] })` via Tauri-Backend
3. Nach erfolgreichem Speichern: Erfolgsmeldung, VariantPanel schließen
4. Prompt-Liste neu laden (via `scanFolder`)

**Phase 1 Einschränkung:** Die Variante wird als **neue Prompt-Datei** im Vault-Ordner gespeichert. Sie ersetzt NICHT den Original-Prompt. Der Nutzer kann die neue Datei manuell weiterbearbeiten.

**Abhängigkeiten:** Stage 1 (Types), bestehendes `createPrompt` in `tauri.ts`

**Geschätzte Zeilen:** ~80

---

### Stage 11: Unit-Tests

**Neue Testdateien:**

| Datei                                                   | Test-Gegenstand                                                         | Tests (ca.) |
| ------------------------------------------------------- | ----------------------------------------------------------------------- | ----------- |
| `src/lib/__tests__/directionFeatureFlag.test.ts`        | `isDirectionProfilesEnabled()`                                          | 12          |
| `src/lib/__tests__/directionProfiles.test.ts`           | `getProfile()`, `getAllProfiles()`, `getDefaultSelection()`             | 20          |
| `src/lib/__tests__/variantGenerator.test.ts`            | `applyDirectionProfile()`, `generateVariants()`, `mapToPromptVariant()` | 35          |
| `src/lib/__tests__/constraintChecker.direction.test.ts` | `checkDirectionProfileConflicts()`                                      | 25          |

**Key Scenarios:**

- Alle 13 Profile: Lookup, Default-Selection, Kategorie-Filter
- VariantGenerator: leeres Content, Whitespace, enrichedContent, Custom-Profil, maxVariants-Limit
- ConstraintChecker: jeder Profil-Typ mit jeder Constraint-Kategorie, Security-Hardening, leere Arrays

**Abhängigkeiten:** Stage 1–5

**Geschätzte Zeilen:** ~1200 (92 Tests)

---

### Stage 12: UI-Tests

**Neue Testdateien:**

| Datei                                                                 | Test-Gegenstand                                    | Tests (ca.) |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------- |
| `src/components/variants/__tests__/DirectionProfileSelector.test.tsx` | Rendering, Auswahl, Multi-Select, Custom           | 20          |
| `src/components/variants/__tests__/VariantPanel.test.tsx`             | Modal öffnen/schließen, Profilauswahl, Generierung | 25          |
| `src/components/variants/__tests__/VariantResultList.test.tsx`        | Varianten-Liste, Constraints, Konflikte, Buttons   | 20          |
| `src/components/variants/__tests__/VariantCompare.test.tsx`           | Side-by-Side, Diff, Speichern                      | 15          |

**Key Scenarios:**

- Alle Input-Typen (Freitext Custom, Multi-Select, kein Profil ausgewählt → Button disabled)
- Varianten mit/ohne Konflikte
- Varianten mit/ohne enrichedContent-Quelle
- Leere Varianten-Liste
- Speichern-/Kopieren-/Vergleichen-Buttons

**Abhängigkeiten:** Stage 7, 8, 9

**Geschätzte Zeilen:** ~1600 (80 Tests)

---

### Stage 13: Integrationstests

**Neue Testdateien:**

| Datei                                                                 | Test-Gegenstand                                                              | Tests (ca.) |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------- |
| `src/components/variants/__tests__/VariantPanel.integration.test.tsx` | Full Flow: Prompt → Panel → Profil → Generieren → Variante anzeigen          | 10          |
| `src/components/variants/__tests__/VariantPanel.enriched.test.tsx`    | Flow mit enrichedContent: Gate → enrichedContent → Varianten nutzen enriched | 8           |
| `src/components/variants/__tests__/VariantPanel.constraint.test.tsx`  | Konflikt-Flow: Constraint + Profil → Warnung → Generierung mit Constraint    | 10          |
| `src/components/variants/__tests__/VariantPanel.regression.test.tsx`  | Regression: Original unverändert, Optimizer intakt, Gate intakt, ActionBar   | 12          |

**Key Scenarios:**

- End-to-End: Datei-Modus und Paste-Modus
- Mit und ohne Gate-Durchlauf
- Alle Constraint-Kategorien durchtesten
- Feature-Flag OFF: bestehender Flow unverändert

**Abhängigkeiten:** Stage 7–10, bestehende Tests

**Geschätzte Zeilen:** ~1200 (40 Tests)

---

### Stage 14: Docs / Evidence

**Dateien:**

- `docs/DECISIONS.md`: ADR-003 anhängen (Architecture-Agent Output)
- `docs/ROADMAP.md`: #215 Status aktualisieren (von "Planned" → "In Spec/Plan")
- `docs/specs/0215-direction-profiles/evidence.md`: Evidence-Report nach Abschluss

**Abhängigkeiten:** Stage 11, 12, 13 (Tests müssen grün sein)

**Geschätzte Zeilen:** ~300

---

### Stage 15: Final Local Gate Run

**Gates:**
| Gate | Befehl |
|------|--------|
| TypeScript Check | `pnpm exec tsc --noEmit` |
| ESLint | `pnpm lint --max-warnings 0` |
| Frontend Tests | `pnpm test` |
| Rust Format | `cargo fmt --check --manifest-path src-tauri/Cargo.toml` |
| Rust Clippy | `cargo clippy --workspace --all-targets -- -D warnings` |

---

## 4. Modul- und Dateiplan

### 4.1 Neue Dateien

| #     | Datei                                                  | Typ     | Stage | Geschätzte Zeilen |
| ----- | ------------------------------------------------------ | ------- | ----- | ----------------- |
| 1     | `src/lib/directionFeatureFlag.ts`                      | Library | 2     | ~45               |
| 2     | `src/lib/directionProfiles.ts`                         | Library | 3     | ~450              |
| 3     | `src/lib/variantGenerator.ts`                          | Library | 4     | ~250              |
| 4     | `src/components/variants/VariantPanel.tsx`             | UI      | 7     | ~350              |
| 5     | `src/components/variants/DirectionProfileSelector.tsx` | UI      | 7     | ~250              |
| 6     | `src/components/variants/VariantResultList.tsx`        | UI      | 7     | ~300              |
| 7     | `src/components/variants/VariantCompare.tsx`           | UI      | 9     | ~200              |
| 8–11  | Test-Dateien (Unit-Tests)                              | Test    | 11    | ~1200             |
| 12–15 | Test-Dateien (UI-Tests)                                | Test    | 12    | ~1600             |
| 16–19 | Test-Dateien (Integration)                             | Test    | 13    | ~1200             |

### 4.2 Zu ändernde Dateien

| #   | Datei                                     | Änderung                                       | Stage | Geschätzte Zeilen |
| --- | ----------------------------------------- | ---------------------------------------------- | ----- | ----------------- |
| 1   | `src/types/index.ts`                      | 8 neue Interfaces/Types (append)               | 1     | ~150              |
| 2   | `src/lib/constraintChecker.ts`            | Neue Funktion `checkDirectionProfileConflicts` | 5     | ~100              |
| 3   | `src/stores/appStore.ts`                  | State + Actions für VariantPanel               | 6     | ~120              |
| 4   | `src/components/details/DetailsPanel.tsx` | ActionBar-Button + VariantPanel-Integration    | 8     | ~100              |
| 5   | `src/stores/appStore.ts`                  | `saveVariantAsPrompt`-Action                   | 10    | ~80               |

### 4.3 Bewusst nicht betroffene Dateien (#216)

| Datei                                      | Grund                              |
| ------------------------------------------ | ---------------------------------- |
| `src/lib/missingInfoDetector.ts`           | #216-exklusiv — keine Änderung     |
| `src/lib/missingInfoClassifier.ts`         | #216-exklusiv — keine Änderung     |
| `src/lib/gateContentMerger.ts`             | #216-exklusiv — keine Änderung     |
| `src/components/gates/MissingInfoGate.tsx` | #216-exklusiv — keine Änderung     |
| `src/lib/promptOptimizer.ts`               | Unabhängiger Pfad — keine Änderung |

---

## 5. Datenfluss

```
┌─────────────────────────────────────────────────────────────────────┐
│                           INPUT                                     │
│                                                                     │
│  prompt.content  ──→  [Missing-Info-Gate]  ──→  enrichedContent     │
│       │                    (optional)                                 │
│       │                                                              │
│       └──────────────┬──────────────────────────────────────────┐   │
│                      │                                            │   │
│                      ▼                                            ▼   │
│              ┌───────────────────────────────────────────────┐       │
│              │         variantContent                        │       │
│              │  = enrichedContent ?? prompt.content          │       │
│              └───────────────────────┬───────────────────────┘       │
│                                      │                               │
├──────────────────────────────────────┼───────────────────────────────┤
│                           PROCESSING │                               │
│                                      ▼                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  DirectionProfileSelection                                    │  │
│  │  - selectedProfileIds[]  (z.B. ["sachlich", "technisch"])    │  │
│  │  - customDirectionText?  (nur bei "custom")                   │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  extractHardConstraints(variantContent)                       │  │
│  │  → HardConstraint[]                                           │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Für jedes Profil:                                            │  │
│  │  1. checkDirectionProfileConflicts(profile, constraints)      │  │
│  │     → ConstraintConflict[]                                    │  │
│  │  2. applyDirectionProfile(variantContent, profile)            │  │
│  │     → generatedContent: string                                │  │
│  │  3. mapToPromptVariant(generatedContent, profile, ...)        │  │
│  │     → PromptVariant                                           │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│                              │                                       │
├──────────────────────────────┼───────────────────────────────────────┤
│                          OUTPUT                                     │
│                              ▼                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  VariantGenerationResult                                       │  │
│  │  - sourceContent                                               │  │
│  │  - enrichedContentUsed: boolean                                │  │
│  │  - variants: PromptVariant[]      (max 5)                     │  │
│  │  - profileConflicts: ConstraintConflict[]                      │  │
│  │  - appliedAt: ISO8601                                          │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  VariantPanel → VariantResultList                             │  │
│  │                                                               │  │
│  │  Pro Variante:                                                │  │
│  │  ┌─────────────────────────────────────────────────────┐     │  │
│  │  │  [💾 Speichern]  [↔️ Vergleichen]  [📋 Kopieren]   │     │  │
│  │  └─────────────────────────────────────────────────────┘     │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. State-Modell

### 6.1 Neue Store-Keys (vollständig getrennt von #216)

```
AppState
├── variantResults: Record<string, VariantGenerationResult>
│   └── Key: promptId
│   └── Value: { sourceContent, enrichedContentUsed, variants[], profileConflicts[], appliedAt }
│   └── Lifecycle: Session-Only (wird bei analyzeSelected() NICHT invalidiert —
│       Varianten bleiben bis clearVariantResults() oder Panel-Schließen erhalten)
│
├── showVariantPanel: boolean
│   └── Unabhängig von isGateOpen — eigenes UI-Flag
│
├── activeVariantPromptId: string | null
│   └── Welcher Prompt ist im VariantPanel aktiv?
│
├── selectedProfileIds: DirectionProfileId[]
│   └── Default: ["sachlich", "technisch", "kurz", "ausfuehrlich", "agentisch"]
│   └── Wird bei openVariantPanel() zurückgesetzt
│
└── isGeneratingVariants: boolean
    └── true während generateVariants() läuft; false sonst
```

### 6.2 Trennung von #216 State

| #215 Key                | #216 Key              | Getrennt?                   |
| ----------------------- | --------------------- | --------------------------- |
| `variantResults`        | `enrichedContexts`    | ✅ Separate Keys            |
| `showVariantPanel`      | `isGateOpen`          | ✅ Separate UI-Flags        |
| `activeVariantPromptId` | `activeGatePromptId`  | ✅ Separate Referenzen      |
| `selectedProfileIds`    | `missingInfoSessions` | ✅ Separate Datenstrukturen |
| `isGeneratingVariants`  | (kein Pendant)        | ✅ Neues Flag               |

### 6.3 Keine Custom-Profile-Persistenz in Phase 1

- Custom-Profil-Text wird NUR im lokalen State des `DirectionProfileSelector` gehalten
- Wird NICHT im Store persistiert
- Wird NICHT über App-Neustarts gespeichert
- Wird bei `closeVariantPanel()` verworfen

### 6.4 Reset/Clear-Verhalten

| Aktion                          | Was passiert mit variantResults?                                                         |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `closeVariantPanel()`           | Panel schließt; `variantResults` bleibt erhalten (kein Datenverlust bei erneutem Öffnen) |
| `clearVariantResults(promptId)` | `variantResults[promptId]` wird gelöscht; `selectedProfileIds` zurückgesetzt             |
| `analyzeSelected()`             | `variantResults` bleibt erhalten (keine automatische Invalidierung)                      |
| `selectPrompt(andereId)`        | Panel schließt automatisch; `variantResults` bleibt erhalten                             |

### 6.5 Conflict State

- Konflikte sind Teil von `VariantGenerationResult.profileConflicts[]`
- Werden NICHT separat im Store gehalten
- Werden bei `clearVariantResults()` mitgelöscht

---

## 7. UI-Plan

### 7.1 Button „🧭 Varianten erzeugen“

| Eigenschaft      | Wert                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| **Position**     | Zwischen „📋 Blueprint“ und „❓ Fehlende Infos“                      |
| **Label**        | „🧭 Varianten erzeugen“                                              |
| **Sichtbarkeit** | Nur wenn `isDirectionProfilesEnabled()` === true                     |
| **Disabled**     | Wenn `!prompt` ODER `isBlocked` ODER `isAnalyzing` ODER `isGateOpen` |
| **Active**       | Sonst immer klickbar                                                 |
| **Tooltip**      | „Verschiedene Ergebnisrichtungen erzeugen“                           |
| **data-testid**  | `variant-actionbar-btn`                                              |

### 7.2 Profile-Chips (DirectionProfileSelector)

- **Layout:** 4-Spalten-Grid, responsiv (3 Spalten bei schmalem Viewport)
- **Chip-Design:**
  - Größe: ~120×80px
  - Icon oben (Emoji, kein externes Asset)
  - Label darunter (z.B. „Sachlich“)
  - Tooltip bei hover (description)
- **Auswahl:**
  - Klick toggelt Auswahl
  - Ausgewählte Chips: `border: 2px solid var(--color-primary)` + leichter Hintergrund
  - Nicht ausgewählte Chips: `border: 1px solid var(--color-border)`
- **Kategorien:**
  - Gruppiert in Sektionen:
    - „Sachlich / Neutral“ → sachlich, kurz, ausführlich, kritisch, anfaenger, compliance
    - „Verkaufsorientiert“ → verkaeuferisch
    - „Technisch / Spezialisiert“ → technisch, experte, deep_research, agentisch
    - „Kreativ“ → kreativ
  - Jede Sektion mit kleinem Kategorie-Label
- **Custom-Chip:**
  - Immer als letztes im Grid
  - Icon: ✏️ (Stift)
  - Label: „Eigene Richtung“
  - Bei Klick: Textarea unter dem Grid einblenden

### 7.3 Benutzerdefinierte Richtung

- **Textarea:** 2–3 Zeilen, placeholder: „z.B. Erkläre es wie für einen 10-Jährigen“
- **Anzeige:** Wenn Text gefüllt → Custom-Chip wird als „ausgewählt“ markiert
- **Constraint-Hinweis:** Banner: „⚠️ Für benutzerdefinierte Richtungen kann keine automatische Constraint-Prüfung durchgeführt werden.“
- **Keine Persistenz:** Text wird verworfen, wenn Panel geschlossen wird

### 7.4 Maximale Varianten-Anzahl (5)

- Nutzer kann beliebig viele Profile auswählen
- Bei Klick auf „Varianten generieren“:
  - Wenn ≤ 5 Profile: alle werden generiert
  - Wenn > 5 Profile: Nur die ersten 5 werden generiert; Hinweis: „⚠️ Maximal 5 Varianten pro Lauf. Es werden nur die ersten 5 ausgewählten Profile verwendet.“
- Wenn `custom` ausgewählt + Text gefüllt → zählt als 1 Profil

### 7.5 Variantenliste (VariantResultList)

- Header: „✅ N Varianten erzeugt“
- Quelle-Hinweis: „ℹ️ Quelle: enrichedContent (Missing-Info-Gate)“ oder „ℹ️ Quelle: Original-Prompt“
- Pro Variante eine Karte:
  - **Header:** Icon + Label (z.B. „📄 Sachlich / Neutral“)
  - **Empfehlung:** kursiv
  - **Constraints:** Liste mit ✅ pro erhaltenem Constraint
  - **Konflikte:** Kollabierbarer Banner (blau=WARNING, rot=BLOCKING)
  - **Annahmen:** Bullet-Liste
  - **Aktionen:** 3 Buttons am Karten-Footer
- Scrollbar, wenn mehr als 2 Varianten

### 7.6 VariantCompare (Side-by-Side)

- Linke Spalte: „Original“ (oder „Angereichert“) — sourceContent
- Rechte Spalte: Profil-Label — variant.content
- Constraints-Vergleich: Tabelle unter den Text-Panes
- Diff-Highlights: keine (Phase 1 — reiner Textvergleich)
- Button: „💾 Variante speichern“ (unten)

### 7.7 Speichern als neue Version

- Button: „💾 Als neue Version speichern“
- Klick:
  1. `createPrompt({ title: variant.label, content: variant.content })` via Tauri
  2. Erfolgs-Toast: „✅ Variante gespeichert: [Label]“
  3. Prompt-Liste neu laden (via `scanFolder`)
  4. VariantPanel schließen
- Bei Fehler: Toast mit Fehlermeldung, Panel bleibt offen

### 7.8 Constraint-/Conflict-Banner

**Im DirectionProfileSelector (vor Generierung):**

- Anzeige: „⚠️ Aktive Constraints:“ mit Liste der extrahierten Constraints
- Wenn ein Konflikt-Profil ausgewählt wird → Warn-Banner unter dem Grid

**In VariantResultList (nach Generierung):**

- Pro Variante: kollabierbarer Konflikt-Bereich
- BLOCKING: roter Banner mit Beschreibung
- WARNING: blauer Banner mit Beschreibung

---

## 8. Feature-Flag-Plan

### 8.1 Name und Konvention

| Eigenschaft        | Wert                                         |
| ------------------ | -------------------------------------------- |
| **Env-Var**        | `PROMPTVAULT_DIRECTION_PROFILES`             |
| **Default**        | Disabled (`false`)                           |
| **Enabled-Values** | `"1"`, `"true"` (case-sensitive, exakt)      |
| **Funktion**       | `isDirectionProfilesEnabled(env?) → boolean` |
| **Datei**          | `src/lib/directionFeatureFlag.ts`            |
| **Pattern**        | Identisch zu `missingInfoFeatureFlag.ts`     |

### 8.2 Flag-Check-Punkte

| Ort                | Was wird geprüft?                        |
| ------------------ | ---------------------------------------- |
| `DetailsPanel.tsx` | Button „🧭 Varianten erzeugen“ sichtbar? |
| `DetailsPanel.tsx` | `handleOpenVariantPanel` ausführbar?     |
| `VariantPanel.tsx` | (optional) Panel rendern?                |

### 8.3 Flag-Tests

| Test               | Erwartung                                                               |
| ------------------ | ----------------------------------------------------------------------- |
| Flag OFF (default) | Button nicht sichtbar, VariantPanel nicht erreichbar                    |
| Flag OFF           | Bestehender Flow (Optimieren, Blueprint, Gate) funktioniert unverändert |
| Flag ON (`=1`)     | Button sichtbar, VariantPanel öffnet sich                               |
| Flag ON (`=true`)  | Button sichtbar                                                         |
| Flag ON (`=TRUE`)  | Button NICHT sichtbar (case-sensitive)                                  |
| Flag ON (`=yes`)   | Button NICHT sichtbar (nur "1" und "true")                              |

---

## 9. Testplan

### 9.1 Unit-Tests (92 Tests, ~1200 Zeilen)

| Suite                                 | Tests | Key Assertions                                                                                                                                                                                      |
| ------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `directionFeatureFlag.test.ts`        | 12    | default=false, "1"=true, "true"=true, "0"=false, "yes"=false, "TRUE"=false, undefined=ok                                                                                                            |
| `directionProfiles.test.ts`           | 20    | Alle 13 Profile vorhanden, getProfile("sachlich") findet, getProfile("unbekannt")=undefined, getDefaultSelection()=5, getProfilesByCategory filtert                                                 |
| `variantGenerator.test.ts`            | 35    | applyDirectionProfile: alle 13 Profile, leerer Input→leer, Whitespace, enrichedContent-Input, custom-Profil. generateVariants: maxVariants-Limit, keine Profile→leer, constraints werden extrahiert |
| `constraintChecker.direction.test.ts` | 25    | deep_research+offline_only→BLOCKING, agentisch+approval_required→BLOCKING, sachlich+alle→keine Konflikte, SECURITY_CATEGORIES-Hardening, leere Arrays                                               |

### 9.2 UI-Tests (80 Tests, ~1600 Zeilen)

| Suite                               | Tests | Key Assertions                                                                                                                                     |
| ----------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DirectionProfileSelector.test.tsx` | 20    | Alle Profile rendern, Klick toggelt, Multi-Select, Custom-Text aktiviert Textarea, Constraint-Banner bei Konflikt-Profil                           |
| `VariantPanel.test.tsx`             | 25    | Modal öffnet/schließt, Button "Varianten generieren" disabled ohne Auswahl, Generierung triggert Ladezustand, Ergebnisse erscheinen, Phase-Wechsel |
| `VariantResultList.test.tsx`        | 20    | Varianten rendern mit Label/Description/Constraints/Konflikten, Leere Liste, 💾-↔️-📋-Buttons klickbar, Konflikt-Banner kollabierbar               |
| `VariantCompare.test.tsx`           | 15    | Side-by-Side rendert beide Texte, Constraints-Tabelle, Speichern-Button, Schließen                                                                 |

### 9.3 Integrationstests (40 Tests, ~1200 Zeilen)

| Suite                               | Tests | Key Flows                                                                                                          |
| ----------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| `VariantPanel.integration.test.tsx` | 10    | Prompt selektieren → Button klicken → Profile wählen → Generieren → Varianten anzeigen → Speichern triggern        |
| `VariantPanel.enriched.test.tsx`    | 8     | Gate durchlaufen → enrichedContent existiert → Varianten nutzen enriched → sourceContent="enriched"                |
| `VariantPanel.constraint.test.tsx`  | 10    | Prompt mit Constraint → Konflikt-Profil wählen → Warnung erscheint → Generierung → Constraint in Variante erhalten |
| `VariantPanel.regression.test.tsx`  | 12    | Original unverändert, Optimizer intakt, Gate intakt, ActionBar alle Buttons, Feature-Flag OFF                      |

### 9.4 Regressionstests (keine neuen — bestehende Suiten)

| Bestehende Suite                   | Assertion                     |
| ---------------------------------- | ----------------------------- |
| `promptOptimizer.test.ts`          | Alle Tests grün (36)          |
| `constraintChecker.test.ts`        | Alle Tests grün (36)          |
| `OptimizationPanel.test.tsx`       | Alle Tests grün               |
| `MissingInfoGate.*.test.tsx`       | Alle Tests grün (33+11+10+10) |
| `appStore.missingInfoGate.test.ts` | Alle Tests grün (38)          |
| `DetailsPanel.blueprint.test.tsx`  | Alle Tests grün (53)          |

### 9.5 Security-Tests (in constraintChecker.direction.test.ts und VariantPanel.constraint.test.tsx)

| Test                              | Assertion                                                      |
| --------------------------------- | -------------------------------------------------------------- |
| `offline_only` + `deep_research`  | Variante enthält KEINE Cloud-Referenzen; BLOCKING-Konflikt     |
| `approval_required` + `agentisch` | `require_human_approval` in Resolution-Optionen                |
| `scope_boundary` + `agentisch`    | Scope bleibt erhalten                                          |
| A1–A5 Invarianten                 | Programmatische Assertions (Spec Abschnitt 7.5)                |
| Constraint-Entfernung             | Alle extrahierten Constraints sind in `preservedConstraints[]` |

---

## 10. Risiken und Mitigations

| #      | Risiko                                                                                     | Severity | Mitigation                                                                                                                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R1** | **Scope-Creep zu #216** — VariantGenerator beginnt, eigene Gap-Detection zu implementieren | HIGH     | Harter Architektur-Block: `variantGenerator.ts` importiert NICHTS aus `missingInfoDetector.ts`, `missingInfoClassifier.ts`, `gateContentMerger.ts`. Code-Review-Gate.                                                                          |
| **R2** | **Scope-Creep zu Cloud/LLM** — „Template-basiert“ wird später durch API-Call ersetzt       | MEDIUM   | Template-basierter Generator ist deterministisch und hat keine Netzwerk-Abhängigkeiten. Phase-1-Design verhindert Upgrades ohne explizites Refactoring.                                                                                        |
| **R3** | **Constraint-Verlust** — Varianten entfernen Constraints stillschweigend                   | HIGH     | `checkDirectionProfileConflicts()` + Security-Hardening (3 Kategorien). System-Invarianten A1–A5 programmatisch prüfbar. Dedizierte Security-Tests.                                                                                            |
| **R4** | **Varianten zu generisch** — Prefix allein reicht nicht für sinnvolle Varianten            | MEDIUM   | 13 Profile mit spezifischen `promptPrefix`-Texten. Unit-Tests validieren jedes Profil. Feedback-Schleife: Profile können nach Usability-Tests verfeinert werden.                                                                               |
| **R5** | **UI-Komplexität** — Zu viele Chips/Buttons/Phasen überfordern Nutzer                      | MEDIUM   | 4-Spalten-Grid mit Kategorien. 5 vorausgewählte Profile reduzieren kognitive Last. Phasen-Wechsel (select→generating→results) linear und klar.                                                                                                 |
| **R6** | **Zu viele Varianten** — Nutzer generiert 13+ Varianten und kann nicht entscheiden         | LOW      | Maximal 5 Varianten pro Lauf (Q2-Entscheidung). Hinweis bei >5 ausgewählten Profilen.                                                                                                                                                          |
| **R7** | **Verwechslung Optimieren vs. Varianten erzeugen** — Nutzer versteht Unterschied nicht     | MEDIUM   | Unterschiedliche Button-Labels („✨ Optimieren“ vs. „🧭 Varianten erzeugen“). Unterschiedliche Icons. Tooltips. Help-Text im VariantPanel: „Anders als die Optimierung verändert die Variantenerzeugung die Zielrichtung, nicht die Struktur.“ |
| **R8** | **Performance-Degradation** — VariantGenerator verlangsamt die App                         | LOW      | Generator ist template-basiert und synchron (<10ms pro Variante). Max. 5 Varianten = <50ms gesamt. Kein Netzwerk, keine Festplatten-I/O.                                                                                                       |
| **R9** | **enrichedContent-Staleness** — enrichedContent veraltet, während VariantPanel offen ist   | LOW      | `analyzeSelected()` invalidiert `enrichedContexts`. VariantPanel zeigt Quelle an. Wenn enrichedContent nicht mehr existiert, fällt Generator auf `prompt.content` zurück.                                                                      |

---

## 11. Abhängigkeiten zu #216

### 11.1 Was #215 aus #216 nutzt (readonly)

| Artefakt                                                                        | Art der Nutzung                                            | #215 Modul                          |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------- |
| `constraintChecker.ts` — `extractHardConstraints()`                             | Wird von `variantGenerator.ts` aufgerufen                  | `variantGenerator.ts`               |
| `constraintChecker.ts` — `buildResolutionOptions()`                             | Wird von `checkDirectionProfileConflicts()` genutzt        | `constraintChecker.ts` (Phase 2)    |
| `types/index.ts` — `ConstraintCategory`, `HardConstraint`, `ConstraintConflict` | Werden in neuen Interfaces verwendet                       | `types/index.ts` (Stage 1)          |
| `types/index.ts` — `DirectionProfileReference`                                  | Wird zu `DirectionProfile` erweitert (nicht ersetzt)       | `types/index.ts` (Stage 1)          |
| `types/index.ts` — `EnrichedPromptContext`                                      | Wird als Input-Typ für `enrichedContentUsed` verwendet     | `variantGenerator.ts`               |
| `appStore.ts` — `enrichedContexts[promptId]`                                    | Wird als optionaler Input für `generateVariants()` gelesen | `appStore.ts` (Stage 6)             |
| `missingInfoFeatureFlag.ts`                                                     | Pattern wird kopiert (nicht importiert)                    | `directionFeatureFlag.ts` (Stage 2) |

### 11.2 Was #215 NICHT aus #216 nutzt

| Artefakt                            | Grund                                              |
| ----------------------------------- | -------------------------------------------------- |
| `missingInfoDetector.ts`            | #215 erkennt keine fehlenden Informationen         |
| `missingInfoClassifier.ts`          | #215 klassifiziert keine Lücken                    |
| `gateContentMerger.ts`              | #215 merged keine Antworten                        |
| `MissingInfoGate.tsx`               | #215 hat eigene UI (VariantPanel)                  |
| `MissingInfoSession`                | #215 hat eigenen State (`VariantGenerationResult`) |
| `GateSessionStatus` / `GateOutcome` | Irrelevant für Varianten-Generierung               |

### 11.3 #215 baut kein eigenes Missing-Info-Gate

- Keine Gap-Detection
- Keine Klassifizierung
- Kein Content-Merging
- Keine Session-Verwaltung
- Keine Frage-Formulare

---

## 12. Plan-Abschluss

### Status

- **Spec:** ✅ Abgeschlossen (`docs/specs/0215-direction-profiles/spec.md`, 835 Zeilen, 27 ACs)
- **Plan:** ✅ Abgeschlossen (dieses Dokument)
- **Owner-Entscheidungen:** ✅ Alle 10 Fragen bestätigt (Q1–Q10)
- **Nächster Schritt:** `/speckit.tasks #215` — atomare Tasks aus diesem Plan ableiten

### Offene Punkte

- Keine. Alle Spec-Fragen sind durch Owner-Entscheidungen geklärt.

### Geschätzte Gesamtzeilen (Code + Tests)

| Kategorie                                                                               | Zeilen (ca.) |
| --------------------------------------------------------------------------------------- | ------------ |
| Types                                                                                   | 150          |
| Libraries (featureFlag, directionProfiles, variantGenerator, constraintChecker Phase 2) | 895          |
| UI-Komponenten                                                                          | 1100         |
| Store + DetailsPanel                                                                    | 300          |
| Unit-Tests                                                                              | 1200         |
| UI-Tests                                                                                | 1600         |
| Integrationstests                                                                       | 1200         |
| Docs                                                                                    | 300          |
| **Gesamt**                                                                              | **~6745**    |

### Geschätzte Testanzahl

| Kategorie                   | Tests (ca.)              |
| --------------------------- | ------------------------ |
| Unit-Tests                  | 92                       |
| UI-Tests                    | 80                       |
| Integrationstests           | 40                       |
| Bestehende Regressionstests | ~316 (aus #216 Baseline) |
| **Gesamt neu**              | **~212**                 |

---

## Referenzen

- **Spec:** `docs/specs/0215-direction-profiles/spec.md`
- **Issue #215:** https://github.com/xxammaxx/promptvault-lite/issues/215
- **Epic #214:** https://github.com/xxammaxx/promptvault-lite/issues/214
- **Issue #216 (abgeschlossen):** https://github.com/xxammaxx/promptvault-lite/issues/216
- **ADR-002:** `docs/DECISIONS.md` (Zeilen 31–143)
- **0216 Spec:** `docs/specs/0216-missing-info-gate/spec.md`
- **0216 Evidence:** `docs/specs/0216-missing-info-gate/evidence.md`
- **Compliance Analysis:** `.opencode/reports/compliance/0215-constraint-preservation-safety-spec.md`
- **missingInfoFeatureFlag.ts:** `src/lib/missingInfoFeatureFlag.ts` (Pattern-Referenz)
- **DetailsPanel.tsx:** `src/components/details/DetailsPanel.tsx` (Integrations-Pattern)
