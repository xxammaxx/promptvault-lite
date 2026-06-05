# PromptVault Lite Phase 5 — Formal Specification

## Version: 1.5.0 — Feature Completion & Developer Experience

---

## S5.1 — Score-Filter in filteredPrompts() (Issue #23)

### User Story

**Als** PromptVault-Nutzer
**möchte ich** dass der Score-Bereichs-Filter (minScore/maxScore) Prompts nach ihrer Qualitätsbewertung filtert
**damit** ich gezielt hoch- oder niedrigbewertete Prompts finden kann.

### Acceptance Criteria

#### AC-1: evaluations-Integration

- `filteredPrompts()` liest `get().evaluations[p.id]?.overall_score` für jedes Prompt
- `overall_score` ist ein `u8` (0–100) im Backend, `number` im Frontend

#### AC-2: Prompt ohne Evaluation

- Prompt ohne Eintrag in `evaluations` wird mit Score = 0 behandelt
- Default-Filter (`minScore=0, maxScore=100`) schließt unevaluierte Prompts **nicht** aus

#### AC-3: minScore-Filter

- `filters.minScore > 0` → Prompts mit Score < minScore werden ausgefiltert
- Prompt ohne Evaluation (Score=0) wird ausgefiltert wenn minScore > 0

#### AC-4: maxScore-Filter

- `filters.maxScore < 100` → Prompts mit Score > maxScore werden ausgefiltert

#### AC-5: Kombinierte Filter

- Score-Filter kombiniert mit: search, category, hygieneStatus, tags, favoritesOnly
- Reihenfolge der Filter-Prüfung: search zuerst (teuer), dann Score, dann restliche

#### AC-6: Edge: minScore > maxScore

- Wenn `minScore > maxScore` → leeres Ergebnis (keine Panic, kein Error)

#### AC-7: Edge: Float-Werte

- `minScore=0.5` / `maxScore=99.9` → Number-Vergleich, keine Rundung

#### AC-8: Bestehender Test aktualisiert

- `appStore.test.ts` L441: Test umbenannt von
  "score-filter (minScore/maxScore) werden aktuell nicht in filteredPrompts geprüft"
  → "filteredPrompts filtert korrekt nach minScore/maxScore"

### Edge Cases

| Case                                   | Verhalten                                                  |
| -------------------------------------- | ---------------------------------------------------------- |
| Kein Prompt hat eine Evaluation        | Alle Prompts Score=0, werden angezeigt wenn minScore=0     |
| minScore = 0, maxScore = 100 (Default) | Alle Prompts durchgelassen (keine Änderung zum Status quo) |
| minScore = 100, maxScore = 100         | Nur Prompts mit Score=100 (selten)                         |
| minScore = 50, maxScore = 50           | Nur Prompts mit Score=50                                   |
| minScore = 101                         | Kein Prompt (max möglicher Score ist 100)                  |
| maxScore = -1                          | Kein Prompt (min möglicher Score ist 0)                    |
| evaluations-Datensatz ist leer         | Alle Prompts Score=0 → wie Default-Filter                  |

### Betroffene Dateien

- `src/stores/appStore.ts` — `filteredPrompts()`-Funktion (L186–210)
- `src/stores/__tests__/appStore.test.ts` — Score-Filter-Tests (L441 + neue)

---

## S5.2 — Favoriten-Backend (Issue #24)

### User Story

**Als** PromptVault-Nutzer
**möchte ich** Prompts als Favoriten markieren und diese Markierung behalten
**damit** ich wichtige Prompts schnell wiederfinden kann.

### Acceptance Criteria

#### AC-1: toggle_favorite toggled Status

- `toggle_favorite(prompt_id)` → `Result<bool, String>`
- Ruft `Database::get_prompt(prompt_id)` auf
- Existiert das Prompt: `Database::set_favorite(prompt_id, !current.is_favorite)`, returned neuen Status
- Existiert das Prompt nicht: `Err("Prompt not found: {prompt_id}")`

#### AC-2: get_favorites returned favorisierte IDs

- `get_favorites()` → `Result<Vec<String>, String>`
- Lädt alle Prompts via `Database::load_prompts()`
- Filtert nach `is_favorite == true`
- Returned die IDs der favorisierten Prompts

#### AC-3: Datenbank-Zugriff

- `toggle_favorite` und `get_favorites` erhalten `tauri::State<'_, Database>` als Parameter
- `Database`-Instanz wird in `lib.rs` via `app.manage()` registriert
- Datenbank-Pfad: `{app_data_dir}/promptvault.db` (existierende Konvention aus `sqlite.rs`)

#### AC-4: Persistenz über Neustart

- Favoriten-Status wird in SQLite via `set_favorite()` persistiert
- `save_prompts()`-UPSERT erhält `is_favorite` via `COALESCE` (existierende Logik, sqlite.rs L154)
- Nach App-Neustart sind Favoriten erhalten

#### AC-5: Bestehende Tests aktualisiert

- `command_errors.rs` L171: `test_toggle_favorite_not_implemented`
  - Umbenannt zu `test_toggle_favorite_unknown_id`
  - Testet: `toggle_favorite("nonexistent")` → `Err("Prompt not found")`
- `command_errors.rs`: `test_toggle_favorite_toggles` (neu)
  - Legt Prompt an, toggled → `Ok(true)`, toggled erneut → `Ok(false)`
