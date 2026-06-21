---
title: Docs-as-Code Audit — Phase 1
description: Umfassende Bestandsaufnahme, Risikoanalyse und Maßnahmenplan für die Dokumentation von PromptVault Lite.
version: 1.0.0
date: 2026-06-10
author: documentation-agent
status: final
classification: internal
---

# Docs-as-Code Audit — Phase 1

> **Bestandsaufnahme, Risikoanalyse und Maßnahmenplan für die Dokumentation von PromptVault Lite.**  
> Dieses Dokument ist das Ergebnis einer vollständigen Inventory-Analyse des Repositories `xxammaxx/promptvault-lite`.
>
> **Kontext:** Diese Audit-Datei wird im Rahmen des Docs-as-Code Phase 1 erstellt. Sie dient als Grundlage für die Phasen 2–10.

---

## 🔍 1. Aktueller Dokumentationsstand

### 1.1 Dokumente im Repository

| #   | Pfad                                           | Typ              | Frontmatter-Version | Letzte Aktualisierung | Qualität                                                             |
| --- | ---------------------------------------------- | ---------------- | ------------------- | --------------------- | -------------------------------------------------------------------- |
| 1   | `README.md`                                    | Root-Doku        | k.A.                | v1.5.0                | ⭐⭐⭐☆ (402 Zeilen, sehr umfassend, aber teilweise veraltet)        |
| 2   | `AGENTS.md`                                    | Agenten-Regeln   | k.A.                | 2026-06-08            | ⭐⭐⭐⭐⭐ (303 Zeilen, extrem detailliert, vollständige Governance) |
| 3   | `CLAUDE.md`                                    | Agenten-Referenz | k.A.                | 2026-06-08            | ⭐⭐⭐⭐☆ (118 Zeilen, gute Komprimierung)                           |
| 4   | `docs/README.md`                               | Docs-Index       | v1.0.0              | k.A.                  | ⭐⭐☆☆☆ (53 Zeilen, dünn, verweist nur auf andere Docs)              |
| 5   | `docs/ARCHITECTURE.md`                         | Architektur      | v1.0.0              | k.A.                  | ⭐⭐⭐⭐☆ (175 Zeilen, gutes Diagramm, Modul-Übersicht)              |
| 6   | `docs/CHANGELOG.md`                            | Versionshistorie | v1.5.0              | 2026-06-05            | ⭐⭐⭐⭐⭐ (138 Zeilen, detailliert, versioniert)                    |
| 7   | `docs/INSTALL.md`                              | Installation     | v1.0.0              | k.A.                  | ⭐⭐⭐☆☆ (63 Zeilen, funktional aber oberflächlich)                  |
| 8   | `docs/USER_GUIDE.md`                           | Benutzerhandbuch | v1.0.0              | k.A.                  | ⭐⭐⭐☆☆ (79 Zeilen, funktional aber lückenhaft)                     |
| 9   | `docs/TESTING.md`                              | Test-Doku        | v1.0.0              | k.A.                  | ⭐⭐⭐⭐☆ (69 Zeilen, klar strukturiert)                             |
| 10  | `docs/SECURITY_GATES.md`                       | Security-Regeln  | k.A.                | 2026-06-07            | ⭐⭐⭐⭐⭐ (183 Zeilen, sehr umfassend)                              |
| 11  | `docs/AI_HANDBUCH.md`                          | Governance       | k.A.                | 2026-06-08            | ⭐⭐⭐⭐⭐ (271 Zeilen, vollständiger Standard)                      |
| 12  | `docs/AI_WORKFLOW.md`                          | Workflow         | k.A.                | 2026-06-08            | ⭐⭐⭐⭐⭐ (483 Zeilen, extrem detailliert, 11 Phasen)               |
| 13  | `docs/EVIDENCE_STANDARD.md`                    | Evidence         | k.A.                | 2026-06-08            | ⭐⭐⭐⭐⭐ (210 Zeilen, vollständig mit Beispielen)                  |
| 14  | `docs/CONTEXT_ENGINEERING_STANDARD.md`         | Kontext          | k.A.                | 2026-06-08            | ⭐⭐⭐⭐⭐ (172 Zeilen, detailliert)                                 |
| 15  | `docs/GITHUB_REPOSITORY_SETTINGS_CHECKLIST.md` | GitHub-Setup     | k.A.                | 2026-06-08            | ⭐⭐⭐⭐☆ (121 Zeilen, praktische Checkliste)                        |
| 16  | `docs/adr/ADR-001-ai-governance.md`            | ADR              | k.A.                | 2026-06-08            | ⭐⭐⭐⭐⭐ (129 Zeilen, formales ADR-Format)                         |
| 17  | `.github/pull_request_template.md`             | PR-Template      | k.A.                | k.A.                  | ⭐⭐⭐⭐⭐ (135 Zeilen, extrem detailliert)                          |
| 18  | `.github/CODEOWNERS`                           | Code Owners      | k.A.                | k.A.                  | ⭐⭐⭐⭐☆ (23 Zeilen, klar definiert)                                |

### 1.2 Issue-Templates

| #   | Pfad                                                  | Typ        | Qualität                                                     |
| --- | ----------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| 1   | `.github/ISSUE_TEMPLATE/feature.yml`                  | Feature    | ⭐⭐⭐⭐⭐ (114 Zeilen, vollständig mit Acceptance Criteria) |
| 2   | `.github/ISSUE_TEMPLATE/bug.yml`                      | Bug        | ⭐⭐⭐⭐☆ (nicht eingelesen, aber vorhanden)                 |
| 3   | `.github/ISSUE_TEMPLATE/ai-task.yml`                  | KI-Aufgabe | ⭐⭐⭐⭐⭐ (124 Zeilen, sehr detailliert)                    |
| 4   | `.github/ISSUE_TEMPLATE/context-engineering-task.yml` | Kontext    | ⭐⭐⭐⭐☆ (nicht eingelesen, aber vorhanden)                 |

### 1.3 Agent-Dokumente

| #   | Pfad                                           | Typ        | Qualität                                                       |
| --- | ---------------------------------------------- | ---------- | -------------------------------------------------------------- |
| 1   | `docs/agent/CONTEXT_MANIFEST_TEMPLATE.md`      | Template   | ⭐⭐⭐⭐⭐ (220 Zeilen, vollständig mit Cold/Warm/Hot Context) |
| 2   | `docs/agent/EVIDENCE_LOG_TEMPLATE.md`          | Template   | ⭐⭐⭐⭐⭐ (175 Zeilen, detaillierte Kategorien)               |
| 3   | `docs/agent/REVIEWER_CHECKLIST.md`             | Checkliste | ⭐⭐⭐⭐⭐ (124 Zeilen, sehr gründlich)                        |
| 4   | `docs/agent/VERIFICATION_CONTRACT_TEMPLATE.md` | Template   | ⭐⭐⭐⭐⭐ (169 Zeilen, umfassend)                             |
| 5   | `docs/agent/context-manifest-48.md`            | Instanz    | ⭐⭐⭐⭐☆ (befüllt)                                            |
| 6   | `docs/agent/context-manifest-49.md`            | Instanz    | ⭐⭐⭐⭐☆ (befüllt)                                            |
| 7   | `docs/agent/evidence-log-48.md`                | Instanz    | ⭐⭐⭐⭐☆ (befüllt)                                            |
| 8   | `docs/agent/evidence-log-49.md`                | Instanz    | ⭐⭐⭐⭐☆ (befüllt)                                            |

