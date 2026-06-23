<!--
  ARCHIVE — historical, not current project guidance.
  Archived: 2026-06-23 via Issue #165.
  Reason: Document found safe (no secrets, no private paths, no stale claims)
  but had consistency gaps with the authoritative AGENTS.md:
    - Local-CI-First policy missing
    - Human Approval Gate incomplete vs AGENTS.md §7
    - Evidence Format diverges (STDOUT/STDERR merged)
    - Source of Truth ordering differs
    - Workflow lacks "Local" CI qualifier
  Now superseded by AGENTS.md as the single source of truth for agent rules.
  Preserved for historical traceability of the project's agent-prompt design work.
-->

# Canonical Prompt Standard — Agent Run Prompts

> Wiederverwendbarer Standard fuer alle zukuenftigen Agenten-/Projekt-Prompts.
> OpenCode-spezifisch ausgerichtet. Projektunabhaengig formuliert.

**Version:** 1.0.0
**Last updated:** 2026-06-19
**Validated with:** OpenCode 1.15.0, Windows 10, PowerShell 5.1

---

## 1. Kontextfenster-Empfehlung

Starte jeden groesseren Agentenlauf in einem **frischen/leeren Kontextfenster**.

Behandle alle Informationen aus:

- ChatGPT-Memory
- alten Projektchats
- frueheren Agent-Reports
- manuell kopierten Projektstaenden

ausdruecklich als **potenziell veraltet** (`STALE_SOURCE`).

Der aktuelle Projektzustand darf nur durch echte Evidence im aktuellen Lauf bestaetigt werden.

---

## 2. Ziel-Agent: OpenCode

Der Standard-Agent fuer alle Runs ist **OpenCode**.

OpenCode-spezifische Regeln:

- Pruefe zuerst Version, Arbeitsverzeichnis, Modell-/Agent-Kontext
- Erfinde keine OpenCode-Kommandos
- Nutze nur tatsaechlich verfuegbare Tools und Permissions
- Kein Auto-Merge, kein Approval-Bypass, kein YOLO-Modus

---

## 3. Aktualitaetsregel (Reality Refresh)

### 3.1 Information Classification

Jede Annahme muss vor Nutzung klassifiziert werden:

| Classification      | Meaning                                     |
| ------------------- | ------------------------------------------- |
| `CONFIRMED_CURRENT` | Im aktuellen Lauf durch Evidence bestaetigt |
| `CONFIRMED_STALE`   | Belegt, aber offensichtlich alt             |
| `ASSUMPTION`        | Plausibel, aber nicht belegt                |
| `UNKNOWN`           | Nicht pruefbar                              |
| `NEEDS_VALIDATION`  | Muss vor Umsetzung geprueft werden          |
| `CONFLICT`          | Widerspruechliche Evidence gefunden         |

### 3.2 Reality Refresh Checkliste

Vor jeder Planung mindestens pruefen:

- [ ] aktueller Branch (`git branch --show-current`)
- [ ] Git-Status (`git status --short`)
- [ ] letzte Commits (`git log --oneline -n 10`)
- [ ] offene/geschlossene Issues (`gh issue list`)
- [ ] offene/geschlossene PRs (`gh pr list`)
- [ ] CI-Status (`gh run list`)
- [ ] Releases/Tags (`gh release list`)
- [ ] README, docs/, AGENTS.md
- [ ] `.opencode/` Konfiguration
- [ ] Runtime-Versionen (Node, Rust, pnpm, Git)
- [ ] OpenCode-Version und Betriebsart

---

## 4. OS-/Shell-Erkundung (Pre-Flight)

### 4.1 Zuerst OS und Shell erkennen

**NIEMALS** blind Linux-Befehle auf Windows oder PowerShell-Befehle auf Linux ausfuehren.

Plattformneutrale Erstpruefung:

```bash
pwd && uname -a && git --version && node --version
```

Wenn fehlgeschlagen → Windows/PowerShell/CMD wahrscheinlich.

Dann Windows-Pruefungen:

```powershell
Get-Location; $PSVersionTable; git --version; node --version
```

### 4.2 OS-Kompatibilitaetsentscheidung

Dokumentiere nach Erkundung:

- Detected OS: Windows / Linux / macOS
- Detected Shell: PowerShell / CMD / bash / zsh
- Path Style: Windows backslash / POSIX slash
- Command Strategy: PowerShell-native / POSIX-shell / cross-platform

---

## 5. OpenCode-Tool-/Permission-Discovery

Vor jeder Aktion pruefen:

- `opencode --version`
- Welche Agenten sind verfuegbar?
- Welche Permissions/Tools sind erlaubt?
- Welche Schreibtools sind verfuegbar?
- Projektlokale `.opencode/` Konfiguration

---

## 6. Hard Constraints (Nicht verhandelbar)

### Darf nicht:

- Alte ChatGPT-/Memory-Informationen ungeprueft als aktuell ausgeben
- Nicht bestaetigte Projektstaende in Dokumentation uebernehmen
- Secrets, Tokens, `.env`, private Keys ausgeben
- YOLO-/Approval-Bypass-/Auto-Merge-Modi verwenden
- Nicht vorhandene Tests, CI-Ergebnisse, Screenshots behaupten
- Linux-Befehle blind auf Windows ausfuehren (und umgekehrt)
- Ohne Reality-Refresh planen
- Ohne Human Approval mergen

