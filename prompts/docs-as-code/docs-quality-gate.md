---
title: "Docs Quality Gate — CI-Prüfung für Dokumentation"
description: "Fordert eine KI auf, ein Docs-Quality-Gate in die CI einzubauen. Prüft Markdown-Validität, interne Links, Frontmatter, Glossar, ADR-Status, Runbook-Rollbacks."
category: "docs-as-code"
version: "1.0.0"
tags:
  - docs-as-code
  - ci
  - quality-gate
  - markdown
  - link-check
---

# Docs Quality Gate — CI-Prüfung für Dokumentation

> **Prompt-Typ:** CI/Gate-Integration
> **Zielgruppe:** KI-Agenten, die Docs-Quality in CI einbauen
> **Pflicht:** Empfohlen für Docs-as-Code-Projekte

---

## Ziel

Erstelle ein Docs-Quality-Gate, das bei jedem PR automatisch die Dokumentationsqualität prüft. Das Gate muss als CI-Job laufen und bei Fehlern den PR blockieren (oder warnen, je nach Konfiguration).

---

## Prüfkriterien

### 1. Markdown-Validität

```bash
# Prüfe auf kaputtes Markdown
# Option A: markdownlint
markdownlint "docs/**/*.md"

# Option B: Einfacher Check (keine externe Dependency)
python scripts/docs_check.py --check-markdown
```

Prüfungen:

- [ ] Keine leeren Links `[]()`
- [ ] Keine unvollständigen Codeblöcke (öffnendes ``` ohne schließendes)
- [ ] Keine doppelten Überschriften auf gleicher Ebene
- [ ] Tabellen korrekt formatiert

### 2. Interne Links

```bash
python scripts/docs_check.py --check-links
```

Prüfungen:

- [ ] Alle relativen Links zeigen auf existierende Dateien
- [ ] Alle Anker-Links (`#heading`) haben ein Ziel
- [ ] Keine Links auf `WIP`, `TODO`, `FIXME` ohne Kontext
- [ ] Externe Links sind explizit als extern markiert

### 3. Frontmatter-Präsenz

Prüfungen:

- [ ] Jede `.md`-Datei in `docs/` hat YAML-Frontmatter (wo erforderlich)
- [ ] Pflichtfelder sind ausgefüllt: `title`
- [ ] `date`-Format ist ISO8601
- [ ] `status` ist aus erlaubter Liste (bei ADRs)

### 4. Glossar-Vollständigkeit

```bash
python scripts/docs_check.py --check-glossary
```

Prüfungen:

- [ ] Keine leeren Begriff-Felder
- [ ] Keine leeren Definitions-Felder
- [ ] Keine doppelten Einträge
- [ ] Alle referenzierten Begriffe existieren im Glossar

### 5. ADR-Status

```bash
python scripts/docs_check.py --check-adrs
```

Prüfungen:

- [ ] Jedes ADR hat einen gültigen Status (`proposed`, `accepted`, `deprecated`, `superseded`)
- [ ] Keine ADRs mit Status `proposed` die älter als 90 Tage sind (Warnung)
- [ ] `superseded` ADRs verweisen auf das ersetzende ADR

### 6. Runbook-Rollbacks

```bash
python scripts/docs_check.py --check-runbooks
```

Prüfungen:

- [ ] Jedes Runbook hat einen "Fehlerbehandlung"-Abschnitt
- [ ] Jedes Runbook hat einen "Rollback"-Hinweis
- [ ] Kritische Runbooks (Deployment, Migration) haben Backup-Hinweise

### 7. MkDocs Build (strict)

```bash
mkdocs build --strict
```

Prüfungen:

- [ ] Build erfolgreich ohne Warnings
- [ ] Keine Broken Links (MkDocs strict mode)
- [ ] Navigation (`mkdocs.yml`) konsistent mit Dateistruktur

---

## CI-Integration

### Workflow-Datei: `.github/workflows/docs-quality.yml`

```yaml
name: Docs Quality
on:
  pull_request:
    paths:
      - "docs/**"
      - "mkdocs.yml"
      - "llms.txt"
      - "README.md"
      - "AGENTS.md"
jobs:
  docs-check:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.x"
      - run: pip install -r requirements-docs.txt
      - run: python scripts/docs_check.py
      - run: mkdocs build --strict
```

### Optional: Nicht-hard-failende Checks

Manche Checks sollten warnen aber nicht blockieren:

```yaml
- name: Link Check (warn only)
  run: python scripts/docs_check.py --check-links --warn-only
  continue-on-error: true
```

---

## Docs-Check-Script (Minimalversion)

```python
#!/usr/bin/env python3
"""Docs Quality Check Script — Minimalversion."""

import sys
import os
from pathlib import Path

DOCS_DIR = Path("docs")

def check_files_exist():
    """Prüft, dass alle docs/-Verzeichnisse existieren."""
    required = [
        "docs/index.md",
        "docs/glossary.md",
        "mkdocs.yml",
    ]
    missing = [f for f in required if not Path(f).exists()]
    if missing:
        print(f"❌ Fehlende Dateien: {missing}")
        return False
    return True

def check_frontmatter():
    """Prüft, dass .md-Dateien in docs/ ein title-Feld haben."""
    errors = []
    for md_file in DOCS_DIR.rglob("*.md"):
        content = md_file.read_text(encoding="utf-8")
        if content.startswith("---"):
            if "title:" not in content[:500]:
                errors.append(f"{md_file}: Frontmatter ohne title")
    if errors:
        for e in errors:
            print(f"⚠️ {e}")
    return len(errors) == 0

def main():
    checks = [
        ("Datei-Existenz", check_files_exist),
        ("Frontmatter", check_frontmatter),
    ]

    all_passed = True
    for name, check in checks:
        print(f"Prüfe: {name}...")
        if not check():
            all_passed = False

    if all_passed:
        print("✅ Alle Docs-Checks bestanden.")
        sys.exit(0)
    else:
        print("❌ Einige Docs-Checks fehlgeschlagen.")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

---

## Harte Regeln

- CI darf NICHT wegen fehlender optionaler Tools hart scheitern
- Optionale Checks als `continue-on-error: true` markieren
- Docs-Checks dürfen den Code-Build nicht blockieren (separater Job)
- Pre-existing Docs-Fehler dokumentieren, nicht als neue Fehler werten

---

## Integration in PromptVault Lite

Dieser Prompt ist Teil des **Agentic Human Approval & Docs-as-Code Standard** Prompt-Packs.

- **Kategorie:** `docs-as-code`
- **Tags:** `docs-as-code`, `ci`, `quality-gate`, `markdown`, `link-check`
- **Optimierungsmodus:** `balanced`
