# Spec: Direction Profiles — Varianten erzeugen / Richtung des Ergebnisses variieren

> **Issue:** [#215](https://github.com/xxammaxx/promptvault-lite/issues/215)
> **Epic:** [#214](https://github.com/xxammaxx/promptvault-lite/issues/214) — Prompt-Optimierung mit Ergebnisvarianten und dynamischen Rückfragen
> **ADR:** ADR-003 in `docs/DECISIONS.md`
> **Speckit Phase:** Specify
> **Status:** Accepted
> **Date:** 2026-07-11
> **Author:** Issue Orchestrator (via Speckit Workflow)
> **Builds on:** [#216](https://github.com/xxammaxx/promptvault-lite/issues/216) — Missing-Info-Gate (abgeschlossen, Commit `568cd2b`)

---

## 1. Feature-Ziel

Das Feature **Direction Profiles** soll aus einem bestehenden Prompt **mehrere strategische Ergebnisvarianten** mit unterschiedlichen Zielrichtungen erzeugen, **ohne harte Constraints zu entfernen oder zu schwächen**. Es erweitert das Prompt-Archiv um eine gezielte Richtungssteuerung: Aus einem Prompt entstehen Varianten für verschiedene Zielgruppen, Tonalitäten, Detailtiefen und Einsatzzwecke — während Sicherheitsregeln, Local-Only-Garantien und Human-Approval-Vorgaben unangetastet bleiben.

Das Feature ist eine **parallele, unabhängige Transformationsschicht** zum bestehenden Optimizer. Es baut auf den Ergebnissen des Missing-Info-Gates (#216) auf und nutzt `constraintChecker.ts` als shared readonly-Infrastruktur.

---

## 2. Nutzerproblem

Ein Prompt ist nicht nur „gut“ oder „schlecht“. Er kann je nach **Zielrichtung** unterschiedlich sinnvoll sein:

- **Sachlich** für neutrale Zusammenfassungen oder Dokumentation
- **Verkaufsstark** für Produkttexte oder Pitches
- **Technisch** für Entwickler-Dokumentation oder API-Referenzen
- **Kurz** für Social Media oder Kurznachrichten
- **Ausführlich** für Deep-Research- oder Analyse-Aufgaben
- **Kreativ** für Brainstorming, Storytelling oder Marketing
- **Kritisch prüfend** für Reviews, Audits oder Risikoanalysen
- **Compliance-/Sicherheitsmodus** für regulatorische Kontexte
- **Agentisch** für autonome Agenten-Prompts
- **Anfängerfreundlich** vs. **Expertenmodus** für unterschiedliche Zielgruppen

Derzeit kann der Nutzer einen Prompt nur optimieren (Qualität verbessern) oder strukturell anpassen. Eine **gezielte Änderung der Ergebnisrichtung** ist nicht möglich. Das Direction-Profiles-Feature schließt diese Lücke.

---

## 3. Abgrenzung zu #216 (Missing-Info-Gate)

| Aspekt                | #216 Missing-Info-Gate                                    | #215 Direction Profiles                                     |
| --------------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| **Aufgabe**           | Fehlende Informationen erkennen und strukturiert erfragen | Gezielte Ergebnisrichtungen aus Prompt erzeugen             |
| **Ergebnis**          | `EnrichedPromptContext` mit Nutzer-Antworten              | `PromptVariant[]` mit gerichteten Prompt-Texten             |
| **Trigger**           | Automatisch bei REQUIRED-Lücken ODER manuell via Button   | Manuell via Button „Varianten erzeugen“                     |
| **UI**                | Modal mit Frage-Formular (Freitext, Chips, Toggle)        | Modal mit Profilauswahl (Chip-Grid) + Variantenliste        |
| **Constraints**       | Prüft Nutzerantworten gegen Constraints                   | Prüft Profile gegen Constraints                             |
| **Speichern**         | Keine Persistenz (Session-Only)                           | Varianten können als neue Prompt-Version gespeichert werden |
| **Pipeline-Position** | Zwischen Analyse und Transformation                       | Parallel zum Optimizer (nach Gate)                          |

### Was #215 aus #216 wiederverwendet

- `constraintChecker.ts`: `extractHardConstraints()`, `buildResolutionOptions()` (readonly, shared)
- `types/index.ts`: `ConstraintCategory`, `HardConstraint`, `ConstraintConflict`, `DirectionProfileReference` (wird zu `DirectionProfile` erweitert)
- `appStore.ts`: `enrichedContexts[promptId]` als optionaler Input für die Generierung
- `DetailsPanel.tsx`: `optimizerContent`-Ableitungsmuster (original vs. enriched)
- `missingInfoFeatureFlag.ts`: Feature-Flag-Pattern (für `PROMPTVAULT_DIRECTION_PROFILES`)

### Was #215 NICHT dupliziert

- ❌ Keine eigene Gap-Detection (`missingInfoDetector.ts`)
- ❌ Keine eigene Klassifizierung (`missingInfoClassifier.ts`)
- ❌ Kein eigenes Content-Merging (`gateContentMerger.ts`)
- ❌ Keine eigene Missing-Info-Gate-UI (`MissingInfoGate.tsx`)
- ❌ Keine eigene Session-Verwaltung (`MissingInfoSession`)
- ❌ Kein neuer Missing-Info-Gate-State im Store

---

## 4. Kernfluss

```
1. Nutzer wählt Prompt aus (Datei-Modus oder Paste-Modus)
         │
2. Analyse-Pipeline läuft (bestehend):
   - classifyContent(), evaluatePromptContext(), evaluateBlueprint()
         │
3. Optional: Missing-Info-Gate (#216)
   - Nutzer ergänzt fehlende Informationen
   - → enrichedContexts[promptId] wird im Store abgelegt
         │
4. Nutzer klickt „🧭 Varianten erzeugen“ in der ActionBar
         │
5. VariantPanel öffnet sich als Modal:
   ├── DirectionProfileSelector: Chip-Grid mit verfügbaren Profilen
   ├── Option: Benutzerdefinierte Richtung (Freitext)
   ├── Anzeige: Welche Constraints sind aktiv?
   └── Button: „Varianten generieren“
         │
6. Nutzer wählt ein oder mehrere Profile aus
         │
7. System prüft: Profil vs. Constraints
   - extractHardConstraints(promptContent) → HardConstraint[]
   - checkDirectionProfileConflicts(profile, constraints) → ConstraintConflict[]
   - Bei BLOCKING-Konflikten: Warnung, Generierung wird NICHT blockiert
   - Bei WARNING-Konflikten: Hinweis, Generierung läuft normal
         │
8. System erzeugt Varianten:
   - Input: originalContent ODER enrichedContexts[promptId].enrichedContent
   - applyDirectionProfile(content, profile) → string
   - Ergebnis: PromptVariant[] mit Metadata
         │
9. Variantenliste wird angezeigt:
   Jede Variante zeigt:
   ├── Titel + Richtung (Label + Kurzbeschreibung)
   ├── Generierter Prompt-Text (vollständig)
   ├── Erhaltene Constraints (unverändert aus Original)
   ├── Verwendete Annahmen / offene Punkte
   ├── Konflikte oder Review-Hinweise (falls vorhanden)
   └── Empfehlung: Wofür ist diese Variante geeignet?
         │
10. Nutzer-Aktionen pro Variante:
    ├── 💾 Als neue Prompt-Version speichern
    ├── ↔️ Mit Ursprung vergleichen (Side-by-Side-Diff)
    └── 📋 In Zwischenablage kopieren
```

### Pipeline-Position (ADR-003-konform)

```
Analyse → Missing-Info-Gate → ┬→ Optimierung (bestehend: conservative/balanced/aggressive)
                               └→ Variantenbildung (#215: Direction Profiles)
                                    │
                          (beide konsumieren enrichedContent/analysis;
                           parallele, unabhängige Pfade)
```

---

## 5. Direction Profiles

### 5.1 Vordefinierte Profile

| #   | Profile ID       | Label                          | Kategorie        | Beschreibung                                                                                                          |
| --- | ---------------- | ------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | `sachlich`       | Sachlich / Neutral             | `sachlich`       | Neutrale, objektive Formulierung. Geeignet für Dokumentation, Berichte, Zusammenfassungen.                            |
| 2   | `verkaeuferisch` | Verkaufsstark / Überzeugend    | `verkaeuferisch` | Überzeugende, handlungsorientierte Sprache. Geeignet für Produkttexte, Pitches, Marketing.                            |
| 3   | `technisch`      | Technisch / Präzise            | `technisch`      | Technisch präzise Sprache mit Fachbegriffen. Geeignet für Entwickler-Dokumentation, API-Referenzen, Code-Reviews.     |
| 4   | `kurz`           | Kurz / Prägnant                | `sachlich`       | Maximal komprimiert. Geeignet für Social Media, Kurznachrichten, Status-Updates.                                      |
| 5   | `ausfuehrlich`   | Ausführlich / Detailliert      | `sachlich`       | Umfassende Darstellung mit Kontext und Begründungen. Geeignet für Analysen, Research, Dokumentation.                  |
| 6   | `kreativ`        | Kreativ / Inspirierend         | `kreativ`        | Kreative, assoziative Sprache. Geeignet für Brainstorming, Storytelling, Ideenfindung.                                |
| 7   | `kritisch`       | Kritisch prüfend               | `sachlich`       | Hinterfragende, risiko-bewusste Perspektive. Geeignet für Reviews, Audits, Risikoanalysen.                            |
| 8   | `anfaenger`      | Anfängerfreundlich             | `sachlich`       | Einfache Sprache, erklärt Begriffe. Geeignet für Einsteiger, Tutorials, Onboarding.                                   |
| 9   | `experte`        | Expertenmodus                  | `technisch`      | Setzt Fachwissen voraus, keine Erklärungen von Grundbegriffen. Geeignet für Fachpublikum.                             |
| 10  | `deep_research`  | Deep-Research-orientiert       | `technisch`      | Tiefgehende Analyse mit Quellenangaben, Methodik und Unsicherheiten. Geeignet für wissenschaftliche Research-Prompts. |
| 11  | `agentisch`      | Agenten-/Implementierungsmodus | `technisch`      | Ausführbare Anweisungen für autonome Agenten. Geeignet für CI/CD, Automatisierung, Agent-Workflows.                   |
| 12  | `compliance`     | Compliance-/Sicherheitsmodus   | `sachlich`       | Regulatorisch korrekt, sicherheitsbewusst. Geeignet für DSGVO, Audit, Security-Reviews.                               |
| 13  | `custom`         | Benutzerdefiniert              | `custom`         | Vom Nutzer definierte Richtung (Freitext).                                                                            |

### 5.2 Profile und Constraints

Jedes Profil deklariert, mit welchen Constraint-Kategorien es kompatibel ist und mit welchen es kollidiert:

| Profil           | Kompatibel mit                 | Kollidiert mit                                                         |
| ---------------- | ------------------------------ | ---------------------------------------------------------------------- |
| `sachlich`       | Alle                           | — (universell kompatibel)                                              |
| `verkaeuferisch` | Alle außer `no_examples`       | `no_examples` (WARNING)                                                |
| `technisch`      | Alle                           | —                                                                      |
| `kurz`           | Alle                           | `max_length` (WARNING: Länge wird respektiert)                         |
| `ausfuehrlich`   | Alle außer `max_length`        | `max_length` (WARNING: wird auf Maximalwert begrenzt)                  |
| `kreativ`        | Alle                           | `no_examples` (WARNING), `format_lock` (WARNING)                       |
| `kritisch`       | Alle                           | —                                                                      |
| `anfaenger`      | Alle                           | —                                                                      |
| `experte`        | Alle                           | —                                                                      |
| `deep_research`  | Alle außer `offline_only`      | `offline_only` (BLOCKING: benötigt ggf. Cloud-Recherche)               |
| `agentisch`      | Alle außer `approval_required` | `approval_required` (BLOCKING: autonome Ausführung vs. Human Approval) |
| `compliance`     | Alle                           | — (respektiert alle Constraints besonders strikt)                      |

### 5.3 Benutzerdefinierte Richtung

Der Nutzer kann eine eigene Richtung als Freitext definieren. Dabei gilt:

- Der Text wird als `promptPrefix` in den Varianten-Prompt eingefügt
- Es findet KEINE automatische Constraint-Prüfung statt (da das Profil nicht bekannt ist)
- Alle harten Constraints bleiben trotzdem erhalten (der Freitext wird NIE in den Original-Prompt injiziert)
- Ein Hinweis: „⚠️ Für benutzerdefinierte Richtungen kann keine automatische Constraint-Prüfung durchgeführt werden. Bitte prüfen Sie das Ergebnis manuell auf Konflikte mit bestehenden Regeln.“

---

## 6. Datenmodell

### 6.1 DirectionProfile (Erweiterung von DirectionProfileReference)

```typescript
/**
 * Vollständiges Direction Profile.
 * Erweitert den bestehenden DirectionProfileReference-Typ aus types/index.ts.
 */
export interface DirectionProfile {
  /** Eindeutige ID (z.B. "sachlich", "technisch"). */
  profileId: string;

  /** Menschenlesbares Label (z.B. "Sachlich / Neutral"). */
  label: string;

  /** Kurzbeschreibung für Tooltip/Info. */
  description: string;

  /** Kategorie für Gruppierung/Filterung. */
  category: "sachlich" | "verkaeuferisch" | "technisch" | "kreativ" | "custom";

  /** Instruction-Präfix, der dem Prompt vorangestellt wird. */
  promptPrefix: string;

  /** Constraint-Kategorien, mit denen dieses Profil kompatibel ist. */
  compatibleConstraintCategories: ConstraintCategory[];

  /** Constraint-Kategorien, die mit diesem Profil kollidieren. */
  conflictingConstraintCategories: ConstraintCategory[];

  /** Empfehlungstext: Wofür ist dieses Profil geeignet? */
  recommendation: string;
}
```

### 6.2 DirectionProfileId

```typescript
/** Vordefinierte Profil-IDs (als Union-Type für Type-Safety). */
export type DirectionProfileId =
  | "sachlich"
  | "verkaeuferisch"
  | "technisch"
  | "kurz"
  | "ausfuehrlich"
  | "kreativ"
  | "kritisch"
  | "anfaenger"
  | "experte"
  | "deep_research"
  | "agentisch"
  | "compliance"
  | "custom";
```

### 6.3 DirectionProfileSelection

```typescript
/** Nutzer-Auswahl: ein oder mehrere Profile + optionaler Custom-Text. */
export interface DirectionProfileSelection {
  /** Ausgewählte Profil-IDs. */
  selectedProfileIds: DirectionProfileId[];

  /** Benutzerdefinierter Richtungstext (nur wenn "custom" ausgewählt). */
  customDirectionText?: string;
}
```

### 6.4 PromptVariant

```typescript
/** Eine einzelne generierte Prompt-Variante. */
export interface PromptVariant {
  /** Eindeutige Varianten-ID. */
  variantId: string;

  /** Referenz auf das verwendete Direction Profile. */
  profileId: string;

  /** Label der Variante (z.B. "Sachlich / Neutral"). */
  label: string;

  /** Der vollständige, generierte Varianten-Prompt. */
  content: string;

  /** Kurzbeschreibung der Zielrichtung. */
  directionExplanation: string;

  /** Welche harten Constraints wurden aus dem Original erhalten? */
  preservedConstraints: PreservedConstraintReference[];

  /** Aufgetretene Konflikte (falls vorhanden). */
  conflicts: VariantConflict[];

  /** Verwendete Annahmen (was das System ergänzt/interpretiert hat). */
  assumptions: string[];

  /** Offene Punkte / Risiken (falls vorhanden). */
  openPoints: string[];

  /** Empfehlung: Wofür ist diese Variante geeignet? */
  recommendation: string;

  /** Metadata. */
  metadata: {
    generatedAt: string;
    sourceContent: "original" | "enriched"; // Wurde enrichedContent verwendet?
    appliedProfileId: string;
  };
}
```

### 6.5 VariantGenerationResult

```typescript
/** Ergebnis einer Variantengenerierung. */
export interface VariantGenerationResult {
  /** Ursprungs-Prompt (original ODER enriched). */
  sourceContent: string;

  /** Wurde enrichedContent verwendet? */
  enrichedContentUsed: boolean;

  /** Alle generierten Varianten. */
  variants: PromptVariant[];

  /** Aufgetretene Profil-Konflikte. */
  profileConflicts: ConstraintConflict[];

  /** Zeitstempel der Generierung. */
  appliedAt: string;
}
```

### 6.6 VariantConflict

```typescript
/** Ein Konflikt zwischen einem Direction Profile und einem Constraint. */
export interface VariantConflict {
  /** Eindeutige ID. */
  id: string;

  /** Betroffenes Profil. */
  profileId: string;

  /** Betroffener Constraint. */
  constraint: HardConstraint;

  /** Beschreibung des Konflikts. */
  description: string;

  /** Schweregrad. */
  severity: "blocking" | "warning";

  /** Wie wurde der Konflikt behandelt? */
  resolution:
    | "constraint_preserved"
    | "profile_adjusted"
    | "manual_review"
    | "ignored";
}
```

### 6.7 VariantRecommendation

```typescript
/** Empfehlung für die Verwendung einer Variante. */
export interface VariantRecommendation {
  /** Für welchen Einsatzzweck? */
  useCase: string;

  /** Für welche Zielgruppe? */
  targetAudience: string;

  /** Risikohinweise (falls vorhanden). */
  cautions: string[];
}
```

### 6.8 PreservedConstraintReference

```typescript
/** Referenz auf einen erhaltenen Constraint in einer Variante. */
export interface PreservedConstraintReference {
  /** ID des ursprünglichen Constraints. */
  constraintId: string;

  /** Text des Constraints. */
  constraintText: string;

  /** Kategorie. */
  category: ConstraintCategory;

  /** Wurde der Constraint durch das Profil beeinflusst? */
  affectedByProfile: boolean;
}
```

### 6.9 Store-Erweiterung (appStore.ts)

```typescript
// Neue State-Felder im AppState:
interface DirectionProfilesState {
  /** Varianten-Ergebnisse pro promptId. */
  variantResults: Record<string, VariantGenerationResult>;

  /** UI-Zustand. */
  showVariantPanel: boolean;
  activeVariantPromptId: string | null;
  selectedProfileIds: DirectionProfileId[];
  isGeneratingVariants: boolean;
}

// Neue Actions:
// openVariantPanel(promptId: string): void;
// closeVariantPanel(): void;
// generateVariants(promptId: string, selection: DirectionProfileSelection): Promise<void>;
// selectProfile(profileId: DirectionProfileId): void;
// toggleProfileSelection(profileId: DirectionProfileId): void;
// clearVariantResults(promptId: string): void;
```

---

## 7. Constraint Preservation

### 7.1 Prinzipien

1. **Harte Constraints** (alle 8 Kategorien aus `constraintChecker.ts`) bleiben in **jeder** Variante **unverändert** erhalten.
2. **Local-only / Privacy / Human Approval / Scope Boundary** haben **Vorrang** vor Profil-Wünschen.
3. Varianten dürfen Constraints **nicht stillschweigend** entfernen, abschwächen oder umgehen.
4. **Konflikte** zwischen Profil und Constraint werden **sichtbar** — im VariantPanel, in der Variantenkarte und im VariantCompare.
5. Konflikte werden **nicht automatisch** gelöst. Der Nutzer entscheidet.
6. Der **Original-Prompt bleibt unverändert** — Varianten sind neue Strings, die den Original-Content nie mutieren.

### 7.2 Security-Kategorien (nicht abschwächbar)

Drei Constraint-Kategorien gelten als **security-kritisch** und können **niemals** durch ein Profil abgeschwächt werden (identisch zu #216):

| Kategorie           | Warum kritisch               | Bei Konflikt                                                                                                                      |
| ------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `offline_only`      | Local-First-Privacy-Garantie | BLOCKING: Variante wird MIT Constraint generiert; Warnung: „Profil 'Deep Research' wurde angepasst — Cloud-Nutzung entfernt.“     |
| `approval_required` | Human-Approval-Regel         | BLOCKING: Variante wird MIT Constraint generiert; Warnung: „Profil 'Agentisch' wurde angepasst — Human Approval bleibt erhalten.“ |
| `scope_boundary`    | Scope-Disziplin              | BLOCKING: Variante wird MIT Constraint generiert; Warnung: „Scope Boundary unverändert.“                                          |

### 7.3 Konfliktbeispiele

| Constraint im Prompt      | Gewähltes Profil | Konflikt-Schwere                         | Behandlung                                                                                   |
| ------------------------- | ---------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| „Keine Cloud verwenden“   | `deep_research`  | BLOCKING                                 | Variante generiert, aber ohne Cloud-Recherche-Hinweise. Warnung im UI.                       |
| „Maximal 200 Wörter“      | `ausfuehrlich`   | WARNING                                  | Variante auf 200 Wörter begrenzt. Hinweis: „Ausführlichkeit durch Constraint eingeschränkt.“ |
| „Keine Beispiele“         | `verkaeuferisch` | WARNING                                  | Variante generiert ohne Beispiele. Hinweis im UI.                                            |
| „Nur auf Deutsch“         | (jedes Profil)   | BLOCKING (wenn Profil Englisch triggert) | Sprache bleibt Deutsch.                                                                      |
| „Human Approval Required“ | `agentisch`      | BLOCKING                                 | Variante behält Human-Approval-Schritt.                                                      |
| „Keine neuen Dateien“     | `agentisch`      | BLOCKING                                 | Scope bleibt erhalten.                                                                       |

### 7.4 Erweiterung constraintChecker.ts (Phase 2)

Neue Export-Funktion in `src/lib/constraintChecker.ts`:

```typescript
/**
 * Check direction profile compatibility against extracted hard constraints.
 *
 * @param profile       Das ausgewählte Direction Profile.
 * @param constraints   Aus dem Prompt extrahierte harte Constraints.
 * @returns Array von ConstraintConflict-Objekten. Leer wenn kompatibel.
 */
export function checkDirectionProfileConflicts(
  profile: DirectionProfile,
  constraints: HardConstraint[],
): ConstraintConflict[];
```

**Algorithmus:**

1. Iteriere über alle `constraints`
2. Wenn `constraint.category` in `profile.conflictingConstraintCategories`: BLOCKING-Konflikt
3. Wenn `constraint.category` in `SECURITY_CATEGORIES` und das Profil diese Kategorie normalerweise abschwächen würde: BLOCKING-Konflikt mit `require_human_approval`
4. Für alle anderen Constraints: WARNING-Konflikt (z.B. `max_length` + `ausfuehrlich`)
5. Erzeuge `ConstraintConflict`-Objekte mit `buildResolutionOptions()`

### 7.5 System-Invarianten (programmatisch prüfbar)

| #   | Invariante                                    | Assertion                                                                                                        |
| --- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| A1  | Original-Prompt unverändert                   | `variant.metadata.sourceContent === "original" ? variant.content !== prompt.content : true`                      |
| A2  | Harte Constraints erhalten                    | `extractHardConstraints(variant.content)` enthält alle Constraints aus `extractHardConstraints(originalContent)` |
| A3  | Keine Cloud-API-Referenzen bei `offline_only` | `variant.content` enthält keine Cloud/API-Keywords, wenn Constraint vorhanden                                    |
| A4  | Keine stille Constraint-Entfernung            | Jeder erhaltene Constraint ist in `variant.preservedConstraints[]` gelistet                                      |
| A5  | Varianten sind neue Strings                   | `variant.content !== sourceContent` (es sei denn, das Profil hat keine Änderung bewirkt)                         |

---

## 8. UI-Anforderungen

### 8.1 ActionBar-Erweiterung

In der bestehenden ActionBar (DetailsPanel.tsx) erscheint ein neuer Button:

```
[ ✨ Optimieren ]  [ 📋 Blueprint ]  [ 🧭 Varianten erzeugen ]  [ ❓ Fehlende Infos ]
```

- Button-Label: **„🧭 Varianten erzeugen“** (zur Diskussion: alternativ „Richtung variieren“)
- Position: nach dem Optimieren-Button, vor dem Missing-Info-Button
- Zustand: deaktiviert wenn `isAnalyzing === true` ODER `isGateOpen === true`
- Feature-Flag: Button nur sichtbar wenn `PROMPTVAULT_DIRECTION_PROFILES` aktiviert ist

### 8.2 VariantPanel (Modal)

Das VariantPanel folgt dem gleichen Modal-Pattern wie `OptimizationPanel.tsx` und `MissingInfoGate.tsx`:

```
┌──────────────────────────────────────────────────────────────┐
│  🧭 Varianten erzeugen — Richtungsprofile                ✕  │
│                                                              │
│  ℹ️ Wählen Sie eine oder mehrere Ergebnisrichtungen.         │
│  Jede Richtung erzeugt eine eigene Prompt-Variante.          │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Verfügbare Richtungen:                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 📄       │ │ 💰       │ │ ⚙️       │ │ 📏       │       │
│  │ Sachlich │ │ Verkaufs-│ │ Technisch│ │ Kurz     │       │
│  │          │ │ stark    │ │          │ │          │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 📚       │ │ 🎨       │ │ 🔍       │ │ 🌱       │       │
│  │ Ausführ- │ │ Kreativ  │ │ Kritisch │ │ Anfänger │       │
│  │ lich     │ │          │ │ prüfend  │ │          │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 🎓       │ │ 🔬       │ │ 🤖       │ │ 🛡️       │       │
│  │ Experte  │ │ Deep     │ │ Agenten- │ │ Compli-  │       │
│  │          │ │ Research │ │ Modus    │ │ ance     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  ─── Benutzerdefinierte Richtung ───                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [Freitext: „Erkläre es wie für einen 10-Jährigen“]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ⚠️ Aktive Constraints:                                      │
│  • offline_only: „Keine Cloud verwenden“                     │
│  • language: „Nur auf Deutsch“                               │
│                                                              │
│  [ Varianten generieren ]  (deaktiviert wenn kein Profil     │
│                              ausgewählt)                     │
└──────────────────────────────────────────────────────────────┘
```

### 8.3 DirectionProfileSelector (Chip-Grid)

- **Grid-Layout:** 4 Spalten, responsiv
- **Chips:** Kacheln mit Icon, Label, Tooltip (description bei hover)
- **Auswahl:** Multi-Select (mehrere Profile gleichzeitig)
- **Visuelles Feedback:** Ausgewählte Chips haben farbigen Border (primary color)
- **Kategorien:** Gruppiert nach `category` (sachlich, verkaeuferisch, technisch, kreativ)
- **Custom-Chip:** Immer vorhanden, triggert Freitext-Eingabe

### 8.4 Variantenliste (VariantResultList)

Nach der Generierung erscheint die Ergebnisliste:

```
┌──────────────────────────────────────────────────────────────┐
│  ✅ 3 Varianten erzeugt                                      │
│  ℹ️ Quelle: enrichedContent (Missing-Info-Gate)              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📄 Sachlich / Neutral                                 │   │
│  │                                                       │   │
│  │ Geeignet für: Dokumentation, Berichte, neutrale       │   │
│  │ Zusammenfassungen.                                    │   │
│  │                                                       │   │
│  │ Erhaltene Constraints:                                │   │
│  │ ✅ offline_only: „Keine Cloud verwenden“              │   │
│  │ ✅ language: „Nur auf Deutsch“                        │   │
│  │                                                       │   │
│  │ Annahmen:                                             │   │
│  │ • Zielgruppe: Allgemein                               │   │
│  │ • Keine spezifischen Formatierungsvorgaben            │   │
│  │                                                       │   │
│  │ ⚠️ Keine Konflikte                                    │   │
│  │                                                       │   │
│  │ [ 💾 Als neue Version speichern ]                    │   │
│  │ [ ↔️ Mit Original vergleichen ]                      │   │
│  │ [ 📋 Kopieren ]                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 💰 Verkaufsstark / Überzeugend                        │   │
│  │ ... (gleiche Struktur) ...                            │   │
│  │                                                       │   │
│  │ ⚠️ Konflikt: „no_examples“                            │   │
│  │ → Variante wurde ohne Beispiele generiert.            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🔬 Deep-Research-orientiert                           │   │
│  │ ... (gleiche Struktur) ...                            │   │
│  │                                                       │   │
│  │ ⚠️ Konflikt (BLOCKING): „offline_only“                │   │
│  │ → Cloud-Recherche-Hinweise wurden entfernt.            │   │
│  │ → Variante bleibt Local-only.                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [ ✕ Schließen ]                                            │
└──────────────────────────────────────────────────────────────┘
```

### 8.5 VariantCompare (Side-by-Side-Diff)

Bei Klick auf „↔️ Mit Original vergleichen“ öffnet sich eine Vergleichsansicht:

```
┌──────────────────────────────────────────────────────────────┐
│  ↔️ Vergleich: Original ↔ Sachlich / Neutral             ✕  │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  ┌───────────────────────┐ ┌──────────────────────────────┐ │
│  │ Original              │ │ Sachlich / Neutral           │ │
│  │                       │ │                              │ │
│  │ Du bist ein hilf-    │ │ Du bist ein Assistent für    │ │
│  │ reicher Assistent.   │ │ sachliche, neutrale Dar-     │ │
│  │ Schreibe einen Text  │ │ stellungen. Schreibe einen   │ │
│  │ über ...              │ │ sachlichen Text über ...     │ │
│  │                       │ │                              │ │
│  │ Constraints: ✅       │ │ Constraints: ✅              │ │
│  └───────────────────────┘ └──────────────────────────────┘ │
│                                                              │
│  ─── Änderungen ───                                         │
│  • PromptPrefix hinzugefügt                                  │
│  • Keine Constraints verändert                               │
│                                                              │
│  [ 💾 Variante speichern ]  [ ✕ Schließen ]                 │
└──────────────────────────────────────────────────────────────┘
```

### 8.6 Nutzung von enrichedContent

Wenn für den gewählten Prompt ein `EnrichedPromptContext` im Store existiert (Gate wurde durchlaufen):

- **Input für die Variantengenerierung:** `enrichedContexts[promptId].enrichedContent`
- **Anzeige im VariantPanel:** „ℹ️ Quelle: enrichedContent (Missing-Info-Gate) — Ihre Ergänzungen wurden berücksichtigt.“
- **Anzeige in Varianten:** `metadata.sourceContent: "enriched"`
- **Gate-Outcome-Anzeige:** Die verwendeten Antworten/Annahmen aus dem Gate werden als „Verwendete Zusatzinformationen“ in der Variantenkarte angezeigt.

Wenn KEIN enrichedContent existiert (Gate nicht durchlaufen oder übersprungen):

- **Input:** `prompt.content` (Original-Prompt)
- **Anzeige:** „ℹ️ Quelle: Original-Prompt“
- **Hinweis:** „Tipp: Nutzen Sie vorher ‚❓ Fehlende Infos prüfen‘, um den Prompt mit Kontext anzureichern.“

---

## 9. Nicht-Ziele (Out of Scope)

> **Dieser Spec-Lauf startet NUR die Spezifikation. Keine Implementierung.**

- ❌ **Keine Implementierung** in diesem Lauf — dies ist `/speckit.specify`, nicht `/speckit.implement`
- ❌ **Keine erneute Missing-Info-Gate-Implementierung** — #216 ist abgeschlossen und unverändert
- ❌ **Keine Cloud-Pflicht** — Variantengenerierung bleibt lokal/deterministisch
- ❌ **Keine automatische Constraint-Überschreibung** — Nutzer muss Konflikte explizit behandeln
- ❌ **Keine persistente Nutzerpräferenz** „als Standard merken“ in Phase 1
- ❌ **Kein Batch-Flow** — Varianten nur für selektierten Einzel-Prompt
- ❌ **Keine Remote-CI / GitHub Actions** — `REMOTE_CI_INFRA_BLOCKED` (#154)
- ❌ **Keine automatische Variantenspeicherung** — Nutzer speichert explizit
- ❌ **Kein Varianten-Scoring / Ranking** (Phase 2)
- ❌ **Keine Persistenz von Varianten über App-Neustarts** — Session-Only (analog zu #216)
- ❌ **Keine Remote-LLM-API-Calls** — `variantGenerator.ts` ist template-basiert
- ❌ **Keine Veränderung der Missing-Info-Gate-Schicht** — `missingInfoDetector.ts`, `missingInfoClassifier.ts`, `gateContentMerger.ts`, `MissingInfoGate.tsx` bleiben unverändert

---

## 10. Akzeptanzkriterien

### UI

- [ ] **AC-01:** Button „🧭 Varianten erzeugen“ erscheint in der ActionBar (neben Optimieren)
- [ ] **AC-02:** Button ist deaktiviert wenn `isAnalyzing === true` oder `isGateOpen === true`
- [ ] **AC-03:** Button ist nur sichtbar wenn Feature-Flag `PROMPTVAULT_DIRECTION_PROFILES` aktiviert ist
- [ ] **AC-04:** Mindestens 12 vordefinierte Profile sind auswählbar
- [ ] **AC-05:** Benutzerdefinierte Richtung (Freitext) ist möglich
- [ ] **AC-06:** VariantPanel öffnet sich als Modal mit Profil-Chip-Grid
- [ ] **AC-07:** Varianten werden nach Generierung als Liste mit vollständigen Metadaten angezeigt

### Generierung

- [ ] **AC-08:** Varianten nutzen `enrichedContent`, falls vorhanden (Gate durchlaufen)
- [ ] **AC-09:** Varianten nutzen `prompt.content`, falls kein enrichedContent existiert
- [ ] **AC-10:** `applyDirectionProfile()` erzeugt einen neuen String — Original wird nie mutiert
- [ ] **AC-11:** VariantGenerator arbeitet vollständig lokal und deterministisch

### Constraints

- [ ] **AC-12:** Harte Constraints aus dem Original bleiben in allen Varianten erhalten
- [ ] **AC-13:** Konflikte zwischen Profil und Constraints werden erkannt und sichtbar gemeldet
- [ ] **AC-14:** Security-Kategorien (`offline_only`, `approval_required`, `scope_boundary`) werden nie abgeschwächt
- [ ] **AC-15:** Konflikte werden nicht automatisch gelöst — Nutzer sieht sie in der Variantenkarte

### Nutzer-Aktionen

- [ ] **AC-16:** Variante kann als neue Prompt-Version gespeichert werden („💾“)
- [ ] **AC-17:** Variante kann mit Ursprung verglichen werden („↔️“, Side-by-Side)
- [ ] **AC-18:** Variante kann in Zwischenablage kopiert werden („📋“)
- [ ] **AC-19:** Original-Prompt bleibt bei allen Aktionen unverändert

### Integration

- [ ] **AC-20:** VariantPanel funktioniert im Datei-Modus (bestehender Prompt)
- [ ] **AC-21:** VariantPanel funktioniert im Paste-Modus (eingefügter Prompt)
- [ ] **AC-22:** #216 wird korrekt als Quelle genutzt — kein Duplikat von Missing-Info-Gate-Funktionen
- [ ] **AC-23:** `constraintChecker.ts` wird als readonly shared-Infrastruktur genutzt (keine Änderung der bestehenden API)

### Compliance

- [ ] **AC-24:** Keine neuen externen npm-Dependencies
- [ ] **AC-25:** Keine Remote-API-Calls — alles läuft lokal
- [ ] **AC-26:** Bei Sicherheitskonflikten erscheint `require_human_approval` als Resolution-Option
- [ ] **AC-27:** Jede Variantengenerierung produziert einen Evidence-Eintrag

---

## 11. Teststrategie (Planung — nicht implementieren)

### 11.1 Unit-Tests

| Test-Suite                            | Test-Gegenstand                                                                      | Key Scenarios                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `directionProfiles.test.ts`           | `getProfile(id)`, `getAllProfiles()`, `getCompatibleProfiles(constraints)`           | Lookup aller Profile, Filter nach Constraint-Kompatibilität, unbekannte Profil-ID → undefined             |
| `variantGenerator.test.ts`            | `applyDirectionProfile(content, profile) → string`                                   | Alle 12 vordefinierten Profile, leeres Content, Whitespace-only, enrichedContent als Input, Custom-Profil |
| `constraintChecker.direction.test.ts` | `checkDirectionProfileConflicts(profile, constraints) → ConstraintConflict[]`        | Jeder Profil-Typ mit jeder Constraint-Kategorie, keine Constraints, leeres Profil, SECURITY_KATEGORIEN    |
| `variantResultMapper.test.ts`         | `mapToPromptVariant(generatedContent, profile, constraints, source) → PromptVariant` | Original-Source, Enriched-Source, mit/ohne Konflikte, leere Constraints                                   |

### 11.2 UI-Komponenten-Tests

| Test-Suite                          | Test-Gegenstand        | Key Scenarios                                                                                                    |
| ----------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `VariantPanel.test.tsx`             | Rendering, Interaktion | Öffnen/Schließen, Profilauswahl, Multi-Select, Generierung triggern, Ergebnisse anzeigen, Custom-Profil          |
| `DirectionProfileSelector.test.tsx` | Profilauswahl          | Alle Profile rendern, Auswahl toggeln, Multi-Select, Custom-Text aktivieren                                      |
| `VariantResultList.test.tsx`        | Variantenliste         | Varianten rendern, Constraints anzeigen, Konflikte anzeigen, Leere Liste, Speichern/Kopieren/Vergleichen-Buttons |
| `VariantCompare.test.tsx`           | Side-by-Side-Diff      | Original vs. Variante, Diff-Ansicht, Constraints-Vergleich                                                       |

### 11.3 Integrationstests

| Test-Suite                                   | Test-Gegenstand                                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `VariantPanel.integration.test.tsx`          | Kompletter Flow: Prompt wählen → VariantPanel öffnen → Profil wählen → Generieren → Variante speichern                     |
| `VariantPanel.enriched.integration.test.tsx` | Flow mit enrichedContent: Gate durchlaufen → enrichedContent existiert → Varianten nutzen enrichedContent                  |
| `VariantPanel.constraint.test.tsx`           | Konflikt-Flow: Prompt mit Constraints → Profil mit Konflikt wählen → Warnung erscheint → Variante generiert mit Constraint |

### 11.4 Regressionstests

| Test                                       | Assertion                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Original-Prompt unverändert                | `prompt.content === originalContent` nach allen Operationen                                            |
| Bestehende Optimizer-Funktionalität intakt | Alle existierenden Tests in `promptOptimizer.test.ts`, `OptimizationPanel.test.tsx` laufen unverändert |
| constraintChecker bestehende API intakt    | Alle existierenden Tests in `constraintChecker.test.ts` (36 Tests) laufen unverändert                  |
| Missing-Info-Gate unverändert              | Alle existierenden Gate-Tests (161 unit + 38 store + 33 UI + 31 integration) laufen unverändert        |
| DetailsPanel ActionBar intakt              | Bestehende Buttons (Optimieren, Blueprint, Fehlende Infos) funktionieren unverändert                   |

### 11.5 Security-Tests

| Test                                       | Assertion                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Security-Constraint-Abschwächung blockiert | `offline_only`-Constraint + `deep_research`-Profil → Variante enthält KEINE Cloud-Referenzen          |
| Human-Approval-Resolutions-Option          | `approval_required`-Constraint + `agentisch`-Profil → `require_human_approval` in Resolution-Optionen |
| Keine stille Constraint-Entfernung         | Alle extrahierten Constraints aus Original sind in `variant.preservedConstraints[]`                   |
| System-Invarianten A1–A5                   | Programmatische Assertions (siehe Abschnitt 7.5)                                                      |

---

## 12. Offene Owner-Fragen

Vor `/speckit.plan` müssen folgende Entscheidungen getroffen werden:

| #       | Frage                                                                                                                               | Relevanz    | Optionen / Vorschlag                                                                                                                                                                                |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Q1**  | Button-Label: „🧭 Varianten erzeugen“ oder „Richtung variieren“?                                                                    | UX          | Vorschlag: „🧭 Varianten erzeugen“ (deutlicher für neue Nutzer)                                                                                                                                     |
| **Q2**  | Wie viele Varianten maximal pro Lauf?                                                                                               | Performance | Vorschlag: Maximal 5 gleichzeitig (analog zu Missing-Info-Gate: max 5 REQUIRED). Nutzer kann mehrere Profile wählen, aber nur die ersten 5 werden generiert.                                        |
| **Q3**  | Standard-Profile: Welche 5 sind vorausgewählt?                                                                                      | UX          | Vorschlag: `sachlich`, `technisch`, `kurz`, `ausfuehrlich`, `agentisch`                                                                                                                             |
| **Q4**  | Dürfen benutzerdefinierte Profile gespeichert werden?                                                                               | Scope       | Vorschlag: **Nein** in Phase 1 (Session-Only, analog zu Gate-Antworten). Phase 2: Persistenz über `localStorage`.                                                                                   |
| **Q5**  | Varianten sofort speichern oder erst previewen?                                                                                     | UX          | Vorschlag: **Erst previewen** — Varianten werden im Panel angezeigt, Nutzer speichert explizit per Button. Kein Auto-Save.                                                                          |
| **Q6**  | Soll enrichedContent bevorzugt oder optional genutzt werden?                                                                        | Integration | Vorschlag: **Bevorzugt, aber optional.** Wenn enrichedContent existiert → verwenden. Wenn nicht → Original-Prompt. Nutzer sieht Info, welche Quelle verwendet wurde.                                |
| **Q7**  | Soll das VariantPanel eine eigene `handleOpenVariantPanel`-Funktion im DetailsPanel bekommen (analog zu `handleOpenOptimizer`)?     | Architektur | Vorschlag: **Ja.** Eigene Handler-Funktion mit gleichem Gate-Check wie `handleOpenOptimizer`.                                                                                                       |
| **Q8**  | Soll der VariantGenerator rein template-basiert (Prefix-Injection) oder auch strukturell (Sektionen hinzufügen/entfernen) arbeiten? | Architektur | Vorschlag: **Phase 1: Template-basiert** (Prompt-Prefix + Tonalitäts-Anpassung). Strukturelle Änderungen in Phase 2. Begründung: einfacher zu testen, weniger Risiko, kein Duplikat des Optimizers. |
| **Q9**  | Feature-Flag-Name: `PROMPTVAULT_DIRECTION_PROFILES`?                                                                                | Dev         | Vorschlag: **Ja** (analog zu `PROMPTVAULT_MISSING_INFO_GATE`)                                                                                                                                       |
| **Q10** | Icon für den ActionBar-Button?                                                                                                      | UX          | Vorschlag: 🧭 (Kompass — symbolisiert Richtung/Orientierung)                                                                                                                                        |

---

## 13. Abhängigkeiten

### 13.1 Interne Abhängigkeiten

| Abhängigkeit             | Typ                       | Beschreibung                                                                              |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| `constraintChecker.ts`   | **Shared Infrastructure** | `extractHardConstraints()`, `buildResolutionOptions()` (readonly)                         |
| `types/index.ts`         | **Type Foundation**       | `ConstraintCategory`, `HardConstraint`, `ConstraintConflict`, `DirectionProfileReference` |
| `appStore.ts`            | **State Provider**        | `enrichedContexts[promptId]` als optionaler Input                                         |
| `DetailsPanel.tsx`       | **UI Orchestrator**       | ActionBar-Erweiterung, VariantPanel-Integration                                           |
| `MissingInfoGate` (#216) | **Upstream Producer**     | Liefert `enrichedContent` (wenn Gate durchlaufen)                                         |
| `promptOptimizer.ts`     | **Paralleler Consumer**   | Unabhängig, keinerlei Abhängigkeit (parallele Pfade)                                      |

### 13.2 Keine neuen externen Abhängigkeiten

Das Feature benötigt **keine neuen npm-Packages**. Alle neuen Module sind reines TypeScript/React ohne externe Imports (außer bestehenden Projekt-Typen und React).

---

## 14. Risiken

| Risiko                                                                    | Impact          | Mitigation                                                                                     |
| ------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| **R1: Zu viele Profile überfordern Nutzer**                               | UX-Frustration  | Grid-Layout mit klaren Icons + Kategorien; Tooltip bei Hover; nur 5 vorausgewählt              |
| **R2: VariantGenerator produziert unsinnige Prompts**                     | Qualität        | Template-basiert in Phase 1 (deterministisch, vorhersagbar); Unit-Tests für jedes Profil       |
| **R3: Constraint-Konflikte werden übersehen**                             | Sicherheit      | `checkDirectionProfileConflicts()` prüft ALLE Constraints; Security-Kategorien werden gehärtet |
| **R4: Store-Blending — VariantPanel-State vermischt sich mit Gate-State** | Architektur     | Separate Store-Keys (`variantResults` ≠ `enrichedContexts`, `showVariantPanel` ≠ `isGateOpen`) |
| **R5: Performance bei vielen Varianten**                                  | Latenz          | Maximal 5 Varianten pro Lauf; Generierung ist synchron (<10ms pro Variante)                    |
| **R6: Original-Prompt wird doch mutiert**                                 | Datenintegrität | System-Invariante A1; Regressionstest; `variantGenerator.ts` arbeitet nur mit String-Kopien    |
| **R7: enrichedContent-Staleness**                                         | Datenintegrität | `analyzeSelected()` invalidiert enrichedContexts; VariantPanel prüft Existenz vor Nutzung      |

---

## 15. Speckit-Phasen

| Phase                  | Befehl                   | Beschreibung                                                  | Status                      |
| ---------------------- | ------------------------ | ------------------------------------------------------------- | --------------------------- |
| ✅ **Specify**         | `/speckit.specify`       | Diese Spezifikation                                           | In Bearbeitung (2026-07-10) |
| ⬜ **Plan**            | `/speckit.plan`          | Implementierungsplan: Module, Komponenten, Store, Reihenfolge | Ausstehend                  |
| ⬜ **Tasks**           | `/speckit.tasks`         | Atomare, testbare Tasks                                       | Ausstehend                  |
| ⬜ **Tasks to Issues** | `/speckit.taskstoissues` | Tasks als GitHub Issues                                       | Ausstehend                  |
| ⬜ **Implement**       | `/speckit.implement`     | Implementierung                                               | Ausstehend                  |
| ⬜ **Accept**          | Dokumentation & Evidence | ADR-003 accepted, ROADMAP updated                             | Ausstehend                  |

---

## 16. Referenzen

- **Issue #215:** https://github.com/xxammaxx/promptvault-lite/issues/215
- **Epic #214:** https://github.com/xxammaxx/promptvault-lite/issues/214
- **Issue #216 (Missing-Info-Gate):** https://github.com/xxammaxx/promptvault-lite/issues/216
- **ADR-002:** `docs/DECISIONS.md` (Zeilen 31–143)
- **ADR-003 (vorgeschlagen):** Architecture-Agent Analysis → `docs/DECISIONS.md` (anzuhängen)
- **0216 Spec:** `docs/specs/0216-missing-info-gate/spec.md`
- **0216 Evidence:** `docs/specs/0216-missing-info-gate/evidence.md`
- **Roadmap:** `docs/ROADMAP.md` (Zeilen 40–55)
- **Types:** `src/types/index.ts` (Zeilen 712–772: Constraint Types + DirectionProfileReference)
- **Constraint Checker:** `src/lib/constraintChecker.ts` (460 Zeilen, Phase 1 abgeschlossen)
- **Compliance Analysis:** `.opencode/reports/compliance/0215-constraint-preservation-safety-spec.md`
