# Feature-Spec: Keyboard-Shortcuts (P3)

## User Story

**Als** Power-User möchte ich häufige Aktionen per Tastatur auslösen können,
**damit** ich effizienter mit PromptVault Lite arbeiten kann.

## Acceptance Criteria

### AC-1: Globale Shortcuts (Toolbar)

- [ ] `Strg+O` / `Cmd+O` → Ordner-Öffnen-Dialog
- [ ] `Strg+Shift+A` / `Cmd+Shift+A` → Alle analysieren
- [ ] `Strg+E` / `Cmd+E` → Export-Dialog öffnen (nach P0-Implementierung)

### AC-2: Explorer-Panel Shortcuts

- [ ] `Strg+F` / `Cmd+F` → Suchfeld fokussieren
- [ ] `Esc` → Suchfeld leeren und Fokus entfernen
- [ ] `Pfeiltasten ↑/↓` → Prompt-Auswahl in der Liste navigieren
- [ ] `Enter` → Selektierten Prompt öffnen/analysieren

### AC-3: Implementierung

- [ ] Verwendung von React `useEffect` mit `keydown`-EventListener
- [ ] Shortcuts nur aktiv wenn kein Input-Feld fokussiert ist (außer `Esc` in Suche)
- [ ] `event.preventDefault()` für abgefangene Shortcuts
- [ ] Plattform-Erkennung: `navigator.platform` für Mac vs. Windows/Linux
- [ ] Shortcut-Hinweise in Tooltips / Button-Labels (z.B. "Öffnen (Strg+O)")

### AC-4: Deaktivierung

- [ ] Shortcuts deaktiviert während `isLoading` oder `isAnalyzing`
- [ ] Shortcuts deaktiviert wenn kein Ordner geladen ist (außer `Strg+O`)

## Edge Cases

- Modales Fenster offen → Shortcuts sollten nicht durchsickern
- Mehrere Tasten gleichzeitig → Nur registrierte Kombinationen
- IME-Eingabe (asiatische Sprachen) → Shortcuts nicht während IME-Komposition

## Technische Notizen

- Custom Hook `useKeyboardShortcuts` in `src/hooks/`
- Keine externe Dependencies nötig
- `document.addEventListener('keydown', ...)` im `useEffect`
- `e.metaKey` (Mac Cmd) vs `e.ctrlKey` (Windows/Linux)
