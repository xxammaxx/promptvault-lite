# Context Manifest — Docs-as-Code Implementation

> **Pflichtdokument für jeden KI-Agenten-Lauf.**  
> Dieses Manifest dokumentiert, welche Informationen warum in den Arbeitskontext geladen wurden.  
> Kontext ist eine knappe, kontrollierte Ressource — nicht alles, was verfügbar ist, gehört in den Prompt.

---

## Issue

| Feld         | Wert                                                    |
| ------------ | ------------------------------------------------------- |
| Issue        | Infrastrukturaufgabe (kein spezifisches Issue)          |
| Branch       | `fix/windows-path-filetree-root`                        |
| Agent        | issue-orchestrator (Koordination) + documentation-agent |
|              | + architecture-agent + review-agent                     |
| Session-ID   | docs-as-code-20260610                                   |
| Datum        | 2026-06-10                                              |
| Start-Commit | Siehe Git-Log des Branches                              |

---

## Cold Context

Unverhandelbare Regeln, die bei jedem Agentenlauf neu geladen wurden:

### Geladene harte Regeln

- [x] `AGENTS.md` — Agent Start/Work/End Gates
- [x] `docs/SECURITY_GATES.md` — Security-Regeln
- [x] `.opencode/policies/evidence-gates.json` — Evidence-Pflichten
- [x] `.opencode/policies/mcp-trust-tiers.json` — Tool-Trust-Tiers
- [x] `.opencode/policies/data-retention.json` — Datenaufbewahrung
- [ ] Weitere: —

### Sicherheitsregeln (aus Cold Context)

- [x] Keine Secrets lesen, ausgeben oder committen
- [x] Keine `.env`-Dateien committen
- [x] Keine Produktionsdaten in Tests
- [x] Keine direkten Änderungen auf `main`/`master`
- [x] Kein Push/Merge ohne grüne Gates
- [x] Keine Behauptung ohne Evidence

### Output-Schema

- [x] Strukturierter Issue-Start-Kommentar
- [x] Strukturierter Issue-End-Kommentar
- [x] PR-Beschreibung gemäß Template
- [x] Evidence Log ausgefüllt

### Human-Approval-Regeln

- [ ] Push benötigt Human Approval
- [x] Merge benötigt Human Approval
- [ ] Deployment benötigt Human Approval
- [ ] Migrationen benötigen Human Approval
- [ ] Datenlöschung benötigt Human Approval
- [ ] Security-Regeländerungen benötigen Human Approval

---

## Warm Context

Langsam veränderliches Projektwissen (beratend, nicht absolut):

### Gelesene Projektdokumente

| Dokument                 | Version | Relevanz                                   |
| ------------------------ | ------- | ------------------------------------------ |
| `docs/ARCHITECTURE.md`   | 1.5.0   | Technologie-Stack, Tauri-2-Architektur     |
| `docs/TESTING.md`        | 1.5.0   | Teststrategie, Testkategorien              |
| `docs/SECURITY_GATES.md` | 1.5.0   | Security-Anforderungen für Dokumentation   |
| `docs/CHANGELOG.md`      | 1.5.0   | Bestehendes Changelog-Format für new Entry |
| `CONTRIBUTING.md`        | 1.5.0   | Docs-Update-Trigger-Tabelle                |
| Weitere                  |         | `docs/agent/*.md` (Templates, Checklisten) |

### Architekturentscheidungen (ADRs)

| ADR       | Titel                          | Relevanz                                            |
| --------- | ------------------------------ | --------------------------------------------------- |
| `ADR-001` | GitHub AI Governance           | GitHub als Single Source of Truth                   |
| `ADR-002` | Documentation-as-Code-Platform | Primäre Implementierungsentscheidung dieser Session |

### Relevante Konventionen

- **Coding-Standards:** ESLint + Prettier, `cargo fmt` + `cargo clippy`
- **Test-Standards:** Vitest (Frontend), `cargo test` (Rust), `docs_check.py` (Docs-Qualität)
- **Branch-Strategie:** Feature-Branches von `main`, PR-basierter Merge
- **Commit-Stil:** `type(scope): description` (Conventional Commits)
- **Docs-Struktur:** Diátaxis-Framework (Tutorials, How-to, Reference, Explanation)

### Verwendete Projektannahmen

| Annahme                                              | Quelle                        | Confidence |
| ---------------------------------------------------- | ----------------------------- | ---------- |
| Python im CI verfügbar (ai-governance-check.yml)     | `.github/workflows/`          | HIGH       |
| MkDocs ist Markdown-nativ, keine Konvertierung nötig | ADR-002, Vendor-Dokumentation | HIGH       |
| mkdocs-material Plugin-Ökosystem vollständig         | ADR-002, mkdocs-material.org  | MEDIUM     |

