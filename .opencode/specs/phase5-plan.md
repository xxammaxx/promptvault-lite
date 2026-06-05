# PromptVault Lite Phase 5 — Implementation Plan

## Version: 1.5.0 — Feature Completion & Developer Experience

## Ausgangsbasis

- Commit: `6e5de57` (v1.4.0)
- 109 Rust-Tests, 84 Frontend-Tests, alle grün
- 0 Clippy, 0 ESLint

## Bestehende Infrastruktur (keine Änderung nötig)

| Komponente                        | Status | Beschreibung                                                            |
| --------------------------------- | ------ | ----------------------------------------------------------------------- |
| `tauri.ts` toggleFavorite()       | ✅     | API-Wrapper korrekt, `invoke<boolean>("toggle_favorite", { promptId })` |
| `tauri.ts` getFavorites()         | ✅     | API-Wrapper korrekt, `invoke<string[]>("get_favorites")`                |
| `ActionBar` Favoriten-Button      | ✅     | ☆/⭐-Toggle, ruft `toggleFavorite(prompt.id)`                           |
| `PromptItem.is_favorite`          | ✅     | bool-Feld im Model                                                      |
| `sqlite.is_favorite`              | ✅     | INTEGER NOT NULL DEFAULT 0 Spalte                                       |
| `Database::set_favorite()`        | ✅     | Implementiert und getestet (sqlite.rs L266)                             |
| `filteredPrompts().favoritesOnly` | ✅     | Prüft bereits `filters.favoritesOnly`                                   |

---

## C1: Favoriten-Backend (Issue #24) — P1

**Geschätzt:** 3–4h  
**Betroffene Dateien:** `favorites.rs`, `lib.rs`, `command_errors.rs`

### Schritt 1: Database in Tauri registrieren

**Datei:** `src-tauri/src/lib.rs`

`Database::new(db_path)` instanziieren und via `app.manage()` registrieren.
`db_path` aus `app.path().app_data_dir()` ableiten (existierende Konvention).

```rust
// In .setup():
let db_path = app.path().app_data_dir()
    .map_err(|e| format!("App-Datenverzeichnis nicht verfügbar: {}", e))?
    .join("promptvault.db");
let database = Database::new(db_path.to_str().unwrap())
    .map_err(|e| format!("Datenbank konnte nicht initialisiert werden: {}", e))?;
app.manage(database);
```

**Abhängigkeit:** Keine. Database-Crate ist bereits in `Cargo.toml`.

### Schritt 2: toggle_favorite implementieren

**Datei:** `src-tauri/src/commands/favorites.rs`

```rust
#[tauri::command]
pub fn toggle_favorite(
    prompt_id: String,
    db: tauri::State<'_, Database>,
) -> Result<bool, String> {
    // Prompt existiert?
    let prompt = db.get_prompt(&prompt_id)?
        .ok_or_else(|| format!("Prompt not found: {}", prompt_id))?;

    let new_state = !prompt.is_favorite;
    db.set_favorite(&prompt_id, new_state)?;
    Ok(new_state)
}
```

**Wichtig:** `use crate::database::Database;` importieren.
**R3:** `Database::set_favorite()` wird verwendet.
**R4:** `tauri::State<Database>` als separater Parameter.

### Schritt 3: get_favorites implementieren

```rust
#[tauri::command]
pub fn get_favorites(db: tauri::State<'_, Database>) -> Result<Vec<String>, String> {
    let prompts = db.load_prompts()?;
    let favorites: Vec<String> = prompts
        .into_iter()
        .filter(|p| p.is_favorite)
        .map(|p| p.id)
        .collect();
    Ok(favorites)
}
```

### Schritt 4: Tests aktualisieren

**Datei:** `src-tauri/tests/command_errors.rs`

| Test (alt)                             | Test (neu)                             | Verhalten                                            |
| -------------------------------------- | -------------------------------------- | ---------------------------------------------------- |
| `test_toggle_favorite_not_implemented` | `test_toggle_favorite_unknown_id`      | `Err("Prompt not found: ...")`                       |
| —                                      | `test_toggle_favorite_sets_favorite`   | Prompt anlegen → toggle → `Ok(true)` → `is_favorite` |
| —                                      | `test_toggle_favorite_unsets_favorite` | Prompt anlegen, favorisieren → toggle → `Ok(false)`  |
| —                                      | `test_get_favorites_empty`             | Leere DB → `Ok([])`                                  |
| —                                      | `test_get_favorites_returns_favorites` | 2 Prompts, 1 favorisiert → `Ok(["id1"])`             |