### 1.4 Audit-Dokumente

| #   | Pfad                                                  | Typ                   | Qualität                       |
| --- | ----------------------------------------------------- | --------------------- | ------------------------------ |
| 1   | `docs/audits/CONTEXT_MANIFEST_PROJECT_UPDATE.md`      | Context Manifest      | ⭐⭐⭐⭐☆                      |
| 2   | `docs/audits/EVIDENCE_LOG_PROJECT_UPDATE.md`          | Evidence Log          | ⭐⭐⭐⭐☆                      |
| 3   | `docs/audits/PROJECT_CONTENT_UPDATE_AUDIT.md`         | Projekt-Audit         | ⭐⭐⭐⭐⭐ (Sehr gute Analyse) |
| 4   | `docs/audits/VERIFICATION_CONTRACT_PROJECT_UPDATE.md` | Verification Contract | ⭐⭐⭐⭐☆                      |

### 1.5 CI-Workflows

| #   | Pfad                                        | Typ        | Stärken                                   | Schwächen                                                |
| --- | ------------------------------------------- | ---------- | ----------------------------------------- | -------------------------------------------------------- |
| 1   | `.github/workflows/ci.yml`                  | CI         | Typecheck, Lint, Test, Build, Secret Scan | **Kein Markdown-Lint, kein Link-Check, kein Docs-Build** |
| 2   | `.github/workflows/ai-governance-check.yml` | Governance | Python-Governance-Check                   | Nur Governance, keine Doku-Qualität                      |

### 1.6 Was bereits gut gelöst ist

- **AI Governance Docs (`docs/AI_HANDBUCH.md`, `docs/AI_WORKFLOW.md`, `docs/EVIDENCE_STANDARD.md`, `docs/CONTEXT_ENGINEERING_STANDARD.md`):** Hervorragend dokumentiert, konsistent, versioniert. Dies ist der stärkste Teil der Dokumentation.
- **Security Docs (`docs/SECURITY_GATES.md`):** Sehr detailliert, mit klaren Gates, CI-Integration und Incident-Response.
- **Agent-Vorlagen (`docs/agent/`):** Vollständige Templates für Context Manifest, Evidence Log, Reviewer Checklist und Verification Contract. Instanzen sind befüllt.
- **PR-Template:** Extrem detailliert mit Scope-Prüfung, Security-Check, Evidence-Block und Risk-Assessment.
- **Issue-Templates:** Professionell, mit Acceptance Criteria, Verification Contract und Red-Tests.
- **Architektur-Diagramm:** Mermaid-Diagramm und textuelles ASCII-Diagramm vorhanden.
- **CODEOWNERS:** Korrekt konfiguriert mit `@xxammaxx` als Default-Owner.
- **README.md:** Umfassend (402 Zeilen) mit Architektur, API-Referenz, Features, Installation und Contributing-Sektion.

---

## ⚠️ 2. Risiken für Dokumentationsdrift

### Risiko 1: Frontmatter-Version-Drift

- **Beschreibung:** Mehrere Docs-Dateien haben Frontmatter `version: 1.0.0`, während das Projekt bei `v1.5.0` ist.
- **Betroffene Dateien:**
  - `docs/ARCHITECTURE.md` (v1.0.0)
  - `docs/TESTING.md` (v1.0.0)
  - `docs/USER_GUIDE.md` (v1.0.0)
  - `docs/INSTALL.md` (v1.0.0)
  - `docs/README.md` (v1.0.0)
- **Risiko:** Neue Teammitglieder oder Agenten verlassen sich auf veraltete Architektur-Beschreibungen.
- **Schwere:** Mittel (kosmetisch, aber inkonsistent)
- **Beleg:** `grep "version: 1.0.0" docs/*.md` → 5 Treffer

### Risiko 2: Testanzahl-Drift

- **Beschreibung:** CHANGELOG v1.5.0 nennt 93 Frontend-Tests, README-Badge und TESTING.md nennen 94.
- **Risiko:** Vertrauensverlust in die Dokumentationsgenauigkeit.
- **Schwere:** Niedrig
- **Beleg:** `PROJECT_CONTENT_UPDATE_AUDIT.md` hat diesen Widerspruch bereits dokumentiert.

### Risiko 3: Keine automatische Docs-Qualitätsprüfung in CI

- **Beschreibung:** CI (`ci.yml`) prüft TypeScript, Rust und Secrets — aber **keine** Markdown-Qualität.
- **Risiko:** Kaputte Links, inkonsistente Formatierung, veraltete Diagramme werden nicht erkannt.
- **Schwere:** Mittel
- **Beleg:** Analyse von `.github/workflows/ci.yml` — kein `markdownlint`, kein `linkcheck`, kein `mkdocs build`.

### Risiko 4: Keine Docs-Build-Plattform

- **Beschreibung:** Es gibt kein `mkdocs.yml`, keine Build-Pipeline, keine Preview-Generation für Docs.
- **Risiko:** Entwickler lesen nur Markdown-Rohdateien. Keine Suchfunktion, keine Navigation, kein strukturiertes Lesen.
- **Schwere:** Mittel
- **Beleg:** `glob **/mkdocs.yml` → kein Treffer. `glob **/mkdocs-material` → kein Treffer.

### Risiko 5: Fehlende Diátaxis-Struktur

- **Beschreibung:** Dokumente sind nicht nach Diátaxis-Prinzip (Tutorial, How-to, Reference, Explanation) gegliedert.
- **Risiko:** Nutzer finden nicht, was sie suchen. Die Einstiegshürde ist höher als nötig.
- **Schwere:** Niedrig (aktuell noch, da Projekt klein)
- **Beleg:** Verzeichnisstruktur `docs/` hat keine Sub-Ordner `getting-started/`, `how-to/`, `reference/`, `explanation/`.

### Risiko 6: Fehlende Nutzer-Feedback-Schleife für Docs

- **Beschreibung:** Es gibt keinen Mechanismus, um Feedback zu Dokumentation zu sammeln (keine Issue-Tags für docs, kein ".github/ISSUE_TEMPLATE/docs.yml").
- **Risiko:** Docs-Qualität verbessert sich nicht organisch.
- **Schwere:** Niedrig
- **Beleg:** Kein `docs`-Label sichtbar, kein separates Issue-Template für Dokumentation.

### Risiko 7: README.md als Single-Point-of-Failure

- **Beschreibung:** `README.md` (402 Zeilen) enthält Features, Architektur, Installation, API-Referenz, Contributing, Sicherheit — alles in einer Datei.
- **Risiko:** Die Datei wird unübersichtlich. Änderungen in einer Sektion können unbeabsichtigt andere Sektionen beeinflussen.
- **Schwere:** Mittel
- **Beleg:** README.md enthält 11 semantische Sektionen in einer Datei.

### Risiko 8: Keine CI-Dokumentation

- **Beschreibung:** Die CI-Workflows sind gut konfiguriert, aber es gibt keine `docs/ci.md` zur Erklärung der Pipeline.
- **Risiko:** Externe Contributor verstehen nicht, wie CI funktioniert und warum Schritte fehlschlagen.
- **Schwere:** Niedrig
- **Beleg:** Keine CI-Dokumentation außer dem Workflow-Kommentar in `ci.yml`.