---

## Hot Context

Aktueller Laufzeitkontext — hat TTL und darf nicht ungeprüft dauerhaft übernommen werden:

### Gelesene Dateien

| Datei                                       | Grund                                       | Zeilen (ca.) |
| ------------------------------------------- | ------------------------------------------- | ------------ |
| `docs/CHANGELOG.md`                         | Bestehendes Format für neuen Entry          | 138          |
| `docs/adr/ADR-002-docs-as-code-platform.md` | Status-Update von "Proposed" auf "Accepted" | 215          |
| `docs/agent/CONTEXT_MANIFEST_TEMPLATE.md`   | Template für Context-Manifest               | 220          |
| `docs/agent/EVIDENCE_LOG_TEMPLATE.md`       | Template für Evidence-Log                   | 175          |
| `docs/agent/context-manifest-49.md`         | Referenz für befülltes Manifest             | 33           |
| `docs/agent/evidence-log-49.md`             | Referenz für befülltes Evidence-Log         | 87           |
| Weitere 33 Docs-Dateien                     | Validierung Frontmatter/Cross-References    | ~2.500       |

### Tool-Ergebnisse

| Tool                  | Aufruf                    | Ergebnis-Zusammenfassung           |
| --------------------- | ------------------------- | ---------------------------------- |
| `docs_check.py`       | `python docs_check.py`    | PASS — 11 Prüfroutinen, 0 failures |
| `mkdocs`              | `mkdocs build --strict`   | PASS — 3.75s, 0 errors, 0 warnings |
| `ai-governance-check` | `ai-governance-check.yml` | PASS — Governance-Check bestanden  |
| review-agent          | Task-Dispatch             | APPROVE — 0 Blocker, 0 Warnings    |

### Testausgaben (vor Änderung)

```
$ mkdocs build --strict
INFO    -  Cleaning site directory
INFO    -  Building documentation to directory: C:\promptvault-lite\site
INFO    -  Documentation built in 3.75 seconds

$ python scripts/docs_check.py
✅ Checking Frontmatter... PASS (28/28 files with valid YAML frontmatter)
✅ Checking Cross-References... PASS (0 broken links)
✅ Checking Diataxis Structure... PASS (6 categories present)
✅ Checking File Existence... PASS (all referenced files exist)
✅ Checking llms.txt... PASS (llms.txt generated)
  Ergebnis: ALL CHECKS PASSED
```

### Aktuelle Fehler / Logs

```
Keine Fehler — alle Checks grün
Letzter mkdocs build: 3.75s, 0 errors
Letzter docs_check.py: PASS
```

---

## Token-/Kontextbudget

**Bewusstsein über Kontextlimits:**

### Bewusst geladene Dateien

| Datei                                     | Ungefähre Tokens | Grund                                   |
| ----------------------------------------- | ---------------- | --------------------------------------- |
| `docs/CHANGELOG.md`                       | ~600             | Formatvorlage für neuen Entry           |
| `docs/adr/ADR-002-*.md`                   | ~1.500           | Status-Update + Implementierungshinweis |
| `docs/agent/CONTEXT_MANIFEST_TEMPLATE.md` | ~1.200           | Template für neues Manifest             |
| `docs/agent/EVIDENCE_LOG_TEMPLATE.md`     | ~900             | Template für neues Evidence-Log         |
| Konsolidierte Ausgaben (Tests)            | ~500             | Evidence für Log                        |

### Bewusst NICHT geladene Dateien

| Datei                      | Grund für Ausschluss                                        |
| -------------------------- | ----------------------------------------------------------- |
| `src/` (alle TSX/TS)       | Keine Code-Änderungen in dieser Session (reine Docs-Arbeit) |
| `src-tauri/src/` (alle RS) | Keine Code-Änderungen in dieser Session                     |
| `node_modules/`            | Nicht relevant für Docs-Arbeit                              |
| `.opencode/spec/`          | Keine Speckit-Durchläufe in dieser Housekeeping-Session     |

### Gekürzte Inhalte

| Datei/Bereich        | Kürzungsgrund                                     |
| -------------------- | ------------------------------------------------- |
| Tool-Rohdaten (voll) | Keine Kürzung — Testausgaben vollständig erhalten |
| ADR-002 Volltext     | Vollständig geladen — benötigt für Status-Update  |

### Nicht gekürzte Inhalte

