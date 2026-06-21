<!-- BEGIN GITHUB_AI_GOVERNANCE -->

# AGENTS.md Docs-Addendum

> **Dokumentationsspezifische Ergänzungen zu den Regeln in `AGENTS.md`.**  
> Dieses Addendum definiert, wann und wie Dokumentation bei Code-Änderungen aktualisiert werden muss.
> Soll bei nächster Revision in `AGENTS.md` integriert werden.

---

## 1. Trigger-Regeln: Wann Code-Änderungen Docs-Updates erfordern

Dokumentation MUSS aktualisiert werden, wenn folgende Änderungen vorgenommen werden:

| Code-Änderung                          | Erforderliches Docs-Update                                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Neue Datei, Komponente, Modul**      | `docs/reference/project-structure.md` ergänzen                                                                        |
| **Neues Rust-Modul / Command**         | `docs/ARCHITECTURE.md` (Module-Tabelle) + `docs/reference/project-structure.md` ergänzen                              |
| **Neues Tauri-Command**                | `docs/ARCHITECTURE.md` (Commands-Tabelle), `docs/reference/project-structure.md`, ggf. `docs/runbooks/development.md` |
| **Neue Abhängigkeit (npm/Cargo)**      | `docs/INSTALL.md` (Voraussetzungen) prüfen                                                                            |
| **Neues UI-Feature**                   | `docs/USER_GUIDE.md` ergänzen                                                                                         |
| **Neue Tastaturkürzel**                | `docs/USER_GUIDE.md` (Tastaturkürzel-Tabelle)                                                                         |
| **Geänderter Build-/Workflow-Schritt** | `docs/runbooks/development.md` aktualisieren                                                                          |
| **Neue Architekturentscheidung**       | Neues ADR in `docs/adr/`, Querverweis in `docs/architecture/overview.md`                                              |
| **Neues Analyse-Kriterium**            | `docs/USER_GUIDE.md`, `docs/glossary.md` ergänzen                                                                     |
| **Neue Version / Release**             | `docs/CHANGELOG.md` ergänzen                                                                                          |
| **Neuer Fachbegriff**                  | `docs/glossary.md` ergänzen                                                                                           |
| **Fehlerbehebung mit UI-Auswirkung**   | `docs/USER_GUIDE.md` oder `docs/CHANGELOG.md` prüfen                                                                  |

**Ausnahme:** Reine Refactorings ohne API-/UI-Änderungen benötigen kein Docs-Update (aber Eintrag im Changelog ist empfohlen).

## 2. Geschützte Docs-Dateien

Folgende Dateien benötigen **vor jeder Änderung eine Prüfung und Human Approval**:

| Datei                                        | Begründung                                                            |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `AGENTS.md`                                  | Zentrale Agenten-Regeln — Änderung nur über separaten Issue + ADR     |
| `docs/SECURITY_GATES.md`                     | Sicherheitsregeln — Änderung nur über Security-Agent + Human Approval |
| `docs/AI_WORKFLOW.md`                        | Workflow-Definition — Änderung nur über Governance-ADR                |
| `docs/AI_HANDBUCH.md`                        | Governance-Standard — Änderung nur über Governance-ADR                |
| `docs/EVIDENCE_STANDARD.md`                  | Evidence-Format — Änderung nur über Governance-ADR                    |
| `docs/agent/REVIEWER_CHECKLIST.md`           | Review-Standard — Änderung nur über Governance-ADR                    |
| `docs/agent/CONTEXT_MANIFEST_TEMPLATE.md`    | Template — Änderung nur über Governance-ADR                           |
| `docs/agent/CONTEXT_MANIFEST_TEMPLATE_V2.md` | Template — Änderung nur über Governance-ADR                           |
| `docs/agent/AGENTS_DOCS_ADDENDUM.md`         | Dieses Dokument — Änderung nur über Governance-ADR                    |

Folgende Dateien sind **offen für Routine-Updates** (ohne Human Approval, aber mit Review):

