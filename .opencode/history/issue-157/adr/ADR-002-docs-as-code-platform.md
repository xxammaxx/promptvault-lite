# ADR-002: Documentation-as-Code Platform

## Status

Accepted

## Umsetzungshinweis

Die Implementierung wurde am 2026-06-10 abgeschlossen und verifiziert:

- MkDocs + mkdocs-material mit Diátaxis-Struktur vollständig eingerichtet
- `docs_check.py` Qualitätsskript: 11 Prüfroutinen, alle grün
- `mkdocs build --strict`: 0 errors, 3.75s Build-Zeit
- `docs.yml` CI-Workflow: automatischer Build bei jedem Push
- Review-Agent: 0 Blocker, Approval erteilt
- Siehe: `docs/CHANGELOG.md` v1.5.1, `docs/agent/context-manifest-docs-as-code.md`

## Datum

2026-06-10

## Kontext

PromptVault Lite ist eine Tauri-2-Desktop-Applikation (React 18 + TypeScript + Vite Frontend, Rust Backend, SQLite). Die Projektdokumentation liegt derzeit als flache Sammlung von Markdown-Dateien in `docs/` vor:

- `ARCHITECTURE.md`, `CHANGELOG.md`, `INSTALL.md`, `SECURITY_GATES.md`, `TESTING.md`, `USER_GUIDE.md`
- `AI_HANDBUCH.md`, `AI_WORKFLOW.md`, `EVIDENCE_STANDARD.md`, `CONTEXT_ENGINEERING_STANDARD.md`
- `agent/` (Templates fur Kontext-Manifeste, Evidence-Logs, Review-Checklisten)
- `adr/` (Architecture Decision Records)
- `audits/` (Projekt-Audit-Dokumente)

Die Dokumentation ist aktuell **unstrukturiert** — es gibt:

1. **Keine Navigationsstruktur** fur die Nutzerdokumentation (`USER_GUIDE.md`) oder Entwicklerdokumentation (`ARCHITECTURE.md`)
2. **Keine Build-Verifikation** — defekte Links oder unvollstandige Cross-References fallen erst beim manuellen Lesen auf
3. **Keine Suchfunktion** — Nutzer mussen Dateien einzeln durchlesen, um Informationen zu finden
4. **Keine KI/RAG-Optimierung** — es gibt keine standardisierte `llms.txt` fur RAG-Systeme oder einheitliche KI-freundliche Metadaten
5. **Risiko von Drift** — Dokumente konnen inkonsistent werden, da es keine Single Source fur die Struktur gibt

Das Projekt folgt dem **Diataxis-Framework** (Tutorials, How-to Guides, Technical Reference, Explanation) und benotigt eine Plattform, die diese Struktur unterstutzt.

### Projekt-Randbedingungen

| Kriterium                | Wert                                             |
| ------------------------ | ------------------------------------------------ |
| Package-Manager          | pnpm (kein pip/poetry/Python im Haupt-Toolchain) |
| CI                       | GitHub Actions (ci.yml, ai-governance-check.yml) |
| Plattformen              | Windows, macOS, Linux                            |
| Anforderungen            | Keine schwergewichtigen Abhangigkeiten           |
| React/MDX                | Nicht benotigt                                   |
| API-Doku-Autogenerierung | Nicht benotigt (kein Python-Projekt)             |

**Wichtig:** GitHub Actions verwendet bereits Python fur den `ai-governance-check.yml` Workflow (`scripts/check_ai_governance.py`), sodass eine Python-basierte Docs-Toolchain im CI kein neues Okosystem einfuhrt.

## Entscheidung

**MkDocs mit mkdocs-material wird als Documentation-as-Code-Plattform eingefuhrt.**

MkDocs ist ein statischer Site-Generator fur Markdown-basierte Dokumentation. In Kombination mit dem `mkdocs-material`-Theme bietet es:

- **Markdown-nativ** — alle bestehenden `docs/*.md`-Dateien bleiben ohne Konvertierung gultig
- **Automatische Navigation** — konfiguriert uber `mkdocs.yml`
- **Volltextsuche** — clientseitig, ohne externe Abhangigkeiten
- **Mermaid-Diagramm-Support** — relevant fur `ARCHITECTURE.md`-Diagramme
- **GitHub Pages Deployment** — nahtlose Integration mit CI
- **Plugin-Okosystem** — `mkdocs-autolinks-plugin` fur Link-Verifikation, `mkdocs-llms-txt` fur KI/RAG
- **Diataxis-tauglich** — `mkdocs.yml` kann Tutorials, How-Tos, Reference und Explanation als eigene Sektionen modellieren

### Begrundung der Entscheidung

1. **Minimale Toolchain-Zusatzbelastung:** Python wird bereits im CI verwendet (`ai-governance-check.yml`). Lokal muss ein Entwickler nur `pip install mkdocs-material` ausfuhren (optional — der CI-Build erfolgt automatisch).
2. **Keine Konvertierungsarbeit:** Alle bestehenden Markdown-Dateien bleiben erhalten. `mkdocs.yml` definiert nur die Struktur.
3. **Zukunftssicher:** KI/RAG-Optimierung uber `llms.txt`-Plugin, Diataxis uber Ordnerstruktur.
4. **Bewahrtes Okosystem:** mkdocs-material ist mit uber 20.000 GitHub-Stars das meistgenutzte Docs-Tool fur technische Projekte.
5. **CI-kompatibel:** Ein dedizierter `docs.yml`-Workflow baut und deployed die Dokumentation.

