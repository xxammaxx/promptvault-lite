# PromptVault Lite Phase 5 — Task Breakdown

## Epic: #22 — v1.5.0 Feature Completion & Developer Experience

---

## T5.1 — Database in Tauri registrieren [1h] 🟠 P1

**Depends on:** Keine  
**Issue:** #24

### Beschreibung

`Database::new(db_path)` in `lib.rs` `.setup()` instanziieren und via `app.manage(database)` registrieren. `db_path` aus `app.path().app_data_dir()` ableiten.

### Tasks

- [ ] `use crate::database::Database;` in `lib.rs` importieren
- [ ] `app_data_dir` aus `app.path()` extrahieren, `promptvault.db` anhängen
- [ ] `Database::new(db_path.to_str().unwrap())` aufrufen, Error-Handling
- [ ] `app.manage(database)` in `.setup()` registrieren

### Akzeptanz

- App startet ohne Fehler
- `promptvault.db` wird im App-Datenverzeichnis erstellt
- `cargo test` — alle Tests grün

---

## T5.2 — toggle_favorite implementieren [1h] 🟠 P1

**Depends on:** T5.1  
**Issue:** #24

### Beschreibung

`toggle_favorite(prompt_id)` via `Database::get_prompt()` + `Database::set_favorite()` implementieren.

### Tasks

- [ ] `toggle_favorite`-Signature ändern: `db: tauri::State<'_, Database>` hinzufügen
- [ ] `db.get_prompt(&prompt_id)?` → `prompt.is_favorite` auslesen
- [ ] `db.set_favorite(&prompt_id, !prompt.is_favorite)?` togglen
- [ ] `Ok(!prompt.is_favorite)` returnen
- [ ] Prompt nicht gefunden → `Err("Prompt not found: {prompt_id}")`

### Akzeptanz

- `toggle_favorite("existing-id")` → `Ok(true)` / `Ok(false)`
- `toggle_favorite("nonexistent")` → `Err("Prompt not found")`
- `cargo test` — grün

---

## T5.3 — get_favorites implementieren [0.5h] 🟠 P1

**Depends on:** T5.1  
**Issue:** #24

### Beschreibung

`get_favorites()` via `Database::load_prompts()` → Filter nach `is_favorite`.

### Tasks

- [ ] `get_favorites`-Signature ändern: `db: tauri::State<'_, Database>` hinzufügen
- [ ] `db.load_prompts()?` → `.iter().filter(|p| p.is_favorite).map(|p| p.id).collect()`
- [ ] `Ok(favorites)` returnen

### Akzeptanz

- Leere DB → `Ok([])`
- 1 Favorit → `Ok(["id1"])`
- `cargo test` — grün

---

## T5.4 — Backend-Tests aktualisieren [1.5h] 🟠 P1

**Depends on:** T5.2, T5.3  
**Issue:** #24

### Beschreibung

`command_errors.rs`-Tests aktualisieren und neue Integrationstests schreiben.

### Tasks

- [ ] `test_toggle_favorite_not_implemented` → umbenannt zu `test_toggle_favorite_unknown_id`
  - `Database::new_in_memory()` → Prompt nicht vorhanden → `Err("Prompt not found")`
- [ ] `test_toggle_favorite_sets_favorite` (neu)
  - Prompt via `db.save_prompts()` anlegen → `toggle_favorite(id)` → `Ok(true)` → `db.get_prompt(id).is_favorite == true`
- [ ] `test_toggle_favorite_unsets_favorite` (neu)
  - Prompt anlegen, favorisieren, togglen → `Ok(false)` → nicht favorisiert
- [ ] `test_get_favorites_empty` (neu)
  - `Database::new_in_memory()` → `get_favorites()` → `Ok([])`
- [ ] `test_get_favorites_returns_favorites` (neu)
  - 2 Prompts anlegen, 1 favorisieren → `get_favorites()` → `Ok(["id1"])`

### Akzeptanz

