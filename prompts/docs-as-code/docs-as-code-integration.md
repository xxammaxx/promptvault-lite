---
title: "Docs-as-Code Integration — Standard-Einbau in bestehende Projekte"
description: "Fordert eine KI auf, Docs-as-Code in ein bestehendes Projekt einzubauen. Enthält MkDocs-Setup, Diátaxis-Struktur, ADRs, Glossar, Runbooks, Docs-CI, Changelog."
category: "docs-as-code"
version: "1.0.0"
tags:
  - docs-as-code
  - mkdocs
  - diataxis
  - adr
  - ci
  - documentation
---

# Docs-as-Code Integration — Standard-Einbau in bestehende Projekte

> **Prompt-Typ:** Projekt-Setup / Docs-Integration
> **Zielgruppe:** KI-Agenten, die Docs-as-Code in ein Projekt einbauen
> **Pflicht:** Nein (Tool-Vorschlag, kein Merge-Gate)

---

## Ziel

Baue Docs-as-Code in ein bestehendes Projekt ein. Das Ergebnis muss:

- Alle Dokumentation versionierbar im Repository liegen
- Über MkDocs (oder Alternative) als statische Site baubar sein
- Der Diátaxis-Struktur folgen
- ADRs für Architekturentscheidungen unterstützen
- Ein Glossar enthalten
- Runbooks für operative Abläufe bereitstellen
- CI-geprüft sein (Docs-Quality-Gate)
- Keine bestehenden App-Dateien überschreiben

---

## Vorgehen

### 1. Ist-Stand analysieren

```bash
# Bestehende Dokumentation finden
git ls-files | grep -E "\.md$|\.rst$|\.adoc$"

# Bestehende Docs-Tools prüfen
ls mkdocs.yml sphinx/conf.py docs/ 2>/dev/null
```

Dokumentiere:

- Welche Docs existieren bereits?
- Welches Tool wird verwendet?
- Welche Struktur existiert?
- Welche Lücken gibt es?

### 2. Docs-Tool wählen

| Tool           | Geeignet für                  | Vorteile                              |
| -------------- | ----------------------------- | ------------------------------------- |
| **MkDocs**     | Python-Projekte, DevOps, APIs | Einfach, Material-Theme, PlantUML     |
| **Docusaurus** | React-Projekte, JS/TS         | React-Komponenten in Docs, Versioning |
| **VitePress**  | Vite-Projekte                 | Leichtgewichtig, Vue-basiert          |
| **Sphinx**     | Python-Bibliotheken           | API-Doc-Generierung, Intersphinx      |
| **mdBook**     | Rust-Projekte                 | Rust-nativ, einfach                   |

Empfehlung: **MkDocs mit Material-Theme** für die meisten Projekte.

### 3. docs/-Struktur nach Diátaxis

```
docs/
  index.md                    # Landing Page
  getting-started/            # Tutorials (anleitend, einstiegsfreundlich)
    index.md
  how-to/                     # How-to Guides (problemlösend, praktisch)
    index.md
  explanation/                # Explanation (hintergründig, konzeptionell)
    index.md
  reference/                  # Reference (technisch, beschreibend)
    project-structure.md
    api.md (falls zutreffend)
  architecture/               # Architektur-Übersicht
    overview.md
  adr/                        # Architecture Decision Records
    ADR-001-template.md
  glossary.md                 # Fachbegriffe
  runbooks/                   # Operative Abläufe
    development.md
    deployment.md (falls zutreffend)
  CHANGELOG.md                # Versionshistorie
```

### 4. ADRs ergänzen

Jedes ADR folgt diesem Template:

