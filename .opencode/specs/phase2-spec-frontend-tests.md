# Feature-Spec: Frontend-Tests (P2)

## User Story

**Als** Entwickler möchte ich, dass die UI-Komponenten durch automatisierte Tests abgesichert sind,
**damit** Regressionen bei UI-Änderungen sofort erkannt werden.

## Acceptance Criteria

### AC-1: TreeNode Tests

- [ ] Rendert Verzeichnis-Knoten mit Expand/Collapse-Icon
- [ ] Rendert Datei-Knoten (Prompt) ohne Expand-Icon
- [ ] Klick auf Verzeichnis expandiert es → Kinder werden sichtbar
- [ ] Klick auf Datei-Knoten → `selectPrompt(id)` wird aufgerufen
- [ ] Favoriten-Stern wird korrekt angezeigt wenn `is_favorite: true`
- [ ] Score-Badge erscheint mit korrekter Farbe (high/medium/low)

### AC-2: FilterPanel Tests

- [ ] Suchtext filtert Prompts korrekt (im Store testen)
- [ ] Kategorie-Dropdown filtert nach ausgewählter Kategorie
- [ ] Tag-Filter (Multi-Select) filtert korrekt
- [ ] "Nur Favoriten"-Toggle filtert korrekt
- [ ] Reset-Button setzt alle Filter zurück
- [ ] Min/Max-Score Filter greift korrekt

### AC-3: AnalysisPanel Tests

- [ ] Ohne selektierten Prompt → "Keine Analyse verfügbar"
- [ ] Mit Prompt aber ohne Evaluation → "Noch nicht analysiert" + Button
- [ ] Mit Evaluation → Score-Anzeige mit korrekter Farbe
- [ ] Mit Hygiene → Status-Badge (clean/warning/critical) wird angezeigt
- [ ] Artefakt-Liste rendert korrekt (Kategorie, Severity, Match, Replacement)
- [ ] Kriterien-Balken zeigen korrekte Breite basierend auf Score
- [ ] Empfehlungsliste wird korrekt gerendert

### AC-4: Test-Infrastruktur

- [ ] `vitest` konfiguriert mit `jsdom`-Environment
- [ ] `@testing-library/react` rendert Komponenten mit Mock-Store
- [ ] Mock `useAppStore` mit `zustand` Test-Utilities
- [ ] Tests können unabhängig voneinander laufen (`--no-file-parallelism` nicht nötig)

## Edge Cases

- TreeNode mit sehr tiefem Pfad (>10 Ebenen) → Rendert ohne Overflow
- FilterPanel mit 100+ Tags → Performance ok
- AnalysisPanel mit `isAnalyzing: true` → Spinner wird angezeigt
- Fehler-Zustand (`error: "..."`) → Fehlermeldung wird angezeigt

## Technische Notizen

- `vitest` und `@testing-library/react` sind bereits in `package.json`
- Tests in `src/components/__tests__/` (pro Komponente eine Datei)
- Mock-Store mit `create` von zustand (Vanilla Store ohne React-Binding)
- `npm test` (vitest run) muss alle Tests einschließen