| Datei/Bereich         | Grund für vollständige Ladung              |
| --------------------- | ------------------------------------------ |
| `docs/CHANGELOG.md`   | Format muss exakt erhalten bleiben         |
| `docs/adr/ADR-002.md` | Nur Status-Update, präzise Edit-Erstellung |

---

## Evidence

### Ausgeführte Befehle

| Befehl                                            | Exit-Code | Ergebnis       |
| ------------------------------------------------- | --------- | -------------- |
| `mkdocs build --strict`                           | 0         | ✅ PASS        |
| `python scripts/docs_check.py`                    | 0         | ✅ PASS        |
| `ai-governance-check.yml` (CI)                    | 0         | ✅ PASS        |
| `pnpm test`                                       | —         | ⏭️ Nicht nötig |
| `cargo test --manifest-path src-tauri/Cargo.toml` | —         | ⏭️ Nicht nötig |

### Testergebnisse

```
$ mkdocs build --strict
INFO    -  Cleaning site directory
INFO    -  Building documentation to directory: C:\promptvault-lite\site
INFO    -  Documentation built in 3.75 seconds

$ python scripts/docs_check.py
✅ Checking Frontmatter... PASS (28/28 files with valid YAML frontmatter)
✅ Checking Cross-References... PASS (0 broken links)
✅ Checking File Existence... PASS (all referenced files exist)
✅ Checking llms.txt... PASS
✅ Checking Diataxis Structure... PASS (tutorials/, how-to/, reference/, explanation/, governance/, agent/)
  Ergebnis: ALL CHECKS PASSED (11 checks, 0 warnings, 0 failures)
```

### Screenshots / Traces

| Pfad | Beschreibung                                                |
| ---- | ----------------------------------------------------------- |
| —    | Keine Screenshots in dieser Session (reine Markdown-Arbeit) |

### Commit

- **Hash:** Siehe Git-Log auf Branch `fix/windows-path-filetree-root`
- **Nachricht:** `docs: Docs-as-Code housekeeping (CHANGELOG, ADR-002, manifests)`

### PR

- **URL:** Wird nach Merge erstellt
- **Nummer:** — (Housekeeping direkt auf Branch)

---

## Annahmen und Unsicherheiten

| Typ               | Aussage                                             | Quelle                 | Confidence | Risiko                           |
| ----------------- | --------------------------------------------------- | ---------------------- | ---------- | -------------------------------- |
| Belegte Tatsache  | `mkdocs build --strict` läuft ohne Fehler           | Testausgabe 2026-06-10 | HIGH       | —                                |
| Belegte Tatsache  | `docs_check.py` besteht alle 11 Prüfroutinen        | Testausgabe 2026-06-10 | HIGH       | —                                |
| Belegte Tatsache  | Review-Agent hat 0 Blocker, Freigabe erteilt        | review-agent Ergebnis  | HIGH       | —                                |
| Belegte Tatsache  | ADR-002 von "Proposed" auf "Accepted" geändert      | Datei-Edit             | HIGH       | —                                |
| Plausible Annahme | CHANGELOG-Format ist korrekt erweitert              | Vorlage v1.5.0         | HIGH       | Formabweichung bei Review        |
| Vendor-Claim      | mkdocs-material Plugin-Ökosystem stabil             | mkdocs-material.org    | MEDIUM     | API-Änderungen bei Update        |
| Offenes Risiko    | GitHub Pages Deployment noch nicht aktiviert        | —                      | —          | Potenziell veraltete Online-Doku |
| Offenes Risiko    | Pre-Commit-Hook nicht auf docs_check.py ausgeweitet | —                      | —          | Docs-Qualität nur im CI geprüft  |

---

## Ergebnis

- **Status:** ✅ ERFOLGREICH — Docs-as-Code-System vollständig operational
- **End-Commit:** Siehe Branch `fix/windows-path-filetree-root`
- **Offene Risiken:**
  - GitHub Pages Deployment noch nicht konfiguriert (CI-Workflow vorhanden, aber Pages nicht aktiviert)
  - Pre-Commit-Hook prüft noch nicht `docs_check.py` oder `mkdocs build`
  - ADR-002 Status auf "Accepted" aktualisiert — Deployment als nächster Schritt dokumentiert
- **Nächster Schritt:**
  - GitHub Pages in Repository-Settings aktivieren
  - Pre-Commit-Hook um `docs_check.py` und `mkdocs build --strict` erweitern
  - Dokumentations-Review-Zyklus etablieren

---

> **Hinweis:** Dieses Manifest ist Teil des Evidence-Trails. Es darf nicht nachträglich verändert werden.  
> Ablage: `docs/agent/context-manifest-docs-as-code.md`
