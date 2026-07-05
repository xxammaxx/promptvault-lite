---
title: Benutzerhandbuch
description: Bedienung der Oberfläche, Suche, Analyse und Exportstatus.
version: 1.7.0
---

# Benutzerhandbuch

## Prompt-Ordner öffnen

1. Starte die App.
2. Klicke auf **Ordner öffnen**.
3. Wähle einen lokalen Ordner mit Markdown-Dateien.
4. Die App scannt den Ordner rekursiv und baut den Explorer-Baum auf.

## Drei-Spalten-Layout

### Links: Explorer

- Ordner und Dateien als Baumstruktur
- Datei-Knoten zeigen optional einen Score-Badge
- Favoriten werden mit Stern markiert

### Mitte: Prompt-Details

- Titel und Beschreibung
- **Audio-Kurzbeschreibung** mit "Kurz vorlesen" Button (lokale Sprachausgabe)
- Version, Kategorie, Tags, Pfad und Datumsangaben
- Vollständiger Markdown-Inhalt
- Aktionen: Favorit, Kopieren, Datei öffnen, Analysieren

### Rechts: Analyse

- Qualitätsanalyse mit Gesamt- und Einzelwerten
- Hygieneanalyse mit Status und Artefakten
- Empfehlungen und Warnhinweise

## Suchen und Filtern

- Nutze das Suchfeld im Explorer für Textsuche.
- Filter sind für Kategorie, Hygiene-Status, Tags und Favoriten vorhanden.
- Der Score-Bereich (min–max) wird per Doppel-Slider im FilterPanel eingestellt; beide Werte werden in der Filterlogik (`appStore.filteredPrompts`) berücksichtigt.

## Analyse von Prompts

- Wähle einen Prompt im Explorer aus.
- Klicke auf **Analysieren** in der Detailansicht.
- Alternativ kann die App alle geladenen Prompts der Reihe nach analysieren.

### Qualitätsscore

- Bereich: `0–100`
- Hoher Wert = guter Aufbau, klare Zielsetzung, gute Struktur
- Die Analyse bewertet u. a. Rolle, Ziel, Kontext, Eingaben, Vorgehen, Ausgabeformat, Qualitätsanforderungen, Sicherheitsgrenzen, Klarheit und Wiederverwendbarkeit

### Hygieneanalyse

- Bereich: `0–100`
- Status:
  - `clean`
  - `warning`
  - `critical`
- Erkennt u. a. Projektartefakte, Repo-Referenzen, Dateipfade, Issue-Referenzen, Logzeilen, Stacktraces, Build-Output, JSON-/Code-Dumps, PII und Secrets

## Export

- Export-Commands sind im Backend vollständig implementiert (`export_json`, `export_markdown`, `export_zip`).
- Über den **Exportieren**-Button in der Toolbar wählst du Format (JSON/Markdown/ZIP) und optional „Nur Favoriten".
- Fortschritt wird in der Export-Dialog-Progressbar angezeigt.

## Tastaturkürzel

- **Enter** auf einem fokussierten Ordner: Auf-/Zuklappen
- **Enter** auf einer fokussierten Datei: Prompt auswählen
- Weitere globale Tastaturkürzel:
  - **Strg/Cmd + O** — Ordner öffnen
  - **Strg/Cmd + F** — Suchfeld fokussieren
  - **Strg/Cmd + Shift + A** — Alle Prompts analysieren
  - **Strg/Cmd + E** — Export-Dialog öffnen
  - **Esc** — Filter zurücksetzen / Suchfeld verlassen

## Audio-Kurzbeschreibung (lokal)

PromptVault Lite kann eine kurze deutsche Zusammenfassung des ausgewählten Prompts vorlesen.

- Die Kurzbeschreibung erscheint in der Detailansicht unterhalb der Metadaten.
- Klicke auf **"Kurz vorlesen"**, um die Sprachausgabe zu starten.
- Während der Wiedergabe erscheint ein **"Stoppen"**-Button.
- Die Sprachausgabe stoppt automatisch beim Wechsel des Prompts.

### Lokale TTS (Text-to-Speech)

Die Sprachausgabe nutzt die **Web Speech API** des Browsers und benötigt **keine Internetverbindung, keine Cloud-TTS-Dienste und keine API-Keys**.

- **Keine Cloud-Abhängigkeit:** Alle Verarbeitung erfolgt lokal.
- **Keine vollständigen Prompt-Inhalte:** Es wird nur eine kurze Zusammenfassung vorgelesen (maximal ca. 500 Zeichen).
- **Sensible Inhalte werden maskiert:** API-Keys, Tokens, E-Mail-Adressen, Pfade und Code-Blöcke werden automatisch erkannt und nicht vorgelesen.
- **Sicherheitsblockierung:** Inhalte mit kritischen Hygiene-Warnungen werden nicht vorgelesen.

### TTS-Provider unter Linux

PromptVault Lite erkennt automatisch verfügbare TTS-Provider:

1. **Web Speech API** (bevorzugt) — im Browser/WebView integriert
2. **Piper** — lokaler ONNX-basierter TTS (separate Installation erforderlich)
3. **spd-say** (Speech Dispatcher) — `sudo apt install speech-dispatcher`
4. **espeak-ng** — `sudo apt install espeak-ng`

Die Kurzbeschreibung bleibt auch ohne TTS-Provider sichtbar — nur die Audioausgabe ist dann deaktiviert.