## Alternativen

### Alternative 1: Docusaurus

| Aspekt            | Bewertung                                               |
| ----------------- | ------------------------------------------------------- |
| Technologie       | Node.js / React                                         |
| Package-Manager   | npm/yarn/pnpm (kompatibel mit Projekt)                  |
| MDX-Support       | Ja (nicht benotigt)                                     |
| Suchfunktion      | Algolia (benotigt externen Service) oder lokales Plugin |
| Build-Komplexitat | Hoch — React-Build-Pipeline, Client-seitiges Routing    |
| Ressourcen        | ~500 MB node_modules zusatzlich                         |

**Verworfen, weil:** Docusaurus ist auf React/MDX-Dokumentation mit interaktiven Komponenten ausgelegt — ein Overkill fur ein Projekt, das explizit keine interaktiven Docs benotigt. Die Node.js-Build-Pipeline fugt unnotige Komplexitat hinzu (SSR, Hydration), die bei MkDocs vollstandig entfallt. Algolia als empfohlene Suchlosung benotigt einen externen Service, was dem local-first-Prinzip des Projekts widerspricht.

### Alternative 2: Sphinx

| Aspekt            | Bewertung                                        |
| ----------------- | ------------------------------------------------ |
| Technologie       | Python                                           |
| Primarformat      | reStructuredText (rST)                           |
| Markdown-Support  | Nur uber MyST-Parser (zusatzliche Konfiguration) |
| API-Dokumentation | Hervorragend (autodoc, napoleon)                 |
| Thema             | Read the Docs (funktional, aber weniger modern)  |

**Verworfen, weil:** Sphinx ist primar auf rST und Python-API-Dokumentation ausgerichtet. Alle bestehenden Docs mussten nach rST konvertiert oder uber MyST-Parser umstandlich eingebunden werden. Das Projekt hat keine Python-API und keinen Bedarf an autodoc-Funktionalitat. Sphinx lost ein Problem (Python-API-Dokumentation), das dieses Projekt nicht hat.

### Alternative 3: Wiki.js

| Aspekt          | Bewertung                                          |
| --------------- | -------------------------------------------------- |
| Technologie     | Node.js                                            |
| Datenbank       | PostgreSQL / MySQL / SQLite erforderlich           |
| Source of Truth | Datenbank (nicht Git)                              |
| Synchronisation | Git-Backend optional, aber zusatzlicher Sync-Layer |

**Verworfen, weil:** Wiki.js speichert Inhalte standardmaBig in einer Datenbank — dies kollidiert mit dem ADR-001-Prinzip "GitHub is Single Source of Truth". Die Git-Synchronisation ist ein zusatzlicher, fehleranfalliger Layer. Ein Wiki-Server musste betrieben werden (kein Static-Site-Deployment). Zusatzliche Infrastruktur widerspricht dem local-first-Ansatz.

### Alternative 4: Plain GitHub-only Docs (Status Quo beibehalten)

| Aspekt           | Bewertung                         |
| ---------------- | --------------------------------- |
| Anderungen       | Keine                             |
| Navigation       | Manuelles Durchsuchen von Dateien |
| Suche            | Nur GitHub-eigene Suche           |
| Link-Validierung | Nicht vorhanden                   |
| Drift-Risiko     | Hoch — keine strukturellen Guards |

**Verworfen, weil:** Der Status quo adressiert keines der genannten Probleme. Ohne Navigation, Suche und Link-Validierung wird die Dokumentation mit wachsender GroBe unwartbar. KI/RAG-Systeme finden keine standardisierte Einstiegsstruktur. Das Projekt erreicht eine GroBe, bei der strukturierte Dokumentation notwendig wird.

## Konsequenzen

### Positiv

- **Strukturierte Navigation:** Nutzer finden Informationen schneller uber eine durchdachte `mkdocs.yml`-Struktur
- **Suchfunktion:** Volltextsuche uber alle Docs ohne externe Abhangigkeiten
- **Link-Validierung in CI:** `mkdocs build --strict` scheitert bei defekten Links — Drift wird sofort erkannt
- **KI/RAG-freundlich:** `llms.txt`-Plugin generiert automatisch eine maschinenlesbare Dokumentationsubersicht
- **Diataxis-konform:** Ordnerstruktur (`tutorials/`, `how-to/`, `reference/`, `explanation/`) bildet das Framework ab
- **Automatisches Deployment:** GitHub Pages deployment uber CI — keine manuellen Schritte
- **Minimale Abhangigkeit:** Python lauft bereits im CI; lokal optional
- **Markdown-native:** Alle bestehenden Dateien bleiben unverandert

### Negativ