- 5 Tests in `command_errors.rs` (1 updated + 4 new), alle grün
- Keine Tauri-Test-Harness-Abhängigkeit (Commands direkt aufrufbar)

---

## T5.5 — filteredPrompts() Score-Filter [1h] 🟢 P2

**Depends on:** Keine  
**Issue:** #23

### Beschreibung

`filteredPrompts()` um `evaluations`-basierte Score-Filter-Logik erweitern.

### Tasks

- [ ] `const { prompts, filters, evaluations } = get();` — `evaluations` extrahieren
- [ ] Score-Filter-Logik nach Search-Filter einfügen
- [ ] `evaluations[p.id]?.overall_score ?? 0` für Score auslesen
- [ ] `score < filters.minScore || score > filters.maxScore` → `return false`
- [ ] Nur aktiv wenn `minScore > 0 || maxScore < 100` (Performance-Optimierung)
- [ ] Test: manuell im Browser prüfen

### Akzeptanz

- Score=50 Prompt wird bei minScore=70 ausgefiltert
- Default-Filter (0-100) verhält sich wie vorher
- `tsc --noEmit` — 0 Errors

---

## T5.6 — filteredPrompts() Score-Filter-Tests [1h] 🟢 P2

**Depends on:** T5.5  
**Issue:** #23

### Beschreibung

Score-Filter-Tests in `appStore.test.ts` schreiben und bestehenden Test L441 aktualisieren.

### Tasks

- [ ] `it("filtert nach minScore/maxScore", ...)` — Prompt Score=50, minScore=70 → nicht im Ergebnis
- [ ] `it("filtert nach maxScore", ...)` — Prompt Score=50, maxScore=30 → nicht im Ergebnis
- [ ] `it("Prompt ohne Evaluation wird mit Score=0 behandelt", ...)` — minScore=10 → ausgefiltert
- [ ] `it("Default-Filter (0-100) lässt alle durch", ...)` — minScore=0, maxScore=100
- [ ] `it("Score-Filter kombiniert mit Search", ...)` — Search match, Score zu niedrig
- [ ] Bestehenden Test L441 umbenennen: "werden aktuell nicht" → "filtert korrekt nach Score"

### Akzeptanz

- 6 Score-Filter-Tests grün
- Alle existierenden `appStore.test.ts`-Tests weiterhin grün

---

## T5.7 — toggleFavorite Store-Action async machen [1h] 🔵 P2

**Depends on:** T5.2 (Backend muss funktionieren)  
**Issue:** #25

### Beschreibung

`toggleFavorite` Store-Action (appStore.ts L125-131) von synchronem State-Update auf async mit Backend-Aufruf umstellen.

### Tasks

- [ ] `toggleFavorite: async (promptId) => { ... }` — Action async machen
- [ ] Optimistisches UI-Update: `is_favorite` sofort togglen
- [ ] `await toggleFavorite(promptId)` aus `@/lib/tauri` aufrufen
- [ ] Bei Erfolg: State mit Backend-Antwort synchronisieren
- [ ] Bei Fehler: State reverten, `set({ error: String(err) })`
- [ ] `prevPrompts` für Revert sichern

### Akzeptanz

- Button-Klick → ☆ wird ★ → Backend persistiert → Neustart → ★ erhalten
- Backend-Fehler → State revertiert, Error im Store
- Keine TypeScript-Fehler (async/Promise korrekt gehandhabt)

---

## T5.8 — Accessibility-Verbesserungen am Favoriten-Button [0.5h] 🔵 P2

**Depends on:** T5.7  
**Issue:** #25

### Beschreibung

`ActionBar`-Button in `DetailsPanel.tsx` um Accessibility-Attribute ergänzen.

### Tasks

- [ ] `role="button"` hinzufügen
- [ ] `aria-label={is_favorite ? "Favorit entfernen" : "Als Favorit markieren"}`
- [ ] `aria-pressed={is_favorite}`
- [ ] `title`-Attribut aktualisieren (falls nicht schon korrekt)
- [ ] `tabIndex={0}` sicherstellen (Button hat default tabIndex=0)
- [ ] `onKeyDown` — Enter/Space → `toggleFavorite(prompt.id)`