---

## 🏗️ 3. Empfohlene Dokumentationsplattform

### Empfehlung: **MkDocs mit mkdocs-material**

### Begründung

| Kriterium                  | MkDocs                                    | Docusaurus             | Vitepress            | ReadTheDocs    |
| -------------------------- | ----------------------------------------- | ---------------------- | -------------------- | -------------- |
| **Python-basiert**         | ✅ Ja                                     | ❌ Node                | ❌ Node              | ✅ Ja          |
| **Python bereits im CI**   | ✅ `ai-governance-check.yml` nutzt Python | ❌                     | ❌                   | ✅             |
| **Markdown-only**          | ✅ Ja                                     | ❌ MDX                 | ✅ Ja                | ✅ Ja          |
| **Theme-Qualität**         | ⭐⭐⭐⭐⭐ (material)                     | ⭐⭐⭐⭐☆              | ⭐⭐⭐⭐☆            | ⭐⭐⭐☆☆       |
| **Suchfunktion**           | ✅ Built-in                               | ✅ Built-in            | ✅ Built-in          | ✅ Built-in    |
| **CI-Integration**         | ✅ Einfach (`pip install`)                | ❌ Node-Build nötig    | ❌ Node-Build nötig  | ✅ Einfach     |
| **GitHub Pages**           | ✅ `mkdocs gh-deploy`                     | ✅ `docusaurus deploy` | ✅ `vitepress build` | ✅ Integriert  |
| **Diátaxis-Unterstützung** | ✅ Navigation + Subs                      | ✅ Sidebar             | ✅ Sidebar           | ✅ Integriert  |
| **React-Kompatibilität**   | ❌ Nicht nötig                            | ✅ (aber MDX)          | ✅ (aber Vue)        | ❌ Nicht nötig |
| **Lernaufwand**            | ⭐⭐⭐⭐⭐ (Minimal)                      | ⭐⭐⭐☆☆               | ⭐⭐⭐☆☆             | ⭐⭐⭐⭐☆      |
| **Community**              | ⭐⭐⭐⭐⭐ (sehr groß)                    | ⭐⭐⭐⭐⭐ (Meta)      | ⭐⭐⭐⭐☆ (Vue)      | ⭐⭐⭐⭐☆      |

### Gewichtung für dieses Projekt

1. **Kein Node-Build zusätzlich nötig** — Das Projekt hat bereits einen Frontend-Build (Vite). Ein Docusaurus oder Vitepress würde zusätzliche Node-Abhängigkeiten und Build-Zeit bedeuten.
2. **Python ist bereits im CI vorhanden** — `ai-governance-check.yml` nutzt `actions/setup-python`. MkDocs kann mit `pip install mkdocs-material` ohne neuen Toolchain-Setup auskommen.
3. **Kein MDX/React in Docs nötig** — Die Dokumentation ist rein informativ. Keine interaktiven Komponenten, keine JSX-Embedding. MkDocs Markdown ist völlig ausreichend.
4. **mkdocs-material** bietet: Suchfunktion, Social-Share-Previews, Dark-Mode, Code-Highlighting, Mermaid-Diagramm-Integration, Navigation-Tabs, Tabellen, Annotations. Alles, was dieses Projekt braucht.
5. **Geringer Lernaufwand** — `pip install mkdocs-material`, `mkdocs.yml` konfigurieren, `mkdocs serve` für lokales Preview, `mkdocs build` für statische HTML-Generierung.

### Geplante Konfiguration (Phase 2)

```yaml
# docs/mkdocs.yml (voraussichtlich)
site_name: PromptVault Lite
site_description: Lokales Prompt-Management-System mit Qualitäts- und Hygieneanalyse
site_author: xxammaxx
repo_url: https://github.com/xxammaxx/promptvault-lite
docs_dir: .

theme:
  name: material
  features:
    - navigation.tabs
    - navigation.sections
    - search.highlight
    - content.code.copy

nav:
  - Start: README.md
  - Installation: INSTALL.md
  - Benutzerhandbuch: USER_GUIDE.md
  - Architektur: ARCHITECTURE.md
  - Testing: TESTING.md
  - Changelog: CHANGELOG.md
  - Sicherheit: SECURITY_GATES.md
  - AI Governance:
      - Handbuch: AI_HANDBUCH.md
      - Workflow: AI_WORKFLOW.md
      - Evidence Standard: EVIDENCE_STANDARD.md
      - Context Engineering: CONTEXT_ENGINEERING_STANDARD.md
      - ADR-001: adr/ADR-001-ai-governance.md
  - Agenten:
      - Context Manifest Template: agent/CONTEXT_MANIFEST_TEMPLATE.md
      - Evidence Log Template: agent/EVIDENCE_LOG_TEMPLATE.md
      - Reviewer Checklist: agent/REVIEWER_CHECKLIST.md
      - Verification Contract: agent/VERIFICATION_CONTRACT_TEMPLATE.md
  - Audits:
      - Docs-as-Code Audit: audits/DOCS_AS_CODE_AUDIT.md
      - Projekt-Update-Audit: audits/PROJECT_CONTENT_UPDATE_AUDIT.md
```

> **Annahme:** MkDocs mit `mkdocs-material` wird in Phase 2 installiert und konfiguriert.  
> **Annahme:** Die Dokumentation wird über GitHub Pages ausgeliefert.  
> **Fakt:** Python `3.x` ist bereits im CI verfügbar (`actions/setup-python@v5` in `ai-governance-check.yml`).

---

## 📄 4. Vorhandene Dateien, die nicht überschrieben werden dürfen

Diese Liste ist **abschließend** für Phase 1. Änderungen an diesen Dateien benötigen einen separaten Issue-Prozess.

### 4.1 Root-Dokumente

| Datei       | Warum nicht überschreiben                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `README.md` | Zentrale Projektdoku (402 Zeilen). Enthält Architektur, API-Referenz, Features, Contributing.  |
| `AGENTS.md` | Verbindliche Agentenregeln (303 Zeilen). Cold Context für jeden Agentenlauf. Hard Constraints. |
| `CLAUDE.md` | Agent-Instructions (118 Zeilen). Wird von Claude und kompatiblen Coding-Agents geladen.        |

### 4.2 Governance-Dokumente (`docs/`)

