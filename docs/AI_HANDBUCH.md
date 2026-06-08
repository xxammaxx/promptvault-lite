<!-- BEGIN GITHUB_AI_GOVERNANCE -->

# GitHub-KI-Governance 2026 — PromptVault Lite

> **Verbindlicher Standard für KI-gestützte Entwicklung in diesem Repository.**  
> Gültig ab: Juni 2026 | Review-Zyklus: jährlich oder bei signifikanten Projektänderungen

---

## 1. GitHub als Source of Truth

GitHub ist die einzige autoritative Quelle für alle Projektinformationen:

- **Issues** sind die Auftragseinheit — kein Code ohne Issue.
- **Pull Requests** sind die Review- und Evidence-Einheit — kein Merge ohne PR.
- **Actions** sind die technischen Gates — kein Merge ohne grüne Checks.
- **Branches** isolieren Arbeit — kein direkter Push auf `main`.
- **Commits** dokumentieren Änderungen atomar — konventionelle Commit-Messages.
- **Kommentare** dokumentieren Agentenläufe — Start- und End-Kommentar pro Issue.

Jede KI- oder Agentenarbeit MUSS über diesen Pfad laufen. Keine Ausnahmen.

---

## 2. Verbindlicher Workflow

```
Issue → Spec → Verification Contract → Red Tests → Agent-Code
    → CI/Security Gates → Sandbox Preview → Reviewer-Agent
    → Human Approval → Evidence-Kommentar → Merge
```

### Phase 1: Issue

- GitHub Issue mit klarem Ziel, Kontext, Acceptance Criteria.
- Label für Kategorie (bug, enhancement, security, context-engineering).
- Zuweisung an verantwortlichen Menschen oder Agenten.

### Phase 2: Spec

- Features: Speckit-Workflow (`/speckit.constitution` → `/speckit.specify` → `/speckit.plan` → `/speckit.tasks`).
- Bugs: Reproduktionsschritte, erwartetes Verhalten, tatsächliches Verhalten.
- Context-Engineering: klare Scope-Definition, Akzeptanzkriterien.

### Phase 3: Verification Contract

- Was muss getestet werden, um Korrektheit zu beweisen?
- Welche Tests müssen VOR der Implementierung rot sein?
- Welche Tests müssen NACH der Implementierung grün sein?

### Phase 4: Red Tests

- Tests schreiben, die aktuell fehlschlagen (erwartetes Verhalten noch nicht implementiert).
- Oder: begründen, warum Red Tests nicht möglich/nötig sind.

### Phase 5: Agent-Code

- Implementierung durch Agent oder Mensch.
- Konventionen aus AGENTS.md und `.github/copilot-instructions.md` befolgen.
- Keine Blind-Änderungen, bestehende Regeln respektieren.

### Phase 6: CI/Security Gates

- Lint, Typecheck, Tests, Build müssen grün sein.
- Secret Scanning darf keine Secrets finden.
- Security-Regeln aus `docs/SECURITY_GATES.md` müssen eingehalten werden.

### Phase 7: Sandbox Preview

- Bei UI-Änderungen: Playwright-Screenshots vergleichen.
- Bei Features: funktionale Validierung in isolierter Umgebung.
- Begründung, wenn nicht anwendbar.

### Phase 8: Reviewer-Agent

- Code-Review durch `review-agent` (automatisiert).
- Qualitäts-, Security- und Spec-Compliance-Prüfung.
- Strukturierter Review-Kommentar im PR.

### Phase 9: Human Approval

- Menschlicher Maintainer prüft und genehmigt.
- Pflicht bei: Security-Änderungen, Architektur-Änderungen, Migrationen, neuen Abhängigkeiten.

### Phase 10: Evidence-Kommentar

- Strukturierter Abschlusskommentar im Issue.
- Enthält: Branch, Commit, geänderte Dateien, Testergebnisse, Risiken, Rollback.

### Phase 11: Merge

- Nur nach grünen Checks und Human Approval.
- Squash-Merge oder Rebase-Merge nach Projektkonvention.
- Branch nach Merge löschen.

---

## 3. Issues als Auftragseinheit

Jede Arbeit beginnt mit einem GitHub Issue. Das Issue definiert:

| Feld                  | Beschreibung                                   | Pflicht   |
| --------------------- | ---------------------------------------------- | --------- |
| Ziel                  | Was soll erreicht werden?                      | Ja        |
| Kontext               | Warum ist das wichtig?                         | Ja        |
| Acceptance Criteria   | Wann gilt die Arbeit als abgeschlossen?        | Ja        |
| Verification Contract | Welche Tests beweisen Korrektheit?             | Empfohlen |
| Red Tests             | Welche Tests müssen vorher fehlschlagen?       | Empfohlen |
| Security/Privacy      | Gibt es Sicherheits- oder Datenschutzbedenken? | Ja        |

Issue-Templates:

- `feature.yml` — für neue Features (Speckit-Workflow)
- `bug.yml` — für Fehlerberichte
- `ai-task.yml` — für KI-gesteuerte Aufgaben
- `context-engineering-task.yml` — für Projekt-Standards und Infrastruktur

---

