# AGENTS.md — Agent Rules for PromptVault Lite

> **Verbindliche Regeln für alle KI-Agenten, die an diesem Projekt arbeiten.**  
> Diese Datei wird bei jedem Agentenlauf als Cold Context geladen.  
> Verstöße gegen diese Regeln führen zu abgelehnten PRs.

---

## Core Principle: GitHub as Single Source of Truth

Jede Arbeitseinheit MUSS von einem GitHub Issue ausgehen. Kein Issue → keine Implementierung.

---

## Kontext-Zonen

Kontext ist eine knappe, kontrollierte Ressource. Agenten dürfen nicht pauschal alle Tools, Dateien oder Memories laden.

### Cold Context (unverhandelbar)

- Sicherheitsregeln aus `docs/SECURITY_GATES.md`
- Datenschutzregeln (lokal, keine Cloud-Anbindung)
- GitHub Issues als Single Source of Truth
- Output-Schemata (Issue-Start/End-Kommentare)
- Human-Approval-Regeln
- Merge-/Push-Gates
- Verbot von Secrets
- Verbot von Produktionsdaten in Tests

### Warm Context (beratend, langsam veränderlich)

- Architekturentscheidungen (`docs/ARCHITECTURE.md`, ADRs)
- Coding-Konventionen (ESLint, Prettier, `cargo fmt`, `cargo clippy`)
- Nutzerpräferenzen
- Produktvision und Roadmap
- Bekannte Risiken
- Domain-Wissen (Prompt-Analyse, Qualitätsmetriken)

### Hot Context (aktueller Laufzeitkontext, TTL-begrenzt)

- Aktuelles Issue
- Aktuelle Logs
- Aktuelle Testausgaben
- Aktuelle Tool-Ergebnisse
- Aktuelle Diff-Analyse
- Aktuelle Fehler

Hot Context hat eine begrenzte Lebensdauer und darf nicht ungeprüft in dauerhafte Dokumentation übernommen werden.

---

## Agent Start Gate

Vor JEDER Änderung MUSS der Agent:

1. **Issue lesen:** `gh issue view <ISSUE> --repo xxammaxx/promptvault-lite --comments`
2. **Specs laden:** Relevante Spezifikationen aus `.opencode/spec/` und `docs/` lesen
3. **Context Manifest starten:** `docs/agent/CONTEXT_MANIFEST_TEMPLATE.md` ausfüllen
4. **Repo-Status prüfen:** `git fetch --all --prune`, `git status`, aktuellen Branch identifizieren
5. **Test- und Buildbefehle identifizieren:**
   - Frontend: `pnpm test`, `pnpm lint`, `pnpm build`
   - Rust: `cargo test --manifest-path src-tauri/Cargo.toml`
6. **Risiken benennen:** Im Context Manifest dokumentieren
7. **Plan als GitHub-Kommentar posten:** Strukturierten Start-Kommentar im Issue schreiben

### Start-Kommentar-Vorlage

```markdown
## Task Started

### Context

- Issue: #<NUMMER>
- Branch: <BRANCH>
- Current commit: <COMMIT>
- Started at: <ISO8601_TIMESTAMP>

### Understanding

<Zusammenfassung des Verständnisses>

### Planned Work

1. <Schritt>
2. <Schritt>

### Tests Planned

- <Testbefehl>
- <Testbefehl>
```

---

## Agent Work Gate

Während der Umsetzung MUSS der Agent:

1. **Nur definierten Scope bearbeiten** — keine Scope Creep
2. **Kleine Commits bevorzugen** — atomar, reviewbar
3. **Vorhandene Patterns respektieren** — keine stillschweigenden Refactorings
4. **Keine Blind-Fixes** — Ursache verstehen, nicht Symptome kaschieren
5. **Red Tests vor Code** — oder begründeten Testplan dokumentieren
6. **Dokumentation parallel aktualisieren** — nicht erst am Ende
7. **Neue Risiken sofort dokumentieren** — als Issue-Kommentar oder neues Issue
8. **Nicht direkt auf `main` oder `master` arbeiten** — immer Feature-Branch
9. **Nur notwendige Tools laden** — Tool-Discovery statt Tool-Dump
10. **Rohdaten nie ungefiltert in den nächsten Prompt übernehmen** — Ergebnisse zusammenfassen