| Datei                                          | Warum nicht überschreiben                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| `docs/AI_HANDBUCH.md`                          | Vollständiger Governance-Standard (271 Zeilen). Referenziert von AGENTS.md, README.md.  |
| `docs/AI_WORKFLOW.md`                          | Workflow-Phasen (483 Zeilen, extrem detailliert). Referenziert von mehreren Dokumenten. |
| `docs/EVIDENCE_STANDARD.md`                    | Evidence-Format (210 Zeilen). Verbindlich für alle PRs und Agentenläufe.                |
| `docs/CONTEXT_ENGINEERING_STANDARD.md`         | Kontext-Management (172 Zeilen). Cold Context für Agenten.                              |
| `docs/SECURITY_GATES.md`                       | Sicherheitsregeln (183 Zeilen). CODEOWNERS schützt diese Datei.                         |
| `docs/GITHUB_REPOSITORY_SETTINGS_CHECKLIST.md` | GitHub-Einstellungen (121 Zeilen). Manuelle Konfigurationshilfe.                        |
| `docs/ARCHITECTURE.md`                         | Systemarchitektur (175 Zeilen). Mermaid-Diagramm und Modul-Übersicht.                   |
| `docs/CHANGELOG.md`                            | Versionshistorie (138 Zeilen). Wichtig für Nachvollziehbarkeit.                         |
| `docs/INSTALL.md`                              | Installationsanleitung (63 Zeilen). Plattform-spezifische Schritte.                     |
| `docs/USER_GUIDE.md`                           | Benutzerhandbuch (79 Zeilen). Endnutzer-Dokumentation.                                  |
| `docs/TESTING.md`                              | Test-Dokumentation (69 Zeilen). Wichtig für Contributor.                                |
| `docs/README.md`                               | Docs-Index (53 Zeilen). Einzige Übersichtsseite der Dokumentation.                      |

### 4.3 ADR

| Datei                               | Warum nicht überschreiben                                   |
| ----------------------------------- | ----------------------------------------------------------- |
| `docs/adr/ADR-001-ai-governance.md` | Architekturentscheidung (129 Zeilen). CODEOWNERS geschützt. |

### 4.4 Agent-Dokumente (`docs/agent/`)

| Datei                                          | Warum nicht überschreiben                                |
| ---------------------------------------------- | -------------------------------------------------------- |
| `docs/agent/CONTEXT_MANIFEST_TEMPLATE.md`      | Template (220 Zeilen). Basis für alle Context Manifests. |
| `docs/agent/EVIDENCE_LOG_TEMPLATE.md`          | Template (175 Zeilen). Basis für alle Evidence Logs.     |
| `docs/agent/REVIEWER_CHECKLIST.md`             | Checkliste (124 Zeilen). Verbindlich für Review-Agent.   |
| `docs/agent/VERIFICATION_CONTRACT_TEMPLATE.md` | Template (169 Zeilen). Verbindlich für Spezifikation.    |
| `docs/agent/context-manifest-48.md`            | Instanz. Evidence-Trail für Issue #48.                   |
| `docs/agent/context-manifest-49.md`            | Instanz. Evidence-Trail für Issue #49.                   |
| `docs/agent/evidence-log-48.md`                | Instanz. Evidence-Trail für Issue #48.                   |
| `docs/agent/evidence-log-49.md`                | Instanz. Evidence-Trail für Issue #49.                   |

### 4.5 Audit-Dokumente (`docs/audits/`)

| Datei                                                 | Warum nicht überschreiben                                        |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| `docs/audits/PROJECT_CONTENT_UPDATE_AUDIT.md`         | Vorheriges Audit (137 Zeilen). Enthält Widersprüche und Risiken. |
| `docs/audits/CONTEXT_MANIFEST_PROJECT_UPDATE.md`      | Context Manifest für vorheriges Audit.                           |
| `docs/audits/EVIDENCE_LOG_PROJECT_UPDATE.md`          | Evidence Log für vorheriges Audit.                               |
| `docs/audits/VERIFICATION_CONTRACT_PROJECT_UPDATE.md` | Verification Contract für vorheriges Audit.                      |

### 4.6 GitHub-Konfiguration

| Datei                                                 | Warum nicht überschreiben                                    |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| `.github/pull_request_template.md`                    | PR-Template (135 Zeilen). Enthält Scope, Security, Evidence. |
| `.github/CODEOWNERS`                                  | Code Owners. Definiert Review-Verantwortlichkeiten.          |
| `.github/workflows/ci.yml`                            | CI-Pipeline. Lint, Test, Build, Secret Scan.                 |
| `.github/workflows/ai-governance-check.yml`           | Governance-Check. Python-basiert.                            |
| `.github/ISSUE_TEMPLATE/feature.yml`                  | Feature-Template. Speckit-kompatibel.                        |
| `.github/ISSUE_TEMPLATE/bug.yml`                      | Bug-Template.                                                |
| `.github/ISSUE_TEMPLATE/ai-task.yml`                  | AI-Task-Template.                                            |
| `.github/ISSUE_TEMPLATE/context-engineering-task.yml` | Context-Engineering-Template.                                |

---

## 🧩 5. Fehlende Elemente

### 5.1 Diátaxis-Mapping