**Hinweis:** Integrationstests benötigen eine In-Memory-Datenbank oder Test-DB.
`Database::new_in_memory()` existiert bereits (sqlite.rs L36-44).
Die Tests müssen `tauri::test::assert_ipc_response` oder ein Mocking-Framework verwenden.

**Alternative:** Unit-Tests in `sqlite.rs` prüfen `set_favorite()` bereits (L563-575).
Integrationstests können `Database::new_in_memory()` direkt instanziieren und
die Commands manuell aufrufen (ohne Tauri-Context).

**Decision (ADR-008):** Tests in `command_errors.rs` verwenden `Database::new_in_memory()`
und rufen die Command-Funktionen direkt auf. Kein Tauri-Test-Harness nötig.
Die Commands sind reine Funktionen ohne AppHandle/Window-Abhängigkeit.

---

## C2: Score-Filter in filteredPrompts() (Issue #23) — P2

**Geschätzt:** 1.5–2h  
**Betroffene Dateien:** `appStore.ts`, `appStore.test.ts`

### Schritt 1: filteredPrompts() erweitern

**Datei:** `src/stores/appStore.ts` L186–210

Score-Filter-Logik nach dem Search-Filter einfügen:

```typescript
filteredPrompts: () => {
  const { prompts, filters, evaluations } = get();
  return prompts.filter((p) => {
    // ... search filter (existing) ...

    // Score-Filter (NEU)
    if (filters.minScore > 0 || filters.maxScore < 100) {
      const evaluation = evaluations[p.id];
      const score = evaluation?.overall_score ?? 0;
      if (score < filters.minScore || score > filters.maxScore) {
        return false;
      }
    }

    // ... restliche Filter (favoritesOnly, category, hygieneStatus, tags) ...
    return true;
  });
},
```

**Design-Entscheidung:** Score-Filter nur aktiv wenn nicht Default (minScore=0, maxScore=100).
Spart eine unnötige Hashmap-Lookup für jeden Prompt bei Default-Filter.

### Schritt 2: Tests erstellen

**Datei:** `src/stores/__tests__/appStore.test.ts`

Den bestehenden Test L441 umbenennen und neue hinzufügen:

| Test                                                | Beschreibung                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| `score-filter mit minScore=70 filtert Score=50 aus` | Prompt mit Score 50, minScore=70 → nicht im Ergebnis              |
| `score-filter mit maxScore=30 filtert Score=50 aus` | Prompt mit Score 50, maxScore=30 → nicht im Ergebnis              |
| `score-filter ohne Evaluation (Score=0)`            | Prompt ohne Eval, minScore=10 → ausgefiltert                      |
| `score-filter Default (0-100) lässt alles durch`    | minScore=0, maxScore=100 → alle Prompts                           |
| `score-filter in Kombination mit Search`            | Search passt, aber Score zu niedrig → ausgefiltert                |
| `bestehender Test L441 umbenannt`                   | "werden aktuell nicht geprüft" → "filtert nach minScore/maxScore" |

**Test-Setup:** `evaluations`-Map im Store mit `overall_score`-Werten vor jedem Test setzen.

---

## C3: Favoriten-UI-Integration (Issue #25) — P2

**Geschätzt:** 2–3h  
**Betroffene Dateien:** `appStore.ts`, `FileTree.tsx`/`TreeNode.tsx`, Tests

### Schritt 1: toggleFavorite Store-Action updaten

**Datei:** `src/stores/appStore.ts` L125–131

Aktuell: nur lokales State-Update.  
Neu: Tauri-Command aufrufen + State synchronisieren.

