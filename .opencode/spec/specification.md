# PromptVault Lite — Formal Specification

## Version: 1.0.0-MVP

---

## User Stories

### US-01: Prompt-Ordner öffnen
**Als** Benutzer  
**möchte ich** einen lokalen Ordner mit Markdown-Prompts auswählen  
**damit** meine Prompt-Sammlung rekursiv eingelesen und durchsuchbar wird.

**Acceptance Criteria:**
- [ ] Ordner-Auswahldialog öffnet natives Dateisystem
- [ ] Rekursives Einlesen aller `.md`-Dateien
- [ ] Nicht-Markdown-Dateien werden ignoriert
- [ ] Symlinks werden aufgelöst (mit Maximaltiefe 5)
- [ ] Fortschrittsanzeige während des Scans
- [ ] Fehler bei unlesbaren Dateien werden geloggt, brechen Scan nicht ab

### US-02: Explorer-Baumansicht
**Als** Benutzer  
**möchte ich** meine Prompt-Ordner als Baumstruktur sehen  
**damit** ich schnell navigieren und Prompts finden kann.

**Acceptance Criteria:**
- [ ] Drei-Spalten-Layout (Explorer | Details | Analyse)
- [ ] Baumstruktur mit Ordnern, Unterordnern, Markdown-Dateien
- [ ] Expand/Collapse für Ordner (mit Chevron-Icons)
- [ ] Klick auf Datei lädt Prompt-Details in Spalte 2
- [ ] Aktiver Eintrag visuell hervorgehoben
- [ ] Filter-Leiste über dem Explorer (Textsuche)
- [ ] Resizable Spalten

### US-03: Prompt-Details anzeigen
**Als** Benutzer  
**möchte ich** alle Metadaten und den Inhalt eines ausgewählten Prompts sehen  
**damit** ich den Prompt bewerten und bearbeiten kann.

**Acceptance Criteria:**
- [ ] Titel, Beschreibung, Kategorie, Version, Tags (aus Frontmatter)
- [ ] Erstellungsdatum, Änderungsdatum, Dateipfad (aus Dateisystem)
- [ ] Vollständiger Prompt-Inhalt (gerendertes Markdown)
- [ ] Buttons: Kopieren, Datei öffnen, Im Explorer anzeigen, Neu analysieren
- [ ] Fehlende Frontmatter-Felder werden automatisch abgeleitet
- [ ] Kategorie wird aus Ordnernamen abgeleitet, wenn nicht in Frontmatter

### US-04: Qualitätsanalyse
**Als** Benutzer  
**möchte ich** eine automatische Qualitätsbewertung meiner Prompts  
**damit** ich hochwertige Prompts identifizieren und verbessern kann.

**Acceptance Criteria:**
- [ ] Gesamtscore 0–100 in Spalte 3
- [ ] 10 Einzelkriterien: Klarheit, Struktur, Zieldefinition, Kontext, Rollenbeschreibung, Eingaben, Vorgehensbeschreibung, Ausgabeformat, Testbarkeit, Wiederverwendbarkeit
- [ ] Jedes Kriterium 0–10 Punkte (regelbasiert)
- [ ] Regelbasierte Erkennung von Prompt-Rollenmustern
- [ ] Fehlende Abschnitte werden aufgelistet
- [ ] Verbesserungsvorschläge werden generiert

### US-05: Hygieneanalyse
**Als** Benutzer  
**möchte ich** unerwünschte Inhalte in Prompts automatisch erkennen  
**damit** meine Prompt-Sammlung sauber und wiederverwendbar bleibt.

**Acceptance Criteria:**
- [ ] Hygiene-Score 0–100
- [ ] Artefakterkennung: Projektnamen, Produktnamen, Repository-Namen (generisch)
- [ ] Repository-Spuren: `github.com/user/repo`, `owner/repository`
- [ ] Dateipfade: Unix/Windows-Pfade, relative Pfade
- [ ] Issue-Referenzen: `Issue #N`, `PR #N`, `Bug #N`
- [ ] Testreports: `X passed, Y skipped, Z failed`
- [ ] Log-Zeilen: INFO, WARN, ERROR, DEBUG, TRACE
- [ ] Stacktraces: `at ...`, `Exception ...`, `Traceback ...`
- [ ] Build-Output: `npm run build`, `cargo build`, `pnpm test`
- [ ] JSON-Dumps: große JSON-Blöcke (>500 Zeichen)
- [ ] Code-Dumps: große Quellcodeblöcke (>20 Zeilen)
- [ ] Personenbezogene Daten: Namen, Telefonnummern, E-Mail-Adressen
- [ ] Secrets: API Keys, Tokens, Passwörter (immer KRITISCH)

