---
title: "Agentic Human Approval Check — Merge-Freigabe"
description: "Fordert eine KI auf, vor Merge-Freigabe eine vollständige Abschlussübersicht zu erstellen. Prüft git status, diff, Datei-Klassifikation, Blueprint-Schutz, Secrets, Tests, Review-Agent-Status."
category: "governance"
version: "1.0.0"
tags:
  - governance
  - human-approval
  - merge-gate
  - evidence
  - git-hygiene
  - ci-gates
---

# Agentic Human Approval Check — Merge-Freigabe

> **Prompt-Typ:** Human-Approval-Gate vor Merge
> **Zielgruppe:** KI-Agenten, die vor einem Merge eine Abschlussprüfung durchführen
> **Pflicht:** Ja — vor jedem Merge auf `main`/`master`

---

## Ziel

Erstelle eine vollständige Human-Approval-Abschlussübersicht, bevor ein Branch gemerged wird. Der Check muss alle unten aufgeführten Prüfpunkte abdecken und in einem strukturierten Format an den Human Reviewer übergeben werden.

---

## Ausgabeformat

Die Ausgabe MUSS exakt folgendes Format haben:

```text
🔍 Human-Approval-Check — Abschlussübersicht

1. git status --short
[Ausgabe + Klassifikation jeder Zeile]

2. git diff HEAD --stat
[Ausgabe + Kurzbewertung, ob Scope eingehalten wurde]

3. Dateien nach Kategorien
[Kategorietabelle mit Dateipfaden]

4. Geschützte Dateien
[Blueprint/pre-existing/unrelated — Bestätigung unverändert]

5. .gitignore — Exclusions
[Relevante Patterns + Status]

6. Untracked relevante Dateien
[Klassifikation jeder untracked Datei]

7. Finale Testergebnisse
[Test-Befehl + Ergebnis + Fehlerdetails]

8. Nicht ausgeführte Tests
[Test + Begründung für Nicht-Ausführung]

9. Abnahme-Kriterien
[Kriterium + Status (✅/❌)]

10. Review-Agent Ergebnis
Status: APPROVED | CHANGES_REQUESTED | BLOCKED

11. Merge-Empfehlung
[Freigabe oder Blocker mit Begründung]
```

---

## Prüfpunkte

### 1. Git Working Tree Analyse

Führe aus und dokumentiere:

```bash
git status --short
git diff HEAD --stat
git diff HEAD --name-only
git diff --cached --name-only
git ls-files --others --exclude-standard
```

Klassifiziere JEDE Datei in eine der folgenden Kategorien:

| Kategorie                  | Beschreibung                                |
| -------------------------- | ------------------------------------------- |
| Feature-Änderung           | Neue Funktion oder Erweiterung              |
| Bugfix                     | Fehlerbehebung                              |
| Docs-as-Code               | Dokumentationsänderung                      |
| CI                         | CI/CD-Konfiguration                         |
| Gitignore                  | `.gitignore`-Änderung                       |
| Tests                      | Testdatei-Änderung                          |
| Agent Logs                 | Agent-Evidence/Log-Datei                    |
| Evidence                   | Evidence-Log oder Context-Manifest          |
| Pre-existing Modification  | Änderung, die vor dieser Session existierte |
| Unrelated Change           | Änderung, die nicht zum Scope gehört        |
| Blueprint / nicht anfassen | Experimentelle/Blueprint-Datei              |
| Build-Artefakt             | Build-Output (dist/, target/, site/)        |
| Secret Risk                | Datei, die Secrets enthalten könnte         |

### 2. Blueprint- und Schutzdatei-Check

- [ ] Blueprint-Dateien NICHT verändert (via `git diff HEAD --name-only` beweisbar)
- [ ] Pre-existing Änderungen NICHT gestaged oder verändert
- [ ] Unrelated Änderungen NICHT übernommen
- [ ] Keine Build-Artefakte (`dist/`, `target/`, `site/`, `.tmp/`) im Commit
- [ ] Keine Cache-Dateien (`__pycache__/`, `*.pyc`, `node_modules/`) im Commit

### 3. Secret und Sicherheits-Check

- [ ] `git diff HEAD` enthält KEINE Secrets (API Keys, Tokens, Passwörter, Private Keys)
- [ ] Keine `.env`-Dateien im Diff
- [ ] Keine `.db`, `.db-shm`, `.db-wal` Dateien im Diff
- [ ] `.gitignore` enthält alle relevanten Exclusions

### 4. Test-Gates

- [ ] Frontend-Tests ausgeführt: `pnpm test`
- [ ] Rust-Tests ausgeführt: `cargo test --manifest-path src-tauri/Cargo.toml`
- [ ] Lint ausgeführt: `pnpm lint`
- [ ] Typecheck: `tsc --noEmit`
- [ ] Build: `pnpm build`

Für JEDEN nicht ausgeführten Test: Begründung dokumentieren.

### 5. Review-Agent Status

Prüfe, ob der `review-agent` bereits ausgeführt wurde. Falls nicht: Fordere Review-Agent an.

Der Review-Agent muss liefern:

- Status: `APPROVED | CHANGES_REQUESTED | BLOCKED`
- Blocker (falls vorhanden)
- Major/Minor Findings
- Security Risks
- Docs Drift
- Evidence Completeness
- Test Coverage
- Scope Creep
- Unrelated Changes

### 6. CI-Gates

- [ ] CI Run abgeschlossen und grün
- [ ] Docs-Quality-Check bestanden
- [ ] Secret-Scan bestanden
- [ ] AI-Governance-Check bestanden

### 7. Merge-Entscheidung

Nur `APPROVED` wenn:

1. Alle Tests grün
2. Keine Blocker vom Review-Agent
3. Keine Secrets im Diff
4. Blueprint-Dateien unverändert
5. CI-Gates grün
6. Scope eingehalten
7. Keine unrelated Changes

Ansonsten: `BLOCKED` mit dokumentierten Blockern.

---

## Harte Verbote

- ❌ `git add .` — niemals pauschal stagen
- ❌ Pre-existing Änderungen stagen
- ❌ Blueprint-Dateien anfassen
- ❌ Secrets committen
- ❌ Build-Artefakte committen
- ❌ Merge ohne grüne Gates
- ❌ Behauptung ohne Evidence

---

## Integration in PromptVault Lite

Dieser Prompt ist Teil des **Agentic Human Approval & Docs-as-Code Standard** Prompt-Packs.

- **Kategorie:** `governance`
- **Tags:** `governance`, `human-approval`, `merge-gate`, `evidence`, `git-hygiene`, `ci-gates`
- **Optimierungsmodus:** `conservative` (harte Constraints müssen erhalten bleiben)

---

## Beispiel: Evidence-Block (nicht als Artefakt zu werten)

```text
🔍 Human-Approval-Check — Abschlussübersicht

1. git status --short
 M prompts/governance/human-approval-check.md      # Feature-Änderung (neu)

2. git diff HEAD --stat
 prompts/governance/human-approval-check.md | 120 ++++++++++++++++++++
 1 file changed, 120 insertions(+)
```