---

## Agent End Gate

Nach Abschluss MUSS der Agent:

1. **Tests ausführen:**
   - `pnpm test` — Frontend-Tests
   - `cargo test --manifest-path src-tauri/Cargo.toml` — Rust-Tests
   - `pnpm lint` — ESLint
2. **CI-Ergebnis prüfen** oder lokal simulieren (`pnpm build`, `tsc --noEmit`)
3. **Context Manifest finalisieren** — alle Felder ausgefüllt
4. **Evidence Log finalisieren** — alle Evidence-Kategorien belegt
5. **PR-Beschreibung ausfüllen** — gemäß `.github/pull_request_template.md`
6. **Review-Agent anfordern** — Task-Dispatch an `review-agent`
7. **Abschlusskommentar im Issue schreiben** — mit Test-Ergebnissen und Änderungsliste

### End-Kommentar-Vorlage

```markdown
## Task Completed

### Context

- Issue: #<NUMMER>
- Branch: <BRANCH>
- Commit: <COMMIT>

### Changes

<Zusammenfassung>

### Files Changed

- <Datei>
- <Datei>

### Tests Run

- `pnpm test` :white_check_mark: / :x:
- `cargo test` :white_check_mark: / :x:
- `pnpm lint` :white_check_mark: / :x:

### Result

- <Ergebnis>

### Blockers / Follow-ups

- <Verbleibende Punkte>
```

---

## Hard Constraints (Re-Injection)

Diese Regeln werden bei JEDEM Agentenlauf neu geladen:

1. GitHub Issues sind Single Source of Truth
2. Jede Arbeit beginnt mit einem Issue
3. Keine Änderung ohne Akzeptanzkriterien
4. Keine Änderung ohne Test oder begründeten Testplan
5. Keine direkte Änderung auf `main` oder `master`
6. Keine Secrets lesen, ausgeben oder committen
7. Keine `.env`-Dateien committen
8. Keine echten Produktionsdaten verwenden
9. Keine Datenbankmigration ohne Rollback-Hinweis
10. Keine Architekturänderung ohne ADR
11. Kein Push/Merge ohne grüne Gates
12. Kein Merge ohne Review oder Human Approval
13. Keine Behauptung ohne Evidence
14. Keine Änderung an `docs/agent/`-Templates ohne explizite Anweisung

---

## Prohibited Actions (Always)

- Niemals aus dem Gedächtnis implementieren — Issue online lesen
- Niemals `*.db`, `*.db-shm`, `*.db-wal`, `.env`, oder Secrets committen
- Niemals den GitHub Issue Comment Cycle überspringen
- Niemals kanonische Produktionsdaten autonom ändern
- Niemals Severity-Behauptungen ohne Evidence
- Niemals den Speckit-Workflow für Features überspringen
- Niemals große Produktfeatures nebenbei implementieren
- Niemals bestehende Tests löschen, nur damit CI grün wird
- Niemals Security-Regeln entfernen
- Niemals alte Projektentscheidungen stillschweigend überschreiben

---

## Tool-Discovery-Regeln

Agenten dürfen nicht pauschal alle Tools laden. Stattdessen:

1. Aufgabe analysieren
2. Relevante Tool-Kategorie bestimmen
3. Nur notwendige Tools laden
4. Nur notwendige Dateien lesen
5. Tool-Ergebnisse zusammenfassen
6. Fehlerlogs, Stacktraces und Testfehler vollständig erhalten
7. Rohdaten nie ungefiltert in den nächsten Prompt übernehmen

---

## Trust Tiers

- **Tier 0 (Readonly):** GitHub MCP (search/read), Brave Search, Context7
- **Tier 1 (Sandboxed):** Playwright, Docker, SQLite (project-local only)
- **Tier 2 (Trusted, Human-Gate):** FileSystem (external), PostgreSQL (readonly)

