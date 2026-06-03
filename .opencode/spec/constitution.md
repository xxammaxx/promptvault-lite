# PromptVault Lite — Constitution

## Projekt-Identität

PromptVault Lite ist ein lokales, datenschutzfreundliches Desktop-Tool zum Management und zur Qualitätsanalyse von Prompt-Sammlungen. Alle Daten bleiben auf dem Gerät des Nutzers.

## Non-Negotiable Principles

### 1. Lokal & Datenschutzfreundlich
- Keine Netzwerkaufrufe für Kernfunktionen
- Keine Telemetrie ohne expliziten Opt-in
- Alle Analysen laufen lokal
- SQLite / JSON-Cache als einzige Datenhaltung

### 2. Spec-Driven Development
- Keine Implementierung ohne formale Spezifikation
- Jede Feature-Entwicklung folgt dem Speckit-Workflow
- GitHub Issues sind die einzige Source of Truth für Tasks

### 3. Test-First (wo sinnvoll)
- Unit Tests für Analyse-Engine (Rust)
- Integration Tests für Scanner und Parser
- UI Component Tests (React Testing Library)
- Kein Commit ohne grüne Tests

### 4. Cross-Platform
- Linux (primär), Windows, macOS
- Tauri als Desktop-Framework garantiert native Integration
- Keine plattformspezifischen Workarounds ohne Abstraktion

### 5. Keine Platzhalter im MVP
- Keine Mock-Daten, keine TODO-Kommentare, keine ungenutzten Dateien
- Jeder implementierte Code muss funktional sein
- Dokumentation muss vollständig sein

### 6. Audit-Trail
- Jede agentengesteuerte Änderung wird in `.opencode/logs/` protokolliert
- Entscheidungen sind durch Evidence-Referenzen nachvollziehbar

## Technische Prinzipien

### Architektur
- Klare Trennung: Backend (Rust/Tauri) ↔ Frontend (React/TypeScript)
- Tauri Commands als API-Schicht zwischen Front- und Backend
- Analyse-Engine in reinem Rust (keine JS-Analyse)
- File-Scanner mit Watch-Mode für Live-Updates

### Qualität
- Rust: `cargo clippy` und `cargo fmt` als Pre-Commit-Hooks
- TypeScript: ESLint + Prettier
- Keine `any`-Typen im TypeScript-Code
- Fehlerbehandlung mit Result/Option in Rust, discriminated unions in TS

### Performance
- Lazy Loading für große Prompt-Sammlungen (10.000+)
- SQLite mit Indexen für schnelle Suche
- Kein UI-Freezing durch async Tauri Commands
- Caching von Analyse-Ergebnissen

## Verboten
- Netzwerkaufrufe in der Analyse-Engine
- Hartcodierte Projektnamen in der Artefakterkennung
- Synchrones Datei-I/O im UI-Thread
- Ungeprüfte Secrets im Code
