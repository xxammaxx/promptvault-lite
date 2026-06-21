# Context Manifest V2

> **Erweiterte Version des Context-Manifests für KI-Agenten.**  
> Erweitert V1 um Docs-as-Code-Bezug, betroffene Dokumentationsdateien und Link-Validierung.
> Basis: [CONTEXT_MANIFEST_TEMPLATE.md](CONTEXT_MANIFEST_TEMPLATE.md) (V1).

---

## Issue

| Feld         | Wert              |
| ------------ | ----------------- |
| Issue        | `#<NUMMER>`       |
| Branch       | `<BRANCH>`        |
| Agent        | `<AGENT-NAME>`    |
| Session-ID   | `<UUID>`          |
| Datum        | `<ISO8601_DATUM>` |
| Start-Commit | `<COMMIT-HASH>`   |

---

## Cold Context

Unverhandelbare Regeln, die bei jedem Agentenlauf neu geladen wurden:

### Geladene harte Regeln

- [ ] `AGENTS.md` — Agent Start/Work/End Gates
- [ ] `docs/agent/AGENTS_DOCS_ADDENDUM.md` — Docs-spezifische Agentenregeln
- [ ] `docs/SECURITY_GATES.md` — Security-Regeln
- [ ] `.opencode/policies/evidence-gates.json` — Evidence-Pflichten
- [ ] `.opencode/policies/mcp-trust-tiers.json` — Tool-Trust-Tiers
- [ ] `.opencode/policies/data-retention.json` — Datenaufbewahrung
- [ ] Weitere: `<AUFLISTUNG>`

### Sicherheitsregeln (aus Cold Context)

- [ ] Keine Secrets lesen, ausgeben oder committen
- [ ] Keine `.env`-Dateien committen
- [ ] Keine Produktionsdaten in Tests
- [ ] Keine direkten Änderungen auf `main`/`master`
- [ ] Kein Push/Merge ohne grüne Gates
- [ ] Keine Behauptung ohne Evidence

### Output-Schema

- [ ] Strukturierter Issue-Start-Kommentar
- [ ] Strukturierter Issue-End-Kommentar
- [ ] PR-Beschreibung gemäß Template
- [ ] Evidence Log ausgefüllt

### Human-Approval-Regeln

- [ ] Push benötigt Human Approval
- [ ] Merge benötigt Human Approval
- [ ] Deployment benötigt Human Approval
- [ ] Migrationen benötigen Human Approval
- [ ] Datenlöschung benötigt Human Approval
- [ ] Security-Regeländerungen benötigen Human Approval
- [ ] **Dokumentationsänderungen** benötigen Human Approval (bei geschützten Dateien)

---

## Warm Context

Langsam veränderliches Projektwissen (beratend, nicht absolut):

### Gelesene Projektdokumente

| Dokument                              | Version     | Relevanz  |
| ------------------------------------- | ----------- | --------- |
| `README.md`                           | `<VERSION>` | `<GRUND>` |
| `docs/ARCHITECTURE.md`                | `<VERSION>` | `<GRUND>` |
| `docs/TESTING.md`                     | `<VERSION>` | `<GRUND>` |
| `docs/SECURITY_GATES.md`              | `<VERSION>` | `<GRUND>` |
| `docs/glossary.md`                    | `<VERSION>` | `<GRUND>` |
| `docs/reference/project-structure.md` | `<VERSION>` | `<GRUND>` |
| `docs/runbooks/development.md`        | `<VERSION>` | `<GRUND>` |
| Weitere                               |             |           |

### Architekturentscheidungen (ADRs)

| ADR       | Titel                 | Relevanz  |
| --------- | --------------------- | --------- |
| `adr-001` | AI Governance         | `<GRUND>` |
| `adr-002` | Docs-as-Code Platform | `<GRUND>` |
| Weitere   |                       |           |

### Relevante Konventionen

- **Coding-Standards:** ESLint + Prettier, `cargo fmt` + `cargo clippy`
- **Test-Standards:** Vitest (Frontend), `cargo test` (Rust)
- **Branch-Strategie:** Feature-Branches von `main`, PR-basierter Merge
- **Commit-Stil:** `type(scope): description` (Conventional Commits)
- **Docs-Konvention:** YAML-Frontmatter, deutsche Sprache, Diátaxis-Struktur

### Verwendete Projektannahmen

| Annahme     | Quelle        | Confidence      |
| ----------- | ------------- | --------------- |
| `<ANNAHME>` | `<DATEI/ADR>` | HIGH/MEDIUM/LOW |

---

## Hot Context

Aktueller Laufzeitkontext — hat TTL und darf nicht ungeprüft dauerhaft übernommen werden:

### Gelesene Dateien

| Datei         | Grund     | Zeilen     |
| ------------- | --------- | ---------- |
| `<DATEIPFAD>` | `<GRUND>` | `<ANZAHL>` |

### Tool-Ergebnisse

| Tool     | Aufruf     | Ergebnis-Zusammenfassung |
| -------- | ---------- | ------------------------ |
| `<TOOL>` | `<BEFEHL>` | `<ZUSAMMENFASSUNG>`      |

### Testausgaben (vor Änderung)

```
<ROHTEXT ODER ZUSAMMENFASSUNG>
```

### Aktuelle Fehler / Logs

```
<ROHTEXT ODER ZUSAMMENFASSUNG>
```

---

## Docs-as-Code Bezug

> **Neu in V2:** Prüfung, ob Dokumentation von Code-Änderungen betroffen ist.

