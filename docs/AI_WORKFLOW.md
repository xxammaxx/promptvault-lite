<!-- BEGIN GITHUB_AI_GOVERNANCE -->

# AI Workflow — PromptVault Lite

> **Verbindlicher Entwicklungs-Workflow für alle KI-Agenten und Entwickler.**  
> Jede Phase hat definierte Ein- und Ausgangskriterien. Keine Phase darf übersprungen werden.

---

## Workflow-Übersicht

```
Issue → Spec → Verification Contract → Red Tests → Agent-Code
    → CI/Security Gates → Sandbox Preview → Reviewer-Agent
    → Human Approval → Evidence-Kommentar → Merge
```

---

## Phase 1: Issue

### Ziel

Eine klar definierte Arbeitseinheit erstellen, die als Source of Truth für alle folgenden Schritte dient.

### Eingangskriterien

- Bedarf oder Problem wurde identifiziert.

### Arbeitsschritte

1. Issue-Template auswählen (feature, bug, ai-task, context-engineering-task).
2. Ziel, Kontext und Acceptance Criteria ausfüllen.
3. Labels setzen (enhancement, bug, security, etc.).
4. Milestone und Assignee zuweisen, falls bekannt.

### Ausgangskriterien

- [ ] Issue hat klares Ziel.
- [ ] Acceptance Criteria sind definiert.
- [ ] Labels sind gesetzt.
- [ ] Issue-Nummer ist bekannt.

### Evidence

- GitHub Issue URL.
- Issue-Nummer für spätere Referenz.

### Typische Fehler

