# Security Gates — PromptVault Lite

> **Verbindliche Sicherheitsregeln für alle KI-Agenten und Entwickler.**  
> Diese Gates werden bei jedem Commit, PR und Merge geprüft.  
> Kein Gate darf umgangen oder entfernt werden.

<!-- BEGIN GITHUB_AI_GOVERNANCE -->

---

## Architektur-Sicherheit

### Local-Only-Prinzip

- **Gate:** Keine Netzwerkaufrufe in der Analyse-Engine (`src-tauri/src/analysis/`)
- **Gate:** Keine Telemetrie ohne expliziten Opt-in
- **Gate:** Alle Analysen laufen lokal auf dem Gerät
- **Prüfung:** Code-Review auf `reqwest`, `hyper`, `fetch`, `XMLHttpRequest` in Analyse-Code

### Dateisystem-Sicherheit

- **Gate:** Path-Traversal-Schutz via `canonicalize` in allen Export-Commands
- **Gate:** Symlink-Containment — externe Symlinks außerhalb des Vault-Roots werden blockiert
- **Gate:** Kein Dateizugriff außerhalb des gewählten Vault-Verzeichnisses
- **Prüfung:** Rust-Tests in `src-tauri/tests/command_errors.rs`

### Datenbank-Sicherheit

- **Gate:** SQLite-Datenbank nur im Projektverzeichnis — keine systemweiten Pfade
- **Gate:** Keine Roh-SQL-Injection — alle Queries über rusqlite-Parameter
- **Gate:** Keine Produktionsdaten in Test-Datenbanken
- **Prüfung:** `cargo clippy`, Code-Review auf `format!()` in SQL-Queries

---

## Code-Sicherheit

### Secret-Scanning (Commit-Gate)

- **Gate: Keine Secrets im Code**
- Verbotene Muster:
  - API-Keys (`api_key`, `apikey`, `API_KEY`)
  - Tokens (`token`, `TOKEN`, `secret`, `SECRET`)
  - Passwörter (`password`, `passwd`, `PASSWORD`)
  - Private Keys (`-----BEGIN.*PRIVATE KEY-----`)
  - AWS-Keys (`AKIA[0-9A-Z]{16}`)
  - JWT-Tokens (`eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*`)
  - Stripe-Keys (`sk_live_[0-9a-zA-Z]{24}`)
  - GitHub-Tokens (`ghp_[0-9a-zA-Z]{36}`)
- **Prüfung:** `git diff --staged | rg <SECRET_PATTERN>`

### Env-Dateien (Commit-Gate)

- **Gate: Keine `.env`-Dateien im Repository**
- `.gitignore` prüft: `.env`, `.env.local`, `.env.*.local`
- **Gate: Keine `.db`-, `.db-shm`-, `.db-wal`-Dateien im Repository**
- `.gitignore` prüft: `*.db`, `*.db-journal`, `*.db-wal`
- **Prüfung:** `git status` vor jedem Commit

### Dependency-Sicherheit

- **Gate: Keine bekannten HIGH/CRITICAL CVEs in Abhängigkeiten**
- **Empfohlen:** `cargo audit` für Rust-Dependencies
- **Empfohlen:** `pnpm audit` für Node-Dependencies
- **Prüfung:** Periodisch (nicht bei jedem Commit, da netzwerkabhängig)

### SAST (Static Analysis)

- **Rust:** `cargo clippy -- -D warnings` (keine Warnings erlaubt)
- **TypeScript:** ESLint `strict-type-checked` (0 Errors, 0 Warnings)
- **Format:** Prettier + `cargo fmt` (keine Abweichungen)
- **Typecheck:** `tsc --noEmit` (keine Fehler)
- **Prüfung:** Pre-Commit-Hook (`.git/hooks/pre-commit`)

---

## Daten-Sicherheit

### Testdaten

