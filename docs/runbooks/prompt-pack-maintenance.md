---
title: "Prompt-Pack-Wartung — Runbook"
description: "Runbook für die Wartung und Erweiterung von Prompt-Packs in PromptVault Lite."
category: "governance"
version: "1.0.0"
tags:
  - governance
  - runbook
  - maintenance
  - prompt-pack
---

# Prompt-Pack-Wartung — Runbook

> **Klassifikation:** Intern · **Version:** 1.0.0

## Ziel

Prompt-Packs in PromptVault Lite erstellen, aktualisieren und warten.

## Voraussetzungen

- Schreibzugriff auf das Repository
- Verständnis der PromptVault-Lite-Frontmatter-Struktur
- Kenntnis der Artefakt-Kategorien

## Schritte

### 1. Neues Prompt-Pack erstellen

1. Wähle die passende Kategorie: `governance`, `docs-as-code`, `evidence`, `prompt-quality`
2. Erstelle `.md`-Datei im entsprechenden `prompts/<kategorie>/`-Verzeichnis
3. Füge YAML-Frontmatter hinzu:

```yaml
---
title: "Titel des Prompts"
description: "Kurzbeschreibung"
category: "governance"
version: "1.0.0"
tags:
  - tag1
  - tag2
---
```

4. Schreibe den Prompt-Inhalt mit:
   - Klarem Ziel
   - Definiertem Scope
   - Ausgabeformat
   - Harten Verboten (falls zutreffend)
5. Verlinke verwandte Prompts
6. Füge eine "Integration in PromptVault Lite"-Sektion hinzu

### 2. Prompt-Pack aktualisieren

1. Version im Frontmatter inkrementieren
2. Änderungen im Prompt dokumentieren (Changelog)
3. Keine bestehenden Kategorien ohne Migration ändern
4. Keine harten Constraints ohne Begründung entfernen

### 3. Prompt-Pack testen

1. Stelle sicher, dass der Prompt von PromptVault Lite gescannt wird
2. Prüfe, dass Kategorie und Tags korrekt erkannt werden
3. Prüfe, dass der Copy-Button den vollständigen Prompt kopiert
4. Prüfe, dass die Hygiene-Engine keine False-Positives meldet (Evidence-Blöcke sollten als `EVIDENCE_BLOCK` markiert sein)

### 4. Prompt-Pack dokumentieren

1. Ergänze Referenz in `docs/standards/`
2. Aktualisiere `docs/reference/project-structure.md` mit neuen Dateien
3. Aktualisiere `docs/CHANGELOG.md`

## Fehlerbehandlung

| Problem                        | Lösung                                            |
| ------------------------------ | ------------------------------------------------- |
| Prompt wird nicht gescannt     | Prüfe `.md`-Endung und gültiges YAML-Frontmatter  |
| Kategorie erscheint nicht      | Frontmatter `category`-Feld prüfen                |
| Hygiene meldet False-Positives | Evidence-Blöcke mit `<!-- EVIDENCE -->` markieren |
| Copy-Button kopiert nur Teile  | Prompt-Länge prüfen (keine technische Begrenzung) |

## Rollback

Prompt-Packs sind einfache `.md`-Dateien. Rollback:

```bash
# Einzelnes Prompt-Pack zurücksetzen
git checkout HEAD~1 -- prompts/governance/human-approval-check.md

# Alle Prompt-Packs zurücksetzen
git checkout HEAD~1 -- prompts/
```