- `command_errors.rs`: `test_get_favorites_empty` (neu)
  - Leere DB → `Ok([])`
- `command_errors.rs`: `test_get_favorites_with_favorites` (neu)
  - 2 Prompts, 1 favorisiert → `Ok(["id1"])`

#### AC-6: Store-Synchronisation

- `toggleFavorite(promptId)` im Frontend-Store ruft `invoke("toggle_favorite", { promptId })` auf
- Aktualisiert `prompts[p].is_favorite` im Store bei Erfolg
- Kein separater `get_favorites`-Aufruf nötig — Status kommt von `toggle_favorite`-Response

### Edge Cases

| Case                                    | Verhalten                                                       |
| --------------------------------------- | --------------------------------------------------------------- |
| toggle_favorite mit unbekannter ID      | `Err("Prompt not found: {id}")`                                 |
| toggle_favorite auf bereits favorisiert | `Ok(false)` — Status wurde entfernt                             |
| toggle_favorite auf nicht-favorisiert   | `Ok(true)` — Status wurde gesetzt                               |
| get_favorites auf leerer Datenbank      | `Ok([])`                                                        |
| Datenbank-Fehler (Lock, IO)             | `Err("Datenbankfehler: ...")` — wird an Frontend propagiert     |
| Gleichzeitiges Togglen                  | SQLite WAL-Mode + busy_timeout=5000ms handeln Concurrent-Access |

### Betroffene Dateien

- `src-tauri/src/commands/favorites.rs` — Stub-Ersatz
- `src-tauri/src/lib.rs` — `manage(Database::new(...))` hinzufügen
- `src-tauri/tests/command_errors.rs` — Tests aktualisieren/neu
- `src/lib/tauri.ts` — Unverändert (API-Signatur bleibt gleich)

---

## S5.3 — Favoriten-UI (Issue #25)

### User Story

**Als** PromptVault-Nutzer
**möchte ich** eine sichtbare Favoriten-Markierung und einen Toggle-Button in der UI sehen
**damit** ich Favoriten direkt erkenne und verwalten kann.

### Acceptance Criteria

#### AC-1: Favoriten-Toggle in Detailansicht

- PromptDetail.tsx zeigt Stern-Icon (☆) oder gefüllten Stern (★)
- Button ruft `useAppStore.getState().toggleFavorite(prompt.id)` auf
- `toggleFavorite` ist existierende Store-Action (appStore.ts L53), ruft Tauri-Command auf

#### AC-2: Visuelles Feedback

- ☆ → ★ beim Klick (optimistisches UI-Update vor Tauri-Response)
- ★ → ☆ beim erneuten Klick
- Button hat Hover- und Focus-Styles (bestehende CSS-Konventionen)

#### AC-3: Accessibility

- `role="button"` auf dem Stern-Element
- `tabIndex={0}` — Tastatur-erreichbar
- `onKeyDown` — Enter/Space triggert Toggle
- `aria-label="Als Favorit markieren"` (nicht-favorisiert) / `"Favorit entfernen"` (favorisiert)
- `aria-pressed={isFavorite}` — Status-Indikator

#### AC-4: FileTree-Indikator

- `FileTree.tsx` / `TreeNode.tsx`: ★-Icon neben favorisierten Einträgen
- Indikator wird aus `prompt.is_favorite` gelesen (bereits im PromptItem-Modell)
- Visuell: kleines ★-Icon (12px) rechts vom Dateinamen

#### AC-5: Favoriten-Filter funktional

- `filteredPrompts()` prüft bereits `filters.favoritesOnly` (appStore.ts L189)
- `prompt.is_favorite` wird beim Scan aus SQLite geladen (sqlite.rs L212)
- `favoritesOnly: true` filtert korrekt sobald Favoriten-Backend funktioniert

#### AC-6: Store toggleFavorite Action

- Existierende Action `toggleFavorite(promptId)` (appStore.ts L53) bleibt Signatur-kompatibel
- Ruft `invoke<boolean>("toggle_favorite", { promptId })` auf (tauri.ts L50)
- Bei `Ok(newState)`: updated `prompts[p].is_favorite = newState`
- Bei `Err`: `set({ error: ... })` oder `console.error`

### Edge Cases

| Case                                  | Verhalten                                                          |
| ------------------------------------- | ------------------------------------------------------------------ |
| Backend-Fehler beim Togglen           | UI revertiert optimistisches Update, zeigt Error-Toast/Message     |
| PromptDetail ohne ausgewähltes Prompt | Button nicht sichtbar                                              |
| Mehrere Prompts favorisiert           | FileTree zeigt ★ für jeden favorisierten Eintrag                   |
| FilterPanel favoritesOnly gesetzt     | Keine Favoriten → "Keine Prompts gefunden" (bestehendes Verhalten) |

### Betroffene Dateien

- `src/components/detail/PromptDetail.tsx` — Favoriten-Button
- `src/components/explorer/FileTree.tsx` / `TreeNode.tsx` — ★-Indikator
- `src/stores/appStore.ts` — `toggleFavorite`-Action-Implementierung
- `src/stores/__tests__/appStore.test.ts` — Neue Tests für toggleFavorite
- `src/components/explorer/__tests__/FileTree.test.tsx` — ★-Indikator-Tests
- `src/components/detail/__tests__/PromptDetail.test.tsx` — Button-Tests