```typescript
toggleFavorite: async (promptId) => {
  // Optimistisches UI-Update
  const prevPrompts = get().prompts;
  set((state) => ({
    prompts: state.prompts.map((p) =>
      p.id === promptId ? { ...p, is_favorite: !p.is_favorite } : p,
    ),
  }));

  try {
    const { toggleFavorite } = await import("@/lib/tauri");
    const newState = await toggleFavorite(promptId);
    // Backend bestätigt — State korrigieren falls nötig
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.id === promptId ? { ...p, is_favorite: newState } : p,
      ),
    }));
  } catch (err) {
    // Revert bei Fehler
    set({ prompts: prevPrompts, error: String(err) });
  }
},
```

**Achtung:** Die Action-Signatur ändert sich von synchron zu async.
Die `ActionBar` ruft `toggleFavorite(prompt.id)` bereits auf (DetailsPanel.tsx L101) —
das funktioniert mit async ohne Änderung (Promise wird nicht awaited, aber das ist ok für Fire-and-Forget).

### Schritt 2: Accessibility-Verbesserungen am Favoriten-Button

**Datei:** `src/components/details/DetailsPanel.tsx` L98-106

Existierenden Button ergänzen um:

```tsx
<button
  className="btn"
  onClick={() => {
    toggleFavorite(prompt.id);
  }}
  role="button"
  aria-label={
    prompt.is_favorite ? "Favorit entfernen" : "Als Favorit markieren"
  }
  aria-pressed={prompt.is_favorite}
  title={prompt.is_favorite ? "Favorit entfernen" : "Als Favorit markieren"}
>
  {prompt.is_favorite ? "⭐" : "☆"}
</button>
```

### Schritt 3: FileTree ★-Indikator

**Dateien:** `src/components/explorer/FileTree.tsx` und/oder `TreeNode.tsx`

Jeder FileTree/TreeNode-Knoten repräsentiert einen Prompt (via `fileTree()`-Derivation).
Der Prompt hat `is_favorite` als Property. ★ muss im Label oder daneben angezeigt werden.

Zu prüfen: Wie werden Prompts im Tree dargestellt?
→ `FileTreeNode`-Typ aus `types/index.ts` hat `prompt?: PromptItem`.
→ `prompt.is_favorite` ist verfügbar.

```tsx
{
  node.prompt?.is_favorite && <span className="favorite-indicator">★</span>;
}
```

### Schritt 4: Tests

| Test-Datei                             | Test                                                |
| -------------------------------------- | --------------------------------------------------- |
| `appStore.test.ts`                     | `toggleFavorite ruft Backend auf und updated State` |
| `appStore.test.ts`                     | `toggleFavorite revertiert bei Backend-Fehler`      |
| `DetailsPanel`-Tests (falls vorhanden) | `Favoriten-Button hat aria-label`                   |
| `FileTree.test.tsx`                    | `★-Indikator bei favorisierten Prompts sichtbar`    |
| `FilterPanel.test.tsx`                 | `favoritesOnly filtert nicht-favorisierte Prompts`  |

---

## Abhängigkeitsgraph

```
C1 (Favoriten-Backend) ──┐
                         ├──> C3 (Favoriten-UI)
C2 (Score-Filter) ───────┘    (unabhängig, parallel)
```

- **C1** und **C2** sind unabhängig voneinander → parallel implementierbar
- **C3** hängt von C1 ab (braucht funktionierendes Backend)
- C3 kann parallel zu C1 begonnen werden, aber Tests brauchen C1

---

## Geschätzte Gesamtzeit

| Komponente            | Zeit       |
| --------------------- | ---------- |
| C1: Favoriten-Backend | 3–4h       |
| C2: Score-Filter      | 1.5–2h     |
| C3: Favoriten-UI      | 2–3h       |
| **Total**             | **6.5–9h** |

---

## Quality Gates

- [ ] `cargo test` — alle Rust-Tests grün (109 + min. 5 neue)
- [ ] `pnpm test` — alle Frontend-Tests grün (84 + min. 8 neue)
- [ ] `cargo clippy -- -D warnings` — 0 Warnings
- [ ] `tsc --noEmit` + ESLint — 0 Errors
- [ ] Manueller Test: Ordner scannen → Prompt favorisieren → ☆ wird ★ → Neustart → ★ erhalten
- [ ] Manueller Test: Score-Filter im FilterPanel funktioniert
- [ ] CHANGELOG auf v1.5.0
