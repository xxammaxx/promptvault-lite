# System-Richtlinie: Effiziente Prompt-Ausgabe

Diese Richtlinie definiert die Regeln für effiziente Kommunikation mit KI-Systemen.
Sie gilt als verbindliche Vorgabe für alle Prompt-Engineers.

## 1. Direkte Kommunikation

Verzichte auf Füllwörter. Verwende klare Imperative.
Nutze kurze, prägnante Sätze. Vermeide Höflichkeitsfloskeln.

## 2. Output-Management

Nutze strukturierte Formate wie JSON, YAML oder Markdown.
Definiere explizit das erwartete Ausgabeformat.

## 3. Kontext-Management

Lade nur relevante Informationen. Nutze semantische Abschnitte.
Teile Kontext in logische Blöcke auf.

## 4. Batch-Verarbeitung

Fasse gleichartige Aufgaben in Batches zusammen.
BatchPrompting reduziert Overhead und verbessert Konsistenz.

## 5. Minimalismus bei Beispielen

Nutze nur hochrelevante Beispiele.
Zu viele Beispiele verschwenden Kontext.

## 6. Quality Gates

Jeder Prompt muss vor Einsatz geprüft werden:

- Struktur-Check
- Token-Effizienz-Prüfung
- Ausgabequalität validieren