- **Initiale Restrukturierung:** `docs/` muss nach Diataxis reorganisiert werden (einmaliger Aufwand)
- **Python-Abhangigkeit fur lokale Vorschau:** Entwickler mussen `mkdocs serve` ausfuhren konnen (ein `pip install`)
- **CI-Wartung:** Ein neuer `docs.yml`-Workflow muss gepflegt werden
- **GitHub Pages Abhangigkeit:** Deployment ist an GitHub gebunden (aber Projekt ist ohnehin auf GitHub)

### Neutrale Punkte

- Mermaid-Diagramme erfordern zusatzliche Markdown-Fenced-Blocks (` ```mermaid `) — `ARCHITECTURE.md` verwendet bereits dieses Format, daher keine Anderung notig
- Der Python-Build im CI fuhrt kein neues Okosystem ein, da `ai-governance-check.yml` bereits Python nutzt

## Bewertung

| Kriterium              | MkDocs | Docusaurus | Sphinx | Wiki.js | Status Quo |
| ---------------------- | ------ | ---------- | ------ | ------- | ---------- |
| Markdown-nativ         | ++     | +          | -      | o       | ++         |
| Toolchain-Gewicht      | +      | --         | o      | -       | ++         |
| Navigation/Suche       | ++     | ++         | +      | +       | --         |
| Diataxis-Unterstutzung | ++     | +          | o      | -       | --         |
| KI/RAG (llms.txt)      | ++     | -          | -      | -       | --         |
| CI-Integration         | ++     | +          | +      | --      | ++         |
| Static-Site-Deployment | ++     | ++         | ++     | --      | n/a        |
| Link-Validierung       | ++     | +          | +      | -       | --         |
| Local-First-Prinzip    | ++     | +          | +      | -       | ++         |

**Legende:** ++ sehr gut | + gut | o neutral | - schlecht | -- sehr schlecht

Die Tabelle zeigt: MkDocs ist die einzige Losung, die in allen bewerteten Kriterien positiv abschneidet, ohne in einem Kriterium deutliche Nachteile zu haben. Docusaurus und Sphinx sind in ihren primaren Starken (React-Interaktivitat bzw. Python-API-Docs) fur dieses Projekt nicht relevant. Wiki.js widerspricht fundamentalen Architekturprinzipien. Der Status quo ist in den kritischen Bereichen Navigation, Suche und Drift-Pravention unzureichend.

## Implementierungsplan

### Phase 1: Initiale Einrichtung (Issue #53)

1. **`mkdocs.yml` erstellen** mit:
   - `site_name: PromptVault Lite`
   - Material-Theme mit Navigation, Suche, Dark Mode
   - Diataxis-konforme Navigation: `Tutorials`, `How-to Guides`, `Reference`, `Explanation`
   - Mermaid-Plugin fur Diagramme
   - `mkdocs-llmstxt` Plugin fur KI/RAG-Integration
2. **`docs/` umstrukturieren:**
   ```
   docs/
   ├── index.md (Startseite)
   ├── tutorials/ (Diataxis: Tutorials)
   │   └── getting-started.md
   ├── how-to/ (Diataxis: How-to Guides)
   │   ├── install.md
   │   └── testing.md
   ├── reference/ (Diataxis: Technical Reference)
   │   ├── architecture.md
   │   ├── security-gates.md
   │   └── adr/
   ├── explanation/ (Diataxis: Explanation)
   │   ├── ai-handbook.md
   │   ├── ai-workflow.md
   │   └── governance/
   └── agent/ (unverandert, referenziert)
   ```
3. **GitHub Actions `docs.yml` erstellen:**
   - Checkout + Python-Setup
   - `pip install mkdocs-material mkdocs-llmstxt`
   - `mkdocs build --strict` (fehlschlagen bei defekten Links)
   - Deployment zu GitHub Pages (nur auf `main`)
4. **`llms.txt` generieren:** Automatisch uber Plugin bei jedem Docs-Build
5. **`docs/README.md` als Redirect:** Punkt auf `mkdocs build`-Ausgabe oder `index.md`

### Phase 2: CI-Integration

- Neuen `docs.yml` Workflow parallel zu bestehendem CI
- `mkdocs build --strict` als Pflicht-Check (wie `tsc --noEmit`)

### Phase 3: Deployment

- GitHub Pages aktivieren
- Deployment nur bei Push auf `main`
- `CNAME`-Datei fur Custom Domain (falls gewunscht)

## Referenzen

- [MkDocs Material Dokumentation](https://squidfunk.github.io/mkdocs-material/) — Theme-Dokumentation
- [Diataxis Framework](https://diataxis.fr/) — Dokumentations-Framework
- [mkdocs-llmstxt Plugin](https://github.com/opendocsgmbh/mkdocs-llmstxt) — KI/RAG-Integration
- `docs/ARCHITECTURE.md` — Projektarchitektur und Technologieentscheidungen
- `docs/adr/ADR-001-ai-governance.md` — GitHub Single Source of Truth Prinzip
- `.github/workflows/ai-governance-check.yml` — bestehendes Python-CI-Pattern
- `.github/workflows/ci.yml` — bestehendes CI-Setup
