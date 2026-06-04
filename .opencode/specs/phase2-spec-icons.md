# Feature-Spec: Native Icons (P1)

## User Story

**Als** PromptVault-Nutzer möchte ich native App-Icons für meine Plattform sehen,
**damit** die App professionell aussieht und sich nahtlos ins Betriebssystem einfügt.

## Acceptance Criteria

### AC-1: Plattform-Icons generieren

- [ ] `.ico` für Windows mit Größen: 256x256, 48x48, 32x32, 16x16
- [ ] `.icns` für macOS (alle erforderlichen Größen: 16, 32, 64, 128, 256, 512)
- [ ] `.png` für Linux in 32x32, 128x128, 256x256
- [ ] Source: `public/vault.svg`

### AC-2: Tauri-Icon-Command

- [ ] `cargo tauri icon public/vault.svg` wird ausgeführt
- [ ] Generierte Icons landen in `src-tauri/icons/`
- [ ] Alte Platzhalter-Icons werden überschrieben

### AC-3: Bundle-Konfiguration

- [ ] `tauri.conf.json` referenziert alle generierten Icons
- [ ] `bundle.icon` enthält Pfade zu allen Größen

## Edge Cases

- `vault.svg` fehlt → Fehler mit Anleitung: "vault.svg muss in public/ existieren"
- SVG hat transparenten Hintergrund → Sollte korrekt gerendert werden (Checkerboard?)
- Verschiedene Betriebssysteme → `cargo tauri icon` generiert plattformspezifisch

## Technische Notizen

- `cargo tauri icon` ist ein Tauri-CLI-Befehl, erfordert `@tauri-apps/cli`
- Der Befehl generiert automatisch `.ico` und `.icns`
- Manuelles Nachbearbeiten falls nötig mit ImageMagick (`convert`)
- Die existierenden 3 PNGs in `icons/` werden ersetzt
