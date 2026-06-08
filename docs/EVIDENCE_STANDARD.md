<!-- BEGIN GITHUB_AI_GOVERNANCE -->

# Evidence Standard — PromptVault Lite

> **Verbindliches Format für alle Agentenläufe, Pull Requests und abgeschlossenen Aufgaben.**  
> Keine Behauptung ohne Beleg. Kein PR ohne Evidence.

---

## 1. Evidence-Block (Pflichtformat)

Jeder PR und jeder abgeschlossene Agentenlauf MUSS folgenden Evidence-Block enthalten:

```markdown
## Evidence

- **Issue:** #<NUMMER> — <TITEL>
- **Branch:** <BRANCH>
- **Commit:** <COMMIT_HASH>
- **PR:** #<NUMMER> (falls vorhanden)
- **Geänderte Dateien:**
  - `<datei1>` (<änderung>)
  - `<datei2>` (<änderung>)
- **Tests ausgeführt:**
  - `<befehl1>` — `<anzahl>` Tests, `<anzahl>` bestanden, `<anzahl>` fehlgeschlagen
  - `<befehl2>` — `<anzahl>` Tests, `<anzahl>` bestanden, `<anzahl>` fehlgeschlagen
- **Testergebnis:** :white_check_mark: PASS / :x: FAIL (Details)
- **Security Checks:**
  - [ ] Secret Scan: PASS / FAIL
  - [ ] Dependency Audit: PASS / FAIL / SKIPPED
  - [ ] Lint: PASS / FAIL
  - [ ] Typecheck: PASS / FAIL
  - [ ] Format Check: PASS / FAIL
- **Manuelle Prüfung:** JA / NEIN — <beschreibung>
- **Risiken:**
  - `<risiko1>` — High/Medium/Low — `<maßnahme>`
- **Rollback:**
  1. `<schritt1>`
  2. `<schritt2>`
- **Human Approval:** `<NAME>` / AUSSTEHEND — <DATUM>
```

---

## 2. Beispiel: Evidence-Block

```markdown
## Evidence

- **Issue:** #42 — Export-Fortschrittsanzeige implementieren
- **Branch:** feature/export-progress-bar
- **Commit:** a1b2c3d
- **PR:** #43
- **Geänderte Dateien:**
  - `src/components/ExportDialog.tsx` (Fortschrittsbalken hinzugefügt)
  - `src/components/__tests__/ExportDialog.test.tsx` (Tests hinzugefügt)
  - `src-tauri/src/commands/export.rs` (Progress-Events hinzugefügt)
- **Tests ausgeführt:**
  - `pnpm test` — 98 Tests, 98 bestanden, 0 fehlgeschlagen
  - `cargo test --manifest-path src-tauri/Cargo.toml` — 113 Tests, 113 bestanden, 0 fehlgeschlagen
- **Testergebnis:** :white_check_mark: PASS
- **Security Checks:**
  - [x] Secret Scan: PASS
  - [x] Dependency Audit: SKIPPED (keine neuen Abhängigkeiten)
  - [x] Lint: PASS
  - [x] Typecheck: PASS
  - [x] Format Check: PASS
- **Manuelle Prüfung:** JA — UI manuell mit verschiedenen Export-Größen getestet
- **Risiken:**
  - Performance bei >1000 Prompts ungetestet — Medium — Follow-up-Issue #44
- **Rollback:**
  1. PR #43 reverten
  2. Branch löschen
- **Human Approval:** @xxammaxx — 2026-06-08
```

---

## 3. Evidence-Kategorien

### 3.1 Bug Fix

Zusätzlich zum Basis-Evidence-Block:

```markdown
- **Failing Test (vorher):** `<testbefehl>` — `<fehlermeldung>`
- **Passing Test (nachher):** `<testbefehl>` — `<ausgabe>`
- **Regression Test:** `<testname>` in `<datei>`
```

### 3.2 Feature Complete

Zusätzlich zum Basis-Evidence-Block:

```markdown
- **Acceptance Criteria:**
  - [x] Kriterium 1 — erfüllt
  - [x] Kriterium 2 — erfüllt
- **Test Coverage:** `<prozent>` % (vorher: `<prozent>` %)
- **Context Manifest:** `docs/agent/context-manifest-<ISSUE>.md`
```

### 3.3 Security Finding

Zusätzlich zum Basis-Evidence-Block (NIEMALS ohne Evidence!):

```markdown
- **CVSS Vector:** `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`
- **CVSS Score:** `<score>` (<severity>)
- **PoC Reproduction:** `<schritte>`
- **PoC Output:**
```

<vollständige_reproduktion>

```
- **Log Evidence:** `<log_auszug>`
- **Human Approval Required:** JA
```

### 3.4 Architecture Decision

Zusätzlich zum Basis-Evidence-Block:

```markdown
- **ADR:** `docs/adr/ADR-<NUMMER>-<titel>.md`
- **Alternativen evaluiert:**
  - Alternative 1 — verworfen weil <grund>
  - Alternative 2 — verworfen weil <grund>
- **Tradeoffs dokumentiert:** JA
- **Human Approval Required:** JA
```

### 3.5 Migration

Zusätzlich zum Basis-Evidence-Block:

```markdown
- **Rollback getestet:** JA / NEIN
- **Data Integrity geprüft:** JA / NEIN
- **Backup bestätigt:** JA / NEIN
- **Human Approval Required:** JA
```

### 3.6 Compliance Judgment

Zusätzlich zum Basis-Evidence-Block (NIEMALS ohne Evidence!):

```markdown
- **Datenfluss-Diagramm:** `docs/data-flow-<ISSUE>.md` oder Referenz
- **Consent-Tracking:** Verifiziert / Nicht anwendbar / Offen
- **Retention-Enforcement:** <aufbewahrungsfrist> — eingehalten / zu prüfen
- **DSGVO/GDPR-Impact:** Keiner / Gering / Mittel / Hoch
- **Data Minimization:** Eingehalten / Zu prüfen
- **Betroffene Datenkategorien:** <liste oder "Keine personenbezogenen Daten">
- **Human Approval Required:** JA
```

---

## 4. Evidence Log

Jeder Agentenlauf MUSS ein Evidence Log führen.

**Template:** `docs/agent/EVIDENCE_LOG_TEMPLATE.md`

**Pflichtfelder:**

- Session ID
- Issue-Referenz
- Evidence-Kategorien (siehe oben)
- Alle ausgeführten Test-Befehle mit Ausgaben
- Alle Security-Checks mit Ergebnissen
- Diff-Statistik

---

## 5. Evidence-Gates

Die folgenden Gates sind in `.opencode/policies/evidence-gates.json` definiert:

| Gate                  | Evidence Required                         | Human Approval |
| --------------------- | ----------------------------------------- | -------------- |
| Severity Claim        | CVSS Vector + PoC + Log                   | Required       |
| Architecture Decision | ADR + Alternatives + Tradeoffs            | Required       |
| Compliance Judgment   | Data Flow + Consent + Retention           | Required       |
| Bug Fix               | Failing Test + Passing Test + Regression  | Not Required   |
| Feature Complete      | Acceptance Criteria + Coverage + Manifest | Not Required   |
| Migration Ready       | Rollback + Data Integrity + Backup        | Required       |

---

## 6. Verbotene Behauptungen

Folgende Behauptungen sind OHNE Evidence NICHT erlaubt:

- „Der Fix funktioniert" (ohne Testergebnis)
- „Keine Security-Implikationen" (ohne Security-Check)
- „Tests wurden ausgeführt" (ohne Testausgabe)
- „Code-Review bestanden" (ohne Review-Kommentar)
- „Kann gemerged werden" (ohne Human Approval)
- „Severity: Critical" (ohne CVSS + PoC)
- „DSGVO-konform" (ohne Datenfluss-Diagramm + Consent-Check)

---

> **Letzte Aktualisierung:** 2026-06-08  
> **Gültig ab:** Commit `chore/github-ai-governance`

<!-- END GITHUB_AI_GOVERNANCE -->
