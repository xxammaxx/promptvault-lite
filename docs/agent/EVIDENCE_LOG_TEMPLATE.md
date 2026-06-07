# Evidence Log

> **Pflichtdokument für jeden KI-Agenten-Lauf.**  
> Jede Aussage muss einer Evidence-Kategorie zugeordnet werden.  
> Keine Behauptung ohne Beleg.

---

## Evidence-Kategorien

### Belegte Tatsache _(verified fact)_

Eine Aussage, die durch reproduzierbare Tests, Logs oder Source-Code-Analyse bestätigt wurde.

**Anforderungen:**

- Konkrete Quellenangabe (Datei, Test, Commit, Log)
- Reproduzierbar durch Dritte
- Kein Interpretationsspielraum

### Getestete Implementierung _(tested implementation)_

Eine Aussage über Code, der durch automatisierte Tests abgedeckt ist.

**Anforderungen:**

- Testname oder Testdatei
- Testausgabe (bestanden/fehlgeschlagen)
- Datum der Testausführung

### Plausible Annahme _(reasonable assumption)_

Eine Aussage, die aus verfügbaren Informationen logisch folgt, aber nicht formal verifiziert wurde.

**Anforderungen:**

- Grundlage der Annahme benennen
- Confidence-Level angeben (HIGH/MEDIUM/LOW)
- Risiko bei Fehlannahme beschreiben

### Vendor-Claim _(vendor claim)_

Eine Aussage, die aus externer Dokumentation, API-Referenz oder Herstellerangabe stammt.

**Anforderungen:**

- Quelle (URL, Dokument, Version)
- Datum des Abrufs
- Hinweis: „Kann ohne Ankündigung abweichen"

### Hypothese _(hypothesis)_

Eine unbewiesene Vermutung, die weiterer Untersuchung bedarf.

**Anforderungen:**

- Als „unbewiesen" kennzeichnen
- Nötige Verifikationsschritte benennen
- Nicht als Grundlage für Sicherheits- oder Architekturentscheidungen verwenden

### Offenes Risiko _(open risk)_

Ein identifiziertes Risiko, das noch nicht adressiert wurde.

**Anforderungen:**

- Risikobeschreibung
- Potenzielle Auswirkungen
- Empfohlene Maßnahme
- Priorität (HIGH/MEDIUM/LOW)

---

## Evidence-Tabelle

| ID  | Kategorie     | Aussage     | Quelle                    | Datum       | Confidence | Verifiziert |
| --- | ------------- | ----------- | ------------------------- | ----------- | ---------- | ----------- |
| E1  | `<KATEGORIE>` | `<AUSSAGE>` | `<DATEI/TEST/COMMIT/URL>` | `<ISO8601>` | `<LEVEL>`  | ✅/❌/⚠️    |
| E2  |               |             |                           |             |            |             |
| E3  |               |             |                           |             |            |             |

---

## Quellenverzeichnis

### Dateien

| Ref | Pfad     | Zeilen     | Hash (optional) |
| --- | -------- | ---------- | --------------- |
| F1  | `<PFAD>` | `<ZEILEN>` | `<SHA256>`      |

### Tests

| Ref | Test         | Befehl     | Ergebnis | Datum       |
| --- | ------------ | ---------- | -------- | ----------- |
| T1  | `<TESTNAME>` | `<BEFEHL>` | ✅/❌    | `<ISO8601>` |

### Commits

| Ref | Hash     | Nachricht     | Datum       |
| --- | -------- | ------------- | ----------- |
| C1  | `<HASH>` | `<NACHRICHT>` | `<ISO8601>` |

### Issues / PRs

| Ref | Nummer      | Titel     | Status     |
| --- | ----------- | --------- | ---------- |
| I1  | `#<NUMMER>` | `<TITEL>` | `<STATUS>` |

### Logs

| Ref | Pfad     | Zeitraum     | Relevanter Ausschnitt |
| --- | -------- | ------------ | --------------------- |
| L1  | `<PFAD>` | `<ZEITRAUM>` | `<AUSSCHNITT>`        |

### Screenshots / Traces

| Ref | Pfad     | Beschreibung     |
| --- | -------- | ---------------- |
| S1  | `<PFAD>` | `<BESCHREIBUNG>` |

### Externe Quellen

| Ref | URL     | Titel     | Abrufdatum  |
| --- | ------- | --------- | ----------- |
| X1  | `<URL>` | `<TITEL>` | `<ISO8601>` |

---

## Befehlsausgaben (Rohdaten)

### Testausgaben

```
<VOLLSTÄNDIGE TESTAUSGABE>
```

### Lint-Ausgaben

```
<VOLLSTÄNDIGE LINT-AUSGABE>
```

### Build-Ausgaben

```
<VOLLSTÄNDIGE BUILD-AUSGABE>
```

### Weitere Befehlsausgaben

```
<AUSGABE>
```

---

## Risiko-Log

| ID  | Risiko     | Kategorie               | Auswirkung     | Wahrscheinlichkeit     | Maßnahme      | Status                      |
| --- | ---------- | ----------------------- | -------------- | ---------------------- | ------------- | --------------------------- |
| R1  | `<RISIKO>` | Security/Arch/Data/Perf | `<AUSWIRKUNG>` | `<WAHRSCHEINLICHKEIT>` | `<MASSNAHME>` | Offen/Adressiert/Akzeptiert |

---

## Entscheidungs-Log

| ID  | Entscheidung     | Begründung     | Alternativen     | Datum       |
| --- | ---------------- | -------------- | ---------------- | ----------- |
| D1  | `<ENTSCHEIDUNG>` | `<BEGRÜNDUNG>` | `<ALTERNATIVEN>` | `<ISO8601>` |

---

> **Hinweis:** Dieses Log ist Teil des Evidence-Trails. Es darf nicht nachträglich verändert werden.  
> Ablage: `docs/agent/evidence-log-<ISSUE>-<DATUM>.md`
