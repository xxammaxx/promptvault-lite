# Feature-Spec: Analyse Edge-Case Tests (P2)

## User Story

**Als** Entwickler möchte ich sicherstellen, dass die Analyse-Engine auch bei extremen Eingaben korrekt funktioniert,
**damit** die Anwendung robust und vertrauenswürdig ist.

## Acceptance Criteria

### AC-1: Leere Dateien

- [ ] Leerer Inhalt `""` → `evaluate_prompt` gibt `overall_score: 0` zurück
- [ ] Leerer Inhalt → `analyze_hygiene` gibt `status: "clean"`, `hygiene_score: 100` zurück
- [ ] Keine Kriterien mit Panic, keine Division durch Null

### AC-2: Binär-Markdown / Nicht-Text

- [ ] Null-Bytes im Inhalt → Werden als Text behandelt (nicht panic)
- [ ] Nicht-UTF-8 Bytes → `String::from_utf8_lossy` oder Fehler-Handling
- [ ] Nur Sonderzeichen (z.B. `(!@#$%^&*())`) → Sollte analysiert werden können
- [ ] Kein Markdown-Frontmatter → `title: ""` und andere Felder Default

### AC-3: Sehr große Prompts (>1MB)

- [ ] Prompt mit 1MB+ Inhalt → Analyse läuft in <5 Sekunden
- [ ] Prompt mit 10MB Inhalt → Analyse terminiert (Zeit sekundär)
- [ ] Kein Stack-Overflow bei tief verschachtelten Markdown-Strukturen
- [ ] Speicherverbrauch bleibt unter 100MB für 1MB Prompt

### AC-4: Unicode Edge-Cases in Frontmatter

- [ ] Deutsche Umlaute: `title: "Überprüfung der Änderungen"` → korrekt geparst
- [ ] Emoji: `description: "🚀 Schnelle Prompt-Engine 🎯"` → korrekt gespeichert
- [ ] RTL-Text (Arabisch/Hebräisch): `title: "نص عربي"` → korrekt gespeichert
- [ ] CJK-Zeichen: `title: "日本語プロンプト"` → korrekt gespeichert
- [ ] Combining Characters: `é` (als e + combining accent) → normalisiert oder akzeptiert

### AC-5: Performance-Test (10.000 Prompts)

- [ ] 10.000 synthetische Prompts scannen → <30 Sekunden
- [ ] 10.000 Prompts analysieren → Progressiv, kein Blocking
- [ ] Speicherverbrauch bei 10.000 Prompts → <500MB
- [ ] Keine Speicherlecks (wiederholtes Scannen erhöht RAM nicht linear)

## Technische Notizen

- Tests in `src-tauri/src/analysis/` als `#[cfg(test)]`-Module
- Verwendung von `tempfile::TempDir` für Testdaten
- `cargo test` muss alle neuen Tests einschließen
- Performance-Test nur in `--release`-Modus relevant