---

## Agent Delegation Rules

- `issue-orchestrator` koordiniert ALLE Subagents — implementiert niemals selbst
- `security-agent` bewertet Severity — niemals delegieren
- `compliance-agent` beurteilt DSGVO — niemals delegieren
- `review-agent` ist Leaf-Node — delegiert nicht weiter
- `research-agent` ist Leaf-Node — delegiert nicht weiter
- `architecture-agent` erstellt ADRs — readonly für Code
- `playwright-agent` macht visuelle QA — Screenshots, DOM-Diffs
- `migration-agent` validiert Migrationen — Rollback-Tests
- `documentation-agent` pflegt Docs — nur `docs/` Schreibzugriff

---

## Testing Requirements

- **Frontend:** `pnpm test` (Vitest + Testing Library)
- **Rust:** `cargo test --manifest-path src-tauri/Cargo.toml`
- **Lint:** `pnpm lint` (ESLint), `cargo clippy`
- **Format:** Prettier, `cargo fmt`
- **Typecheck:** `tsc --noEmit`
- **Build:** `pnpm build`

---

## Evidence Requirements

Jede abgeschlossene Aufgabe MUSS:

- [ ] Context Manifest (`docs/agent/context-manifest-<ISSUE>.md`)
- [ ] Evidence Log (`docs/agent/evidence-log-<ISSUE>.md`)
- [ ] Verification Contract erfüllt
- [ ] Testausgaben dokumentiert
- [ ] GitHub Issue-Kommentar (Start + End)
- [ ] PR mit ausgefülltem Template

---

<!-- BEGIN GITHUB_AI_GOVERNANCE -->

# GitHub-KI-Governance

Dieses Repository arbeitet verbindlich nach folgendem Workflow:

Issue → Spec → Verification Contract → Red Tests → Agent-Code → CI/Security Gates → Sandbox Preview → Reviewer-Agent → Human Approval → Evidence-Kommentar → Merge.

## Harte Regeln für Agenten

1. GitHub ist die einzige Source of Truth.
2. Keine Arbeit ohne Issue-Kontext.
3. Keine Implementierung ohne Acceptance Criteria.
4. Keine Architekturänderung ohne ADR.
5. Kein direkter Push auf main.
6. Jede Änderung erfolgt über Branch + Pull Request.
7. Jeder PR braucht Tests, Evidence und Rollback-Hinweise.
8. Security-, Datenschutz- und Compliance-Regeln haben Vorrang.
9. Merge nur nach grünen Checks und Human Approval.
10. Jeder Agentenlauf endet mit einem Evidence-Kommentar.

## Kontext-Regeln

- Lade nur relevante Dateien.
- Behandle Kontext als knappe Ressource.
- Trenne Cold, Warm und Hot Context.
- Komprimiere Tool-Rohdaten, aber niemals Fehlerlogs oder Security-Findings.
- Kennzeichne Aussagen als Tatsache, Annahme, Hypothese oder Vendor-Claim.

## Referenzen

- [AI Handbuch](./docs/AI_HANDBUCH.md) — vollständiger Governance-Standard
- [AI Workflow](./docs/AI_WORKFLOW.md) — Workflow-Phasen im Detail
- [Evidence Standard](./docs/EVIDENCE_STANDARD.md) — verbindliches Evidence-Format
- [Security Gates](./docs/SECURITY_GATES.md) — Sicherheitsregeln
- [Context Engineering Standard](./docs/CONTEXT_ENGINEERING_STANDARD.md) — Kontext-Management
- [ADR-001](./docs/adr/ADR-001-ai-governance.md) — Architekturentscheidung
<!-- END GITHUB_AI_GOVERNANCE -->

---

> **Letzte Aktualisierung:** 2026-06-08  
> **Gültig ab:** Commit `chore/github-ai-governance`  
> **Review-Zyklus:** Jährlich oder nach signifikanten Projektänderungen
