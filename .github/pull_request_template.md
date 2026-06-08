<!-- BEGIN GITHUB_AI_GOVERNANCE -->

# Pull Request

## Summary

<!-- Kurze Zusammenfassung (1-2 Sätze): Was? Warum? -->

## Linked Issue

<!-- Fixes #<NUMMER> oder Closes #<NUMMER> -->

Closes #

## Workflow Checklist

<!-- Pflicht: Alle Workflow-Phasen durchlaufen -->
<!--
Issue → Spec → Verification Contract → Red Tests → Agent-Code
  → CI/Security Gates → Sandbox Preview → Reviewer-Agent
  → Human Approval → Evidence-Kommentar → Merge
-->

- [ ] Issue gelesen und verstanden
- [ ] Spec geprüft oder ergänzt (Speckit für Features)
- [ ] Verification Contract definiert
- [ ] Red Tests ergänzt (oder begründet nicht nötig)
- [ ] Implementierung abgeschlossen (Agent-Code)
- [ ] CI/Security Gates grün (Typecheck, Lint, Test, Build, Secret Scan)
- [ ] Sandbox Preview geprüft (oder begründet nicht nötig)
- [ ] Reviewer-Agent oder menschlicher Review durchgeführt
- [ ] Human Approval ausstehend oder erteilt
- [ ] Evidence-Kommentar vorbereitet

## Scope

### In Scope

<!-- Was wurde implementiert? -->

### Out of Scope

<!-- Was wurde bewusst NICHT implementiert? -->

## Context Manifest

<!-- Pflicht: Context Manifest aus docs/agent/ -->

- [ ] Context Manifest erstellt/aktualisiert: `docs/agent/context-manifest-<ISSUE>.md`
- [ ] Cold Context geprüft (AGENTS.md, Security-Gates)
- [ ] Warm Context geprüft (Architektur, ADRs, Konventionen)
- [ ] Hot Context dokumentiert (Tests, Logs, Fehler)

## Verification Contract

<!-- Pflicht: Verification Contract erfüllt -->

- [ ] Akzeptanzkriterien erfüllt
- [ ] Red Tests erstellt (oder begründet nicht möglich)
- [ ] Tests ausgeführt und bestanden
- [ ] CI grün (oder Abweichung dokumentiert)

## Tests

### Commands Run

```bash
# Vorher (Baseline):
pnpm test
# <AUSGABE>

# Nachher:
pnpm test
# <AUSGABE>

cargo test --manifest-path src-tauri/Cargo.toml
# <AUSGABE>

pnpm lint
# <AUSGABE>
```

## Security

<!-- Pflicht: Security-Prüfung -->

- [ ] Keine Secrets im Diff
- [ ] Keine `.env`-Dateien im Diff
- [ ] Keine `.db`-Dateien im Diff
- [ ] Keine Produktionsdaten in Tests
- [ ] Keine ungeprüften Migrationen
- [ ] Keine Security-Regeln entfernt
- [ ] Human Approval erforderlich?
  - [ ] Ja → Genehmigung: `<NAME>`, Datum: `<DATUM>`
  - [ ] Nein → Begründung: `<GRUND>`

## Evidence

<!-- Pflicht: Evidence Log aus docs/agent/ -->

- [ ] Evidence Log erstellt/aktualisiert: `docs/agent/evidence-log-<ISSUE>.md`

### Test Results

```
<VOLLSTÄNDIGE TESTAUSGABEN>
```

### Screenshots / Traces

<!-- Nur bei UI-Änderungen -->

| Beschreibung     | Screenshot |
| ---------------- | ---------- |
| `<BESCHREIBUNG>` | `<PFAD>`   |

### Changed Files

```
<git diff --stat AUSGABE>
```

## Risks

<!-- Offene Risiken, bekannte Einschränkungen, Follow-up-Issues -->

| Risiko     | Schwere      | Maßnahme      |
| ---------- | ------------ | ------------- |
| `<RISIKO>` | High/Med/Low | `<MASSNAHME>` |

## Reviewer Notes

<!-- Hinweise für den Reviewer -->

<!-- END GITHUB_AI_GOVERNANCE -->