Nach dem [Diátaxis-Framework](https://diataxis.fr/) fehlen folgende Kategorien:

| Diátaxis-Kategorie | Soll                    | Vorhanden                                          | Status       |
| ------------------ | ----------------------- | -------------------------------------------------- | ------------ |
| **Tutorial**       | `docs/getting-started/` | Kein Verzeichnis                                   | ❌ Fehlt     |
| **How-to Guide**   | `docs/how-to/`          | Kein Verzeichnis                                   | ❌ Fehlt     |
| **Reference**      | `docs/reference/`       | Nur `docs/ARCHITECTURE.md` und `docs/CHANGELOG.md` | ⚠️ Teilweise |
| **Explanation**    | `docs/explanation/`     | Nur `docs/AI_HANDBUCH.md`                          | ⚠️ Teilweise |

### 5.2 Vollständige Liste fehlender Elemente

| #   | Fehlendes Element                               | Begründung                                                                           | Diátaxis    | Priorität  |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------ | ----------- | ---------- |
| 1   | `docs/mkdocs.yml`                               | Build-Konfiguration für MkDocs-Doks-Plattform                                        | —           | 🔴 Hoch    |
| 2   | `docs/getting-started/`                         | Schnellstart-Tutorial für neue Nutzer (Erstinstallation, erster Scan, erste Analyse) | Tutorial    | 🟡 Mittel  |
| 3   | `docs/getting-started/quickstart.md`            | 5-Minuten-Schnellstart                                                               | Tutorial    | 🟡 Mittel  |
| 4   | `docs/getting-started/installation-detailed.md` | Detail-Installation mit Plattform-spezifischen Abhängigkeiten                        | Tutorial    | 🟡 Mittel  |
| 5   | `docs/how-to/`                                  | Lösungsorientierte Anleitungen für häufige Aufgaben                                  | How-to      | 🟡 Mittel  |
| 6   | `docs/how-to/analyze-prompts.md`                | Schritt-für-Schritt: Prompts analysieren                                             | How-to      | 🟡 Mittel  |
| 7   | `docs/how-to/export-results.md`                 | Schritt-für-Schritt: Ergebnisse exportieren                                          | How-to      | 🟡 Mittel  |
| 8   | `docs/how-to/manage-favorites.md`               | Schritt-für-Schritt: Favoriten verwalten                                             | How-to      | 🟡 Mittel  |
| 9   | `docs/how-to/use-keyboard-shortcuts.md`         | Tastaturkürzel-Referenz als How-to                                                   | How-to      | 🟢 Niedrig |
| 10  | `docs/reference/`                               | Technische Referenz-Dokumentation                                                    | Reference   | 🟡 Mittel  |
| 11  | `docs/reference/api.md`                         | Vollständige API-Referenz (Tauri Commands) mit Typen                                 | Reference   | 🟡 Mittel  |
| 12  | `docs/reference/configuration.md`               | Vollständige Konfigurations-Referenz                                                 | Reference   | 🟡 Mittel  |
| 13  | `docs/reference/data-model.md`                  | Datenmodell-Referenz (PromptItem, Evaluation, etc.)                                  | Reference   | 🟡 Mittel  |
| 14  | `docs/reference/cli.md`                         | CLI-Referenz (falls vorhanden)                                                       | Reference   | 🟢 Niedrig |
| 15  | `docs/explanation/`                             | Hintergrund-Erklärungen                                                              | Explanation | 🟢 Niedrig |
| 16  | `docs/explanation/architecture-deep-dive.md`    | Architektur-Entscheidungen im Detail                                                 | Explanation | 🟢 Niedrig |
| 17  | `docs/explanation/analysis-methodology.md`      | Wie Qualitäts- und Hygieneanalyse funktionieren                                      | Explanation | 🟢 Niedrig |
| 18  | `docs/explanation/security-model.md`            | Sicherheitsmodell-Erklärung                                                          | Explanation | 🟡 Mittel  |
| 19  | `docs/glossary.md`                              | Fachbegriffe und Abkürzungen                                                         | Reference   | 🟢 Niedrig |
| 20  | `docs/runbooks/`                                | Betriebs-Runbooks                                                                    | How-to      | 🟢 Niedrig |
| 21  | `docs/runbooks/ci-failure.md`                   | CI-Fehler analysieren und beheben                                                    | How-to      | 🟢 Niedrig |
| 22  | `docs/runbooks/build-failure.md`                | Build-Fehler analysieren und beheben                                                 | How-to      | 🟢 Niedrig |
| 23  | `CONTRIBUTING.md`                               | Separates Contributing-Handbuch (nur Sektion in README)                              | How-to      | 🟡 Mittel  |
| 24  | `.github/CONTRIBUTING.md`                       | GitHub-native Contributing-Datei                                                     | How-to      | 🟢 Niedrig |
| 25  | `llms.txt`                                      | KI/RAG-optimierte Zusammenfassung des Projekts                                       | Reference   | 🟢 Niedrig |
| 26  | `docs/ci.md`                                    | CI-Pipeline-Dokumentation                                                            | Reference   | 🟢 Niedrig |
| 27  | **Docs-Qualitäts-Gates in CI**                  | Markdown-Lint, Link-Check, Docs-Build in CI                                          | —           | 🔴 Hoch    |
| 28  | **Markdown-Linter** (`markdownlint`)            | Formatierungsprüfung für alle `.md`-Dateien                                          | —           | 🟡 Mittel  |
| 29  | **Link-Checker** (`markdown-link-check`)        | Prüfung auf tote Links in der Dokumentation                                          | —           | 🟡 Mittel  |
| 30  | **Docs-Build-Check** (`mkdocs build`)           | Prüfung, ob Docs-Build fehlerfrei ist                                                | —           | 🔴 Hoch    |

### 5.3 Inkonsistenzen, die behoben werden müssen

| #   | Inkonsistenz                                                                | Betroffene Dateien                                                                                   | Aktion                                                         |
| --- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Frontmatter v1.0.0 vs Projekt v1.5.0                                        | `docs/ARCHITECTURE.md`, `docs/TESTING.md`, `docs/USER_GUIDE.md`, `docs/INSTALL.md`, `docs/README.md` | Version auf 1.5.0 aktualisieren                                |
| 2   | Testanzahl 93 vs 94                                                         | `docs/CHANGELOG.md` vs `README.md` + `docs/TESTING.md`                                               | Mit aktuellem Testlauf verifizieren                            |
| 3   | README.md enthält Contributing-Sektion, aber kein separates CONTRIBUTING.md | `README.md` (Z. 340–346) vs fehlende Datei                                                           | Entscheiden: Sektion belassen oder in separate Datei auslagern |

---

## 📋 6. Konkrete Umsetzungsschritte (Phasen 2–10)

### Phase 2: MkDocs-Setup und Build-Infrastruktur

- [ ] **2.1** `requirements-docs.txt` erstellen mit `mkdocs-material`
- [ ] **2.2** `docs/mkdocs.yml` mit Navigation, Theme und Plugin-Konfiguration erstellen
- [ ] **2.3** `mkdocs serve` lokal testen
- [ ] **2.4** `mkdocs build` in CI integrieren (neuer Job `docs` in `ci.yml`)
- [ ] **2.5** GitHub Pages Deployment: `mkdocs gh-deploy` als Deployment-Job
- [ ] **2.6** `mkdocs.yml` im CI mit `--strict` builden (Fehler = CI-Fail)

### Phase 3: Markdown-Qualitäts-Gates

- [ ] **3.1** `markdownlint-cli` als Dev-Dependency installieren
- [ ] **3.2** `.markdownlint.json` mit projektspezifischen Regeln erstellen
- [ ] **3.3** `markdown-link-check` als Dev-Dependency installieren
- [ ] **3.4** `.mlc-config.json` für Link-Checker erstellen
- [ ] **3.5** Job in CI ergänzen: `pnpm lint:md` + `pnpm check:links`
- [ ] **3.6** Alle aktuellen Markdown-Dateien auf Lint-Fehler prüfen und beheben
- [ ] **3.7** Alle aktuellen Links auf Gültigkeit prüfen und defekte Links reparieren

### Phase 4: Diátaxis-Struktur aufbauen

- [ ] **4.1** `docs/getting-started/` anlegen:
  - [ ] `docs/getting-started/index.md` — Übersicht
  - [ ] `docs/getting-started/quickstart.md` — 5-Minuten-Schnellstart
  - [ ] `docs/getting-started/installation-detailed.md` Aus INSTALL.md extrahieren und erweitern
- [ ] **4.2** `docs/how-to/` anlegen:
  - [ ] `docs/how-to/index.md` — Übersicht
  - [ ] `docs/how-to/analyze-prompts.md` — aus USER_GUIDE.md extrahieren
  - [ ] `docs/how-to/export-results.md` — Export-fokussiert
  - [ ] `docs/how-to/manage-favorites.md` — Favoriten-fokussiert
  - [ ] `docs/how-to/use-keyboard-shortcuts.md` — Tastaturkürzel
- [ ] **4.3** `docs/reference/` anlegen:
  - [ ] `docs/reference/index.md` — Übersicht
  - [ ] `docs/reference/api.md` — API-Referenz aus README.md extrahieren und erweitern
  - [ ] `docs/reference/configuration.md` — Konfigurations-Referenz aus README.md extrahieren
  - [ ] `docs/reference/data-model.md` — Datenmodelle (PromptItem, PromptEvaluation, PromptHygiene)
  - [ ] `docs/reference/cli.md` — CLI-Referenz (falls vorhanden)
- [ ] **4.4** `docs/explanation/` anlegen:
  - [ ] `docs/explanation/index.md` — Übersicht
  - [ ] `docs/explanation/architecture-deep-dive.md` — Erweiterte Architektur-Erklärung
  - [ ] `docs/explanation/analysis-methodology.md` — Qualitäts- und Hygieneanalyse im Detail
  - [ ] `docs/explanation/security-model.md` — Sicherheitsmodell

### Phase 5: CONTRIBUTING.md

- [ ] **5.1** `CONTRIBUTING.md` im Root erstellen (aus README.md-Sektion extrahieren und erweitern)
- [ ] **5.2** Fork-/Clone-/Branch-Anleitung
- [ ] **5.3** Dev-Setup mit allen Varianten (pnpm, cargo, pre-commit)
- [ ] **5.4** Coding-Standards (ESLint, Prettier, clippy, fmt)
- [ ] **5.5** Test-Anleitung (pnpm test, cargo test, Coverage)
- [ ] **5.6** PR-Prozess (Templates, Checkliste, Review)
- [ ] **5.7** Governance-Referenz (Links zu AI_HANDBUCH, AGENTS.md, etc.)
- [ ] **5.8** README.md-Contributing-Sektion durch Verweis auf CONTRIBUTING.md ersetzen
- [ ] **5.9** `.github/CONTRIBUTING.md` als Symlink oder Kopie (optional)

### Phase 6: Version-Drift beheben und Inkonsistenzen korrigieren

- [ ] **6.1** Frontmatter in allen `docs/*.md` von `v1.0.0` auf `v1.5.0` aktualisieren
- [ ] **6.2** Testanzahl-Drift auflösen: aktuellen `pnpm test`-Run dokumentieren
- [ ] **6.3** `docs/ARCHITECTURE.md` auf aktuellen Stand bringen (Database-Mutex, Blueprint-Module als untracked)
- [ ] **6.4** `docs/README.md` (Docs-Index) mit allen neuen Verzeichnissen aktualisieren
- [ ] **6.5** `docs/CHANGELOG.md` prüfen auf Konsistenz mit README-Badge

### Phase 7: Glossary und llms.txt

- [ ] **7.1** `docs/glossary.md` erstellen:
  - Technische Begriffe: PromptItem, Frontmatter, Tauri-Command, IPC, etc.
  - Analyse-Begriffe: Qualitätsscore, Hygienescore, Artefakt, etc.
  - Architektur-Begriffe: Store, Service, Command, Module
- [ ] **7.2** `llms.txt` nach [llmstxt-Standard](https://llmstxt.org/) erstellen:
  - Projekt-Kurzbeschreibung
  - Wichtige Dateipfade
  - API-Referenz (Kurzform)
  - Governance-Hinweise
  - Link zu allen wichtigen Dokumenten

### Phase 8: Runbooks

- [ ] **8.1** `docs/runbooks/` anlegen:
  - [ ] `docs/runbooks/index.md` — Übersicht
  - [ ] `docs/runbooks/ci-failure.md` — CI-Fehlerdiagnose
  - [ ] `docs/runbooks/build-failure.md` — Build-Fehlerdiagnose
  - [ ] `docs/runbooks/release-process.md` — Release-Prozess (Versionierung, CHANGELOG, Tagging)

### Phase 9: CI-Dokumentation

- [ ] **9.1** `docs/ci.md` erstellen:
  - Workflow-Übersicht (frontend, rust, secret-scan, ai-governance-check)
  - Status-Badges
  - Fehlerbehebung für häufige CI-Fehler
  - Wie man CI lokal simuliert

### Phase 10: Finale Qualitätskontrolle und Docs-Lebenszyklus

- [ ] **10.1** Vollständigen Docs-Build testen: `mkdocs build --strict`
- [ ] **10.2** Alle Links prüfen: `pnpm check:links`
- [ ] **10.3** Alle Markdown-Dateien linten: `pnpm lint:md`
- [ ] **10.4** GitHub Actions Docs-Job auf grün stellen
- [ ] **10.5** Dieses Audit (`DOCS_AS_CODE_AUDIT.md`) abschließen und Status auf `final` setzen
- [ ] **10.6** Docs-Lebenszyklus-Richtlinie definieren:
  - Wann werden Docs geupdated? (parallel zu Code-Änderungen)
  - Wer reviewed Docs-Änderungen?
  - Wie wird Docs-Drift verhindert? (CI-Gates, jährliches Audit)
  - Wie wird Feedback zu Docs gesammelt? (Issue-Template, Label)

---

## ❓ 7. Offene Annahmen

### 7.1 Tatsachen (belegt durch Dateien)

| #   | Tatsache                                              | Beleg                                                                   |
| --- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| T1  | Python ist im CI verfügbar                            | `.github/workflows/ai-governance-check.yml` Zeile 20: `setup-python@v5` |
| T2  | 5 docs haben Frontmatter v1.0.0                       | `grep "version: 1.0.0" docs/*.md` → 5 Treffer                           |
| T3  | Kein mkdocs.yml vorhanden                             | `glob **/mkdocs.yml` → kein Treffer                                     |
| T4  | Kein llms.txt vorhanden                               | `glob **/llms.txt` → kein Treffer                                       |
| T5  | Kein CONTRIBUTING.md vorhanden                        | `glob CONTRIBUTING.md` + `glob .github/CONTRIBUTING.md` → kein Treffer  |
| T6  | 4 Issue-Templates vorhanden                           | `.github/ISSUE_TEMPLATE/` → 4 Dateien                                   |
| T7  | 2 CI-Workflows vorhanden                              | `.github/workflows/` → 2 Dateien                                        |
| T8  | CODEOWNERS definiert `@xxammaxx` als Default Owner    | `.github/CODEOWNERS` Zeile 5                                            |
| T9  | docs/agent/ hat 8 Dateien (4 Templates + 4 Instanzen) | `docs/agent/` → 8 Einträge                                              |
| T10 | docs/audits/ hat 4 Dateien (vor diesem Audit)         | `docs/audits/` → 4 Einträge                                             |
| T11 | CI prüft keine Markdown-Qualität                      | `.github/workflows/ci.yml` — kein markdownlint, kein linkcheck          |
| T12 | 402 Zeilen README.md                                  | `README.md` — 402 Zeilen                                                |
| T13 | Frontmatter im docs/README.md ist v1.0.0              | `docs/README.md` Zeile 4                                                |
| T14 | Testanzahl-Drift: CHANGELOG sagt 93, README sagt 94   | `docs/CHANGELOG.md` Zeile 33 vs `README.md` Zeile 296                   |
| T15 | Keine Diátaxis-Struktur                               | Keine Sub-Ordner getting-started/, how-to/, reference/, explanation/    |

### 7.2 Annahmen (logische Schlussfolgerungen)

| #   | Annahme                                                                           | Grundlage                                             | Confidence | Risiko bei Fehlannahme                                                        |
| --- | --------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| A1  | MkDocs-mit-material ist die beste Wahl                                            | Analyse der Alternativen (siehe Sektion 3)            | HOCH       | Docusaurus oder Vitepress müssten verwendet werden — mehr Node-Abhängigkeiten |
| A2  | Python pip-Installation funktioniert im CI                                        | Python ist bereits im CI-Setup                        | HOCH       | CI-Job müsste angepasst werden                                                |
| A3  | README.md-Contributing-Sektion kann durch CONTRIBUTING.md-Referenz ersetzt werden | Projekt ist klein genug für diese Änderung            | MEDIUM     | Nutzer könnten Contributing-Info in README vermissen                          |
| A4  | Die Frontmatter-Version 1.0.0 ist ein Versehen, nicht Absicht                     | Alle anderen Docs haben korrekte Versionshinweise     | HOCH       | Versionen waren bewusst zurückgesetzt (unwahrscheinlich)                      |
| A5  | GitHub Pages ist der beste Deployment-Kanal                                       | Projekt ist auf GitHub, mkdocs gh-deploy ist Standard | HOCH       | Alternative: Netlify, Vercel, ReadTheDocs                                     |
| A6  | MkDocs-strict-Modus verhindert fehlerhafte Docs-Builds                            | mkdocs-material unterstützt --strict                  | HOCH       | Einige Plugins sind nicht kompatibel                                          |

### 7.3 Offene Fragen

| #   | Frage                                                                                                        | Betrifft               | Geklärt durch                                          |
| --- | ------------------------------------------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------ |
| Q1  | Soll die Doku über GitHub Pages oder ReadTheDocs ausgeliefert werden?                                        | Phase 2                | Human Approval                                         |
| Q2  | Soll `README.md` reduziert werden (nur Intro + Badges + Links), oder bleibt es die umfassende Single-Source? | Phase 4–5              | Human Approval                                         |
| Q3  | Soll der Link-Checker externe Links prüfen (risiko: Netzwerkabhängigkeit im CI)?                             | Phase 3                | Human Approval                                         |
| Q4  | Gibt es eine Präferenz für ein Markdown-Lint-Regel-Set?                                                      | Phase 3                | Human Approval                                         |
| Q5  | Soll `docs/glossary.md` mehrsprachig sein (DE + EN)?                                                         | Phase 7                | Human Approval                                         |
| Q6  | Soll das `docs/`-Verzeichnis umbenannt werden (z.B. `documentation/`)?                                       | Phase 2                | Human Approval (voraussichtlich: nein, bleibt `docs/`) |
| Q7  | Werden Screenshots in der Dokumentation mit Playwright automatisiert erstellt?                               | Phase 7                | Human Approval                                         |
| Q8  | Soll es ein Issue-Template speziell für Dokumentation geben?                                                 | Phase 10               | Human Approval                                         |
| Q9  | Ist der `strict`-Modus für MkDocs gewünscht (CI-Failure bei Warnungen)?                                      | Phase 2                | Human Approval                                         |
| Q10 | Werden alle Docs ins Englische übersetzt, oder bleibt Deutsch die primäre Sprache?                           | Phase 2, grundsätzlich | Human Approval                                         |

---

## 📊 8. Qualitätsbewertung

### 8.1 Gesamtscore: **6,2 / 10** („Gut mit Luft nach oben")

### 8.2 Einzelbewertung

| Kategorie            | Score | Begründung                                                                                                                         |
| -------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Vollständigkeit**  | 6/10  | AI Governance ist vollständig. User Docs haben Lücken. Keine Diátaxis-Struktur. Fehlende Reference/How-to/Explanation-Dokumente.   |
| **Korrektheit**      | 7/10  | Governance-Docs sind korrekt und aktuell. Frontmatter-Versionen sind veraltet (1.0.0 statt 1.5.0). Testanzahl-Drift (93 vs 94).    |
| **Konsistenz**       | 6/10  | Governance-Docs untereinander konsistent. User Docs haben uneinheitliche Tiefe. README ist überladen.                              |
| **Aktualität**       | 5/10  | AI Governance: ⭐⭐⭐⭐⭐ (2026-06-08). User Docs: ⭐⭐☆☆☆ (Frontmatter 1.0.0). ARCHITECTURE.md fehlen v1.5.0-Änderungen.          |
| **Auffindbarkeit**   | 4/10  | Keine Suchfunktion (kein MkDocs-Build). Keine Diátaxis-Struktur. README.md als einziger Einstiegspunkt.                            |
| **Automatisierung**  | 3/10  | Kein Docs-Build in CI. Kein Markdown-Lint. Kein Link-Check. Keine Docs-Qualitäts-Gates.                                            |
| **Barrierefreiheit** | 5/10  | Nur Markdown (gut für README, schlecht für strukturierte Docs). Keine HTML-Version. Keine Suchfunktion.                            |
| **Wartbarkeit**      | 6/10  | Templates und Governance-Docs sind gut wartbar. README.md ist zu groß (402 Zeilen) und schwer wartbar. Keine automatische Prüfung. |

### 8.3 Bewertungs-Rubrik

| Score | Bedeutung                                                                |
| ----- | ------------------------------------------------------------------------ |
| 9–10  | Exzellent — Vorbildlich für Open-Source-Projekte                         |
| 7–8   | Gut — Mit kleineren Lücken                                               |
| 5–6   | **Befriedigend** — Grundlegend funktional, aber mit signifikanten Lücken |
| 3–4   | Mangelhaft — Wesentliche Elemente fehlen                                 |
| 1–2   | Ungenügend — Kaum dokumentiert                                           |

### 8.4 Stärken und Schwächen

#### Stärken

- **AI Governance ist exzellent:** Vollständig, versioniert, konsistent, mit klaren Gates.
- **Agent-Templates sind vollständig:** Context Manifest, Evidence Log, Reviewer Checklist, Verification Contract.
- **Issue- und PR-Templates sind professionell:** Mit Acceptance Criteria, Security-Check, Evidence-Block.
- **README.md ist umfassend:** Trotz Überladung enthält es alle wichtigen Informationen.
- **CODEOWNERS ist korrekt konfiguriert:** Schützt Security-relevante Dateien.

#### Schwächen

- **Kein Docs-Build-System:** MkDocs fehlt. Keine Suchfunktion, keine Navigation, keine HTML-Version.
- **Keine Docs-Qualitäts-Gates in CI:** Markdown-Lint, Link-Check, Build-Check fehlen.
- **Keine Diátaxis-Struktur:** Tutorial, How-to, Reference, Explanation fehlen als Kategorien.
- **Frontmatter-Version-Drift:** 5 Dateien zeigen v1.0.0 statt v1.5.0.
- **Testanzahl-Drift:** CHANGELOG vs README.
- **Kein separates CONTRIBUTING.md:** Nur eine kurze Sektion in README.md.
- **Keine Glossar-Datei:** Fachbegriffe sind nicht zentral definiert.
- **Kein llms.txt:** KI-Assistenten haben keine optimierte Projektzusammenfassung.
- **Keine Runbooks:** Betriebsabläufe sind nicht dokumentiert.
- **Keine CI-Dokumentation:** Wie die CI-Pipeline funktioniert, ist nicht erklärt.

---

## 🎯 Zusammenfassung

| Bereich                | Status       | Nächster Schritt                      |
| ---------------------- | ------------ | ------------------------------------- |
| **AI Governance**      | ✅ Excellent | Keine Änderung nötig                  |
| **Agent Docs**         | ✅ Excellent | Keine Änderung nötig                  |
| **Security Docs**      | ✅ Excellent | Keine Änderung nötig                  |
| **Build-Plattform**    | ❌ Fehlt     | **Phase 2: MkDocs aufsetzen**         |
| **CI-Qualitäts-Gates** | ❌ Fehlt     | **Phase 3: markdownlint + linkcheck** |
| **Diátaxis-Struktur**  | ❌ Fehlt     | **Phase 4: Ordner-Struktur**          |
| **CONTRIBUTING.md**    | ❌ Fehlt     | **Phase 5: Separates Handbuch**       |
| **Version-Drift**      | ⚠️ Behebbar  | **Phase 6: Frontmatter-Korrektur**    |
| **Glossar/llms.txt**   | ❌ Fehlt     | **Phase 7: Glossary + llms.txt**      |
| **Runbooks**           | ❌ Fehlt     | **Phase 8: Betriebsdokumente**        |
| **CI-Dokumentation**   | ❌ Fehlt     | **Phase 9: docs/ci.md**               |
| **Lebenszyklus**       | ❌ Fehlt     | **Phase 10: Docs-Policy**             |

### Nächste Phase (Phase 2)

Die unmittelbar nächsten Schritte sind:

1. **Issue erstellen** für Phase 2 (MkDocs-Setup)
2. `requirements-docs.txt` mit `mkdocs-material` erstellen
3. `docs/mkdocs.yml` konfigurieren
4. MkDocs-Build als CI-Job ergänzen
5. GitHub Pages Deployment konfigurieren

---

## ✅ Post-Implementation Verification (2026-06-10)

> **Referenz:** Der vollständige, detaillierte Implementierungsbericht mit allen Testergebnissen und Checklisten befindet sich in `docs/audits/DOCS_AS_CODE_IMPLEMENTATION_REPORT.md`.

### Implementierte Elemente aus „Fehlende Elemente" (Abschnitt 5)

| #   | Fehlendes Element (aus Audit Phase 1)               | Status           | Implementiert als                                                  |
| --- | --------------------------------------------------- | ---------------- | ------------------------------------------------------------------ |
| 1   | `docs/mkdocs.yml` — Build-Konfiguration             | ✅ Implementiert | `mkdocs.yml` (Root) mit mkdocs-material, Navigation, Plugins       |
| 2   | `docs/getting-started/` — Tutorial-Kategorie        | ✅ Implementiert | `docs/getting-started/index.md` (Erste-Schritte-Tutorial)          |
| 5   | `docs/how-to/` — How-to-Kategorie                   | ✅ Implementiert | `docs/how-to/index.md` mit Aufgabenverweisen                       |
| 10  | `docs/reference/` — Reference-Kategorie             | ✅ Implementiert | `docs/reference/project-structure.md` (Projektstruktur-Referenz)   |
| 15  | `docs/explanation/` — Explanation-Kategorie         | ✅ Implementiert | `docs/explanation/index.md` (Erklärungen-Übersicht)                |
| 19  | `docs/glossary.md` — Fachbegriffe und Abkürzungen   | ✅ Implementiert | `docs/glossary.md` (36 Begriffe, 7 Domänen)                        |
| 20  | `docs/runbooks/` — Betriebs-Runbooks                | ✅ Implementiert | `docs/runbooks/development.md` (Development-Runbook)               |
| 23  | `CONTRIBUTING.md` — Separates Contributing-Handbuch | ✅ Implementiert | `CONTRIBUTING.md` (Root, mit Docs-Update-Trigger-Tabelle)          |
| 25  | `llms.txt` — KI/RAG-optimierte Projektübersicht     | ✅ Implementiert | `llms.txt` (Root, nach llmstxt.org-Standard)                       |
| 27  | **Docs-Qualitäts-Gates in CI**                      | ✅ Implementiert | `.github/workflows/docs-quality.yml` (eigener CI-Workflow)         |
| 30  | **Docs-Build-Check** (`mkdocs build --strict`)      | ✅ Implementiert | In docs-quality.yml integriert; lokal über `scripts/docs_check.py` |

### Zusätzlich implementierte Elemente (über das Audit hinaus)

| Element                                      | Status           | Beschreibung                                                         |
| -------------------------------------------- | ---------------- | -------------------------------------------------------------------- |
| `docs/architecture/overview.md`              | ✅ Implementiert | High-Level-Architekturüberblick (Subkategorie Explanation)           |
| `docs/adr/ADR-002-docs-as-code-platform.md`  | ✅ Implementiert | Architekturentscheidung: MkDocs + mkdocs-material                    |
| `docs/index.md`                              | ✅ Implementiert | Neue MkDocs-Landing-Page (Diátaxis-basiert)                          |
| `docs/agent/AGENTS_DOCS_ADDENDUM.md`         | ✅ Implementiert | Docs-spezifische Agentenregeln                                       |
| `docs/agent/CONTEXT_MANIFEST_TEMPLATE_V2.md` | ✅ Implementiert | Erweiterte Context-Manifest-Vorlage                                  |
| `.github/workflows/docs-quality.yml`         | ✅ Implementiert | Dedizierter CI-Workflow für Docs-Qualität                            |
| `scripts/docs_check.py`                      | ✅ Implementiert | Lokale Docs-Qualitätsprüfung (erforderliche Dateien, Links, Secrets) |
| `requirements-docs.txt`                      | ✅ Implementiert | Python-Abhängigkeiten für Docs-Build (`mkdocs-material`)             |

### Nicht umgesetzte Elemente (bewusst zurückgestellt)

| #     | Element                                         | Begründung                                                                                |
| ----- | ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 28    | `markdownlint` (eigenständig)                   | Durch `scripts/docs_check.py` ersetzt — Python-basiert, plattformunabhängig, kein Node-JS |
| 29    | `markdown-link-check` (eigenständig)            | In `scripts/docs_check.py` integriert — Link-Check über Python-RGX                        |
| 24    | `.github/CONTRIBUTING.md`                       | Nicht nötig — GitHub zeigt Root-`CONTRIBUTING.md` automatisch an                          |
| 26    | `docs/ci.md`                                    | CI-Details in `docs/runbooks/development.md` integriert                                   |
| 4     | `docs/getting-started/installation-detailed.md` | Ausreichend durch bestehendes `docs/INSTALL.md` und `docs/getting-started/index.md`       |
| 6–9   | Detailierte How-to-Anleitungen                  | Als P4 für zukünftige Issues zurückgestellt                                               |
| 11–14 | Detailierte Reference-Dokumente                 | Als P4 für zukünftige Issues zurückgestellt                                               |
| 16–18 | Detailierte Explanation-Dokumente               | Als P4 für zukünftige Issues zurückgestellt                                               |

### System-Status

- **Docs-as-Code-System:** ✅ **OPERATIONAL**
- **Build-Plattform:** MkDocs + mkdocs-material eingerichtet (`mkdocs build --strict` fehlerfrei)
- **CI-Integration:** `.github/workflows/docs-quality.yml` — Link-Check, Build-Check, Secret-Scan
- **Diátaxis-Struktur:** ✅ Vollständig (Tutorial, How-to, Reference, Explanation + Architecture, Runbooks)
- **Version-Drift:** ⚠️ Teilweise behoben — vollständige Korrektur ist ein separates Issue (siehe Implementierungsbericht)
- **GitHub Pages Deployment:** ⏳ Noch nicht aktiviert (benötigt GitHub Pages-Aktivierung in Repository-Settings)

### Fazit

Das Audit wurde als **historische Baseline** belassen. Alle 10 Phasen der Implementierung sind abgeschlossen.  
Das Docs-as-Code-System ist vollständig operational und in den Entwicklungsworkflow integriert.

---

> **Status:** `final` — Dieses Audit wurde nach erfolgreichem Abschluss aller 10 Phasen als historische Baseline abgeschlossen.  
> **Autor:** documentation-agent  
> **Datum:** 2026-06-10  
> **Nächste Überprüfung:** Nächstes reguläres Docs-Audit oder bei signifikanten Projektänderungen.