### US-06: Artefakterkennung
**Als** Benutzer  
**möchte ich** wissen, welche konkreten Artefakte in meinen Prompts stecken  
**damit** ich sie durch generische Platzhalter ersetzen kann.

**Acceptance Criteria:**
- [ ] Generische Erkennung (nicht hartcodiert)
- [ ] Kategorisierung: PROJECT_ARTIFACT, REPO_REFERENCE, FILE_PATH, ISSUE_REF, TEST_REPORT, LOG_LINE, STACKTRACE, BUILD_OUTPUT, JSON_DUMP, CODE_DUMP, PII, SECRET
- [ ] Position im Text (Zeile/Spalte)
- [ ] Schweregrad: INFO, WARNING, CRITICAL
- [ ] Generierung von Ersetzungsvorschlägen (`{PROJECT_NAME}`, `{ISSUE_ID}` etc.)

### US-07: Suche & Filter
**Als** Benutzer  
**möchte ich** meine Prompt-Sammlung durchsuchen und filtern  
**damit** ich relevante Prompts schnell finde.

**Acceptance Criteria:**
- [ ] Volltextsuche in Titel, Kategorie, Tags, Inhalt
- [ ] Filter nach Kategorie (Dropdown)
- [ ] Filter nach Score-Bereich (Slider)
- [ ] Filter nach Hygiene-Status
- [ ] Filter nach Tags (Multi-Select)
- [ ] Kombinierbare Filter (UND-Verknüpfung)
- [ ] Ergebnisanzahl wird live angezeigt
- [ ] Suche in Echtzeit (Debounce 300ms)

### US-08: Favoriten
**Als** Benutzer  
**möchte ich** Prompts als Favoriten markieren  
**damit** ich schnell auf meine wichtigsten Prompts zugreifen kann.

**Acceptance Criteria:**
- [ ] Stern-Icon zum Markieren/Entmarkieren
- [ ] Favoriten-Status persistent in SQLite/JSON
- [ ] Filter "Nur Favoriten" in Filterleiste
- [ ] Favoriten werden im Explorer visuell hervorgehoben

### US-09: Export
**Als** Benutzer  
**möchte ich** meine Prompts exportieren  
**damit** ich sie teilen oder sichern kann.

**Acceptance Criteria:**
- [ ] Export als JSON (alle Metadaten + Analyse-Ergebnisse)
- [ ] Export als Markdown (gebündelt)
- [ ] Export als ZIP (Originaldateien + Metadaten)
- [ ] Auswahl: Alle / Nur Favoriten / Nach Filter
- [ ] Zielverzeichnis-Auswahl

### US-10: File Watcher (Optional / Stretch)
**Als** Benutzer  
**möchte ich** dass Änderungen im Dateisystem automatisch erkannt werden  
**damit** meine Prompt-Sammlung immer aktuell ist.

**Acceptance Criteria:**
- [ ] Watch-Mode für den ausgewählten Ordner
- [ ] Automatisches Re-Scannen bei neuen/geänderten/gelöschten `.md`-Dateien
- [ ] UI-Update ohne manuellen Refresh
- [ ] Debounce-Mechanismus (500ms)

---

## Datenmodell

### PromptItem
```typescript
type PromptItem = {
  id: string;               // UUID
  file_path: string;        // Absoluter Pfad
  file_name: string;        // Dateiname
  title: string;            // Aus Frontmatter oder Dateiname
  description: string;      // Aus Frontmatter
  category: string;         // Aus Frontmatter oder Ordnername
  version: string;          // Aus Frontmatter
  tags: string[];           // Aus Frontmatter
  content: string;          // Vollständiger Prompt-Inhalt
  raw_frontmatter: Record<string, unknown>; // Geparstes Frontmatter
  created_at: string;       // ISO 8601
  updated_at: string;       // ISO 8601
  is_favorite: boolean;
};
```

### PromptEvaluation
```typescript
type PromptEvaluation = {
  id: string;
  prompt_id: string;
  overall_score: number;    // 0–100
  criteria: EvaluationCriterion[];
  missing_sections: string[];
  recommendations: string[];
  evaluated_at: string;     // ISO 8601
};

type EvaluationCriterion = {
  name: string;
  score: number;            // 0–10
  max_score: number;        // 10
  weight: number;           // 0.0–1.0
  details: string;
};
```

