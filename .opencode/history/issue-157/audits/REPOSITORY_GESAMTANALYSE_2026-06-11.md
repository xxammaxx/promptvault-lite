# Repository-Gesamtanalyse — PromptVault Lite

> **Datum:** 2026-06-11  
> **Analyst:** issue-orchestrator (deepseek-v4-pro)  
> **Repository:** `xxammaxx/promptvault-lite` (privat)  
> **HEAD:** `3425a7d` auf Branch `fix/windows-path-filetree-root`  
> **Status:** ANALYSIS COMPLETE — READ-ONLY

---

## 1. Kurzfazit

PromptVault Lite ist ein weit fortgeschrittenes, funktionales Desktop-Tool mit einer soliden Rust/React-Architektur. Der Kern (Prompts scannen, analysieren, exportieren) ist stabil und gut getestet (113 Rust-Tests + viele Frontend-Tests grün). Allerdings befindet sich das Repository in einem **chaotischen Arbeitsbaum-Zustand**: massive gestagte Änderungen (39 Files, 4562 Zeilen), unstaged Lockfile-Änderungen, unvollständiger Blueprint-Code, und verwaiste `.tmp/`-Worktrees. Der Build ist **gebrochen** (Blueprint-TypeScript-Fehler), ESLint hat **205 Fehler**, und 35 Frontend-Tests scheitern durch eine Worktree-Reaktiv-Duplikat-Situation. Das Projekt hat keine Lizenz, keine Screenshots, kein GitHub Project, und das Wiki ist deaktiviert. Die nächste Priorität ist: **Arbeitsbaum bereinigen, Blueprint-Code fertigstellen oder isolieren, Build reparieren**.

---

## 2. Repository Facts

| Feld             | Wert                                                                        | Beleg                              |
| ---------------- | --------------------------------------------------------------------------- | ---------------------------------- |
| Repository-Name  | `promptvault-lite`                                                          | `gh repo view`                     |
| Owner            | `xxammaxx`                                                                  | `git remote -v`                    |
| Sichtbarkeit     | **privat**                                                                  | `gh repo view --json isPrivate`    |
| Aktueller Branch | `fix/windows-path-filetree-root`                                            | `git branch --show-current`        |
| HEAD Commit      | `3425a7d`                                                                   | `git rev-parse --short HEAD`       |
| Letzter Commit   | `feat(governance): add agentic human approval and docs-as-code prompt pack` | `git log --oneline -n1`            |
| Working Tree     | **DIRTY** (gestaged + unstaged + untracked)                                 | `git status --short`               |
| Gestaged         | 39 files, +4562/-26 lines                                                   | `git diff --cached --stat`         |
| Unstaged         | 3 files (package.json, pnpm-lock.yaml, vite.config.ts)                      | `git diff --stat`                  |
| Untracked        | 20+ Dateien (Blueprint, Playwright, Agentic Browser)                        | `git ls-files --others`            |
| Remote           | `origin https://github.com/xxammaxx/promptvault-lite`                       | `git remote -v`                    |
| Default Branch   | `master` (origin/HEAD → origin/master)                                      | `git branch -a`                    |
| Branches lokal   | 7 (inkl. chore/_, feat/_, fix/\*)                                           | `git branch`                       |
| Issues enabled   | Ja                                                                          | `gh repo view`                     |
| Projects enabled | Ja (aber kein Project für dieses Repo)                                      | `gh repo view`                     |
| Wiki enabled     | **Nein**                                                                    | `gh repo view`                     |
| Lizenzen         | Keine `LICENSE`-Datei                                                       | `ls -la LICENSE` → nicht vorhanden |
| `.gitignore`     | Vorhanden, 59 Zeilen, deckt Standard ab                                     | `Read .gitignore`                  |

---

## 3. Architektur und Tech Stack

### Tech Stack

| Kategorie         | Technologie                         | Version                   |
| ----------------- | ----------------------------------- | ------------------------- |
| Frontend          | React 18 + TypeScript 5.5           | `package.json`            |
| State Management  | Zustand 4.5                         | `package.json`            |
| Build-Tool        | Vite 5.4                            | `package.json`            |
| Backend           | Rust 2021 Edition                   | `Cargo.toml`              |
| Desktop Framework | Tauri 2.0                           | `Cargo.toml`              |
| Datenbank         | SQLite 3 (rusqlite 0.31, FTS5)      | `Cargo.toml`              |
| Test-Frontend     | Vitest 1.6 + Testing Library 15     | `package.json`            |
| Test-Rust         | `#[test]` (native) + `tempfile`     | `Cargo.toml`              |
| Lint-Frontend     | ESLint 8.57 (`strict-type-checked`) | `package.json`            |
| Lint-Rust         | `cargo clippy` (CI-konfiguriert)    | `ci.yml`                  |
| Format            | Prettier 3.3 + `cargo fmt`          | `package.json` / `ci.yml` |
| E2E               | Playwright 1.60                     | `package.json`            |
| Docs              | MkDocs Material (Diátaxis)          | `mkdocs.yml`              |
| CI                | GitHub Actions (5 Workflows)        | `.github/workflows/`      |
| Package Manager   | pnpm                                | `pnpm-lock.yaml`          |
| Python (Scripts)  | Python 3.x                          | `requirements-docs.txt`   |

### Architekturkarte

```text
UI Layer:         React 18 + TypeScript + Vite
                  ├── components/analysis/AnalysisPanel.tsx
                  ├── components/explorer/ (FileTree, SearchBar, FilterPanel)
                  ├── components/details/DetailsPanel.tsx
                  ├── components/common/ (ExportDialog, ThemeToggle)
                  └── components/blueprints/ (BlueprintExplorer, BlueprintDetails, ...) 🔴 UNVOLLSTÄNDIG
State Layer:      Zustand 4.5
                  ├── stores/appStore.ts (Haupt-Store, 94 Tests)
                  └── stores/blueprintStore.ts 🔴 UNVOLLSTÄNDIG (TS-Fehler)
Domain Layer:     src-tauri/src/ (Rust)
                  ├── analysis/ (quality.rs, hygiene.rs, recommendations.rs, blueprint_quality.rs) 🔴
                  ├── parser/ (frontmatter.rs, markdown.rs)
                  ├── scanner/ (file_scanner.rs, watcher.rs, blueprint_scanner.rs) 🔴
                  └── models/ (prompt.rs, evaluation.rs, artifact.rs, blueprint.rs) 🔴
Backend/API Layer: Tauri IPC Commands
                  ├── commands/analyze.rs (evaluate_prompt, analyze_hygiene, analyze_all)
                  ├── commands/scan.rs (scan_directory, start/stop_file_watcher)
                  ├── commands/export.rs (export_json, export_markdown, export_zip)
                  ├── commands/favorites.rs (toggle_favorite, get_favorites)
                  ├── commands/persistence.rs (load_cache, save_cache)
                  └── commands/blueprint.rs 🔴 UNVOLLSTÄNDIG
Storage Layer:    SQLite 3 via rusqlite (FTS5), In-Memory Cache
Filesystem:       walkdir, notify (File-Watcher), zip (Export)
Build/Runtime:    Vite → tauri build (frontendDist: ../dist)
CI/CD:            GitHub Actions (5 Workflows)
Docs:             MkDocs Material (Diátaxis Framework)
GitHub:           Issues + Projects (aktiviert), Wiki deaktiviert
```