### Betroffene Docs-Dateien

| Docs-Datei                            | Grund                        | Änderung nötig? |
| ------------------------------------- | ---------------------------- | --------------- |
| `docs/reference/project-structure.md` | Neue/entfernte Dateien       | JA / NEIN       |
| `docs/ARCHITECTURE.md`                | Neue Module/Commands         | JA / NEIN       |
| `docs/USER_GUIDE.md`                  | Neue UI-Features             | JA / NEIN       |
| `docs/glossary.md`                    | Neue Fachbegriffe            | JA / NEIN       |
| `docs/INSTALL.md`                     | Neue Abhängigkeiten          | JA / NEIN       |
| `docs/runbooks/development.md`        | Neue Workflows/Commands      | JA / NEIN       |
| `docs/adr/`                           | Neue Architekturentscheidung | JA / NEIN       |
| `docs/CHANGELOG.md`                   | Feature/Fix/Änderung         | JA / NEIN       |
| Weitere                               | `<GRUND>`                    | JA / NEIN       |

### Trigger-Regeln für Docs-Update

Dokumentation MUSS aktualisiert werden, wenn:

- Eine neue Datei, Komponente oder ein neues Modul hinzugefügt wird
- Ein Tauri-Command oder eine Rust-Funktion geändert/entfernt wird
- Ein UI-Feature oder eine Benutzerinteraktion geändert wird
- Eine Abhängigkeit hinzugefügt/entfernt wird
- Ein Build-Schritt oder Dev-Workflow geändert wird
- Eine Architekturentscheidung getroffen wird

### Link-Check-Verifikation

Vor Merge MÜSSEN alle internen Links in geänderten Docs-Dateien geprüft werden:

- [ ] Alle `./` und `../` Verweise zeigen auf existierende Dateien
- [ ] Alle Anker (`#`) verweisen auf existierende Überschriften
- [ ] Keine defekten Links zu ADRs oder Agent-Dokumenten
- [ ] `docs/`-interne Querverweise konsistent

---

## Token-/Kontextbudget

**Bewusstsein über Kontextlimits:**

### Bewusst geladene Dateien

| Datei     | Ungefähre Tokens | Grund     |
| --------- | ---------------- | --------- |
| `<DATEI>` | `<SCHÄTZUNG>`    | `<GRUND>` |

### Bewusst NICHT geladene Dateien

| Datei     | Grund für Ausschluss |
| --------- | -------------------- |
| `<DATEI>` | `<GRUND>`            |

### Gekürzte Inhalte

| Datei/Bereich | Kürzungsgrund |
| ------------- | ------------- |
| `<DATEI>`     | `<GRUND>`     |

### Nicht gekürzte Inhalte

| Datei/Bereich | Grund für vollständige Ladung |
| ------------- | ----------------------------- |
| `<DATEI>`     | `<GRUND>`                     |

---

## Evidence

### Ausgeführte Befehle

| Befehl                                            | Exit-Code | Ergebnis     |
| ------------------------------------------------- | --------- | ------------ |
| `pnpm test`                                       | `<CODE>`  | `<ERGEBNIS>` |
| `cargo test --manifest-path src-tauri/Cargo.toml` | `<CODE>`  | `<ERGEBNIS>` |
| `pnpm lint`                                       | `<CODE>`  | `<ERGEBNIS>` |
| Weitere                                           |           |              |

### Testergebnisse

```
<VOLLSTÄNDIGE TESTAUSGABE>
```

### Screenshots / Traces

| Pfad     | Beschreibung     |
| -------- | ---------------- |
| `<PFAD>` | `<BESCHREIBUNG>` |

### Commit

- **Hash:** `<COMMIT-HASH>`
- **Nachricht:** `<COMMIT-MESSAGE>`

### PR

- **URL:** `<PR-URL>`
- **Nummer:** `#<NUMMER>`

---

## Annahmen und Unsicherheiten

| Typ                       | Aussage     | Quelle                | Confidence | Risiko             |
| ------------------------- | ----------- | --------------------- | ---------- | ------------------ |
| Belegte Tatsache          | `<AUSSAGE>` | `<DATEI/TEST/COMMIT>` | HIGH       | —                  |
| Getestete Implementierung | `<AUSSAGE>` | `<TEST>`              | HIGH       | —                  |
| Plausible Annahme         | `<AUSSAGE>` | `<QUELLE>`            | MEDIUM     | `<RISIKO>`         |
| Vendor-Claim              | `<AUSSAGE>` | `<URL/DOKU>`          | MEDIUM     | Abweichung möglich |
| Hypothese                 | `<AUSSAGE>` | —                     | LOW        | Verifikation nötig |
| Offenes Risiko            | `<AUSSAGE>` | —                     | —          | `<RISIKO>`         |

---

## Ergebnis

- **Status:** `✅ ERFOLGREICH` / `⚠️ MIT RISIKEN` / `❌ FEHLGESCHLAGEN`
- **End-Commit:** `<COMMIT-HASH>`
- **Offene Risiken:**
  - `<RISIKO 1>`
  - `<RISIKO 2>`
- **Nächster Schritt:**
  - `<NÄCHSTE AKTION>`

---

> **Hinweis:** Dieses Manifest ist Teil des Evidence-Trails. Es darf nicht nachträglich verändert werden.  
> Ablage: `docs/agent/context-manifest-<ISSUE>-<DATUM>.md`  
> V2-spezifisch: Docs-as-Code und Link-Check vor Merge abschließen.