## 4. PRs als Review- und Evidence-Einheit

Jede Änderung erfolgt über einen Pull Request. Der PR enthält:

- Zusammenfassung der Änderungen
- Link zum Issue (`Closes #<NUMMER>`)
- Workflow-Checkliste
- Testergebnisse
- Security-Prüfung
- Evidence-Block
- Human Approval Status

PR-Template: `.github/pull_request_template.md`

---

## 5. Actions als technische Gates

CI-Workflow in `.github/workflows/ci.yml`:

| Job         | Prüfung                      | Bei Fehler      |
| ----------- | ---------------------------- | --------------- |
| Frontend    | Typecheck, Lint, Test, Build | Merge blockiert |
| Rust        | Format, Clippy, Test, Build  | Merge blockiert |
| Secret Scan | Secrets, .env, .db Dateien   | Merge blockiert |

Kein Merge ohne grüne CI.

---

## 6. Security Scanning

Automatisierte Security-Prüfungen:

- **Secret Scanning**: Pattern-basierte Suche nach API-Keys, Tokens, Passwörtern.
- **Dependency Scanning**: `cargo audit` und `pnpm audit` (periodisch).
- **Static Analysis**: `cargo clippy`, ESLint `strict-type-checked`.
- **CodeQL**: Dokumentiert, Aktivierung in GitHub empfohlen.

Siehe `docs/SECURITY_GATES.md` für vollständige Regeln.

---

## 7. CODEOWNERS und Review-Regeln

- `@xxammaxx` ist Default Owner für alle Dateien.
- Security-relevante Dateien (`docs/SECURITY_GATES.md`, CI-Workflows) benötigen Owner-Review.
- Agenten-Regeln (`AGENTS.md`, `.github/copilot-instructions.md`) benötigen Owner-Review.

Siehe `.github/CODEOWNERS`.

---

## 8. Rulesets / Branch Protection

Empfohlene GitHub-Einstellungen:

- Branch Protection oder Ruleset für `main`.
- Pull Request vor Merge erforderlich.
- Required Status Checks aktivieren.
- CODEOWNERS Review erforderlich.
- Direkte Pushes auf `main` verbieten.
- Admin Override nur dokumentiert erlauben.

Siehe `docs/GITHUB_REPOSITORY_SETTINGS_CHECKLIST.md`.

---

## 9. Copilot / KI-Agenten

Alle KI-gestützten Arbeiten folgen diesem Standard:

- Agenten lesen `AGENTS.md` als ersten Cold Context.
- Agenten nutzen `.github/copilot-instructions.md` als Projektkontext.
- Agenten arbeiten nur auf Feature-Branches.
- Agenten dokumentieren jeden Lauf mit Context Manifest und Evidence Log.
- Agenten posten Start- und End-Kommentare im Issue.
- Agenten überschreiben niemals bestehende Dateien blind.

---

## 10. MCP / Tool-Integration

Trust-Tier-System für MCP-Tools:

| Tier   | Zugriff    | Tools                              | Auto-Approve |
| ------ | ---------- | ---------------------------------- | ------------ |
| Tier 0 | Readonly   | GitHub MCP, Brave Search, Context7 | Ja           |
| Tier 1 | Sandboxed  | Playwright, Docker, SQLite (lokal) | Ja           |
| Tier 2 | Human-Gate | FileSystem (external), PostgreSQL  | Nein         |

Siehe `.opencode/policies/mcp-trust-tiers.json`.

---

## 11. Evidence-Kommentare

Jeder abgeschlossene Agentenlauf MUSS einen Evidence-Kommentar enthalten:

```markdown
## Evidence

- Issue: #<NUMMER>
- Branch: <BRANCH>
- Commit: <COMMIT>
- PR: #<NUMMER>
- Geänderte Dateien: <LISTE>
- Tests ausgeführt: <BEFEHLE>
- Testergebnis: <PASS/FAIL>
- Security Checks: <BEFEHLE>
- Manuelle Prüfung: <JA/NEIN>
- Risiken: <LISTE>
- Rollback: <SCHRITTE>
- Human Approval: <NAME>/<STATUS>
```

Siehe `docs/EVIDENCE_STANDARD.md`.

---

## 12. Human Approval

Folgende Aktionen benötigen zwingend Human Approval:

- Push auf `main`/`master`
- Merge eines PR
- Deployment in Produktion
- Datenbank-Migrationen (auch lokal)
- Datenlöschung (auch Testdaten)
- Security-Regel-Änderungen
- Architektur-Änderungen ohne ADR
- Neue Abhängigkeiten

---

## 13. Kein Merge ohne Checks

Ein Merge auf `main` ist nur erlaubt, wenn:

1. Alle CI-Checks grün sind.
2. CODEOWNERS Review erteilt wurde.
3. Human Approval vorliegt (wo erforderlich).
4. Evidence-Kommentar im Issue vorhanden ist.
5. PR-Template vollständig ausgefüllt ist.

---

> **Letzte Aktualisierung:** 2026-06-08  
> **Gültig ab:** Commit `chore/github-ai-governance`  
> **Verantwortlich:** `@xxammaxx`

<!-- END GITHUB_AI_GOVERNANCE -->
