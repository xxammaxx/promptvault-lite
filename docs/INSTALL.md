---
title: Installation
description: Installationsanleitung für Linux, Windows und macOS.
version: 1.5.0-rc.1
---

# Installation

## Voraussetzungen

- Rust 1.77 oder neuer
- Node.js (LTS empfohlen)
- pnpm

## Allgemeine Schritte

```bash
pnpm install
```

Danach kannst du die App im Entwicklungsmodus starten:

```bash
pnpm start
```

Für einen Produktionsbuild:

```bash
pnpm tauri build
```

## Linux

1. Installiere Rust, Node.js und pnpm.
2. Stelle sicher, dass die nativen Build-Abhängigkeiten für deine Distribution vorhanden sind.
3. Klone das Projekt und wechsle in das Verzeichnis.
4. Führe `pnpm install` aus.
5. Starte mit `pnpm start`.

## Windows

1. Installiere Rust, Node.js und pnpm.
2. Stelle die nativen Build-Tools bereit, die Rust/Tauri auf Windows benötigt.
3. Öffne ein Terminal im Projektordner.
4. Führe `pnpm install` aus.
5. Starte mit `pnpm start`.

## macOS

1. Installiere Rust, Node.js und pnpm.
2. Stelle die Xcode-/Command-Line-Tools bereit, falls dein System sie noch nicht hat.
3. Öffne ein Terminal im Projektordner.
4. Führe `pnpm install` aus.
5. Starte mit `pnpm start`.

## Troubleshooting

- **`pnpm` oder `cargo` nicht gefunden**: Prüfe, ob die Werkzeuge im PATH sind.
- **App startet nicht**: Führe `pnpm install` erneut aus.
- **Scan findet keine Dateien**: Der Scanner verarbeitet nur `.md`-Dateien.
- **Export/Favoriten scheinen zu hängen**: Der Vorgang läuft lokal im Rust-Backend; bei großen Prompt-Mengen (>>100) kann der erste Aufruf mehrere Sekunden dauern. Status wird in der Toolbar als ⏳-Symbol angezeigt.
- **Build-Probleme auf Linux/macOS/Windows**: Prüfe die plattformspezifischen Native-Build-Voraussetzungen für Rust/Tauri.
