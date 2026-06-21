# Verification Contract — Project Content Update

**Session ID:** project-content-update-2026-06-09
**Issue:** N/A (meta-task)

---

## Akzeptanzkriterien

- [ ] Alle aktualisierten Aussagen sind durch lokale Projektdateien belegbar.
- [ ] README und zentrale Dokumentation widersprechen sich nicht.
- [ ] Implementierte Features sind klar von geplanten Features getrennt.
- [ ] Keine Datei wurde blind überschrieben — bestehende korrekte Inhalte bleiben erhalten.
- [ ] Alte relevante Inhalte wurden erhalten oder sauber migriert.
- [ ] Projektregeln für KI-Agenten sind konsistent dokumentiert (AGENTS.md, CLAUDE.md, .github/copilot-instructions.md).
- [ ] Datenschutz-/Security-Aussagen sind vorsichtig und belegbar formuliert.
- [ ] Tests, Lint und Build wurden ausgeführt, soweit im Projekt möglich.
- [ ] Ein Evidence-Kommentar dokumentiert alle Änderungen.

---

## Red Tests / Gegenprüfungen

### Aussagen ohne Beleg (zu prüfen)

- [ ] „94 tests passing" Badge — durch Testausführung verifizierbar?
- [ ] Keine Aussage wie „production ready", „fully secure", „100%", „complete", „finished"
- [ ] Keine erfundenen Features
- [ ] Keine Cloud-/Upload-/Telemetry-Behauptungen (lokal widersprechen)

### Veraltete Installationsbefehle

- [ ] `pnpm install` → `pnpm tauri dev` — korrekt und aktuell?
- [ ] Rust-Version 1.77 — mit Cargo.toml konsistent?

### Datenschutzversprechen

- [ ] „Alles läuft lokal" — vom Code gedeckt? (Analyse in Rust, kein Netzwerkcode)
- [ ] „Keine Cloud-Anbindung" — vom Code gedeckt? (keine HTTP-Clients in deps)

### CI-/Test-Angaben

- [ ] CI-Workflow-Dateien existieren
- [ ] Test-Befehle in package.json vorhanden

---

## Testplan

| Test            | Befehl                                            | Erwartet                            |
| --------------- | ------------------------------------------------- | ----------------------------------- |
| Frontend-Tests  | `pnpm test`                                       | 94 tests passing (laut README)      |
| Rust-Tests      | `cargo test --manifest-path src-tauri/Cargo.toml` | 113 tests passing (laut README)     |
| ESLint          | `pnpm lint`                                       | 0 errors, 0 warnings                |
| Typecheck       | `tsc --noEmit` (oder `pnpm build`)                | Keine Fehler                        |
| Build           | `pnpm build`                                      | Erfolgreich                         |
| Markdown-Lint   | Nicht vorhanden                                   | N/A                                 |
| Secret-Scan     | `rg`-Pattern-Check                                | Keine Secrets                       |
| Risiko-Aussagen | grep nach riskanten Begriffen                     | Nur dokumentierte/belegte Vorkommen |

---

## Änderungsplan

### Dateien zum Aktualisieren

1. **README.md** — „Fehlende Informationen"-Sektion aktualisieren, Projektstruktur ergänzen, Blueprint-Hinweis
2. **docs/ARCHITECTURE.md** — Frontmatter-Version aktualisieren, Blueprint-Module dokumentieren
3. **docs/TESTING.md** — Frontmatter-Version aktualisieren
4. **docs/USER_GUIDE.md** — Frontmatter-Version aktualisieren
5. **docs/INSTALL.md** — Frontmatter-Version aktualisieren
6. **docs/README.md** — Frontmatter-Version aktualisieren

### Nicht zu ändernde Dateien

- **AGENTS.md** — aktuell (2026-06-08), konsistent mit Governance
- **CLAUDE.md** — aktuell, kompakte Referenz zu AGENTS.md
- **Prompt.md** — historisches Dokument, nicht anfassen
- **.github/copilot-instructions.md** — aktuell
- **docs/SECURITY_GATES.md** — aktuell (2026-06-07)
- **docs/AI_HANDBUCH.md** — aktuell (2026-06-08)
- **docs/AI_WORKFLOW.md** — aktuell (2026-06-08)
- **docs/EVIDENCE_STANDARD.md** — aktuell (2026-06-08)
- **docs/CONTEXT_ENGINEERING_STANDARD.md** — aktuell (2026-06-08)
- **docs/adr/ADR-001-ai-governance.md** — aktuell
- **docs/CHANGELOG.md** — aktuell (v1.5.0 korrekt)