### Muss:

- Zuerst Aktualitaet, Runtime, OS, Shell und OpenCode-Version pruefen
- Befehlssyntax an OS und Shell anpassen
- Aenderungen klein genug halten (reviewbar)
- Alle Behauptungen auf Evidence stuetzen
- Exit-Codes dokumentieren
- Am Ende Next-Step-Handoff liefern

---

## 7. Source of Truth Hierarchie

1. Repository-Dateien (git, realer Dateistatus)
2. Git-Historie
3. Echte Shell-/Tool-Ausgaben mit Exit-Codes
4. GitHub Issues / Pull Requests / Releases (via `gh`)
5. CI-Dateien und CI-Logs
6. Tests und Testausgaben
7. Evidence-Dateien
8. README / docs

**Nicht** Source of Truth:

- ChatGPT-Memory
- Alte Chatverlaeufe
- Fruehere Agent-Reports (ohne aktuelle Verifikation)

---

## 8. Standard-Workflow

```
Issue → Spec → Verification Contract → Red Tests → Agent-Code
→ CI/Security Gates → Sandbox Preview → Reviewer-Agent
→ Human Approval → Evidence-Kommentar → Merge
```

---

## 9. Pflichtabschnitte fuer jeden Run

### 9.1 Pre-Flight-Scan (vor Aenderungen)

- Ziel des Runs
- OS-/Shell-Erkundung
- OpenCode-Erkundung
- Betroffene Dateien/Tools/Issues/PRs
- Nicht anfassen
- Risiken
- Snapshot-/Rollback-Strategie
- Human Approval noetig?

### 9.2 Evidence-Log (waehrend des Runs)

Jede Aktion dokumentieren mit:

- Command ID
- CWD
- Command
- Exit Code
- Ergebnis-Zusammenfassung
- Evidence Status: PASS / FAIL / NOT_RUN / MISSING / BLOCKED

### 9.3 Finaler Report (nach Abschluss)

- Kurzfazit (GREEN / YELLOW / RED)
- Geaenderte Dateien
- CI/Security Gates Tabelle
- Verification Contract Status
- Human Approval Status
- Naechste sinnvolle Optionen (max. 3)
- **"Was kann die Software jetzt im Vergleich zum vorherigen Lauf?"** (PFLICHT)

---

## 10. Verification Contract (Red Tests)

Fuer prompt-basierte Projekte muessen folgende negative Tests definiert sein:

1. Prompt ohne Reality-Refresh → UNGUELTIG
2. Prompt, der ChatGPT-Info ungeprueft uebernimmt → UNGUELTIG
3. Prompt ohne Pre-Flight-Scan → UNGUELTIG
4. Prompt ohne OS-/Shell-Erkundung → UNGUELTIG
5. Prompt mit blinden Linux-Befehlen auf Windows → UNGUELTIG
6. Prompt ohne OpenCode-Zielruntime → UNGUELTIG
7. Prompt mit YOLO-/Auto-Merge ohne Approval → UNGUELTIG
8. Prompt ohne Evidence-Portfolio → UNGUELTIG
9. Prompt ohne Human-Approval-Gate → UNGUELTIG
10. Prompt ohne abschliessenden Faehigkeitenvergleich → UNGUELTIG
11. Prompt mit privaten/sensiblen Daten → UNGUELTIG
12. Prompt mit unbelegten Behauptungen → UNGUELTIG

---

## 11. Living Software Portfolio

Jedes Projekt fuehrt ein Evidence Portfolio mit:

- Aktuelle Faehigkeiten (mit Testnachweisen)
- Neue Faehigkeiten seit letztem Release
- Entfernte Blocker
- Unveraenderte Einschraenkungen
- Known Limitations
- OS-/Shell-Kompatibilitaetsstatus
- OpenCode-Kompatibilitaetsstatus
- Naechster sinnvoller Schritt
- Letzte Aktualisierung

**Keine Faehigkeiten behaupten, die nicht belegt sind.**

---

## 12. GitHub Repository Pflege

Regelmaessig pruefen und aktuell halten:

- README (aktuell, korrekt, vollstaendig)
- Repository Description & Topics
- Releases/Tags mit Release Notes
- CI-Gates und Badges
- Issue-/PR-Templates
- SECURITY.md, CONTRIBUTING.md, LICENSE

---

## 13. Human Approval Gate

**Ohne Human Approval erlaubt:**

- README/docs aktualisieren
- Evidence-Dateien erstellen
- Agentenregeln dokumentieren
- Sichere Tests ausfuehren

**Nicht erlaubt ohne Human Approval:**

- Produktiven Code grossflaechig umbauen
- Architektur wechseln
- Neue externe Dependencies hinzufuegen
- CI-/Security-Gates abschwaechen
- Tests loeschen
- Force-pushen, mergen, releasen

---

## 14. Commit- und Merge-Regeln

- Kein Commit ohne gruene Tests
- Kein Merge ohne CI und Human Approval
- `git diff --check` vor jedem Commit
- Keine Secrets, `.env`, `*.db` committen
- Evidence-Kommentar im Issue/PR vor Merge
