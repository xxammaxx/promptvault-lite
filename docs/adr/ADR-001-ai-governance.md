<!-- BEGIN GITHUB_AI_GOVERNANCE -->

# ADR-001: AI Governance and GitHub Source-of-Truth Workflow

## Status

Accepted

## Datum

2026-06-08

## Kontext

PromptVault Lite wird mit KI-Agenten, GitHub Issues, Pull Requests und CI-Gates weiterentwickelt. Mehrere Agenten (issue-orchestrator, review-agent, security-agent, compliance-agent, etc.) arbeiten im Ökosystem. Ohne klare Governance-Regeln drohen:

- Agenten überschreiben bestehende Dateien blind.
- Implementierung ohne Issues und Acceptance Criteria.
- Änderungen ohne Tests und Evidence.
- Merges ohne Review und Human Approval.
- Halluzination von Security-Findings ohne PoC.

## Entscheidung

**GitHub ist die einzige Source of Truth für alle Projektinformationen.**

Alle KI-Arbeiten laufen verbindlich über folgenden Workflow:

```
Issue → Spec → Verification Contract → Red Tests → Agent-Code
    → CI/Security Gates → Sandbox Preview → Reviewer-Agent
    → Human Approval → Evidence-Kommentar → Merge
```

Zusätzlich gelten folgende Regeln:

1. **Kein direkter Push auf `main`** — alle Änderungen über Feature-Branches und PRs.
2. **Kein Merge ohne grüne Checks** — CI muss Typecheck, Lint, Tests, Build und Secret Scan bestehen.
3. **Jeder PR braucht Evidence** — Testergebnisse, Security Checks, Diff-Statistik, Risiken, Rollback.
4. **Keine Behauptung ohne Beleg** — Evidence-Gates sind technisch und prozedural durchgesetzt.
5. **Agenten dürfen bestehende Dateien nicht blind überschreiben** — bestehende Inhalte müssen erhalten und nur ergänzt werden.
6. **Sicherheitsregeln werden technisch über CI/Gates abgesichert** — Secret Scanning, Lint, Clippy, Typecheck.
7. **Human Approval ist Pflicht** für Security-Änderungen, Architekturänderungen, Migrationen und neue Abhängigkeiten.

### Kontext-Engineering

Kontext wird als knappe Ressource behandelt und in drei Zonen getrennt:

- **Cold Context:** Stabile Regeln (AGENTS.md, Security-Gates, AI Workflow).
- **Warm Context:** Beratendes Wissen (Architektur, ADRs, Konventionen).
- **Hot Context:** Laufzeitspezifisch, TTL-begrenzt (aktuelles Issue, Logs, Tests).

Jeder Agentenlauf führt ein Context Manifest und ein Evidence Log.

### Tool-Governance

MCP-Tools werden in Trust Tiers eingeteilt:

| Tier   | Zugriff                                | Auto-Approve |
| ------ | -------------------------------------- | ------------ |
| Tier 0 | Readonly (GitHub MCP, Brave Search)    | Ja           |
| Tier 1 | Sandboxed (Playwright, Docker, SQLite) | Ja           |
| Tier 2 | Human-Gate (FileSystem external)       | Nein         |

## Konsequenzen

### Positiv

- **Reproduzierbarkeit:** Jede Änderung ist durch Issue, Branch, PR und Evidence nachvollziehbar.
- **Sicherheit:** Technische Gates verhindern Secrets, unsauberen Code und ungetestete Änderungen.
- **Audit-Fähigkeit:** Jeder Agentenlauf ist durch Evidence-Kommentare und Logs auditierbar.
- **DSGVO-Compliance:** Datenverarbeitung ist dokumentiert, keine Cloud-Anbindung.
- **Qualität:** Red-Tests und Verification Contracts erzwingen Testbarkeit.

### Negativ

- **Langsamerer Workflow:** Mehr Schritte vor dem Merge.
- **Höherer Dokumentationsaufwand:** Context Manifests und Evidence Logs pro Lauf.
- **Rigidität:** Kreative oder explorative Arbeit muss diszipliniert dokumentiert werden.

## Alternativen

### Alternative 1: Freies Vibe Coding ohne Governance

Keine Issues, keine Specs, keine Tests, direkter Push auf main.

- **Vorteil:** Schnell.
- **Nachteil:** Nicht auditierbar, hohes Risiko von Regressionen und Sicherheitsproblemen.
- **Entscheidung:** Verworfen. Nicht vereinbar mit Qualitäts- und Sicherheitsanforderungen.

### Alternative 2: Nur manuelle Reviews

Keine automatisierten Checks, keine Evidence-Gates, rein menschliche Reviews.

- **Vorteil:** Einfach.
- **Nachteil:** Fehleranfällig, nicht skalierbar mit mehreren Agenten.
- **Entscheidung:** Verworfen. Automatische Gates sind notwendig für Konsistenz.

### Alternative 3: Nur Dokumentation ohne technische Gates

Dokumentierte Regeln, aber keine CI-Gates oder automatischen Checks.

- **Vorteil:** Weniger Infrastruktur-Aufwand.
- **Nachteil:** Regeln werden nicht durchgesetzt, Verstöße bleiben unbemerkt.
- **Entscheidung:** Verworfen. Technische Gates sind die einzige zuverlässige Durchsetzung.

## Bewertung

Der gewählte Ansatz (vollständiger GitHub-KI-Governance-Workflow) ist:

- **Langsamer** als freies Coding, aber **sicherer** und **reproduzierbarer**.
- **Aufwändiger** in der Dokumentation, aber **besser auditierbar**.
- **Struktureller** durch Specs und Tests, was die **Qualität** erhöht.
- **Besser geeignet** für Multi-Agenten-Entwicklung, da Regeln für alle Agenten gleichermaßen gelten.

Insgesamt überwiegen die Vorteile die Nachteile deutlich, insbesondere für ein Projekt, das von mehreren KI-Agenten mitentwickelt wird und bei dem Sicherheit und Datenintegrität (local-only, DSGVO) kritisch sind.

## Referenzen

- `AGENTS.md` — Agentenregeln und Workflow
- `.github/copilot-instructions.md` — Projektkonventionen
- `docs/AI_HANDBUCH.md` — Vollständiger Governance-Standard
- `docs/AI_WORKFLOW.md` — Workflow-Phasen im Detail
- `docs/SECURITY_GATES.md` — Sicherheitsregeln
- `docs/EVIDENCE_STANDARD.md` — Evidence-Format
- `docs/CONTEXT_ENGINEERING_STANDARD.md` — Kontext-Management
- `.opencode/policies/` — Evidence-Gates, MCP-Trust-Tiers, Data-Retention

<!-- END GITHUB_AI_GOVERNANCE -->