```markdown
# ADR-XXX: Kurztitel

**Status:** proposed | accepted | deprecated | superseded
**Datum:** YYYY-MM-DD
**Entscheider:** [Name/Rolle]
**Betrifft:** [Modul/System]

## Kontext

[Warum brauchen wir diese Entscheidung?]

## Entscheidung

[Was haben wir entschieden?]

## Alternativen

[Welche Alternativen wurden evaluiert?]

| Alternative | Pro | Contra |
| ----------- | --- | ------ |
| A           | ... | ...    |
| B           | ... | ...    |

## Konsequenzen

[Was sind die Folgen? Positiv und negativ.]

## Referenzen

- [Issue #XXX](link)
- [Diskussion](link)
```

### 5. Glossar ergänzen

Minimalstruktur:

```markdown
# Glossar

| Begriff | Definition                         | Verwendung         | Siehe auch         |
| ------- | ---------------------------------- | ------------------ | ------------------ |
| Prompt  | Instruktionstext für ein KI-Modell | Prompt-Engineering | Prompt-Optimierung |
```

### 6. Runbooks ergänzen

Jedes Runbook folgt diesem Aufbau:

- **Ziel:** Was wird erreicht?
- **Voraussetzungen:** Was wird benötigt?
- **Schritte:** Nummerierte Anleitung
- **Fehlerbehandlung:** Was tun bei Problemen?
- **Rollback:** Wie rückgängig machen?

### 7. llms.txt — KI/RAG-Übersicht

`llms.txt` im Projekt-Root ist eine **handkuratierte** Projektübersicht für KI-Assistenten und RAG-Systeme. Sie wird NICHT automatisch generiert.

```markdown
# Projektname — KI-Übersicht

> Kuratierte Projektübersicht für KI-Assistenten und RAG-Systeme.

## Projekt

- **Name:** [Name]
- **Stack:** [Technologien]
- **Repository:** [URL]
- **Lizenz:** [Lizenz]

## Architektur (komprimiert)

[Wesentliche Architektur-Informationen]

## Wichtige Dateien

- `src/` — Quellcode
- `docs/` — Dokumentation
- `AGENTS.md` — Agentenregeln

## Konventionen

- Commits: [Conventional Commits]
- Code Style: [ESLint, Prettier, etc.]
```

### 8. Docs-Check-Script

Erstelle ein Script `scripts/docs_check.py`, das prüft:

- [ ] Alle internen Links sind gültig
- [ ] Alle Docs-Dateien haben Frontmatter (wo nötig)
- [ ] Glossar-Einträge haben keine leeren Felder
- [ ] ADRs haben Status
- [ ] Runbooks haben Rollback-Hinweise
- [ ] Keine Broken Links in `mkdocs build --strict`

### 9. Docs-CI

Ergänze `.github/workflows/docs-quality.yml`:

```yaml
name: Docs Quality
on:
  pull_request:
    paths: ["docs/**", "mkdocs.yml"]
jobs:
  docs-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.x"
      - run: pip install -r requirements-docs.txt
      - run: python scripts/docs_check.py
      - run: mkdocs build --strict
```

### 10. Changelog aktualisieren

Ergänze `docs/CHANGELOG.md` mit neuem Eintrag:

```markdown
## [Version] — YYYY-MM-DD

### Added

- Docs-as-Code-Struktur mit MkDocs
- Diátaxis-Dokumentationsstruktur
- ADR-XXX: [Titel]
- Glossar
- Runbooks
- Docs-CI
- llms.txt

### Changed

- [Geänderte Docs]
```

---

## Schutzregeln

- ❌ Keine App-Blueprint-Dateien anfassen
- ❌ Keine bestehenden Docs ohne Grund umstrukturieren
- ❌ Keine automatisch generierten Docs ohne Human-Review
- ❌ `llms.txt` nicht automatisch generieren — handkuratieren
- ❌ Keine Docs für unfertige Features erstellen

---

## Integration in PromptVault Lite

Dieser Prompt ist Teil des **Agentic Human Approval & Docs-as-Code Standard** Prompt-Packs.

- **Kategorie:** `docs-as-code`
- **Tags:** `docs-as-code`, `mkdocs`, `diataxis`, `adr`, `ci`, `documentation`
- **Optimierungsmodus:** `balanced`