- Zu vage Ziele („etwas verbessern").
- Fehlende Acceptance Criteria.
- Scope Creep (zu viel in einem Issue).

### Abbruchbedingungen

- Ziel kann nicht klar definiert werden → Issue zurückstellen.
- Acceptance Criteria sind nicht messbar → Nachschärfen.

---

## Phase 2: Spec

### Ziel

Eine formale Spezifikation erstellen, die alle Anforderungen präzise beschreibt.

### Eingangskriterien

- Issue mit Ziel und Kontext existiert.

### Arbeitsschritte

1. Für Features: Speckit-Workflow starten (`/speckit.specify`).
2. Für Bugs: Reproduktion, Erwartung, Ist-Zustand dokumentieren.
3. Für Context-Engineering: Scope, betroffene Dateien, Akzeptanzkriterien.
4. In Scope / Out of Scope klar abgrenzen.
5. Abhängigkeiten identifizieren.

### Ausgangskriterien

- [ ] Spezifikation ist vollständig.
- [ ] In Scope / Out of Scope ist definiert.
- [ ] Abhängigkeiten sind dokumentiert.
- [ ] Keine vagen Formulierungen.

### Evidence

- Spezifikationsdokument oder Issue-Body.
- Verlinkte ADRs, falls Architektur betroffen.

### Typische Fehler

- Spezifikation überspringen und direkt implementieren.
- Out of Scope nicht definieren → Scope Creep.
- Abhängigkeiten ignorieren.

### Abbruchbedingungen

- Spezifikation kann nicht vervollständigt werden → Issue zurückstellen.
- Requirements sind widersprüchlich → Klärung durch Human anfordern.

---

## Phase 3: Verification Contract

### Ziel

Definieren, WIE die Korrektheit der Implementierung bewiesen wird.

### Eingangskriterien

- Vollständige Spezifikation.

### Arbeitsschritte

1. Für jedes Acceptance Criterion einen Testfall definieren.
2. Testtypen identifizieren: Unit, Integration, E2E, visuell.
3. Erwartete Testergebnisse dokumentieren.
4. Testdaten definieren (synthetisch, keine Produktionsdaten).

### Ausgangskriterien

- [ ] Jedes Acceptance Criterion hat einen Testfall.
- [ ] Testtypen sind definiert.
- [ ] Erwartete Ergebnisse sind dokumentiert.
- [ ] Testdaten sind definiert.

### Evidence

- Verification Contract im Issue oder Spec-Dokument.
- Testfall-Liste.

### Typische Fehler

- Nur Happy-Path testen.
- Edge Cases ignorieren (leere Eingaben, Maximalwerte, Fehlerfälle).
- Produktionsdaten in Tests verwenden.

### Abbruchbedingungen

- Acceptance Criteria sind nicht testbar → Nachschärfen.
- Testumgebung kann nicht bereitgestellt werden → Alternativen dokumentieren.

---

## Phase 4: Red Tests

### Ziel

Tests schreiben, die VOR der Implementierung fehlschlagen (TDD-Prinzip).

### Eingangskriterien

- Verification Contract definiert.

### Arbeitsschritte

1. Tests gemäß Verification Contract implementieren.
2. Tests ausführen und Fehlschlag dokumentieren.
3. Falls Red Tests nicht möglich: begründen und dokumentieren.

### Ausgangskriterien

- [ ] Tests sind implementiert.
- [ ] Tests schlagen fehl (oder Fehlschlag ist dokumentiert).
- [ ] Begründung für nicht-mögliche Red Tests liegt vor.

### Evidence

- Testausgabe mit Fehlschlägen.
- Screenshot oder Log der roten Tests.

### Typische Fehler

- Tests schreiben, die sofort grün sind (falsch-positive Tests).
- Red Tests überspringen ohne Begründung.
- Zu komplexe Tests, die Setup-Probleme haben.

### Abbruchbedingungen

- Test-Framework funktioniert nicht → Infrastruktur-Issue erstellen.
- Red Tests können nicht geschrieben werden → Begründung dokumentieren und fortsetzen.

---

## Phase 5: Agent-Code

### Ziel

Die Implementierung gemäß Spezifikation und Red Tests durchführen.

### Eingangskriterien

- Red Tests existieren.
- AGENTS.md und `.github/copilot-instructions.md` wurden gelesen.

### Arbeitsschritte

1. Branch von `main` erstellen.
2. Implementierung in atomaren Commits.
3. Konventionen aus AGENTS.md befolgen.
4. Keine bestehenden Dateien blind überschreiben.
5. Dokumentation parallel aktualisieren.
6. Context Manifest führen.

### Ausgangskriterien

- [ ] Implementierung ist abgeschlossen.
- [ ] Red Tests werden grün.
- [ ] Dokumentation ist aktualisiert.
- [ ] Keine Regression in bestehenden Tests.

### Evidence

- `git diff --stat`.
- Context Manifest (`docs/agent/context-manifest-<ISSUE>.md`).

### Typische Fehler

- Scope Creep (mehr implementieren als spezifiziert).
- Bestehende Regeln oder Patterns brechen.
- Dokumentation vergessen.

### Abbruchbedingungen

- Implementierung weicht von Spec ab → Spec nachschärfen oder Rücksprache.
- Technische Blockade → Issue-Kommentar und Hilfe anfordern.

---

## Phase 6: CI/Security Gates

### Ziel

Automatisierte Prüfungen bestehen, die Code-Qualität und Sicherheit garantieren.

### Eingangskriterien

- Code ist committed und gepusht.
- PR ist erstellt.

### Arbeitsschritte

1. Auf CI-Ergebnis warten.
2. Bei Fehlern: Logs analysieren, beheben, neu pushen.
3. Security-Regeln aus `docs/SECURITY_GATES.md` prüfen.

### Check-Liste

- [ ] Typecheck bestanden (`tsc --noEmit`)
- [ ] Lint bestanden (`pnpm lint`, `cargo clippy`)
- [ ] Format bestanden (`cargo fmt --check`, Prettier)
- [ ] Unit-Tests bestanden (`pnpm test`, `cargo test`)
- [ ] Build erfolgreich (`pnpm build`, `cargo build`)
- [ ] Secret Scan sauber
- [ ] Keine `.env`- oder `.db`-Dateien im Diff

### Ausgangskriterien

- [ ] Alle CI-Jobs grün.
- [ ] Keine Security-Findings.
- [ ] Keine Secrets im Code.

### Evidence

- CI-Log (GitHub Actions Run URL).
- Lokale Testausgaben.

### Typische Fehler

- CI-Fehler ignorieren und PR trotzdem stellen.
- „Works on my machine" — Plattform-Unterschiede nicht beachten.

### Abbruchbedingungen

- CI bricht infrastrukturell ab → CI-Issue erstellen.
- Security-Scan findet echte Secrets → Sofort beheben und rotieren.

---

## Phase 7: Sandbox Preview

### Ziel

Funktionale und visuelle Validierung in isolierter Umgebung.

### Eingangskriterien

- CI/Security Gates grün.
- Build erfolgreich.

### Arbeitsschritte

1. Bei UI-Änderungen: Playwright-Screenshots gegen Baseline vergleichen.
2. Bei Features: manuelle oder automatisierte Smoke-Tests.
3. Ergebnisse klassifizieren: expected change, regression, false positive.
4. Bei Nicht-Anwendbarkeit: begründen.

### Ausgangskriterien

- [ ] Keine visuellen Regressionen.
- [ ] Funktionale Validierung bestanden (oder begründet nicht nötig).

### Evidence

- Screenshots (vorher/nachher).
- Playwright-Testbericht.
- Begründung bei Nicht-Anwendbarkeit.

### Typische Fehler

- Sandbox Preview überspringen ohne Begründung.
- Screenshot-Diffs nicht manuell prüfen.

### Abbruchbedingungen

- Playwright-Umgebung nicht verfügbar → Begründung dokumentieren.

---

## Phase 8: Reviewer-Agent

### Ziel

Automatisierte Code-Qualitätsprüfung durch einen Review-Agenten.

### Eingangskriterien

- PR ist erstellt.
- CI ist grün.

### Arbeitsschritte

1. `review-agent`-Task auslösen.
2. Review-Kommentar im PR lesen.
3. Findings kategorisieren (blocker, suggestion, nitpick).
4. Blockers beheben, Suggestions bewerten.

### Ausgangskriterien

- [ ] Review-Agent hat kommentiert.
- [ ] Blockers sind behoben oder als akzeptiert dokumentiert.

### Evidence

- Review-Agent-Kommentar im PR.
- Änderungen als Reaktion auf Review.

### Typische Fehler

- Review-Agent nicht auslösen.
- Blockers ignorieren.
- Review-Kommentare nicht dokumentieren.

### Abbruchbedingungen

- Review-Agent nicht verfügbar → Menschlichen Review anfordern.

---

## Phase 9: Human Approval

### Ziel

Menschliche Qualitätssicherung und Freigabe.

### Eingangskriterien

- Alle automatischen Checks sind grün.
- Review-Agent hat keine offenen Blockers.

### Arbeitsschritte

1. Human Approval im PR anfordern (Request Review).
2. Auf Feedback warten.
3. Feedback einarbeiten.
4. Genehmigung dokumentieren.

### Ausgangskriterien

- [ ] Human Approval wurde erteilt.
- [ ] Feedback wurde eingearbeitet (oder Diskussion dokumentiert).

### Evidence

- GitHub Review Approval.
- Name und Datum der Genehmigung.

### Typische Fehler

- Ohne Genehmigung mergen.
- Feedback ignorieren.
- Zu früh um Review bitten (CI noch rot).

### Abbruchbedingungen

- Grundlegende Meinungsverschiedenheit → Issue-Diskussion.

---

## Phase 10: Evidence-Kommentar

### Ziel

Vollständige Dokumentation des Agentenlaufs im Issue.

### Eingangskriterien

- Human Approval liegt vor oder steht kurz bevor.

### Arbeitsschritte

1. Evidence Log finalisieren.
2. Strukturierten Kommentar im Issue posten.
3. Alle Felder ausfüllen.

### Ausgangskriterien

- [ ] Evidence-Kommentar ist im Issue gepostet.
- [ ] Alle Felder sind ausgefüllt.

### Evidence

- Issue-Kommentar mit Evidence-Block.
- Evidence Log (`docs/agent/evidence-log-<ISSUE>.md`).

### Typische Fehler

- Evidence-Kommentar vergessen.
- Felder leer lassen.
- Testergebnisse nicht dokumentieren.

### Abbruchbedingungen

- Keine — dieser Schritt MUSS immer erfolgen.

---

## Phase 11: Merge

### Ziel

Änderungen in `main` integrieren.

### Eingangskriterien

- Alle vorherigen Phasen abgeschlossen.
- Human Approval erteilt.
- Evidence-Kommentar vorhanden.

### Arbeitsschritte

1. Merge-Button in GitHub UI klicken (Squash oder Rebase nach Konvention).
2. Branch nach Merge löschen.
3. Issue schließen (automatisch oder manuell).

### Ausgangskriterien

- [ ] Code ist auf `main`.
- [ ] Branch ist gelöscht.
- [ ] Issue ist geschlossen.

### Evidence

- Merge-Commit auf `main`.
- Geschlossenes Issue.

### Typische Fehler

- Branch nicht löschen → Repository vermüllt.
- Issue nicht schließen → Offene Issues sammeln sich.

### Abbruchbedingungen

- Merge-Konflikte → Konflikte lösen und neu approven lassen.

---

> **Letzte Aktualisierung:** 2026-06-08  
> **Gültig ab:** Commit `chore/github-ai-governance`

<!-- END GITHUB_AI_GOVERNANCE -->
