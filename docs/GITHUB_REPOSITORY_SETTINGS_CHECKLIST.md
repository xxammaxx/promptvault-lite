<!-- BEGIN GITHUB_AI_GOVERNANCE -->

# GitHub Repository Settings Checklist

> **Manuelle Einstellungen, die im GitHub Repository UI konfiguriert werden müssen.**  
> Diese Checkliste listet alle GitHub-seitigen Einstellungen, die nicht über Dateien im Repository konfiguriert werden können.

---

## Repository Settings → Branches

- [ ] **Branch Protection Rule für `main`**
  - [ ] "Require a pull request before merging" aktivieren
  - [ ] "Require approvals" aktivieren (mind. 1)
  - [ ] "Dismiss stale pull request approvals when new commits are pushed" aktivieren
  - [ ] "Require review from Code Owners" aktivieren (falls CODEOWNERS vorhanden)
  - [ ] "Require status checks to pass before merging" aktivieren
    - [ ] `Frontend (TypeScript/React)` — Typecheck, Lint, Test, Build
    - [ ] `Rust (Tauri Backend)` — Format, Clippy, Test, Build
    - [ ] `Secret Scan` — Secrets, .env, .db
    - [ ] `AI Governance Check` — Pflichtdateien vorhanden
  - [ ] "Require branches to be up to date before merging" aktivieren
  - [ ] "Require conversation resolution before merging" aktivieren
  - [ ] "Do not allow bypassing the above settings" aktivieren
  - [ ] "Restrict who can push to matching branches" — nur Administratoren
  - [ ] "Allow force pushes" deaktivieren
  - [ ] "Allow deletions" deaktivieren

---

## Repository Settings → Actions → General

- [ ] "Allow all actions and reusable workflows" auswählen
- [ ] "Allow GitHub Actions to create and approve pull requests" nach Bedarf aktivieren
- [ ] "Fork pull request workflows from outside collaborators" — "Require approval for first-time contributors"

---

## Repository Settings → Code security and analysis

- [ ] **Secret scanning**
  - [ ] "Enable secret scanning" aktivieren (falls auf dem Plan verfügbar)
  - [ ] "Enable push protection" aktivieren
- [ ] **Code scanning (CodeQL)**
  - [ ] "Set up CodeQL" — Workflow generieren und anpassen
- [ ] **Dependabot alerts**
  - [ ] "Enable Dependabot alerts" aktivieren
  - [ ] "Enable Dependabot security updates" aktivieren
  - [ ] "Enable Dependabot version updates" nach Bedarf aktivieren

---

## Repository Settings → Code security and analysis → Code scanning

- [ ] CodeQL Analysis Workflow konfigurieren:
  - Sprachen: TypeScript + Rust
  - Schedule: wöchentlich + on push to main + on PR
  - Pfade in `.github/workflows/codeql.yml`

---

## Repository Settings → Rules → Rulesets (empfohlen)

Falls Rulesets bevorzugt werden (neuer als klassische Branch Protection):

- [ ] **Ruleset: `main` branch protection**
  - Target: `main` branch
  - [ ] "Restrict deletions" aktivieren
  - [ ] "Restrict force pushes" aktivieren
  - [ ] "Require a pull request before merging"
  - [ ] "Require approvals" (1)
  - [ ] "Require status checks to pass"
    - Siehe CI-Jobs oben
  - [ ] "Require conversation resolution"
  - Enforce: Active

---

## Repository Settings → Pull Requests

- [ ] "Allow merge commits" — nach Projektkonvention (default: allow)
- [ ] "Allow squash merging" — nach Projektkonvention (default: allow)
- [ ] "Allow rebase merging" — nach Projektkonvention (default: allow)
- [ ] "Always suggest updating pull request branches" aktivieren
- [ ] "Automatically delete head branches" aktivieren

---

## Repository Settings → Environments

- [ ] Keine Environments erforderlich (kein Deployment, local-only App)
- Falls später Deployment hinzukommt: Environment `production` mit Schutzregeln erstellen.

---

## Repository Settings → Webhooks

- [ ] Keine Webhooks erforderlich (local-only App)

---

## Repository Settings → Deploy Keys

- [ ] Keine Deploy Keys erforderlich

---

## Repository Settings → Secrets and variables → Actions

- [ ] Keine Secrets erforderlich (local-only App, keine Cloud-API-Keys)
- Falls später Secrets benötigt werden: NUR über GitHub Secrets UI, NIEMALS im Code.

---

> **Letzte Aktualisierung:** 2026-06-08  
> **Gültig ab:** Commit `chore/github-ai-governance`  
> **Verantwortlich:** `@xxammaxx`
>
> **Hinweis:** Diese Einstellungen müssen manuell im GitHub UI vorgenommen werden. Sie können nicht über Repository-Dateien automatisiert werden (außer Rulesets via API).

<!-- END GITHUB_AI_GOVERNANCE -->