### PromptHygiene
```typescript
type PromptHygiene = {
  id: string;
  prompt_id: string;
  hygiene_score: number;    // 0–100
  status: 'clean' | 'warning' | 'critical';
  artifacts: DetectedArtifact[];
  analyzed_at: string;      // ISO 8601
};
```

### DetectedArtifact
```typescript
type DetectedArtifact = {
  id: string;
  category: ArtifactCategory;
  severity: 'info' | 'warning' | 'critical';
  match: string;            // Gefundener Text
  line: number;
  column: number;
  replacement_suggestion: string | null;
};

type ArtifactCategory =
  | 'PROJECT_ARTIFACT'
  | 'REPO_REFERENCE'
  | 'FILE_PATH'
  | 'ISSUE_REFERENCE'
  | 'TEST_REPORT'
  | 'LOG_LINE'
  | 'STACKTRACE'
  | 'BUILD_OUTPUT'
  | 'JSON_DUMP'
  | 'CODE_DUMP'
  | 'PII'
  | 'SECRET';
```

---

## UI-Spezifikation

### Layout
- Drei-Spalten-Layout, responsiv ab 1024px Breite
- Spaltenbreiten: Explorer 280px (min 200px), Details flexibel, Analyse 320px (min 260px)
- Resizable Splits zwischen den Spalten

### Explorer (Spalte 1)
- Suchfeld oben (mit Lupen-Icon)
- Filter-Button öffnet Filter-Panel
- Baumstruktur mit:
  - Ordner-Icon + Name (klickbar für Expand/Collapse)
  - Datei-Icon + Name + Score-Badge
  - Favoriten-Stern
- Scrollbar bei Überlauf

### Prompt-Details (Spalte 2)
- Header-Bereich: Titel, Kategorie-Badge, Favoriten-Stern
- Meta-Raster: Version, Tags, Daten, Pfad
- Aktionsleiste: Kopieren, Datei öffnen, Im Explorer anzeigen, Neu analysieren
- Content-Bereich: Markdown-Rendering (Code-Highlighting)
- Platzhalter bei keinem ausgewählten Prompt

### Analyse (Spalte 3)
- Score-Anzeige: Große Zahl + Farbcodierung (Grün≥70, Gelb≥40, Rot<40)
- Kriterienliste mit Einzelscores und Balken
- Hygiene-Status mit Icon
- Artefaktliste mit Kategorie, Schweregrad, Vorschlag
- Fehlende Abschnitte als Warnliste
- Empfehlungen als nummerierte Liste

### Farbpalette
- Primary: #2563EB (Blau)
- Success: #16A34A (Grün)
- Warning: #CA8A04 (Gelb)
- Danger: #DC2626 (Rot)
- Background: #FAFAFA
- Surface: #FFFFFF
- Text: #171717
- Muted: #737373

---

## Technische Spezifikation

### Tauri Commands (Rust → Frontend API)
```rust
// Scanner
#[tauri::command] fn scan_directory(path: String) -> Result<Vec<PromptItem>, String>
#[tauri::command] fn refresh_scan() -> Result<Vec<PromptItem>, String>
#[tauri::command] fn watch_directory(path: String) -> Result<(), String>

// Analyse
#[tauri::command] fn evaluate_prompt(prompt_id: String) -> Result<PromptEvaluation, String>
#[tauri::command] fn analyze_hygiene(prompt_id: String) -> Result<PromptHygiene, String>
#[tauri::command] fn analyze_all() -> Result<AnalysisReport, String>

// Favoriten
#[tauri::command] fn toggle_favorite(prompt_id: String) -> Result<bool, String>
#[tauri::command] fn get_favorites() -> Result<Vec<PromptItem>, String>

// Export
#[tauri::command] fn export_json(prompt_ids: Vec<String>, path: String) -> Result<(), String>
#[tauri::command] fn export_markdown(prompt_ids: Vec<String>, path: String) -> Result<(), String>
#[tauri::command] fn export_zip(prompt_ids: Vec<String>, path: String) -> Result<(), String>

// Persistenz
#[tauri::command] fn load_cache() -> Result<Vec<PromptItem>, String>
#[tauri::command] fn save_cache(items: Vec<PromptItem>) -> Result<(), String>
```

