<!-- BEGIN GITHUB_AI_GOVERNANCE -->

# Context Engineering Standard — PromptVault Lite

> **Wie Kontext in diesem Projekt verwaltet wird.**  
> Kontext ist eine knappe, kontrollierte Ressource. Dieser Standard definiert, wie Agenten und Entwickler Kontext laden, verwalten und dokumentieren.

---

## 1. Kontext-Zonen

### Cold Context (unverhandelbar)

Stabile, langfristig gültige Regeln. Werden bei JEDEM Agentenlauf geladen.

- `AGENTS.md` — Agentenregeln, Start/End Gates, Hard Constraints
- `.github/copilot-instructions.md` — Projektkonventionen, Coding Standards
- `docs/SECURITY_GATES.md` — Sicherheitsregeln
- `docs/AI_WORKFLOW.md` — Workflow-Definition
- `.opencode/policies/` — Evidence-Gates, MCP-Trust-Tiers, Data-Retention

**Eigenschaften:**

- Langsame Änderungsrate (Tage bis Monate).
- Änderungen benötigen Human Approval.
- Werden als Re-Injection bei jedem Run neu geladen.
- Keine Vermischung mit Hot Context.

### Warm Context (beratend, langsam veränderlich)

Projektspezifisches Wissen, das für die aktuelle Arbeit relevant ist.

- Architekturentscheidungen (`docs/ARCHITECTURE.md`, `docs/adr/`)
- Coding-Konventionen (ESLint, Prettier, `cargo fmt`, `cargo clippy`)
- Nutzerpräferenzen und Produktvision
- Aktuelle Issues und offene PRs
- Bekannte Risiken und technische Schulden
- Domain-Wissen (Prompt-Analyse, Qualitätsmetriken)

**Eigenschaften:**

- Mittlere Änderungsrate (Stunden bis Tage).
- Wird nach Bedarf geladen, nicht pauschal.
- Dient als Advisory Memory, nicht als Source of Truth.

### Hot Context (aktueller Laufzeitkontext, TTL-begrenzt)

Flüchtiger, laufzeitspezifischer Kontext eines einzelnen Agentenlaufs.

- Aktuelles Issue (Body, Kommentare)
- Aktuelle Logs und Fehlerausgaben
- Aktuelle Testausgaben
- Aktuelle Tool-Ergebnisse
- Aktuelle Diff-Analyse
- Aktueller Branch und Commit

**Eigenschaften:**

- Sehr schnelle Änderungsrate (Sekunden bis Minuten).
- Begrenzte Lebensdauer (TTL: Dauer des Agentenlaufs).
- Darf nicht ungeprüft in dauerhafte Dokumentation übernommen werden.
- Wird nach Abschluss des Laufs im Evidence Log zusammengefasst.

---

## 2. Context Manifest

Jeder Agentenlauf MUSS ein Context Manifest führen.

**Template:** `docs/agent/CONTEXT_MANIFEST_TEMPLATE.md`

**Pflichtfelder:**

- Session ID
- Issue-Referenz
- Geladener Cold Context (Dateien)
- Geladener Warm Context (Dateien)
- Aktueller Hot Context (Branch, Commit, Logs)
- Confidence-Level für Aussagen
- Token-Budget-Schätzung

**Konvention:** Context Manifest wird zu Beginn des Laufs erstellt und während des Laufs aktualisiert.

---

## 3. Token-Budget

Kontext verbraucht Token. Agenten müssen sparsam damit umgehen.

**Regeln:**

- Lade nur Dateien, die für die aktuelle Aufgabe relevant sind.
- Nutze Tool-Discovery (Glob, Grep) statt pauschaler Verzeichnis-Lesevorgänge.
- Komprimiere Tool-Rohdaten, bevor sie in den nächsten Prompt übernommen werden.
- Große Dateien in relevanten Abschnitten lesen, nicht komplett.
- Ergebnisse zusammenfassen, nicht Rohdaten durchreichen.

**Niemals komprimieren:**

- Fehlerlogs
- Stacktraces
- Security-Findings
- Testergebnisse (vollständige Ausgabe)

---

## 4. Retrieval-Regeln

### Tool-Discovery statt Tool-Dump

- Aufgabe analysieren → relevante Tool-Kategorie bestimmen → nur notwendige Tools laden.
- Niemals alle verfügbaren Tools pauschal aktivieren.

### Confidence-Kennzeichnung

Jede Aussage MUSS als eine der folgenden Kategorien gekennzeichnet werden:

| Kategorie        | Bedeutung                                               | Beispiel                                                 |
| ---------------- | ------------------------------------------------------- | -------------------------------------------------------- |
| **Tatsache**     | Verifiziert durch Code, Test oder offizielle Doku       | „Die Datei `appStore.ts` exportiert `useAppStore`"       |
| **Annahme**      | Logische Schlussfolgerung, nicht direkt verifiziert     | „Vermutlich ist der Watcher für das UI-Update zuständig" |
| **Hypothese**    | Ungeprüfte Vermutung                                    | „Könnte ein Race-Condition-Problem sein"                 |
| **Vendor-Claim** | Aussage eines externen Tools oder einer externen Quelle | „Laut npm audit hat Paket X eine Schwachstelle"          |

### Freshness

- Hot Context ist nur für die Dauer des aktuellen Laufs gültig.
- Warm Context wird bei jedem Lauf auf Aktualität geprüft.
- Cold Context wird als Re-Injection immer neu geladen.

### Ownership

- Jede Datei im Projekt hat einen Owner (siehe `.github/CODEOWNERS`).
- Änderungen an Cold-Context-Dateien benötigen Owner-Review.
- Agenten dürfen Cold-Context-Dateien nicht ohne Human Approval ändern.

---

## 5. Memory mit TTL

### Advisory Memory vs. Source of Truth

- **Advisory Memory:** `.opencode/memory/` — Zwischenspeicher für laufende Arbeit, 7 Tage TTL.
- **Source of Truth:** GitHub Issues, PRs, Commits — unbegrenzte Gültigkeit.

Advisory Memory darf Source of Truth niemals widersprechen. Bei Konflikt: Source of Truth gewinnt.

### Speicherorte

| Ort                                    | TTL      | Zweck                                  |
| -------------------------------------- | -------- | -------------------------------------- |
| `.opencode/memory/evidence-cache.json` | 7 Tage   | Zwischenspeicher für Evidence-Sammlung |
| `.opencode/logs/sessions/`             | 30 Tage  | Session-Logs für Debugging             |
| `.opencode/logs/audit/`                | 10 Jahre | Audit-Trail für DSGVO-Compliance       |

---

## 6. Risiko-Dokumentation

Neue Risiken MÜSSEN sofort dokumentiert werden:

- Als Issue-Kommentar im aktuellen Issue.
- Oder als neues Issue mit Label `risk`.
- Mit Einschätzung: High / Medium / Low.
- Mit Maßnahme: Was kann getan werden?

---

> **Letzte Aktualisierung:** 2026-06-08  
> **Gültig ab:** Commit `chore/github-ai-governance`

<!-- END GITHUB_AI_GOVERNANCE -->
