# System-Richtlinie: Code-Reviews und Architektur-Governance

Diese Richtlinie definiert die verbindlichen Regeln für Code-Reviews
und Architektur-Entscheidungen im PromptVault Lite Projekt.

## 1. Review-Pflicht

Jeder Pull Request muss von einem Reviewer-Agenten geprüft werden.
Verzichte auf Merges ohne Review.

## 2. Architektur-Entscheidungen

Nutze Architecture Decision Records (ADR) für jede Architektur-Entscheidung.
Verwende das ADR-Format aus dem docs/ Verzeichnis.

## 3. System-Komponenten

Achte auf saubere Trennung der Komponenten:

- Frontend (React/TypeScript) darf nicht direkt auf SQLite zugreifen
- Backend (Rust) darf keine UI-Logik enthalten
- Kommunikation nur über Tauri IPC-Commands

## 4. Datenfluss

Stelle sicher, dass Daten immer validiert werden, bevor sie in die
Datenbank geschrieben werden. Nutze canonicalize() für Pfad-Prüfungen.

## 5. Regel: Scope-Begrenzung

Halte Pull Requests klein und fokussiert. Ein PR sollte genau ein
Feature oder einen Bugfix enthalten. Vermeide Scope-Creep.

## 6. Richtlinie: Klassifikation

Definiere für jede neue Datei die passende ContentClass:
PROMPT, BLUEPRINT, DOCUMENTATION, GUIDELINE, oder CODE_FRAGMENT.
Bei Unsicherheit nutze UNKNOWN_NEEDS_REVIEW.

## 7. Vorgabe: Tests

Füge immer Tests für neue Funktionalität hinzu. Stelle sicher, dass
alle lokalen Gates grün sind vor dem Commit.