### Rust-Modulstruktur
```
src-tauri/src/
├── main.rs              # Tauri-App Entry, Command-Registrierung
├── lib.rs               # Modul-Deklarationen
├── scanner/
│   ├── mod.rs           # Scanner-Modul
│   ├── file_scanner.rs  # Rekursiver Datei-Scanner
│   └── watcher.rs       # File-Watcher (optional)
├── parser/
│   ├── mod.rs           # Parser-Modul
│   ├── frontmatter.rs   # YAML-Frontmatter-Parser
│   └── markdown.rs      # Markdown-Struktur-Parser
├── analysis/
│   ├── mod.rs           # Analyse-Modul
│   ├── quality.rs       # Qualitätsanalyse
│   ├── hygiene.rs       # Hygieneanalyse
│   ├── artifacts.rs     # Artefakterkennung
│   └── recommendations.rs # Verbesserungsvorschläge
├── models/
│   ├── mod.rs           # Modell-Modul
│   ├── prompt.rs        # PromptItem
│   ├── evaluation.rs    # PromptEvaluation
│   ├── hygiene.rs       # PromptHygiene
│   └── artifact.rs      # DetectedArtifact
├── database/
│   ├── mod.rs           # Datenbank-Modul
│   ├── sqlite.rs        # SQLite-Integration
│   └── cache.rs         # JSON-Cache-Fallback
└── commands/
    ├── mod.rs           # Tauri Command-Handler
    ├── scan.rs
    ├── analyze.rs
    ├── favorites.rs
    └── export.rs
```

### Frontend-Komponentenstruktur
```
src/
├── main.tsx             # React Entry
├── App.tsx              # Root-Komponente, Layout
├── components/
│   ├── explorer/
│   │   ├── ExplorerPanel.tsx   # Spalte 1 Container
│   │   ├── FileTree.tsx        # Baumstruktur
│   │   ├── TreeNode.tsx        # Einzelner Baumknoten
│   │   ├── SearchBar.tsx       # Suchfeld
│   │   └── FilterPanel.tsx     # Filter-Panel
│   ├── details/
│   │   ├── DetailsPanel.tsx    # Spalte 2 Container
│   │   ├── PromptHeader.tsx    # Titel, Badges
│   │   ├── PromptMeta.tsx      # Metadaten-Raster
│   │   ├── PromptContent.tsx   # Markdown-Renderer
│   │   └── ActionBar.tsx       # Button-Leiste
│   ├── analysis/
│   │   ├── AnalysisPanel.tsx   # Spalte 3 Container
│   │   ├── ScoreDisplay.tsx    # Score-Anzeige
│   │   ├── CriteriaList.tsx    # Kriterienliste
│   │   ├── HygieneStatus.tsx   # Hygiene-Status
│   │   ├── ArtifactList.tsx    # Artefaktliste
│   │   └── Recommendations.tsx # Empfehlungen
│   └── common/
│       ├── ResizeHandle.tsx    # Spalten-Resizer
│       ├── Badge.tsx           # Badge-Komponente
│       ├── ScoreBar.tsx        # Score-Balken
│       └── EmptyState.tsx      # Leerzustand
├── hooks/
│   ├── usePrompts.ts          # Prompt-Daten-Hook
│   ├── useAnalysis.ts         # Analyse-Hook
│   ├── useSearch.ts           # Such-Hook
│   └── useFileTree.ts         # Baumstruktur-Hook
├── stores/
│   └── appStore.ts            # Zustand Store
├── types/
│   └── index.ts               # TypeScript-Typen
└── lib/
    ├── tauri.ts                # Tauri API-Wrapper
    └── utils.ts                # Hilfsfunktionen
```

---

## Performance-Anforderungen

- 10.000+ Prompts ohne UI-Freezing
- Lazy Loading für Dateibaum (Virtualisierung)
- SQLite-Indexe für Volltextsuche
- Analyse-Caching (Änderungsdatum-basiert)
- Async Tauri Commands (nicht-blockierend)
- Debounced Suche (300ms)

---

## Nicht-funktionale Anforderungen

- **Startzeit:** < 3 Sekunden bei 10.000 Prompts
- **Speicher:** < 500MB bei voller Prompt-Sammlung
- **Scan-Geschwindigkeit:** > 100 Dateien/Sekunde
- **Analyse-Geschwindigkeit:** < 50ms pro Prompt
- **UI-Reaktionszeit:** < 100ms für Navigation
- **Barrierefreiheit:** ARIA-Labels, Tastaturnavigation