- **Gate: Keine echten Produktionsdaten in Tests**
- **Gate: Testdaten als solche erkennbar**
  - Beispiel-E-Mails: `test@example.com`
  - Beispiel-Namen: `Test User`, `John Doe`
  - Beispiel-Pfade: `/tmp/test-vault/`, `C:\test-vault\`
- **Gate: Keine echten Secrets in Test-Assertions**
  - Secrets in Test-Fixtures müssen maskiert oder synthetisch sein

### Logging & Output

- **Gate: Keine PII (Personally Identifiable Information) in Logs**
- **Gate: Keine Secrets in Fehlermeldungen oder Logs**
- **Gate: Keine Rohdaten in UI-Fehlermeldungen (Output-Sanitization)**
- **Prüfung:** Code-Review auf `log::`, `console.log`, `println!`

### Export-Sicherheit

- **Gate: Path-Traversal-Schutz in allen Export-Pfaden**
- **Gate: Keine Überschreibung existierender Dateien ohne Bestätigung**
- **Prüfung:** Rust-Tests für Export-Commands

---

## Agenten-Sicherheit

### Tool-Allowlist (Trust Tiers)

- **Tier 0 (Readonly):** GitHub MCP (search/read), Brave Search, Context7
- **Tier 1 (Sandboxed):** Playwright, Docker, SQLite (project-local only)
- **Tier 2 (Trusted, Human-Gate):** FileSystem (external), PostgreSQL (readonly)
- **Gate:** Kein Tier-2-Tool ohne Human Approval

### Evidence-Gates

- **Gate: Keine Severity-Behauptung ohne Evidence**
  - CVSS-Vektor + PoC-Reproduktion + Log-Evidence erforderlich
- **Gate: Keine Architekturentscheidung ohne ADR**
  - ADR muss Alternativen und Tradeoffs dokumentieren
- **Gate: Kein Compliance-Urteil ohne Datenfluss-Diagramm**
  - DSGVO/GDPR: Consent-Tracking, Retention-Enforcement

### Human-Approval-Gates

Folgende Aktionen benötigen zwingend Human Approval:

- **Push** auf `main`/`master`
- **Merge** eines PR
- **Deployment** in Produktion
- **Datenbank-Migrationen** (auch lokal!)
- **Datenlöschung** (auch Testdaten!)
- **Security-Regel-Änderungen** (diese Datei!)
- **Architektur-Änderungen** ohne ADR
- **Neue Abhängigkeiten** (Dependency-Review)

---

## CI-Security-Gates (vorgeschlagen)

Die folgende CI-Pipeline ist in `.github/workflows/ci.yml` dokumentiert:

1. **Checkout + Install** — Reproduzierbarer Build
2. **Lint** — ESLint, `cargo clippy`
3. **Format Check** — Prettier, `cargo fmt --check`
4. **Typecheck** — `tsc --noEmit`
5. **Unit Tests** — `pnpm test`, `cargo test`
6. **Build** — `pnpm build`, `cargo build`
7. **Secret Scan** — Pattern-Check (empfohlen: `trufflehog` oder Git-Hook)

---

## Audit & Compliance

### Audit-Trail

- **Gate:** Jede agentengesteuerte Änderung wird in `.opencode/logs/` protokolliert
- **Gate:** Entscheidungen sind durch Evidence-Referenzen nachvollziehbar
- **Aufbewahrung:** Session-Logs 30 Tage, Audit-Logs 10 Jahre

### DSGVO/GDPR

- **Gate:** Keine personenbezogenen Daten in der Analyse (die App ist local-only)
- **Gate:** Keine Netzwerkübermittlung von Daten
- **Gate:** Export-Daten enthalten nur Prompt-Inhalte, keine Nutzerdaten

---

## Incident-Response

Bei Verdacht auf Security-Incident:

1. **Keine eigenmächtigen Änderungen** — Human Approval einholen
2. **Issue erstellen** mit Label `security`
3. **Betroffene Dateien identifizieren** — `git log -- <datei>`
4. **Evidence sammeln** — Logs, Diffs, Screenshots
5. **Keine öffentliche Diskussion** vor Klärung

---

> **Letzte Aktualisierung:** 2026-06-07  
> **Gültig ab:** Commit `chore/context-engineering-standard`  
> **Änderungen an dieser Datei benötigen Human Approval.**

<!-- END GITHUB_AI_GOVERNANCE -->
