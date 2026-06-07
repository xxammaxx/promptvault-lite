# Reviewer Checklist

> **Pflicht-Checkliste für Review-Agent und Human Reviewer vor jedem Merge.**  
> Jeder PR muss diese Checkliste bestehen.

---

## PR-Metadaten

| Feld        | Wert                 |
| ----------- | -------------------- |
| PR          | `#<NUMMER>`          |
| Issue       | `#<NUMMER>`          |
| Autor       | `<AUTOR>`            |
| Branch      | `<BRANCH>`           |
| Ziel-Branch | `main` / `<ANDERER>` |
| Datum       | `<ISO8601>`          |

---

## Scope-Prüfung

- [ ] **PR erfüllt exakt das verlinkte Issue** — keine Scope Creep
- [ ] **In-Scope-Grenzen** aus dem Issue wurden eingehalten
- [ ] **Out-of-Scope** wurde nicht implementiert
- [ ] **Keine nicht verwandten Änderungen** im Diff (Refactoring, Whitespace, Formatierung)

## Akzeptanzkriterien

- [ ] **Alle Akzeptanzkriterien** aus dem Issue wurden erfüllt
- [ ] **Jedes Kriterium** hat einen korrespondierenden Test oder eine begründete Ausnahme
- [ ] **Edge Cases** aus der Spezifikation wurden behandelt

## Test-Prüfung

- [ ] **Red Tests** existieren (oder begründet nicht möglich)
- [ ] **Unit Tests** decken neuen Code ab
- [ ] **Integration Tests** wurden ergänzt (wo nötig)
- [ ] **Tests sind aussagekräftig** — nicht nur `expect(true).toBe(true)`
- [ ] **Alle Tests bestehen** (`pnpm test` und `cargo test`)
- [ ] **Keine Regression** — bestehende Tests schlagen nicht fehl
- [ ] **Coverage** nicht verschlechtert (falls messbar)

## CI/Security-Prüfung

- [ ] **CI ist grün** (oder Abweichung dokumentiert)
- [ ] **Lint** ohne neue Warnings/Errors
- [ ] **Format** eingehalten (Prettier, `cargo fmt`)
- [ ] **Typecheck** bestanden (`tsc --noEmit`)
- [ ] **Build** erfolgreich

## Secrets & Sicherheit

- [ ] **Keine Secrets** im Diff (API-Keys, Tokens, Passwörter)
- [ ] **Keine `.env`-Dateien** im Diff
- [ ] **Keine `.db`-Dateien** im Diff
- [ ] **Keine hartcodierten Credentials** im Code
- [ ] **Keine unsicheren Dependencies** eingeführt
- [ ] **Keine Debug-Logs** mit sensitiven Daten

## Produktionsdaten

- [ ] **Keine echten Produktionsdaten** in Tests oder Fixtures
- [ ] **Keine echten Benutzerdaten** in Commit-Messages oder Kommentaren
- [ ] **Testdaten als solche erkennbar** (z. B. `test@example.com`)

## Architektur

- [ ] **Keine ungeprüften Architekturänderungen** ohne ADR
- [ ] **Neue Abhängigkeiten** wurden geprüft und sind gerechtfertigt
- [ ] **Bestehende Patterns** werden respektiert
- [ ] **Zirkuläre Abhängigkeiten** wurden vermieden
- [ ] **Modul-Grenzen** wurden eingehalten (Frontend ↔ Backend)

## Dokumentation

- [ ] **Context Manifest** wurde erstellt/aktualisiert
- [ ] **Evidence Log** wurde erstellt/aktualisiert
- [ ] **`docs/CHANGELOG.md`** wurde aktualisiert
- [ ] **README** wurde aktualisiert (falls API/UX betroffen)
- [ ] **ADR** wurde erstellt (falls Architekturänderung)
- [ ] **Code-Kommentare** erklären das „Warum", nicht das „Was"

## Evidence

- [ ] **Keine unbelegten Behauptungen** im PR
- [ ] **Vendor-Claims** sind als solche markiert
- [ ] **Annahmen** sind offengelegt
- [ ] **Unsicherheiten** sind dokumentiert
- [ ] **Testausgaben** sind im Evidence Log dokumentiert

## Human Approval

- [ ] **Human Approval nötig?** (Push, Merge, Migration, Security-Änderung)
  - [ ] **Ja** → Genehmigung liegt vor
  - [ ] **Nein** → Begründung dokumentiert

---

## Reviewer-Entscheidung

### Gesamturteil

- [ ] ✅ **APPROVED** — Alle Checks bestanden, bereit zum Merge
- [ ] ⚠️ **CHANGES REQUESTED** — Mängel gefunden, Nachbesserung nötig
- [ ] ❌ **REJECTED** — Fundamentale Probleme, nicht mergbar

### Beanstandungen (falls CHANGES REQUESTED oder REJECTED)

| ID  | Kategorie     | Beschreibung     | Schwere                 | Behebung      |
| --- | ------------- | ---------------- | ----------------------- | ------------- |
| F1  | `<KATEGORIE>` | `<BESCHREIBUNG>` | Blocker / Major / Minor | `<VORSCHLAG>` |

### Reviewer-Notizen

```
<FREITEXT>
```

---

> **Reviewer:** `<NAME>`  
> **Datum:** `<ISO8601>`  
> **Signatur:** Diese Checkliste wurde vollständig abgearbeitet.
