# Verification Contract

> **Pflichtdokument vor jeder Implementierung.**  
> Definiert die Brücke zwischen Spezifikation und Test.  
> Keine Implementierung ohne Verification Contract.

---

## Metadaten

| Feld          | Wert              |
| ------------- | ----------------- |
| Issue         | `#<NUMMER>`       |
| Specification | `<SPEK-DOKUMENT>` |
| Version       | `<VERSION>`       |
| Autor         | `<AUTOR>`         |
| Datum         | `<ISO8601>`       |

---

## Erwartetes Verhalten

### Funktional

- `<VERHALTEN 1>`
- `<VERHALTEN 2>`
- `<VERHALTEN 3>`

### Nicht-funktional

- **Performance:** `<ANFORDERUNG>`
- **Sicherheit:** `<ANFORDERUNG>`
- **Accessibility:** `<ANFORDERUNG>`
- **Plattform:** `<ANFORDERUNG>`

---

## Nicht erlaubtes Verhalten

- `<VERBOTENES VERHALTEN 1>`
- `<VERBOTENES VERHALTEN 2>`
- **Keine Regression** in bestehenden Funktionalitäten
- **Keine neuen Lint-Warnings** ohne dokumentierte Begründung
- **Keine Verschlechterung** der Testabdeckung

---

## Akzeptanzkriterien

- [ ] **AC1:** `<KRITERIUM>` — Verifikation: `<WIE>`
- [ ] **AC2:** `<KRITERIUM>` — Verifikation: `<WIE>`
- [ ] **AC3:** `<KRITERIUM>` — Verifikation: `<WIE>`

---

## Red Tests

> Red Tests werden VOR der Implementierung geschrieben und MÜSSEN zunächst fehlschlagen.

| Test         | Datei     | Erwarteter Fehler | Status                                 |
| ------------ | --------- | ----------------- | -------------------------------------- |
| `<TESTNAME>` | `<DATEI>` | `<FEHLER>`        | 🔴 Red / 🟢 Green nach Implementierung |
| `<TESTNAME>` | `<DATEI>` | `<FEHLER>`        | 🔴 Red / 🟢 Green nach Implementierung |

**Red-Test-Ausgabe vor Implementierung:**

```
<AUSGABE DER FEHLGESCHLAGENEN TESTS>
```

---

## Unit Tests

| Test         | Datei     | Beschreibung     | Status                                        |
| ------------ | --------- | ---------------- | --------------------------------------------- |
| `<TESTNAME>` | `<DATEI>` | `<BESCHREIBUNG>` | ⬜ Geplant / ✅ Bestanden / ❌ Fehlgeschlagen |
| `<TESTNAME>` | `<DATEI>` | `<BESCHREIBUNG>` | ⬜ / ✅ / ❌                                  |

**Minimale Coverage-Anforderung:** `<PROZENT>`% (branches)

---

## Integration Tests

| Test         | Datei     | Beschreibung     | Status       |
| ------------ | --------- | ---------------- | ------------ |
| `<TESTNAME>` | `<DATEI>` | `<BESCHREIBUNG>` | ⬜ / ✅ / ❌ |

---

## E2E / Smoke Tests

| Test         | Beschreibung     | Status       |
| ------------ | ---------------- | ------------ |
| `<TESTNAME>` | `<BESCHREIBUNG>` | ⬜ / ✅ / ❌ |

---

## Security Gates

- [ ] **Secret-Scan:** Keine Secrets im Diff (`git diff --staged`)
- [ ] **Env-Dateien:** Keine `.env`-Dateien im Commit
- [ ] **Dependencies:** Keine bekannten CVEs in neuen oder aktualisierten Abhängigkeiten
- [ ] **SAST:** Keine neuen HIGH/CRITICAL Findings (falls konfiguriert)
- [ ] **Input-Validierung:** Alle neuen Eingaben validiert
- [ ] **Output-Sanitization:** Keine Rohdaten in Fehlermeldungen

---

## Datenschutz-Gates

- [ ] **Keine Produktionsdaten** in Tests oder Fixtures
- [ ] **Keine PII** in Logs oder Fehlermeldungen
- [ ] **Keine echten Secrets** in Test-Assertions (maskiert/ersetzt)
- [ ] **Keine Netzwerkaufrufe** für lokale Kernfunktionen

---

## Dokumentations-Gates

- [ ] **`docs/CHANGELOG.md`** aktualisiert
- [ ] **`README.md`** aktualisiert (falls API/UX betroffen)
- [ ] **`docs/ARCHITECTURE.md`** aktualisiert (falls Architektur betroffen)
- [ ] **ADR erstellt** (falls Architekturentscheidung)
- [ ] **Context Manifest** erstellt/aktualisiert
- [ ] **Evidence Log** erstellt/aktualisiert

---

## Review-Gates

- [ ] **Code-Review** durch Review-Agent
- [ ] **Reviewer-Checkliste** (`docs/agent/REVIEWER_CHECKLIST.md`) abgearbeitet
- [ ] **Human Approval** eingeholt (wo erforderlich)

---

## Evidence-Anforderungen

- [ ] Testausgaben vollständig dokumentiert
- [ ] Lint-Ausgaben dokumentiert
- [ ] Diff (`git diff --stat`) dokumentiert
- [ ] Screenshots (bei UI-Änderungen)
- [ ] Logs (bei Fehlern)

---

## Definition of Done

Diese Aufgabe gilt als abgeschlossen, wenn:

- [ ] Alle Akzeptanzkriterien erfüllt sind
- [ ] Alle Red Tests grün sind
- [ ] Alle Unit Tests grün sind
- [ ] Alle Integration Tests grün sind
- [ ] CI ist grün (oder Abweichung dokumentiert)
- [ ] Security Gates bestanden
- [ ] Datenschutz-Gates bestanden
- [ ] Dokumentation aktualisiert
- [ ] Code Review bestanden
- [ ] Human Approval eingeholt (wo erforderlich)
- [ ] PR ist gemerged (oder bereit zum Merge)
- [ ] Issue-End-Kommentar geschrieben

---

> **Hinweis:** Dieser Contract ist bindend. Abweichungen müssen dokumentiert und begründet werden.  
> Ablage: `docs/agent/verification-contract-<ISSUE>.md`
