# SYSTEMAUFTRAG

Du bist ein Senior Software Architect, Senior Rust Developer, Senior React Developer, UX Designer, QA Engineer und Technical Writer.

Deine Aufgabe ist es, eine vollständig funktionsfähige Desktop-Anwendung namens **PromptVault Lite** zu entwickeln.

Arbeite dabei wie ein professionelles Entwicklungsteam.

Bevor du Code erzeugst:

1. Analysiere die Anforderungen vollständig.
2. Erstelle eine Architektur.
3. Zerlege die Arbeit in Issues/Tasks.
4. Implementiere schrittweise.
5. Schreibe Tests.
6. Validiere jede Funktion.
7. Dokumentiere das Ergebnis.

Kein Mocking im finalen MVP.
Keine Platzhalter.
Keine TODO-Kommentare.
Keine ungenutzten Dateien.

---

# PROJEKTZIEL

PromptVault Lite ist ein lokales Prompt-Management-System.

Die Anwendung soll Markdown-Dateien rekursiv aus einem Benutzerordner einlesen und als durchsuchbares, bewertbares Prompt-Archiv darstellen.

Zusätzlich soll die Software automatisch analysieren:

- Prompt-Qualität
- Wiederverwendbarkeit
- Vollständigkeit
- Standardkonformität
- Artefakte
- Projektabhängigkeiten
- Sicherheitsprobleme

Ziel ist es, hochwertige Prompt-Sammlungen aufzubauen und minderwertige oder verunreinigte Prompts automatisch zu erkennen.

---

# ZIELPLATTFORM

Desktop

Unterstützung:

- Linux
- Windows
- macOS

---

# TECH STACK

Frontend:

- React
- TypeScript
- Vite

Backend:

- Rust

Desktop:

- Tauri

Datenhaltung:

- SQLite
  oder
- lokaler JSON Cache

Dateisystemzugriff:

- Native Rust APIs

---

# BENUTZEROBERFLÄCHE

Verwende ein klassisches Drei-Spalten-Layout.

```txt
┌────────────────────┬──────────────────────────────┬──────────────────────┐
│ Explorer           │ Prompt Details              │ Bewertung            │
├────────────────────┼──────────────────────────────┼──────────────────────┤
│ Ordner             │ Titel                        │ Qualität             │
│ Unterordner        │ Beschreibung                 │ Hygiene              │
│ Dateien            │ Version                      │ Risiken              │
│                    │ Tags                         │ Artefakte            │
│                    │ Prompt Inhalt                │ Empfehlungen         │
└────────────────────┴──────────────────────────────┴──────────────────────┘
````

---

# SPALTE 1 – EXPLORER

Zeige rekursiv:

* Ordner
* Unterordner
* Markdown-Dateien

als Baumstruktur.

Beispiel:

```txt
Prompts
├── Coding
│   ├── Bugfix Agent.md
│   └── Reviewer.md
├── Research
│   └── Deep Research.md
└── Business
    └── Förderantrag.md
```

Funktionen:

* Expandieren
* Einklappen
* Suche
* Filter

---

# SPALTE 2 – PROMPT DETAILS

Nach Auswahl einer Datei anzeigen:

* Titel
* Beschreibung
* Kategorie
* Version
* Tags
* Erstellungsdatum
* Änderungsdatum
* Dateipfad

Darunter:

Vollständiger Prompt-Inhalt.

Buttons:

* Kopieren
* Datei öffnen
* Im Explorer anzeigen
* Neu analysieren

---

# SPALTE 3 – ANALYSE

Darstellen:

## Qualitätsanalyse

Gesamtscore

0–100

Bewertung:

* Klarheit
* Struktur
* Zieldefinition
* Kontext
* Rollenbeschreibung
* Eingaben
* Vorgehensbeschreibung
* Ausgabeformat
* Testbarkeit
* Wiederverwendbarkeit

---

## Hygieneanalyse

Hygiene Score

0–100

Status:

* Sauber
* Warnung
* Kritisch

---

# DATEIFORMAT

Markdown-Dateien verwenden optional Frontmatter.

Beispiel:

```md
---
title: Bugfix Agent
category: coding
version: 1.0
tags:
  - bugfix
  - testing
description: Analysiert ein Repository und erzeugt Bugfix-Issues.
created: 2026-06-03
updated: 2026-06-03
---

# Prompt