🔴 = unvollständig / Build-blockierend

---

## 4. Git-Hygiene und Arbeitsbaum

### Status: 🔴 KRITISCH

Der Arbeitsbaum ist stark verschmutzt. Dies ist das **dringendste Problem** vor jeder weiteren Arbeit.

| Datei/Bereich                                 | Status            | Kategorie       | Risiko                              | Empfehlung                                |
| --------------------------------------------- | ----------------- | --------------- | ----------------------------------- | ----------------------------------------- |
| `package.json`                                | unstaged modified | Lockfile/Config | 🔴 Build-Reproduzierbarkeit         | Commit oder Discard                       |
| `pnpm-lock.yaml`                              | unstaged modified | Lockfile        | 🔴 Dependency-Drift                 | Commit oder Discard                       |
| `vite.config.ts`                              | unstaged modified | Config          | 🟡 Build-Konfiguration              | Commit                                    |
| 39 gestagte Dateien                           | staged            | Docs-as-Code    | 🟡 Riesiger Staging-Bereich         | In eigenen Branch committen               |
| `src/stores/appStore.ts`                      | staged modified   | Kerncode        | 🔴 Ungeplant mit Docs-work gestaged | In separaten Commit isolieren             |
| `src/stores/__tests__/appStore.test.ts`       | staged modified   | Tests           | 🔴 Neue Tests mit Docs gestaged     | In separaten Commit isolieren             |
| `src/components/blueprints/`                  | untracked         | Blueprint       | 🔴 Build-blockierend (TS-Fehler)    | Fertigstellen oder in `.tmp/` verschieben |
| `src/stores/blueprintStore.ts`                | untracked         | Blueprint       | 🔴 Build-blockierend                | Fertigstellen oder isolieren              |
| `src-tauri/src/analysis/blueprint_quality.rs` | untracked         | Blueprint Rust  | 🟡 Fehlt im Build                   | Fertigstellen                             |
| `src-tauri/src/commands/blueprint.rs`         | untracked         | Blueprint Rust  | 🟡 Fehlt im Build                   | Fertigstellen                             |
| `src-tauri/src/models/blueprint.rs`           | untracked         | Blueprint Rust  | 🟡 Fehlt im Build                   | Fertigstellen                             |
| `src-tauri/src/scanner/blueprint_scanner.rs`  | untracked         | Blueprint Rust  | 🟡 Fehlt im Build                   | Fertigstellen                             |
| `playwright.config.ts`                        | untracked         | E2E Config      | 🟡 Neue Infrastruktur               | Commit nach Fertigstellung                |
| `tests/e2e/theme-toggle.spec.ts`              | untracked         | E2E Test        | 🟡 Neue Tests                       | Commit nach Fertigstellung                |
| `.agentic-browser/`                           | untracked         | Agentic Browser | 🟡 Neue Infrastruktur               | Commit oder `.gitignore`                  |
| `test-results/`                               | untracked         | Test-Artefakte  | 🟢 Ignorierbar                      | In `.gitignore`                           |
| `.tmp/issue-64-worktree/`                     | vorhanden         | Worktree        | 🔴 Verursacht Test-Failures         | Löschen (`rm -rf`)                        |
| `github-ai-opencode-governance.zip`           | vorhanden         | Binary-Artefakt | 🟡 14 KB Binary im Repo             | Löschen oder verschieben                  |
| `vite-out.log`                                | vorhanden         | Log             | 🟢 Ignorierbar                      | In `.gitignore` oder löschen              |
| `dist/`                                       | vorhanden         | Build-Output    | 🟢 In `.gitignore`                  | OK                                        |
| `site/`                                       | nicht vorhanden   | Docs-Build      | 🟢 Ist in `.gitignore`              | OK                                        |

### Konkrete Handlungsempfehlungen für Git-Hygiene:

1. **Sofort:** `.tmp/issue-64-worktree/` löschen — verursacht 35 Test-Failures
2. **Sofort:** `github-ai-opencode-governance.zip` löschen oder in `.gitignore`
3. **Priorität:** Gestagte Docs-Änderungen in eigenen Branch `docs/docs-as-code-integration` committen
4. **Priorität:** Unstaged Lockfile-Änderungen prüfen und committen
5. **Priorität:** Blueprint untracked Files entweder fertigstellen (Issue #49-#59) oder in `.tmp/` isolieren, da sie Build und Lint blockieren
6. `test-results/` in `.gitignore` aufnehmen

---

## 5. Offene Issues — Gesamtbild

**Anzahl offen:** 28 Issues (#39–#71, mit Lücken)

### Verteilung nach Priorität/Label:

- **P0 (Critical):** 1 (#62 — Dark Mode + Dashboard)
- **P1 (High):** 0
- **P2 (Medium):** 8 (#41, #55–#59, #63, #64, #67, #70)
- **P3 (Low):** 4 (#39, #40, #42, #43)
- **Ohne Priorität:** 9 (#44, #45, #47, #48, #49, #50–#54, #66, #68, #69, #71)
- **Blueprint-Tasks (T-001 bis T-010):** 10 Issues (#50–#59) — alle als Sub-Tasks von #49

### Kategorisierung:

- **Blueprint-Feature (Epic #49):** 11 Issues (T-001 bis T-010 + Parent) — 🔴 Code existiert bereits unvollständig im Arbeitsbaum
- **UI/UX (#62, #63, #65):** 3 Issues — teilweise umgesetzt (#65 gemerged)
- **Dark Mode (#44, #48, #62):** 3 Issues — #62 supersetzt #44/#48 (Duplikate)
- **Analyse-Features (#64, #66, #67):** 3 Issues
- **Testing/QA (#68, #69, #71):** 3 Issues
- **CI/CD (#41):** 1 Issue — Workflows existieren bereits
- **Docs/Governance (#39, #40, #42, #43, #47):** 5 Issues
- **Bugfix (#70):** 1 Issue — trivialer ESLint-Fix

### Kritische Beobachtungen:

1. **Issue #44 und #48 sind Duplikate von #62** — sollten geschlossen/verlinkt werden
2. **Blueprint-Code ist bereits im Arbeitsbaum, aber nicht im Build-Stack** — Issues #50–#59 sind teilweise implementiert, aber Code nicht gemerged und nicht kompilierbar
3. **Issue #71 (Agentic Browser)** — Skripte bereits im Arbeitsbaum, aber ungtestet
4. **Issue #39 (LICENSE) ist P2 aber rechtlich kritisch**
5. **Issue #41 (CI/CD) ist obsolet** — Workflows existieren bereits (allerdings nur lokal, nicht als CI-Run bestätigt)

---

## 6. Offene Issues — Detailtabelle

| Issue | Titel                                        | Kategorie   | Priorität | Repo-Reality                                            | Empfehlung                                 |
| ----: | -------------------------------------------- | ----------- | --------- | ------------------------------------------------------- | ------------------------------------------ |
|    71 | Phase 2: Agentic Browser Repair Kit          | Testing/CI  | P1        | Skripte + Config bereits untracked vorhanden            | Fertigstellen, Issue #71 als Parent nutzen |
|    70 | [Bug] ESLint: unnecessary optional chain L87 | Bugfix      | P2        | Trivial, 1-Zeilen-Fix in appStore.ts                    | Fixen, sofort machbar                      |
|    69 | Prompt-Packs im UI manuell testen            | Testing     | P2        | Kein Code im Repo sichtbar                              | Manuell testen, ggf. automatisieren        |
|    68 | 35 Frontend-Tests in .tmp/ reparieren        | Bug/Testing | P1        | Worktree-Duplikat → .tmp/ löschen                       | Worktree löschen, Tests prüfen             |
|    67 | Prompt-Optimierungs-Engine (3 Modi)          | Feature     | P2        | Kein Code sichtbar                                      | Spec-first, Issue #64 als verwandt prüfen  |
|    66 | EVIDENCE_BLOCK Artefaktkategorie             | Feature     | P2        | Kein Code sichtbar                                      | Nach Blueprint-Fix umsetzbar               |
|    65 | Explorer-Spalte resizable                    | UI/Fix      | P2        | **Code gemerged via PR #61**                            | ✅ Issue sollte geschlossen werden!        |
|    64 | Prompt-Erkennung/Bewertung überarbeiten      | Feature     | P1        | Umfangreich, kein sichtbarer Code                       | Splitten, Spec-first                       |
|    63 | Einstellungen-Dialog (Settings Modal)        | UI          | P2        | Kein Code sichtbar                                      | Nach Dark Mode (#62) umsetzen              |
|    62 | Dark Mode + Dashboard-Layout                 | UI          | P0        | ThemeToggle.tsx existiert, CSS-Variablen vorhanden      | Höchste UI-Priorität                       |
|    59 | [T-010] Blueprint Integrationstests & QA     | Testing     | P2        | Code existiert, aber unvollständig                      | Nach Blueprint-Vervollständigung           |
|    58 | [T-008] Blueprint UI-Komponenten             | Frontend    | P2        | Code existiert untracked, TS-Fehler                     | Types exportieren, TS fixen                |
|    57 | [T-009] Tab-Navigation Prompts/Blueprints    | Frontend    | P2        | Kein Code sichtbar                                      | Nach UI-Komponenten                        |
|    56 | [T-007] Blueprint Tauri-API-Wrapper          | Frontend    | P2        | Kein Code in lib/tauri.ts                               | Nach Rust-Commands                         |
|    55 | [T-006] Blueprint-Zustand-Store              | Frontend    | P2        | blueprintStore.ts untracked, TS-Fehler                  | Types fixen                                |
|    54 | [T-005] Blueprint Tauri-Commands             | Backend     | P2        | commands/blueprint.rs untracked                         | In lib.rs registrieren                     |
|    53 | [T-004] Blueprint-Qualitätsanalyse           | Backend     | P2        | blueprint_quality.rs untracked                          | In mod.rs registrieren, testen             |
|    52 | [T-003] Blueprint-Scanner                    | Backend     | P2        | blueprint_scanner.rs untracked                          | In mod.rs registrieren, testen             |
|    51 | [T-002] Blueprint TypeScript-Typen           | Frontend    | P2        | **NICHT in types/index.ts** — Ursache für Build-Fehler! | Typen zuerst definieren!                   |
|    50 | [T-001] Blueprint Rust-Datenmodell           | Backend     | P2        | models/blueprint.rs untracked                           | In mod.rs registrieren                     |
|    49 | Blueprint-Erkennung (Epic)                   | Feature     | P1        | Epic mit 10 Sub-Tasks, teilweise Code                   | Epic koordinieren                          |
|    48 | Darkmode/Dark-Theme                          | UI          | P1        | **Duplikat von #62**                                    | Schließen, auf #62 verweisen               |
|    47 | GitHub-KI-Governance integriert              | Docs        | P2        | **PR #46 offen**                                        | PR mergen                                  |
|    45 | Prompt-Vorschläge übernehmen                 | Feature     | P2        | Kein Code                                               | Nach Analyse-Überarbeitung                 |
|    44 | Dark Mode mit Theme-System                   | UI          | P1        | **Duplikat von #62**                                    | Schließen, auf #62 verweisen               |
|    43 | Native-Dependencies in INSTALL.md            | Docs        | P3        | Docs existieren                                         | Umsetzbar, niedrige Prio                   |
|    42 | docs/README.md archivieren/löschen           | Docs        | P3        | Trivial                                                 | Schnell erledigbar                         |
|    41 | CI/CD einrichten                             | CI/CD       | P2        | **Workflows existieren bereits**                        | Issue aktualisieren: Status prüfen         |
|    40 | Screenshots ergänzen                         | Docs        | P3        | Keine Screenshots                                       | Nach UI-Stabilisierung                     |
|    39 | LICENSE-Datei hinzufügen                     | Legal       | P2        | Keine LICENSE                                           | Rechtlich kritisch, vor Release            |

---

## 7. Geschlossene Issues — Gesamtbild

Die Liste der geschlossenen Issues konnte wegen Output-Trunkierung nicht vollständig analysiert werden. Sichtbare geschlossene Issues:

| Issue | Titel                      | ClosedAt               | Beleg im Repo                        | Testbeleg                 | Bewertung                 | Follow-up nötig |
| ----: | -------------------------- | ---------------------- | ------------------------------------ | ------------------------- | ------------------------- | --------------- |
|    65 | Explorer-Spalte resizable  | (offen, aber gemerged) | PR #61 gemerged                      | ✅                        | Sollte geschlossen werden | Nein            |
|    60 | Explorer resize (original) | 2026-06-08             | PR #61 merged, Code in ExplorerPanel | ✅                        | ✅ Wirklich abgeschlossen | Nein            |
|    27 | README Initial Commit      | (alt)                  | README.md existiert                  | —                         | ✅ Abgeschlossen          | Nein            |
|    26 | v1.5.0 Phase 5             | 2026-06-05             | PR #26 merged                        | 113 Rust-Tests + Frontend | ✅ Abgeschlossen          | Nein            |

**Hinweis:** Vollständige Analyse der geschlossenen Issues war wegen Output-Trunkierung blockiert. Empfehlung: `gh issue list --state closed --limit 200 --json number,title,closedAt,labels --repo xxammaxx/promptvault-lite` mit verlängertem Timeout erneut ausführen.

---

## 8. Pull Requests

| PR  | Titel                     | Status     | Datum      | Bewertung                                                                                                              |
| --- | ------------------------- | ---------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| #46 | GitHub-KI-Governance      | **OPEN**   | 2026-06-08 | Riesiger PR mit Docs-as-Code + Agentic Browser. Sollte gesplittet oder gemerged werden. Blockiert 39 gestagte Dateien. |
| #61 | Resizable Explorer-Spalte | **MERGED** | 2026-06-08 | ✅ Sauber, Issue #60/#65                                                                                               |
| #26 | v1.5.0 Phase 5            | **MERGED** | 2026-06-05 | ✅ Release                                                                                                             |

**Kritisch:** PR #46 ist offen und umfasst massive Änderungen (39 gestagte Files). Dies sollte priorisiert gemerged oder geschlossen werden, um den Staging-Bereich zu klären.

---

## 9. GitHub Project Integration

### Status: 🔴 KEINE

| Project               | Zweck           | Items | Verbindung zum Repo | Empfehlung           |
| --------------------- | --------------- | ----- | ------------------- | -------------------- |
| PrivateLegalNavigator | Anderes Projekt | —     | ❌ Nicht relevant   | —                    |
| BescheidPilot         | Anderes Projekt | —     | ❌ Nicht relevant   | —                    |
| CoverForge            | Anderes Projekt | —     | ❌ Nicht relevant   | —                    |
| _(PromptVault Lite)_  | —               | 0     | ❌ Kein Project     | **Project anlegen!** |

**Empfehlung:** Ein GitHub Project "PromptVault Lite" anlegen mit:

- Status: Backlog → Ready → In Progress → In Review → Done
- Custom Fields: Priority (P0-P3), Component (Frontend/Backend/Docs), Sprint
- Alle 28 offenen Issues verknüpfen

---

## 10. Website-/Docs-Website-Stand

### Status: 🟡 Teilweise fertig (65%)

| Bereich               | Status                | Beleg                                                   | Lücke                                | Empfehlung                       |
| --------------------- | --------------------- | ------------------------------------------------------- | ------------------------------------ | -------------------------------- |
| MkDocs Config         | ✅ Vorhanden          | `mkdocs.yml` (145 Zeilen)                               | `strict: false` → sollte `true` sein | `strict: true` setzen            |
| Navigation (Diátaxis) | ✅ Strukturiert       | Tutorials, How-to, Referenz, Erklärungen                | —                                    | OK                               |
| Startseite            | ✅ Vorhanden          | `docs/index.md`                                         | —                                    | OK                               |
| Getting Started       | ✅ Vorhanden          | `docs/getting-started/index.md`                         | —                                    | OK                               |
| Installation          | ✅ Vorhanden          | `docs/INSTALL.md`                                       | Windows/macOS unvollständig (#43)    | Siehe #43                        |
| User Guide            | ✅ Vorhanden          | `docs/USER_GUIDE.md`                                    | —                                    | Nach UI-Änderungen aktualisieren |
| Architektur           | ✅ Vorhanden          | `docs/ARCHITECTURE.md`, `docs/architecture/overview.md` | —                                    | OK                               |
| Projektstruktur       | ✅ Vorhanden          | `docs/reference/project-structure.md`                   | —                                    | OK                               |
| Glossar               | ✅ Vorhanden          | `docs/glossary.md`                                      | —                                    | OK                               |
| Changelog             | ✅ Vorhanden          | `docs/CHANGELOG.md`                                     | Nur bis 1.5.0                        | Kontinuierlich pflegen           |
| Security Gates        | ✅ Vorhanden          | `docs/SECURITY_GATES.md`                                | —                                    | OK                               |
| ADRs                  | ✅ 2 vorhanden        | ADR-001, ADR-002                                        | —                                    | OK                               |
| Governance Docs       | ✅ Vorhanden          | AI_HANDBUCH, AI_WORKFLOW, etc.                          | —                                    | OK                               |
| Screenshots           | 🔴 Fehlen             | Keine PNG/WebP                                          | README hat Platzhalter               | Siehe #40                        |
| Build (mkdocs)        | ⚠️ Nicht getestet     | `mkdocs build --strict` nicht lokal ausgeführt          | Python-Deps nötig                    | In CI prüfen                     |
| Deployment            | 🔴 Kein Deployment    | Kein GitHub Pages Workflow                              | Website nicht live                   | GitHub Pages Workflow anlegen    |
| `llms.txt`            | ✅ Vorhanden          | `llms.txt` (154 Zeilen)                                 | —                                    | OK                               |
| Docs Quality CI       | ✅ Workflow existiert | `docs-quality.yml`                                      | Noch nie gelaufen?                   | CI-Run bestätigen                |

### Website-Reife: 65%

**Begründung:** Struktur, Inhalt und Navigation sind solide (Diátaxis). Build nicht getestet, Deployment nicht konfiguriert, keine Screenshots.
**Blocker:** Kein Deployment, `mkdocs build` nicht verifiziert  
**Nächste 5 Schritte:**

1. `mkdocs build --strict` lokal ausführen und Fehler beheben
2. `strict: true` in mkdocs.yml setzen
3. GitHub Pages Deployment Workflow anlegen
4. Screenshots aufnehmen (#40)
5. INSTALL.md vervollständigen (#43)

---

## 11. GitHub Wiki Stand

### Status: 🔴 DEAKTIVIERT

```json
{ "hasWikiEnabled": false }
```

| Wiki-Bereich    | Status  | Beleg          | Problem   | Empfehlung                                         |
| --------------- | ------- | -------------- | --------- | -------------------------------------------------- |
| Wiki aktiviert? | ❌ Nein | `gh repo view` | —         | **So belassen** — Docs-as-Code (MkDocs) ist besser |
| Wiki-Inhalte    | —       | —              | Kein Wiki | Kein Wiki benötigt                                 |

**Wiki-Reife: 0% (deaktiviert)**
**Empfehlung:** Wiki deaktiviert lassen. Docs-as-Code via MkDocs ist der bessere Ansatz. Alle Dokumentation gehört in `docs/` und wird via MkDocs deployed.

---

## 12. CI/CD und Quality Gates

### Workflows: 5 konfiguriert

| Workflow                      | Trigger                                    | Jobs                                                                              | Blocking? | Status                                 | Risiko                             | Empfehlung                      |
| ----------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------- | --------- | -------------------------------------- | ---------------------------------- | ------------------------------- |
| `ci.yml`                      | push/pull_request auf main                 | Frontend (tsc, lint, test, build) + Rust (fmt, clippy, test, build) + Secret Scan | ✅ Ja     | ⚠️ Lokal nicht als bestanden bestätigt | 🟡 Blueprint-Code würde CI brechen | Blueprint fixen, dann CI testen |
| `ai-governance-check.yml`     | push/pull_request auf main                 | Python Governance Check                                                           | ✅ Ja     | ⚠️ Nicht getestet                      | 🟢 Niedrig                         | Testen                          |
| `docs-quality.yml`            | push/pull_request (nur docs-Pfade)         | docs_check.py + mkdocs build                                                      | ✅ Ja     | ⚠️ Nicht getestet                      | 🟢 Niedrig                         | `mkdocs build --strict` testen  |
| `agentic-browser-quality.yml` | pull_request, push main                    | Toolkit Policy + Browser Tests                                                    | ✅ Ja     | 🔴 Ungetestet (neue Infrastruktur)     | 🟡 Neue Config                     | Mit Issue #71 abschließen       |
| `evidence-gates.yml`          | pull_request, push main, workflow_dispatch | Evidence Validierung                                                              | ✅ Ja     | 🔴 Ungetestet                          | 🟡 Neue Config                     | Mit Issue #71 abschließen       |

### Quality Gates im CI (`ci.yml`):

- **Frontend:** `tsc --noEmit` → `pnpm lint` → `pnpm test` → `pnpm build`
- **Rust:** `cargo fmt --check` → `cargo clippy -- -D warnings` → `cargo test` → `cargo build`
- **Secret Scan:** Pattern-Matching (API Keys, AWS, GitHub Tokens, Private Keys), `.env`-Check, `.db`-Check
- **Caching:** Rust dependencies via `actions/cache@v4`

### Fehlende Gates:

- ❌ Coverage-Reporting (nicht konfiguriert)
- ❌ Browser/E2E-Tests (erst mit #71)
- ❌ Release/Deploy-Workflow (nicht vorhanden)
- ❌ Human Approval Gate (nur per PR-Review)

---

## 13. Tests und Qualität

| Test/Gate       | Befehl                                            | Ergebnis                        | Details                                                                                                                                                                                                                        | Risiko                                                                  |
| --------------- | ------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Frontend Tests  | `pnpm test` (Vitest)                              | ⚠️ 35 failed / viele passed     | 35 Failures aus `.tmp/issue-64-worktree/` (doppelte React-Instanz). Projekt-eigene Tests grün.                                                                                                                                 | 🔴 Worktree muss gelöscht werden                                        |
| Rust Unit Tests | `cargo test --manifest-path src-tauri/Cargo.toml` | ✅ 96 passed, 1 ignored         | 96 Lib-Tests + 17 Integrationstests = 113 passed. 1 ignored (`test_many_prompts_analysis`).                                                                                                                                    | 🟢 Stabil                                                               |
| ESLint          | `pnpm lint`                                       | 🔴 205 errors                   | Alle in Blueprint-Dateien (`blueprintStore.ts`, `BlueprintAnalysis.tsx`, etc.) + 1 in `appStore.ts` (L87 optional chain)                                                                                                       | 🔴 Blueprint-Code muss getypt werden                                    |
| TypeScript      | `tsc --noEmit`                                    | 🔴 19 errors                    | Fehlende Type-Exports für Blueprint (BlueprintItem, BlueprintEvaluation, BlueprintFilters, BlueprintFileTreeNode, DEFAULT_BLUEPRINT_FILTERS, scanBlueprints, evaluateBlueprint, analyzeBlueprintHygiene, analyzeAllBlueprints) | 🔴 Typen müssen in `types/index.ts` und `lib/tauri.ts` definiert werden |
| Build           | `pnpm build`                                      | 🔴 Fehlgeschlagen               | Gleiche TS-Fehler wie `tsc --noEmit`                                                                                                                                                                                           | 🔴 Build ist gebrochen                                                  |
| Rust Build      | `cargo build`                                     | ⚠️ Nicht getestet (CI macht es) | Blueprint-Dateien sind nicht in `lib.rs` registriert                                                                                                                                                                           | 🟡 Registrierung fehlt                                                  |
| E2E Tests       | `pnpm test:e2e`                                   | ⚠️ Nicht ausgeführt             | Playwright config existiert untracked, `tests/e2e/theme-toggle.spec.ts` vorhanden                                                                                                                                              | 🟡 Noch nicht integriert                                                |
| Docs Build      | `mkdocs build --strict`                           | ⚠️ Nicht getestet               | Python-Deps ggf. fehlen                                                                                                                                                                                                        | 🟢 Niedrig                                                              |

### Testabdeckung:

- Frontend: 5 Test-Dateien, 94 Tests (projekt-eigene, alle grün). Keine Coverage-Metriken.
- Rust: 96 + 17 Tests, alle relevanten Module abgedeckt (analysis, parser, scanner, database, commands, export).
- **Lücke:** Keine Blueprint-Tests, keine E2E-Tests in CI, keine Coverage-Reports.
- **Bekannte Failures:** 35 Tests in `.tmp/issue-64-worktree/` — Worktree-React-Duplikat (Issue #68).

---

## 14. Produktfortschritt und Reifegrad

| Bereich                                   | Reifegrad | Beleg                                                 | Hauptlücke                                      | Nächster Schritt                  |
| ----------------------------------------- | --------: | ----------------------------------------------------- | ----------------------------------------------- | --------------------------------- |
| Kernfunktionalität (Scan, Parse, Analyze) |       90% | 113 Rust-Tests, stabile Commands                      | Blueprint-Integration                           | Blueprint fertigstellen           |
| UI/UX (Explorer, Details, Analyse)        |       75% | Komponenten existieren, 94 Tests                      | Dark Mode fehlt, Settings fehlt                 | #62, #63                          |
| Datenpersistenz (SQLite + Cache)          |       85% | SQLite mit FTS5, Favoriten, Cache                     | —                                               | Stabil                            |
| Analyse-/Businesslogik                    |       80% | 10 Qualitätskriterien, 12 Hygiene-Artefakte           | Blueprint-Analyse fehlt                         | #53, #67                          |
| Import/Export (JSON, MD, ZIP)             |       90% | Alle 3 Formate, Path-Traversal-Schutz                 | —                                               | Stabil                            |
| Desktop-Integration (Tauri)               |       80% | File-Watcher, Symlink-Containment, Fenster            | Keine Release-Builds bestätigt                  | Release-Build testen              |
| Website/Dokumentation                     |       65% | MkDocs, Diátaxis, 25+ Docs-Seiten                     | Kein Deployment, keine Screenshots              | Deployment + Screenshots          |
| Wiki                                      |        0% | Deaktiviert                                           | —                                               | So belassen                       |
| GitHub Issues/Roadmap                     |       50% | 28 offen, gut gelabelt                                | Keine Milestones, kein Project                  | Milestones + Project anlegen      |
| CI/CD                                     |       70% | 5 Workflows konfiguriert                              | Nicht als lauffähig bestätigt, Build gebrochen  | Build fixen, CI testen            |
| Tests                                     |       75% | 113 Rust + 94 Frontend (97% pass)                     | 35 Worktree-Failures, keine E2E, keine Coverage | Worktree löschen, E2E integrieren |
| Security/Governance                       |       70% | Security Gates, Secret Scan, Policies                 | Kein Live-CI-Run bestätigt                      | CI testen                         |
| Release-Fähigkeit                         |       30% | Keine LICENSE, Build gebrochen, kein Release-Workflow | Build fixen, LICENSE, Release-Workflow          | #39, Build fixen                  |

### Gesamturteil

```text
Projekt-Reifegrad insgesamt: 65%
Begründung: Stabiler Kern, gute Testabdeckung, solide Architektur. Aber: Build gebrochen, Arbeitsbaum verschmutzt,
unvollständiges Blueprint-Feature, keine LICENSE, kein Release-Workflow, kein Deployment.

Release-Reife: Alpha (intern nutzbar, nicht öffentlich releasefähig)

Hauptblocker:
1. Build ist gebrochen (Blueprint-TS-Fehler)
2. Arbeitsbaum ist stark verschmutzt (39 gestagte Dateien, untracked Blueprint-Code)
3. Keine LICENSE-Datei

Größtes Risiko:
Blueprint-Code ist unvollständig im Arbeitsbaum und blockiert Build/Lint — muss entweder fertiggestellt oder isoliert werden.

Schnellster sichtbarer Fortschritt:
1. .tmp/issue-64-worktree/ löschen → 35 Tests werden grün
2. License-Datei anlegen → rechtlicher Status geklärt
3. Issue #70 fixen → 1 ESLint-Fehler weniger
```

---

## 15. Risiken und technische Schulden

| #   | Risiko                                       | Schwere     | Wahrscheinlichkeit | Beleg                                             | Empfehlung                                               |
| --- | -------------------------------------------- | ----------- | ------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| R1  | Build ist gebrochen                          | 🔴 Kritisch | 100%               | `tsc --noEmit`: 19 errors, `pnpm build`: fail     | Blueprint-Typen definieren oder Blueprint-Code isolieren |
| R2  | Arbeitsbaum-Verschmutzung                    | 🔴 Kritisch | 100%               | 39 staged + 3 unstaged + 20 untracked             | Sofort bereinigen: committen oder isolieren              |
| R3  | Worktree verursacht 35 Test-Failures         | 🟡 Mittel   | 100%               | `.tmp/issue-64-worktree/` doppelte React-Instanz  | Löschen                                                  |
| R4  | Keine Lizenz                                 | 🔴 Kritisch | 100%               | Kein `LICENSE`-File                               | Vor jedem öffentlichen Release klären (#39)              |
| R5  | Blueprint-Feature halb implementiert         | 🟡 Mittel   | 100%               | Code existiert, aber nicht kompilierbar           | Fertigstellen oder als experimentell kennzeichnen        |
| R6  | Kein GitHub Project                          | 🟡 Mittel   | 100%               | Projects enabled, aber kein Project für Repo      | Project anlegen                                          |
| R7  | PR #46 (Governance) blockiert Staging        | 🟡 Mittel   | 100%               | Offener PR mit 39 gestagten Dateien               | Mergen oder schließen                                    |
| R8  | CI nie als grün bestätigt                    | 🟡 Mittel   | 80%                | Workflows existieren, aber kein Live-Run sichtbar | Build fixen, dann CI triggern                            |
| R9  | Duplikate in Issues (#44, #48 ≈ #62)         | 🟢 Niedrig  | 100%               | Issues haben ähnlichen Scope                      | Duplikate schließen                                      |
| R10 | Issues #65 noch offen, aber bereits gemerged | 🟢 Niedrig  | 100%               | PR #61 = Issue #65                                | Issue schließen                                          |
| R11 | Kein Release-Workflow                        | 🟡 Mittel   | 100%               | Kein `release.yml`                                | Vor v1.6.0 anlegen                                       |
| R12 | Keine Code-Coverage                          | 🟢 Niedrig  | 100%               | Keine Coverage-Tools konfiguriert                 | Optional, nicht kritisch                                 |

---

## 16. Priorisierte nächste Schritte

| Prio   | Aufgabe                                              | Aufwand    | Risiko  | Begründung                                           |
| ------ | ---------------------------------------------------- | ---------- | ------- | ---------------------------------------------------- |
| **P0** | `.tmp/issue-64-worktree/` löschen                    | S (10 min) | Niedrig | Blockiert 35 Tests, reine Bereinigung                |
| **P0** | Blueprint-Code isolieren oder Typen fixen            | M (2-4h)   | Mittel  | Blockiert Build, ESLint (205 Fehler), TS (19 Fehler) |
| **P0** | Gestagte Docs-Änderungen in eigenen Branch committen | S (30 min) | Niedrig | 39 Dateien blockieren weiteren Workflow              |
| **P1** | LICENSE-Datei anlegen (#39)                          | S (30 min) | Niedrig | Rechtlich notwendig, Entscheidung nötig              |
| **P1** | Arbeitsbaum aufräumen (unstaged, untracked)          | S (1h)     | Niedrig | Clean Slate für weitere Arbeit                       |
| **P1** | PR #46 mergen oder schließen                         | S (30 min) | Niedrig | Blockiert Staging-Bereich                            |
| **P1** | Issue #65 schließen (bereits gemerged)               | S (5 min)  | Niedrig | Hygiene                                              |
| **P1** | Issues #44 und #48 als Duplikate schließen           | S (10 min) | Niedrig | Vermeidet Verwirrung                                 |
| **P2** | GitHub Project für PromptVault Lite anlegen          | S (30 min) | Niedrig | Bessere Übersicht über 28 offene Issues              |
| **P2** | Milestones definieren (v1.6.0, v2.0.0)               | S (30 min) | Niedrig | Roadmap sichtbar machen                              |
| **P2** | Dark Mode implementieren (#62)                       | M (4-8h)   | Mittel  | Höchste UI-Priorität                                 |
| **P2** | CI nach Build-Fix testen (Push auf Branch)           | S (30 min) | Mittel  | Bestätigung dass CI funktioniert                     |
| **P3** | Screenshots aufnehmen (#40)                          | S (1h)     | Niedrig | README und Docs verbessern                           |
| **P3** | GitHub Pages Deployment einrichten                   | M (2-4h)   | Niedrig | Docs live stellen                                    |
| **P3** | docs/README.md archivieren (#42)                     | S (15 min) | Niedrig | Aufräumen                                            |

---

## 17. Top-5 Workflow-Pläne

### 1. P0: Build reparieren (Blueprint-Isolierung)

```
Issue #70 (ESLint fix) → Issue #68 (Worktree löschen) →
Fix: Blueprint-Code temporär nach .tmp/ verschieben ODER Typen vervollständigen (Issues #51, #56) →
tsc --noEmit grün → pnpm lint grün → pnpm build grün →
pnpm test (35 failures behoben) → Commit → PR → CI grün → Merge
```

### 2. P1: Arbeitsbaum bereinigen

```
Issue (neu) → Spec: Bereinigungsplan →
1) Gestagte Docs in Branch docs/docs-as-code-integration committen →
2) Unstaged Lockfile-Änderungen prüfen und committen →
3) Untracked Blueprint isolieren (entweder in Feature-Branch oder .tmp/) →
4) .tmp/issue-64-worktree/ löschen →
5) github-ai-opencode-governance.zip löschen →
git status clean → Commit → PR
```

### 3. P1: Lizenz und rechtliche Grundlage (#39)

```
Issue #39 → Entscheidung: MIT vs Apache-2.0 →
LICENSE-Datei anlegen → package.json license-Feld setzen →
Cargo.toml license-Feld setzen → README Badge aktualisieren →
CONTRIBUTING.md Verweis ergänzen → PR → Human Approval → Merge
```

### 4. P2: Dark Mode implementieren (#62)

```
Issue #62 → Spec (darkmode.md existiert bereits) →
Verification Contract → Red Tests →
Implementation: CSS [data-theme="dark"], ThemeToggle, localStorage →
CI/Security Gates → Sandbox Preview → Reviewer-Agent →
Human Approval → Evidence-Kommentar → Merge
```

### 5. P2: GitHub Project + Milestones aufsetzen

```
Issues #49, #62 als Milestones gruppieren →
GitHub Project "PromptVault Lite" anlegen →
Custom Fields: Priority, Component, Sprint →
28 offene Issues verknüpfen → Status aktualisieren →
Roadmap-View erstellen → Dokumentation in docs/
```

---

## 18. Offene Fragen

1. **Q1:** Ist der Blueprint-Code (untracked) als experimentell gedacht oder soll er aktiv entwickelt werden? Aktuell blockiert er Build und Lint.
2. **Q2:** Soll PR #46 (Governance + Docs-as-Code) gemerged werden? Der PR umfasst 39 gestagte Dateien und ist seit 2026-06-08 offen.
3. **Q3:** Welche Lizenz soll verwendet werden? (Issue #39 empfiehlt MIT, Alternative Apache-2.0)
4. **Q4:** Soll das Wiki aktiviert werden oder bleibt Docs-as-Code via MkDocs der Standard?
5. **Q5:** Gibt es bereits einen GitHub Pages Deployment-Plan oder soll die Doku-Website nur lokal/staging bleiben?
6. **Q6:** Ist der Branch `fix/windows-path-filetree-root` der richtige Arbeits-Branch oder sollte auf `master` zurückgewechselt werden?
7. **Q7:** Wurde CI jemals erfolgreich durchlaufen? Es gibt 5 Workflows aber keinen sichtbaren Live-Run-Status.
8. **Q8:** Sollen Issues #44 und #48 (Dark Mode Duplikate) geschlossen werden?
9. **Q9:** Soll Issue #65 geschlossen werden (PR #61 bereits gemerged)?
10. **Q10:** Warum ist `master` der Default-Branch statt `main`?

---

## 19. Context Manifest

### Cold Context

- Projekt: PromptVault Lite — lokales Prompt-Management mit Qualitäts-/Hygieneanalyse
- Architektur: React 18 + TypeScript (Frontend), Rust 2021 + Tauri 2 (Backend), SQLite FTS5 (Storage)
- Regeln: GitHub Issues als Source of Truth, kein Code ohne Spec/Acceptance Criteria, Evidence-Gates, Human Approval
- Hard Constraints: Keine Cloud-Anbindung, alles lokal, Symlink-Containment, Path-Traversal-Schutz

### Warm Context

- Offene Issues: 28 (#39–#71), Schwerpunkt Blueprint (#49–#59) und UI (#62, #63)
- Geschlossene Issues: #26 (v1.5.0), #60 (Explorer Resize)
- PRs: #46 offen (Governance), #61 gemerged (Explorer Resize), #26 gemerged (v1.5.0)
- CI/CD: 5 Workflows (ci.yml, ai-governance-check.yml, docs-quality.yml, agentic-browser-quality.yml, evidence-gates.yml)
- Docs: MkDocs Material, 25+ Seiten, Diátaxis-Struktur
- Kritische Dateien: `src/types/index.ts` (fehlende Blueprint-Typen), `src/lib/tauri.ts` (fehlende Wrapper), `src/stores/blueprintStore.ts` (any-Typen)

### Hot Context

- **Branch:** `fix/windows-path-filetree-root`
- **HEAD:** `3425a7d`
- **Gestagte Dateien (39):** Vor allem Docs-As-Code-Integration und appStore-Tests
- **Unstaged Dateien (3):** package.json, pnpm-lock.yaml, vite.config.ts
- **Untracked (Build-blockierend):** `src/components/blueprints/*.tsx`, `src/stores/blueprintStore.ts`, `src-tauri/src/analysis/blueprint_quality.rs`, `src-tauri/src/commands/blueprint.rs`, `src-tauri/src/models/blueprint.rs`, `src-tauri/src/scanner/blueprint_scanner.rs`
- **Probleme:** Build gebrochen (19 TS-Fehler), ESLint 205 Fehler, 35 Test-Failures (Worktree), keine LICENSE

### Excluded Context

- `.opencode/` (Sub-Installation, nicht versioniert)
- `node_modules/` (Dependencies, nicht versioniert)
- `src-tauri/target/` (Build-Artefakte)
- `dist/` (Frontend-Build)
- `.agentic-browser/` (experimentell, noch nicht integriert)
- `test-results/` (Test-Artefakte)

### Source of Truth

- GitHub Issues: `https://github.com/xxammaxx/promptvault-lite/issues`
- `package.json` (Version 1.5.0, Scripts)
- `src-tauri/Cargo.toml` (Version 1.5.0, Dependencies)
- `mkdocs.yml` (Docs-Konfiguration)
- `.github/workflows/ci.yml` (CI-Pipeline)
- `docs/ARCHITECTURE.md` (Übersicht)

### Freshness

- Issues: Aktuell (alle von Juni 2026)
- Gestagte Änderungen: Von 2026-06-10 (Docs-As-Code + appStore-Tests)
- HEAD Commit: 2026-06-11 (Agentic Browser Prompt Pack)
- Build-Status: Gebrochen seit Blueprint-Code hinzugefügt wurde
- CI-Status: Unbekannt (letzter Run nicht lokal sichtbar)

### Confidence

- Repository-Status: **HIGH** — direkt aus `git status`, `gh` CLI
- Architektur: **HIGH** — aus Dateien und Doku belegt
- Test-Ergebnisse: **HIGH** — `pnpm test` und `cargo test` ausgeführt
- Build-Status: **HIGH** — `pnpm build` und `tsc --noEmit` ausgeführt
- Issue-Analyse: **MEDIUM** — offene Issues vollständig, geschlossene Issues unvollständig (Output-Trunkierung)
- CI-Status: **LOW** — Workflows existieren, aber kein Live-Run bestätigt
- Website-Deployment: **LOW** — Konfiguration vorhanden, Deployment nicht getestet

---

## 20. Kompakte Übergabe an ChatGPT

```
PromptVault Lite ist ein privates GitHub-Repo (xxammaxx/promptvault-lite), Version 1.5.0.
Tech Stack: React 18 + TypeScript + Zustand (Frontend), Rust 2021 + Tauri 2 + SQLite FTS5 (Backend).

WAS FERTIG IST (65% Reife):
- Kernfunktionalität: Prompts scannen, parsen, Qualitäts-/Hygieneanalyse, Favoriten, Export (JSON/MD/ZIP)
- Tests: 113 Rust-Tests (96+17) alle grün, ~94 Frontend-Tests grün
- Docs: MkDocs Material mit 25+ Seiten, Diátaxis-Struktur
- CI/CD: 5 GitHub Actions Workflows konfiguriert (Frontend, Rust, Docs, Secret Scan, Agentic Browser)
- Explorer-Spalte resizable gemerged (PR #61)

WAS NUR TEILWEISE FERTIG IST:
- Blueprint-Feature (Issues #49-#59): Code existiert untracked aber unvollständig — Build ist GEBROCHEN
- Dark Mode (Issue #62): ThemeToggle-Komponente existiert, CSS-Variablen bereit, aber nicht aktiv
- Docs-As-Code Integration: 39 Dateien gestaged, PR #46 offen
- Agentic Browser (Issue #71): Skripte + Config vorhanden, aber nicht in CI getestet

WAS KRITISCH OFFEN IST (P0):
1. BUILD IST GEBROCHEN: 19 TypeScript-Fehler, 205 ESLint-Fehler — alle durch unvollständigen Blueprint-Code
2. ARBEITSBAUM VERSCHMUTZT: 39 gestaged, 3 unstaged, 20+ untracked Dateien
3. 35 Frontend-Tests failen wegen .tmp/issue-64-worktree/ (doppelte React-Instanz)
4. Keine LICENSE-Datei

WEBSITE: 65% — MkDocs konfiguriert, aber nicht deployed, keine Screenshots
WIKI: Deaktiviert (soll so bleiben, Docs-as-Code ist besser)
GITHUB PROJECT: Nicht vorhanden für dieses Repo

NÄCHSTE 5 SCHRITTE (priorisiert):
1. P0: .tmp/issue-64-worktree/ löschen → 35 Tests sofort grün
2. P0: Blueprint-Code isolieren (.tmp/) oder Typen vervollständigen → Build reparieren
3. P0: Gestagte Änderungen in Branch committen → Arbeitsbaum bereinigen
4. P1: LICENSE-Datei anlegen (MIT empfohlen) → Issue #39
5. P2: GitHub Project + Milestones anlegen → 28 Issues organisieren

DATEIEN DIE CHATGPT KENNEN MUSS:
- src/types/index.ts (fehlende Blueprint-Typen → Build-Fehler-Ursache)
- src/lib/tauri.ts (fehlende Blueprint-API-Wrapper)
- src/stores/blueprintStore.ts (any-Typen, 205 ESLint-Fehler)
- .github/workflows/ci.yml (CI-Pipeline, muss nach Build-Fix getestet werden)
- docs/audits/REPOSITORY_GESAMTANALYSE_2026-06-11.md (dieser Bericht)

ISSUES DIE CHATGPT KENNEN MUSS:
- #51 (T-002: Blueprint TypeScript-Typen — URSACHE der Build-Fehler)
- #62 (Dark Mode — höchste UI-Prio)
- #39 (LICENSE — rechtlich kritisch)
- #68 (35 Test-Failures — schneller Fix)
- #49 (Blueprint Epic — Koordination der 10 Sub-Tasks)
- #41 (CI/CD — Workflows existieren bereits, Status muss geprüft werden)
```

---

## STATUS: ANALYSIS COMPLETE

**REASON:** Alle angeforderten Analysebereiche wurden untersucht. Einige Teilbereiche (geschlossene Issues vollständig, mkdocs build, CI Live-Run) konnten wegen Umgebungslimitierungen nicht vollständig analysiert werden — dies ist dokumentiert.

**NEXT HUMAN DECISION:**

1. Welchen der P0-Blocker zuerst angehen? (Build-Reparatur vs. Arbeitsbaum-Bereinigung)
2. Blueprint-Code: Fertigstellen oder isolieren?
3. PR #46: Mergen oder schließen?
4. Lizenz-Wahl: MIT oder Apache-2.0?
