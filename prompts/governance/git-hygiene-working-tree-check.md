---
title: "Git Hygiene — Working Tree Analyse und sauberes Staging"
description: "Fordert eine KI auf, den Git Working Tree sauber zu analysieren, Dateien zu klassifizieren und nur explizit freigegebene Änderungen zu stagen. Verbot von git add ."
category: "governance"
version: "1.0.0"
tags:
  - governance
  - git-hygiene
  - staging
  - repo-hygiene
  - evidence
---

# Git Hygiene — Working Tree Analyse und sauberes Staging

> **Prompt-Typ:** Git-Workflow-Check vor jedem Commit
> **Zielgruppe:** KI-Agenten, die Git-Operationen ausführen
> **Pflicht:** Ja — vor jedem `git add`, `git commit`, `git push`

---

## Ziel

Analysiere den Git Working Tree vollständig, klassifiziere ALLE Dateien und stage NUR die explizit zur Aufgabe gehörenden Änderungen. Verhindere Blind-Staging und schütze pre-existing, unrelated und Blueprint-Dateien.

---

## Zwingende Befehle

Führe VOR jedem Staging aus:

```bash
git status --short
git diff HEAD --stat
git diff HEAD --name-only
git diff --cached --name-only
git ls-files --others --exclude-standard
```

Dokumentiere die Ausgabe jeder Zeile.

---

## Klassifikationstabelle

JEDE Datei aus `git status --short` und `git ls-files --others --exclude-standard` muss einer Kategorie zugeordnet werden:

| Präfix                  | Kategorie                 | Beschreibung                         | Stagen?              |
| ----------------------- | ------------------------- | ------------------------------------ | -------------------- |
| `M` (tracked, modified) | Eigene Änderung           | Gehört zum aktuellen Issue-Scope     | ✅ Ja                |
| `M` (tracked, modified) | Pre-existing Modification | Existierte vor dieser Session        | ❌ Nein              |
| `M` (tracked, modified) | Unrelated Change          | Gehört nicht zum Scope               | ❌ Nein              |
| `??`                    | Neue Datei (im Scope)     | Neue Datei für aktuelles Issue       | ✅ Ja                |
| `??`                    | Blueprint-Datei           | Experimentelle/geschützte Datei      | ❌ Nein              |
| `??`                    | Build-Artefakt            | `dist/`, `target/`, `site/`, `.tmp/` | ❌ Nein              |
| `??`                    | Cache-Datei               | `__pycache__/`, `*.pyc`              | ❌ Nein              |
| `??`                    | Secret Risk               | `.env`, Keys, Tokens                 | ❌ Nein              |
| `??`                    | Agent Log                 | Evidence/Log-Datei                   | ⚠️ Nur wenn im Scope |
| `??`                    | Relevant untracked        | Neue Datei, die zum Scope gehört     | ✅ Ja                |
| `D`                     | Gelöscht (im Scope)       | Geplante Löschung                    | ✅ Ja                |

---

## Staging-Regeln

### Erlaubt

```bash
# Einzelne Dateien stagen
git add prompts/governance/human-approval-check.md

# Gezielte Patterns (nur wenn Scope klar)
git add prompts/governance/*.md

# Ganze Verzeichnisse (nur wenn ALLE Dateien im Verzeichnis zum Scope gehören)
git add docs/standards/
```

### Verboten

```bash
# ❌ Niemals:
git add .                    # Blind-Staging
git add -A                   # Alles inkl. Deletions
git add *                    # Wildcard-Staging
git add --all                # Wie git add -A
git commit -a                # Staged + committed alles Tracked
```

---

## Pre-existing Änderungen schützen

Wenn `git status --short` bereits modifizierte Dateien zeigt, die NICHT von dieser Session stammen:

1. Im Diff-Bericht als `Pre-existing Modification` klassifizieren
2. NICHT stagen
3. NICHT inhaltlich bewerten oder ändern
4. Im Evidence-Log dokumentieren
5. Bei Unsicherheit: Human Approval anfordern

---

## Blueprint-Dateien schützen

Blueprint-Dateien sind experimentelle oder geschützte Dateien, die:

- Nicht zur aktuellen Aufgabe gehören
- Nicht formatiert werden dürfen
- Nicht verschoben oder gelöscht werden dürfen
- Nicht in Tests "gefixt" werden dürfen
- Nur im Evidence-Bericht als "nicht berührt" dokumentiert werden

Beweis der Unverändertheit:

```bash
# Zeige, dass Blueprint-Dateien im Diff nicht auftauchen
git diff HEAD --name-only | grep -E "blueprint|Blueprint" || echo "Keine Blueprint-Änderungen"
```

---

## Build-Artefakte erkennen

Folgende Patterns sind Build-Artefakte und dürfen NIEMALS gestaged werden:

```text
dist/
target/
site/
.tmp/
node_modules/
build/
coverage/
*.pyc
__pycache__/
*.db
*.db-shm
*.db-wal
*.zip
```

Prüfung:

```bash
git ls-files --others --exclude-standard | grep -E "(dist/|target/|site/|\.tmp/|__pycache__|\.pyc$|\.db$)" || echo "Keine Build-Artefakte"
```

---

## Secrets ausschließen

Prüfe VOR jedem Staging auf Secrets:

```bash
# Suche nach Secret-Patterns in allen Änderungen
git diff HEAD | grep -iE "(api_key|apikey|secret|password|token|-----BEGIN.*PRIVATE KEY-----)" || echo "Keine Secrets gefunden"
```

Falls Secrets gefunden werden:

- NICHT stagen
- NICHT committen
- Human Approval anfordern
- `.gitignore` prüfen

---

## Nach dem Staging

```bash
# Verifiziere, dass NUR die gewünschten Dateien gestaged wurden
git diff --cached --name-only

# Verifiziere, dass KEINE verbotenen Dateien gestaged wurden
git diff --cached --name-only | grep -E "(\.env$|\.db$|secret|password)" || echo "Sauber"
```

---

## Ausgabeformat

```text
## Git Hygiene Report

### 1. Working Tree Übersicht
[Ausgabe git status --short]

### 2. Diff-Stat
[Ausgabe git diff HEAD --stat]

### 3. Klassifikation
| Datei | Kategorie | Stagen? | Begründung |
|-------|-----------|---------|------------|
| prompts/governance/human-approval-check.md | Neue Datei (im Scope) | ✅ Ja | Prompt-Pack |
| src/stores/blueprintStore.ts | Blueprint | ❌ Nein | Geschützt |

### 4. Gestaged (nach git add)
[Ausgabe git diff --cached --name-only]

### 5. Verbotene Dateien (geprüft)
- Secrets: [Keine / Gefunden]
- Build-Artefakte: [Keine / Gefunden]
- Blueprint-Änderungen: [Keine / Gefunden]

### 6. Sicherheits-Check
- [Bestanden / Fehlgeschlagen]
```

---

## Harte Verbote

- ❌ `git add .`
- ❌ `git add -A`
- ❌ `git commit -a`
- ❌ Pre-existing Änderungen stagen
- ❌ Blueprint-Dateien stagen
- ❌ Secrets committen
- ❌ Build-Artefakte committen
- ❌ Unrelated Änderungen stagen

---

## Integration in PromptVault Lite

Dieser Prompt ist Teil des **Agentic Human Approval & Docs-as-Code Standard** Prompt-Packs.

- **Kategorie:** `governance`
- **Tags:** `governance`, `git-hygiene`, `staging`, `repo-hygiene`, `evidence`
- **Optimierungsmodus:** `conservative` (enthält harte Verbote, die nicht entfernt werden dürfen)