### Akzeptanz

- Screenreader liest "Als Favorit markieren" / "Favorit entfernen"
- Keyboard-Navigation: Tab zum Button, Enter/Space toggled
- ESLint: 0 Errors (insb. `jsx-a11y`-Regeln)

---

## T5.9 — FileTree ★-Indikator [1h] 🔵 P2

**Depends on:** T5.7 (Store muss is_favorite setzen)  
**Issue:** #25

### Beschreibung

★-Icon neben favorisierten Einträgen im FileTree anzeigen.

### Tasks

- [ ] `TreeNode`-Typ prüfen: `node.prompt?.is_favorite` verfügbar?
- [ ] ★-Span mit CSS-Klasse `favorite-indicator` rendern wenn `is_favorite === true`
- [ ] CSS: `font-size: 12px`, `margin-left: 4px`, `color: #f5a623` (Gold)
- [ ] `aria-label="Favorit"` für Screenreader

### Akzeptanz

- Favorisierte Prompts zeigen ★ im Tree
- Nicht-favorisierte zeigen kein ★
- Keyboard-Navigation funktioniert (★ ist dekorativ, nicht interaktiv)

---

## T5.10 — Favoriten-UI-Tests [1h] 🔵 P2

**Depends on:** T5.7, T5.8, T5.9  
**Issue:** #25

### Beschreibung

Tests für Store-Action und UI-Indikatoren.

### Tasks

- [ ] `appStore.test.ts`: `toggleFavorite ruft Backend auf und updated State`
- [ ] `appStore.test.ts`: `toggleFavorite revertiert State bei Backend-Fehler`
- [ ] `DetailsPanel`/ActionBar-Test: `Favoriten-Button hat korrektes aria-label`
- [ ] `FileTree.test.tsx`: `★-Indikator bei favorisierten Prompts sichtbar`
- [ ] `FileTree.test.tsx`: `kein ★-Indikator bei nicht-favorisierten Prompts`
- [ ] `FilterPanel.test.tsx`: `favoritesOnly filtert nicht-favorisierte Prompts` (falls noch nicht getestet)

### Akzeptanz

- 5–6 neue UI/Store-Tests grün
- Keine Regression in bestehenden Tests

---

## Task Summary

| Task  | Beschreibung                      | Issue | Zeit     | Deps       |
| ----- | --------------------------------- | ----- | -------- | ---------- |
| T5.1  | Database in Tauri registrieren    | #24   | 1h       | —          |
| T5.2  | toggle_favorite implementieren    | #24   | 1h       | T5.1       |
| T5.3  | get_favorites implementieren      | #24   | 0.5h     | T5.1       |
| T5.4  | Backend-Tests aktualisieren       | #24   | 1.5h     | T5.2, T5.3 |
| T5.5  | filteredPrompts() Score-Filter    | #23   | 1h       | —          |
| T5.6  | Score-Filter-Tests                | #23   | 1h       | T5.5       |
| T5.7  | toggleFavorite Store-Action async | #25   | 1h       | T5.2       |
| T5.8  | Accessibility Favoriten-Button    | #25   | 0.5h     | T5.7       |
| T5.9  | FileTree ★-Indikator              | #25   | 1h       | T5.7       |
| T5.10 | Favoriten-UI-Tests                | #25   | 1h       | T5.7–T5.9  |
| **Σ** |                                   |       | **9.5h** |            |

---

## Ausführungsreihenfolge

```
Phase A (parallel):  T5.1 → T5.2 → T5.3 → T5.4  (Backend)
                     T5.5 → T5.6                  (Score-Filter)

Phase B (sequentiell nach T5.2):
                     T5.7 → T5.8 → T5.9 → T5.10   (UI-Integration)
```
