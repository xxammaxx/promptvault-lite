# Context Manifest — Blueprint-Erkennung (#49)

> **Issue:** #49
> **Session:** 2026-06-08
> **Agent:** issue-orchestrator

---

## Issue Understanding

Der Benutzer möchte, dass PromptVault Lite neben Prompts auch Blueprints (`.md`-Dateien mit Software-Beschreibungen) aus einem separaten Analyse-Ordner erkennt. Blueprints erhalten einen eigenen Tab in der UI mit eigenem Explorer, Detailansicht und Analyse-Panel.

## Decision Log

| #   | Decision                                     | Rationale                                         |
| --- | -------------------------------------------- | ------------------------------------------------- |
| D1  | Blueprint-Scanner als eigenständige Funktion | Keine vorzeitige Abstraktion gemäß Speckit-Plan   |
| D2  | Separater Zustand-Store (blueprintStore)     | Klare Trennung von Prompt- und Blueprint-Concerns |
| D3  | PromptHygiene für Blueprints wiederverwenden | Hygiene-Analyse ist inhalts-agnostisch            |
| D4  | activeTab-State im appStore                  | Minimal-invasive Integration; kein Router nötig   |
| D5  | Blueprint-spezifische Frontmatter-Felder     | system_name, components als optional              |

## Risk Assessment

| Risk                      | Level     | Mitigation                                            |
| ------------------------- | --------- | ----------------------------------------------------- |
| Code-Duplizierung Scanner | Low       | Im Plan dokumentiert, Refactoring als Folge-Issue     |
| Type-Mismatch Rust/TS     | Addressed | BlueprintAnalysisReport nutzt PromptHygiene           |
| UI-Regression             | None      | Alle 118 Tests passen, kein bestehender Code geändert |

## Completed Tasks (10/10)

T-001 bis T-010 alle abgeschlossen.