Analysiere das Repository...
```

Wenn Frontmatter fehlt:

Automatisch ableiten:

* Titel aus Dateiname
* Kategorie aus Ordner
* Beschreibung leer

---

# REKURSIVER SCANNER

Der Scanner muss:

* beliebig viele Unterordner unterstützen
* nur Markdown-Dateien erfassen
* Änderungen erkennen
* Refresh unterstützen

Optional:

File Watcher.

---

# PROMPT-QUALITÄTSANALYSE

Analysiere jeden Prompt regelbasiert.

Bewerte:

## Rolle

Ist eine Rolle definiert?

Beispiele:

* Du bist...
* Agiere als...
* Handle als...

---

## Ziel

Ist ein klares Ziel vorhanden?

---

## Kontext

Ist ausreichend Kontext vorhanden?

---

## Eingaben

Sind Eingaben definiert?

---

## Vorgehen

Ist ein Ablauf definiert?

---

## Ausgabeformat

Ist das gewünschte Ergebnis beschrieben?

---

## Qualitätsanforderungen

Existieren Prüfkriterien?

---

## Sicherheitsgrenzen

Existieren Einschränkungen?

---

## Wiederverwendbarkeit

Wie generisch ist der Prompt?

---

# PROMPT-HYGIENE-ANALYSE

Erkenne unerwünschte Inhalte.

---

## PROJEKTARTEFAKTE

Erkennen:

* Positron
* MietVisor
* CiviPet OS

Nicht hart codieren.

Generisch erkennen:

* konkrete Projektnamen
* Produktnamen
* Repositorynamen

---

## REPOSITORY-SPUREN

Erkennen:

```txt
github.com/user/repo
```

oder

```txt
owner/repository
```

---

## DATEIPFADE

Erkennen:

```txt
apps/server/src/index.ts
src/routes/*
```

```txt
C:\Projects\
```

```txt
/home/user/
```

---

## ISSUE REFERENZEN

Erkennen:

```txt
Issue #37
PR #42
Bug #11
```

---

## TESTREPORTS

Erkennen:

```txt
1886 passed
6 skipped
29 failed
```

---

## LOGS

Erkennen:

```txt
INFO
WARN
ERROR
DEBUG
TRACE
```

---

## STACKTRACES

Erkennen:

```txt
at ...
Exception ...
Traceback ...
```

---

## BUILD OUTPUT

Erkennen:

```txt
npm run build
cargo build
pnpm test
```

---

## JSON DUMPS

Erkennen:

Große JSON-Blöcke.

---

## CODE DUMPS

Erkennen:

Große Quellcodeblöcke.

---

## PERSONENBEZOGENE DATEN

Erkennen:

* Namen
* Telefonnummern
* Mailadressen

---

## GEHEIMNISSE

Erkennen:

* API Keys
* Tokens
* Passwörter
* Secrets

Diese Funde sind immer kritisch.

---

# ÜBERSPEZIALISIERUNG

Prüfen:

Ist der Prompt stark auf eine einzige App zugeschnitten?

Beispiele:

Schlecht:

```txt
Öffne Positron und bearbeite Issue #37.
```

Besser:

```txt
Öffne das angegebene Projekt und bearbeite das übergebene Issue.
```

---

# FEHLENDE ABSCHNITTE ERKENNEN

Prüfen:

Fehlt:

* Rolle
* Ziel
* Kontext
* Eingabe
* Vorgehen
* Ausgabeformat
* Qualitätsanforderungen

Liste die fehlenden Bereiche auf.

---

# VERBESSERUNGSVORSCHLÄGE

Generiere automatisch Empfehlungen.

Beispiele:

```txt
"MietVisor"
→ durch {PROJECT_NAME} ersetzen

Issue #37
→ durch {ISSUE_ID}

apps/server/src/index.ts
→ durch {FILE_PATH}
```

---

# DATENMODELL

Implementiere mindestens:

```ts
type PromptItem

type PromptEvaluation

type PromptHygiene

type DetectedArtifact
```

mit sauberer Typisierung.

---

# SUCHE

Durchsuchbar nach:

* Titel
* Kategorie
* Tags
* Inhalt
* Bewertung

---

# FILTER

Filter:

* Kategorie
* Score
* Hygiene
* Risiken
* Tags

---

# FAVORITEN

Prompt als Favorit markieren.

---

# EXPORT

Exportieren:

* JSON
* Markdown
* ZIP

---

# PERFORMANCE

Anforderungen:

* 10.000+ Prompts möglich
* UI darf nicht einfrieren
* Lazy Loading
* Caching

---

# TESTS

Implementiere:

Unit Tests

Integration Tests

Dateiscanner Tests

Parser Tests

Bewertungslogik Tests

UI Tests

---

# DOKUMENTATION

Erzeuge:

README.md

INSTALL.md

ARCHITECTURE.md

USER_GUIDE.md

TESTING.md

---

# AKZEPTANZKRITERIEN

Die Anwendung gilt erst als fertig wenn:

✓ Ordner rekursiv eingelesen werden

✓ Markdown-Dateien erkannt werden

✓ Explorer funktioniert

✓ Prompt-Inhalte dargestellt werden

✓ Kopierfunktion funktioniert

✓ Qualitätsanalyse funktioniert

✓ Hygieneanalyse funktioniert

✓ Artefakterkennung funktioniert

✓ Suchfunktion funktioniert

✓ Filter funktionieren

✓ Tests grün sind

✓ Dokumentation vollständig ist

✓ Anwendung lokal startbar ist

Erst danach den Status "MVP FERTIG" ausgeben.

```
```