| Datei                                 | Update-Grund                          |
| ------------------------------------- | ------------------------------------- |
| `docs/reference/project-structure.md` | Neue/entfernte Dateien, Module        |
| `docs/USER_GUIDE.md`                  | Neue UI-Features, geänderte Bedienung |
| `docs/INSTALL.md`                     | Neue Abhängigkeiten                   |
| `docs/runbooks/development.md`        | Neue Commands, Workflows              |
| `docs/glossary.md`                    | Neue Fachbegriffe                     |
| `docs/CHANGELOG.md`                   | Neue Versionen                        |
| `docs/architecture/overview.md`       | Neue ADRs                             |
| `docs/getting-started/index.md`       | Geänderte Einstiegsschritte           |
| `docs/how-to/index.md`                | Neue How-to-Guides                    |

## 3. Evidence-Anforderungen für Docs-Änderungen

Jede Docs-Änderung MUSS folgende Evidence erbringen:

### Link-Check (Pflicht)

- [ ] Alle internen Markdown-Links wurden auf Existenz geprüft
- [ ] Relative Pfade (`./`, `../`) zeigen auf existierende Dateien
- [ ] Ankerlinks (`#`) verweisen auf existierende Überschriften
- [ ] Keine defekten Querverweise zwischen Docs-Dateien

### Build-Check (Pflicht)

- [ ] Frontend-Build: `pnpm build` (bei Änderungen an `docs/reference/project-structure.md`)
- [ ] TypeScript-Prüfung: `tsc --noEmit` (bei Änderungen an Beispiel-Code-Blöcken)

### Konsistenz-Check (Empfohlen)

- [ ] YAML-Frontmatter in neuen Docs vorhanden (title, description, version)
- [ ] Version entspricht `package.json` (`1.5.0`)
- [ ] Sprache: Deutsch (Projektsprache)
- [ ] Keine Duplikate von Inhalten aus anderen Docs (stattdessen Querverweise)
- [ ] Diátaxis-Struktur eingehalten (Tutorial/How-to/Reference/Explanation)

## 4. Docs-Review vs. Code-Review

Docs-Review unterscheidet sich vom Code-Review in folgenden Punkten:

| Aspekt          | Code-Review                         | Docs-Review                                              |
| --------------- | ----------------------------------- | -------------------------------------------------------- |
| **Prüfziel**    | Korrektheit, Performanz, Sicherheit | Verständlichkeit, Vollständigkeit, Aktualität            |
| **Testbarkeit** | Automatisierte Tests                | Link-Check, manuelle Prüfung                             |
| **Sprache**     | TypeScript/Rust                     | Deutsch (Projektsprache)                                 |
| **Toleranz**    | Keine Toleranz für Fehler           | Toleranz für Stil-Varianten, aber nicht für Faktenfehler |
| **Umfang**      | Vollständiger Diff                  | Fokus auf geänderte Abschnitte + Querverweise            |
| **Reviewer**    | review-agent + Human                | review-agent + Human (bei geschützten Docs)              |

## 5. Regeln für KI-generierte Dokumentation

KI-generierte Dokumentation unterliegt folgenden Regeln:

1. **Muss reviewed werden:** Keine KI-generierte Docs ohne menschliche Prüfung.
2. **Muss projektspezifisch sein:** Keine generischen Platzhalter — alle Pfade, Versionen und Beschreibungen müssen dem tatsächlichen Repository entsprechen.
3. **Keine Halluzinationen:** Nicht existierende Dateien, Funktionen oder Features dürfen nicht beschrieben werden.
4. **Technische Verifikation:** Jeder Code-Block, Pfad und Befehl muss gegen das tatsächliche Repository geprüft werden.
5. **Quellenangabe:** Wenn externe Quellen verwendet werden (z. B. Rust-Dokumentation), muss die Quelle genannt werden.
6. **Kein Duplikat:** Keine Inhalte, die bereits in anderen Docs existieren — stattdessen Querverweise.

> **Konsequenz bei Verstoß:** PR wird abgelehnt. Wiederholte Verstöße führen zu Docs-Sperre für den betroffenen Agenten.

## 6. Technische Verifikation vor Merge

Vor dem Merge einer Docs-Änderung MUSS folgende technische Prüfung durchgeführt werden:

- [ ] Repository gepullt und aktuelle Struktur geladen
- [ ] Alle referenzierten Dateien existieren (Link-Check)
- [ ] Alle referenzierten Funktionen/Komponenten existieren (Code-Check)
- [ ] YAML-Frontmatter valide (title, description, version vorhanden)
- [ ] Keine Widersprüche zu anderen Docs-Dateien
- [ ] Falls Code-Blöcke enthalten: Syntax valide

<!-- END GITHUB_AI_GOVERNANCE -->
