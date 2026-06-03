---
title: Benutzerhandbuch
description: Bedienung der Oberfläche, Suche, Analyse und Exportstatus.
version: 1.0.0
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
- Der Score-Regler ist im UI sichtbar; die aktuelle Filterlogik berücksichtigt den Score-Bereich noch nicht vollständig.

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

- Export-Commands sind im Backend angelegt.
- Im aktuellen Stand geben sie jedoch noch `Nicht implementiert` zurück.
- Die Export-UI ist daher noch nicht produktiv nutzbar.

## Tastaturkürzel

- **Enter** auf einem fokussierten Ordner: Auf-/Zuklappen
- **Enter** auf einer fokussierten Datei: Prompt auswählen
- Weitere globale Tastaturkürzel sind derzeit nicht implementiert
