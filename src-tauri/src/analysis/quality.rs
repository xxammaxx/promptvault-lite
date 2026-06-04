use crate::models::{EvaluationCriterion, PromptEvaluation};
use regex::Regex;

// =============================================================================
// Prompt-Qualitätsanalyse — Regelbasierte 10-Kriterien-Bewertung
// =============================================================================

/// Führt eine vollständige Qualitätsanalyse eines Prompts durch.
pub fn evaluate_prompt(content: &str, prompt_id: &str) -> PromptEvaluation {
    let mut evaluation = PromptEvaluation::new(prompt_id.to_string());

    // Sonderfall: Leerer Prompt
    if content.trim().is_empty() {
        evaluation.overall_score = 0;
        evaluation.missing_sections = vec![
            "Rollendefinition".into(),
            "Zieldefinition".into(),
            "Kontextqualität".into(),
            "Eingabendefinition".into(),
            "Vorgehensbeschreibung".into(),
            "Ausgabeformat".into(),
            "Qualitätsanforderungen".into(),
            "Sicherheitsgrenzen".into(),
            "Klarheit".into(),
            "Wiederverwendbarkeit".into(),
        ];
        evaluation.criteria = vec![
            EvaluationCriterion {
                name: "Rollendefinition".into(),
                score: 0,
                max_score: 10,
                weight: 0.12,
                details: "Kein Inhalt".into(),
            },
            EvaluationCriterion {
                name: "Zieldefinition".into(),
                score: 0,
                max_score: 10,
                weight: 0.14,
                details: "Kein Inhalt".into(),
            },
            EvaluationCriterion {
                name: "Kontextqualität".into(),
                score: 0,
                max_score: 10,
                weight: 0.11,
                details: "Kein Inhalt".into(),
            },
            EvaluationCriterion {
                name: "Eingabendefinition".into(),
                score: 0,
                max_score: 10,
                weight: 0.10,
                details: "Kein Inhalt".into(),
            },
            EvaluationCriterion {
                name: "Vorgehensbeschreibung".into(),
                score: 0,
                max_score: 10,
                weight: 0.12,
                details: "Kein Inhalt".into(),
            },
            EvaluationCriterion {
                name: "Ausgabeformat".into(),
                score: 0,
                max_score: 10,
                weight: 0.10,
                details: "Kein Inhalt".into(),
            },
            EvaluationCriterion {
                name: "Qualitätsanforderungen".into(),
                score: 0,
                max_score: 10,
                weight: 0.08,
                details: "Kein Inhalt".into(),
            },
            EvaluationCriterion {
                name: "Sicherheitsgrenzen".into(),
                score: 0,
                max_score: 10,
                weight: 0.08,
                details: "Kein Inhalt".into(),
            },
            EvaluationCriterion {
                name: "Klarheit".into(),
                score: 0,
                max_score: 10,
                weight: 0.08,
                details: "Kein Inhalt".into(),
            },
            EvaluationCriterion {
                name: "Wiederverwendbarkeit".into(),
                score: 0,
                max_score: 10,
                weight: 0.09,
                details: "Kein Inhalt".into(),
            },
        ];
        return evaluation;
    }

    let mut total_weighted_score: f64 = 0.0;
    let mut total_weight: f64 = 0.0;

    let criteria = [
        evaluate_role_definition(content),
        evaluate_goal_definition(content),
        evaluate_context_quality(content),
        evaluate_input_definition(content),
        evaluate_procedure_definition(content),
        evaluate_output_format(content),
        evaluate_quality_requirements(content),
        evaluate_security_boundaries(content),
        evaluate_clarity(content),
        evaluate_reusability(content),
    ];

    let mut missing: Vec<String> = Vec::new();

    for criterion in &criteria {
        total_weighted_score += criterion.score as f64 * criterion.weight;
        total_weight += criterion.weight;

        if criterion.score < 3 {
            missing.push(criterion.name.clone());
        }
    }

    let overall_score = if total_weight > 0.0 {
        ((total_weighted_score / total_weight) * 10.0)
            .round()
            .clamp(0.0, 100.0) as u8
    } else {
        0
    };

    evaluation.criteria = criteria.to_vec();
    evaluation.overall_score = overall_score;
    evaluation.missing_sections = missing;
    evaluation.recommendations = generate_quality_recommendations(&evaluation.criteria);

    evaluation
}

// -----------------------------------------------------------------------------
// Kriterium 1: Rollendefinition
// -----------------------------------------------------------------------------

fn evaluate_role_definition(content: &str) -> EvaluationCriterion {
    let role_patterns = [
        r"(?i)(du\s+bist|agiere\s+als|handle\s+als|you\s+are|act\s+as|you\s+act\s+as)\s+(ein[er]?\s+)?[\w\s\-/]+",
        r"(?i)(rolle|role)\s*:\s*.+",
        r"(?i)(deine\s+rolle|your\s+role)",
        r"(?i)(ich\s+möchte\s+dass\s+du|i\s+want\s+you\s+to)",
    ];

    let (found, count) = count_pattern_matches(content, &role_patterns);

    let score = if count >= 2 {
        10
    } else if found {
        7
    } else {
        2
    };

    let details = if score >= 7 {
        "Rolle klar definiert — der Prompt weist dem LLM eine eindeutige Identität zu.".into()
    } else if found {
        "Rolle teilweise erkennbar — könnte expliziter formuliert sein.".into()
    } else {
        "Keine Rollendefinition gefunden — definiere, als was das LLM agieren soll (z.B. »Du bist ein Senior Developer«).".into()
    };

    EvaluationCriterion {
        name: "Rollendefinition".into(),
        score,
        max_score: 10,
        weight: 0.12,
        details,
    }
}

// -----------------------------------------------------------------------------
// Kriterium 2: Zieldefinition
// -----------------------------------------------------------------------------

fn evaluate_goal_definition(content: &str) -> EvaluationCriterion {
    let goal_patterns = [
        r"(?i)(ziel|goal|aufgabe|task|zweck|purpose)\s*(ist|:)\s*.+",
        r"(?i)(deine\s+aufgabe|your\s+task|dein\s+ziel)",
        r"(?i)(sollst|soll|musst|must|should)\s+.{10,}",
        r"(?i)(erwarte|erwartet|expected|expect)",
    ];

    let (found, count) = count_pattern_matches(content, &goal_patterns);

    // Zusätzlich: Prüfe ob die erste Zeile nach Überschriften ein Ziel beschreibt
    let has_goal_statement = content.lines().any(|line| {
        let trimmed = line.trim().to_lowercase();
        (trimmed.contains("ziel")
            || trimmed.contains("aufgabe")
            || trimmed.contains("goal")
            || trimmed.contains("task"))
            && trimmed.len() > 20
    });

    let score = if count >= 2 && has_goal_statement {
        10
    } else if found || has_goal_statement {
        6
    } else {
        2
    };

    let details = if score >= 10 {
        "Ziel präzise definiert — das LLM weiß genau, was es erreichen soll.".into()
    } else if score >= 6 {
        "Ziel erkennbar, aber könnte klarer formuliert sein.".into()
    } else {
        "Kein klares Ziel erkennbar — formuliere explizit, was der Prompt bewirken soll.".into()
    };

    EvaluationCriterion {
        name: "Zieldefinition".into(),
        score,
        max_score: 10,
        weight: 0.14,
        details,
    }
}

// -----------------------------------------------------------------------------
// Kriterium 3: Kontextqualität
// -----------------------------------------------------------------------------

fn evaluate_context_quality(content: &str) -> EvaluationCriterion {
    let context_patterns = [
        r"(?i)(hintergrund|background|kontext|context|umgebung|environment)",
        r"(?i)(projekt\s*(beschreibung|info|details)|project\s*(description|info|details))",
        r"(?i)(technologie|techstack|framework|sprache|language)",
        r"(?i)(domäne|domain|fachbereich|branche)",
    ];

    let (_found, count) = count_pattern_matches(content, &context_patterns);

    // Prüfe Textlänge — längere Prompts haben tendenziell mehr Kontext
    let content_length = content.len();
    let length_bonus = if content_length > 2000 {
        2
    } else if content_length > 500 {
        1
    } else {
        0
    };

    let score = (count as u8 * 2 + length_bonus).min(10);

    let details = if score >= 8 {
        "Ausreichend Kontext vorhanden — das LLM versteht den Anwendungsfall.".into()
    } else if score >= 5 {
        "Etwas Kontext vorhanden — mehr Hintergrundinformationen würden die Qualität verbessern."
            .into()
    } else {
        "Wenig bis kein Kontext — füge Hintergrundinformationen, Technologie-Stack und Domänenwissen hinzu.".into()
    };

    EvaluationCriterion {
        name: "Kontextqualität".into(),
        score,
        max_score: 10,
        weight: 0.11,
        details,
    }
}

// -----------------------------------------------------------------------------
// Kriterium 4: Eingabendefinition
// -----------------------------------------------------------------------------

fn evaluate_input_definition(content: &str) -> EvaluationCriterion {
    let input_patterns = [
        r"(?i)(eingabe|input|parameter|argumente?|arguments?)",
        r"(?i)(folgende\s+(datei|daten|information|input)|the\s+following\s+(file|data|input))",
        r"(?i)(\{[A-Z_]+\})", // Platzhalter wie {FILE_PATH}
        r"(?i)(erwartet\s+(wird|werden)\s+folgende|expects?\s+the\s+following)",
    ];

    let (found, count) = count_pattern_matches(content, &input_patterns);

    // Prüfe auf Variablen/Platzhalter
    let has_placeholders = Regex::new(r"\{\w+\}").unwrap().is_match(content);

    let score = if count >= 2 && has_placeholders {
        10
    } else if found || has_placeholders {
        7
    } else if count >= 1 {
        4
    } else {
        1
    };

    let details = if score >= 7 {
        "Eingaben klar definiert mit Platzhaltern — das LLM weiß, welche Daten es erwartet.".into()
    } else if found {
        "Eingaben teilweise definiert — verwende Platzhalter wie {INPUT} für Variablen.".into()
    } else {
        "Keine Eingaben definiert — beschreibe, welche Informationen das LLM benötigt.".into()
    };

    EvaluationCriterion {
        name: "Eingabendefinition".into(),
        score,
        max_score: 10,
        weight: 0.10,
        details,
    }
}

// -----------------------------------------------------------------------------
// Kriterium 5: Vorgehensbeschreibung
// -----------------------------------------------------------------------------

fn evaluate_procedure_definition(content: &str) -> EvaluationCriterion {
    let procedure_patterns = [
        r"(?i)(vorgehen|vorgehensweise|schritt|step|anleitung|ablauf|procedure|workflow)",
        r"(?i)(^\d+\.\s+.+$)", // Nummerierte Schritte
        r"(?i)(zuerst|dann|danach|anschließend|first|then|next|finally)",
        r"(?i)(phase|stufe|etappe|stage)",
    ];

    let (found, count) = count_pattern_matches(content, &procedure_patterns);

    // Zähle nummerierte Listen-Einträge
    let numbered_steps = Regex::new(r"^\d+\.\s+").unwrap();
    let step_count = content
        .lines()
        .filter(|l| numbered_steps.is_match(l))
        .count();

    let score = if step_count >= 3 {
        10
    } else if step_count >= 1 || count >= 2 {
        7
    } else if found {
        4
    } else {
        1
    };

    let details = if score >= 7 {
        format!("Vorgehen strukturiert beschrieben ({} nummerierte Schritte) — das LLM kann systematisch arbeiten.", step_count)
    } else if found {
        "Ansatzweise ein Ablauf erkennbar — strukturiere mit nummerierten Schritten.".into()
    } else {
        "Kein Vorgehen definiert — beschreibe Schritt für Schritt, wie das LLM vorgehen soll."
            .into()
    };

    EvaluationCriterion {
        name: "Vorgehensbeschreibung".into(),
        score,
        max_score: 10,
        weight: 0.12,
        details,
    }
}

// -----------------------------------------------------------------------------
// Kriterium 6: Ausgabeformat
// -----------------------------------------------------------------------------

fn evaluate_output_format(content: &str) -> EvaluationCriterion {
    let output_patterns = [
        r"(?i)(ausgabe|output|ergebnis|result|antwort|response|format)",
        r"(?i)(gib\s+(mir\s+)?(das\s+ergebnis|die\s+antwort)\s+(in|als|im))",
        r"(?i)(json|markdown|yaml|xml|csv|tabelle|table|liste|list)",
        r"(?i)(struktur|schema|template|vorlage)",
        r"```[\w]*\n[\s\S]*?\n```", // Beispiel-Codeblöcke für Ausgabeformat
    ];

    let (found, count) = count_pattern_matches(content, &output_patterns);

    let has_output_example = Regex::new(r"(?i)(beispiel|example).*(ausgabe|output|ergebnis)")
        .unwrap()
        .is_match(content);

    let score = if count >= 2 && has_output_example {
        10
    } else if count >= 2 {
        7
    } else if found {
        4
    } else {
        1
    };

    let details = if score >= 7 {
        "Ausgabeformat definiert — das LLM weiß, in welcher Form es antworten soll.".into()
    } else if found {
        "Ausgabeformat angedeutet — spezifiziere das gewünschte Format (JSON, Markdown, Tabelle etc.).".into()
    } else {
        "Kein Ausgabeformat definiert — beschreibe das erwartete Format der Antwort.".into()
    };

    EvaluationCriterion {
        name: "Ausgabeformat".into(),
        score,
        max_score: 10,
        weight: 0.10,
        details,
    }
}

// -----------------------------------------------------------------------------
// Kriterium 7: Qualitätsanforderungen
// -----------------------------------------------------------------------------

fn evaluate_quality_requirements(content: &str) -> EvaluationCriterion {
    let quality_patterns = [
        r"(?i)(qualität|quality|prüfe|überprüfe|check|verify|validate|teste)",
        r"(?i)(korrekt|richtig|vollständig|correct|complete|accurate)",
        r"(?i)(fehler|error|bug|mangel|issue)",
        r"(?i)(akzeptanzkriterien|acceptance criteria|definition of done)",
    ];

    let (found, count) = count_pattern_matches(content, &quality_patterns);

    let score = if count >= 3 {
        8
    } else if count >= 2 {
        6
    } else if found {
        3
    } else {
        1
    };

    let details = if score >= 6 {
        "Qualitätsanforderungen vorhanden — der Prompt enthält Prüfkriterien.".into()
    } else if found {
        "Einige Qualitätshinweise vorhanden — ergänze explizite Prüfkriterien.".into()
    } else {
        "Keine Qualitätsanforderungen — definiere Akzeptanzkriterien oder Prüfschritte.".into()
    };

    EvaluationCriterion {
        name: "Qualitätsanforderungen".into(),
        score,
        max_score: 10,
        weight: 0.08,
        details,
    }
}

// -----------------------------------------------------------------------------
// Kriterium 8: Sicherheitsgrenzen
// -----------------------------------------------------------------------------

fn evaluate_security_boundaries(content: &str) -> EvaluationCriterion {
    let security_patterns = [
        r"(?i)(nicht|kein|verboten|darfst\s+nicht|sollst\s+nicht|do\s+not|must\s+not|never|don't)",
        r"(?i)(sicherheit|security|datenschutz|privacy|geheim|secret|vertraulich)",
        r"(?i)(einschränkung|beschränkung|grenze|limit|restriction|boundary|guardrail)",
        r"(?i)(ausschließen|vermeiden|unterlassen|exclude|avoid|refrain)",
    ];

    let (found, count) = count_pattern_matches(content, &security_patterns);

    let score = if count >= 3 {
        8
    } else if count >= 2 {
        5
    } else if found {
        3
    } else {
        1
    };

    let details = if score >= 5 {
        "Sicherheitsgrenzen definiert — der Prompt begrenzt unerwünschtes Verhalten.".into()
    } else if found {
        "Einige Einschränkungen vorhanden — definiere explizit, was das LLM NICHT tun soll.".into()
    } else {
        "Keine Sicherheitsgrenzen — ergänze Guardrails (z.B. »Gib niemals persönliche Daten aus«)."
            .into()
    };

    EvaluationCriterion {
        name: "Sicherheitsgrenzen".into(),
        score,
        max_score: 10,
        weight: 0.08,
        details,
    }
}

// -----------------------------------------------------------------------------
// Kriterium 9: Klarheit
// -----------------------------------------------------------------------------

fn evaluate_clarity(content: &str) -> EvaluationCriterion {
    let lines: Vec<&str> = content.lines().collect();
    let total_lines = lines.len();

    if total_lines == 0 {
        return EvaluationCriterion {
            name: "Klarheit".into(),
            score: 0,
            max_score: 10,
            weight: 0.08,
            details: "Leerer Prompt — keine Bewertung möglich.".into(),
        };
    }

    // Durchschnittliche Zeilenlänge (optimal: 40-100 Zeichen)
    let avg_line_len: f64 = lines.iter().map(|l| l.len() as f64).sum::<f64>() / total_lines as f64;
    let line_len_score = if avg_line_len > 30.0 && avg_line_len < 120.0 {
        4
    } else if avg_line_len > 10.0 && avg_line_len < 200.0 {
        2
    } else {
        0
    };

    // Überschriften-Struktur
    let has_h1 = lines.iter().any(|l| l.starts_with("# "));
    let has_h2 = lines.iter().any(|l| l.starts_with("## "));
    let structure_score = match (has_h1, has_h2) {
        (true, true) => 4,
        (true, false) => 3,
        (false, true) => 2,
        (false, false) => 0,
    };

    // Absätze (nicht-leere Zeilen nach Leerzeilen)
    let paragraph_count = count_paragraphs(&lines);
    let paragraph_score = if paragraph_count >= 3 {
        2
    } else if paragraph_count >= 1 {
        1
    } else {
        0
    };

    let score = (line_len_score + structure_score + paragraph_score).min(10);

    let details = format!(
        "Klarheit: {}/10 (Zeilenlänge Ø{:.0} Zeichen, {} Absätze, Überschriften: {})",
        score,
        avg_line_len,
        paragraph_count,
        if has_h1 && has_h2 {
            "H1+H2"
        } else if has_h1 {
            "nur H1"
        } else if has_h2 {
            "nur H2"
        } else {
            "keine"
        }
    );

    EvaluationCriterion {
        name: "Klarheit".into(),
        score,
        max_score: 10,
        weight: 0.08,
        details,
    }
}

// -----------------------------------------------------------------------------
// Kriterium 10: Wiederverwendbarkeit
// -----------------------------------------------------------------------------

fn evaluate_reusability(content: &str) -> EvaluationCriterion {
    // Negativ-Indikatoren (projektspezifisch → schlecht wiederverwendbar)
    let specific_patterns = [
        r"(?i)(positron|mietvisor|civipet|promptvault)", // Eigennamen
        r"(?i)(github\.com/[\w\-]+/[\w\-]+)",            // Repository-Links
        r"(?i)(/home/\w+|C:\\)",                         // Absolute Pfade
        r"(?i)(issue\s+#\d+|pr\s+#\d+|bug\s+#\d+)",      // Issue-Referenzen
    ];

    let (_specific_found, specific_count) = count_pattern_matches(content, &specific_patterns);

    // Positiv-Indikatoren (generisch → gut wiederverwendbar)
    let generic_patterns = [
        r"\{[A-Z_]+\}", // Platzhalter
        r"(?i)(das\s+(angegebene|übergebene|bereitgestellte)\s+\w+)",
        r"(?i)(the\s+(provided|given|specified)\s+\w+)",
    ];

    let (generic_found, generic_count) = count_pattern_matches(content, &generic_patterns);

    // Score: Start bei 10, Abzüge für Spezifität, Boni für Generik
    let mut score: i32 = 5; // Basis

    score -= (specific_count as i32 * 2).min(4);
    score += generic_count as i32 * 2;

    // Bonus für Platzhalter
    if generic_found {
        score += 2;
    }

    let score = score.clamp(0, 10) as u8;

    let details = if score >= 8 {
        "Gut wiederverwendbar — der Prompt ist generisch formuliert und verwendet Platzhalter."
            .into()
    } else if score >= 5 {
        "Bedingt wiederverwendbar — einige projektspezifische Referenzen vorhanden.".into()
    } else {
        "Schlecht wiederverwendbar — stark projektspezifisch. Ersetze konkrete Namen durch Platzhalter.".into()
    };

    EvaluationCriterion {
        name: "Wiederverwendbarkeit".into(),
        score,
        max_score: 10,
        weight: 0.09,
        details,
    }
}

// -----------------------------------------------------------------------------
// Hilfsfunktionen
// -----------------------------------------------------------------------------

/// Zählt Pattern-Matches im Content und gibt (any_found, total_count) zurück
fn count_pattern_matches(content: &str, patterns: &[&str]) -> (bool, usize) {
    let mut total_count = 0;
    for pattern in patterns {
        if let Ok(re) = Regex::new(pattern) {
            let count = re.find_iter(content).count();
            total_count += count;
        }
    }
    (total_count > 0, total_count)
}

/// Zählt die Anzahl sinnvoller Absätze (durch Leerzeilen getrennte nicht-leere Blöcke)
fn count_paragraphs(lines: &[&str]) -> usize {
    let mut count = 0;
    let mut in_paragraph = false;

    for line in lines {
        let is_empty = line.trim().is_empty();
        if !is_empty && !in_paragraph {
            count += 1;
            in_paragraph = true;
        } else if is_empty {
            in_paragraph = false;
        }
    }
    count
}

/// Generiert automatische Verbesserungsvorschläge basierend auf den Kriterien
fn generate_quality_recommendations(criteria: &[EvaluationCriterion]) -> Vec<String> {
    let mut recommendations: Vec<String> = Vec::new();

    for criterion in criteria {
        if criterion.score < 5 {
            match criterion.name.as_str() {
                "Rollendefinition" => {
                    recommendations.push(
                        "Definiere eine klare Rolle: »Du bist ein [Rolle] mit [Expertise].«".into(),
                    );
                }
                "Zieldefinition" => {
                    recommendations.push(
                        "Formuliere ein explizites Ziel: »Deine Aufgabe ist es, [Ziel] zu erreichen.«".into(),
                    );
                }
                "Kontextqualität" => {
                    recommendations.push(
                        "Ergänze Kontext: Technologie-Stack, Projektbeschreibung und Domänenwissen.".into(),
                    );
                }
                "Eingabendefinition" => {
                    recommendations.push(
                        "Definiere Eingaben mit Platzhaltern: »Erwartete Eingabe: {INPUT_DATEI}«"
                            .into(),
                    );
                }
                "Vorgehensbeschreibung" => {
                    recommendations.push(
                        "Strukturiere das Vorgehen: »1. Analysiere... 2. Implementiere... 3. Validiere...«".into(),
                    );
                }
                "Ausgabeformat" => {
                    recommendations.push(
                        "Spezifiziere das Ausgabeformat: »Antworte im JSON-Format mit den Feldern...«".into(),
                    );
                }
                "Qualitätsanforderungen" => {
                    recommendations.push(
                        "Ergänze Prüfkriterien: »Das Ergebnis muss folgende Akzeptanzkriterien erfüllen...«".into(),
                    );
                }
                "Sicherheitsgrenzen" => {
                    recommendations.push(
                        "Definiere Grenzen: »Gib keine personenbezogenen Daten aus. Führe keine destruktiven Aktionen aus.«".into(),
                    );
                }
                "Klarheit" => {
                    recommendations.push(
                        "Verbessere die Lesbarkeit: Verwende Überschriften, Absätze und prägnante Formulierungen.".into(),
                    );
                }
                "Wiederverwendbarkeit" => {
                    recommendations.push(
                        "Mache den Prompt generischer: Ersetze konkrete Projekt- und Dateinamen durch Platzhalter.".into(),
                    );
                }
                _ => {}
            }
        }
    }

    recommendations
}

// =============================================================================
// Unit Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn get_good_prompt() -> &'static str {
        "---\ntitle: Test\ndescription: Ein guter Prompt\n---\n\n\
         Du bist ein Senior Rust Developer mit 10 Jahren Erfahrung.\n\n\
         ## Ziel\n\
         Deine Aufgabe ist es, den Code im Repository {REPO_PATH} auf Sicherheitslücken zu analysieren.\n\n\
         ## Kontext\n\
         Das Projekt verwendet Rust 1.77 und das Actix-Web Framework.\n\
         Es handelt sich um eine REST-API mit JWT-Authentifizierung.\n\n\
         ## Eingabe\n\
         - Repository-Pfad: {REPO_PATH}\n\
         - Zu prüfende Dateien: {FILE_LIST}\n\n\
         ## Vorgehen\n\
         1. Analysiere die Abhängigkeiten auf bekannte CVEs.\n\
         2. Prüfe unsichere Code-Muster (unsafe-Blöcke, unwrap()).\n\
         3. Validiere die Authentifizierungslogik.\n\
         4. Erstelle einen Sicherheitsbericht.\n\n\
         ## Ausgabeformat\n\
         Erstelle einen Markdown-Bericht mit folgenden Abschnitten:\n\
         - Executive Summary\n\
         - Gefundene Schwachstellen (nach CVSS sortiert)\n\
         - Empfehlungen\n\n\
         ## Qualitätsanforderungen\n\
         - Jede Schwachstelle muss mit CVSS-Score und CVE-Referenz dokumentiert sein\n\
         - Keine False Positives\n\
         - Alle unsicheren Code-Stellen müssen mit Zeilennummer referenziert sein\n\n\
         ## Einschränkungen\n\
         - Keine automatischen Code-Änderungen vornehmen\n\
         - Keine Secrets im Bericht ausgeben\n\
         - Bei Unsicherheit Rücksprache halten"
    }

    #[test]
    fn test_evaluate_good_prompt() {
        let result = evaluate_prompt(get_good_prompt(), "test-1");
        assert!(
            result.overall_score >= 70,
            "Score: {}",
            result.overall_score
        );
        assert!(result.missing_sections.len() <= 2);
    }

    #[test]
    fn test_evaluate_minimal_prompt() {
        let content = "Analysiere den Code.";
        let result = evaluate_prompt(content, "test-2");
        assert!(result.overall_score < 40, "Score: {}", result.overall_score);
        assert!(result.missing_sections.len() >= 3);
    }

    #[test]
    fn test_evaluate_empty_prompt() {
        let result = evaluate_prompt("", "test-3");
        assert_eq!(result.overall_score, 0);
    }

    #[test]
    fn test_role_detection_german() {
        let content = "Du bist ein erfahrener Software-Architekt.";
        let criterion = evaluate_role_definition(content);
        assert!(criterion.score >= 7, "Score: {}", criterion.score);
    }

    #[test]
    fn test_role_detection_english() {
        let content = "You are a senior software architect with expertise in distributed systems.";
        let criterion = evaluate_role_definition(content);
        assert!(criterion.score >= 7, "Score: {}", criterion.score);
    }

    #[test]
    fn test_role_not_detected() {
        let criterion = evaluate_role_definition("Just do this task.");
        assert!(criterion.score <= 3, "Score: {}", criterion.score);
    }

    #[test]
    fn test_procedure_with_numbered_steps() {
        let content = "1. First step\n2. Second step\n3. Third step\n4. Fourth step";
        let criterion = evaluate_procedure_definition(content);
        assert_eq!(criterion.score, 10);
    }

    #[test]
    fn test_output_format_with_example() {
        let content = "Ausgabeformat: JSON\nBeispiel-Ausgabe:\n```json\n{\"result\": \"ok\"}\n```";
        let criterion = evaluate_output_format(content);
        assert!(criterion.score >= 7, "Score: {}", criterion.score);
    }

    #[test]
    fn test_security_boundaries_detected() {
        let content = "Du darfst keine personenbezogenen Daten ausgeben. Vermeide unsichere Operationen. Dies ist eine Sicherheitsgrenze.";
        let criterion = evaluate_security_boundaries(content);
        assert!(criterion.score >= 5, "Score: {}", criterion.score);
    }

    #[test]
    fn test_reusability_high() {
        let content = "Analysiere {PROJECT_PATH} und erstelle einen Bericht für {OUTPUT_FILE}.";
        let criterion = evaluate_reusability(content);
        assert!(criterion.score >= 7, "Score: {}", criterion.score);
    }

    #[test]
    fn test_reusability_low() {
        let content = "Öffne Positron und bearbeite Issue #37 im MietVisor-Repository unter /home/user/project.";
        let criterion = evaluate_reusability(content);
        assert!(criterion.score <= 4, "Score: {}", criterion.score);
    }

    #[test]
    fn test_clarity_with_good_structure() {
        let content = "# Titel\n\nEinleitungstext hier.\n\n## Abschnitt 1\n\nInhalt Abschnitt 1.\n\n## Abschnitt 2\n\nInhalt Abschnitt 2.";
        let criterion = evaluate_clarity(content);
        assert!(criterion.score >= 5, "Score: {}", criterion.score);
    }

    #[test]
    fn test_all_criteria_present() {
        let result = evaluate_prompt(get_good_prompt(), "test-all");
        assert_eq!(result.criteria.len(), 10);
        // Jedes Kriterium sollte einen Namen haben
        for c in &result.criteria {
            assert!(!c.name.is_empty());
            assert!(c.score <= 10);
            assert!(c.max_score == 10);
        }
    }
}

#[cfg(test)]
mod edge_tests {
    use super::*;

    #[test]
    fn test_empty_prompt() {
        let eval = evaluate_prompt("", "test-empty");
        assert_eq!(eval.overall_score, 0);
        // Should not panic
    }

    #[test]
    fn test_null_bytes_in_prompt() {
        let content = "Hello\0World\0Test\n\nSome prompt content";
        let eval = evaluate_prompt(content, "test-null");
        // Should not panic, should produce a valid evaluation
        assert!(!eval.criteria.is_empty());
    }

    #[test]
    fn test_only_special_chars() {
        let content = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
        let eval = evaluate_prompt(content, "test-special");
        assert!(!eval.criteria.is_empty());
    }

    #[test]
    fn test_unicode_umlauts() {
        let content = "# Überprüfung der Änderungen\n\nDas ist ein Test mit Ümläuten und ß.";
        let eval = evaluate_prompt(content, "test-umlaut");
        assert!(!eval.criteria.is_empty());
    }

    #[test]
    fn test_emoji_in_prompt() {
        let content = "# 🚀 Schnelle Prompt-Engine 🎯\n\nTest mit Emojis: 😀 🔥 ✅ ❌";
        let eval = evaluate_prompt(content, "test-emoji");
        assert!(!eval.criteria.is_empty());
    }

    #[test]
    fn test_rtl_text() {
        let content = "# نص عربي\n\nهذا اختبار للنص العربي";
        let eval = evaluate_prompt(content, "test-rtl");
        assert!(!eval.criteria.is_empty());
    }

    #[test]
    fn test_cjk_text() {
        let content = "# 日本語プロンプト\n\nこれはテストです。漢字も含まれています。";
        let eval = evaluate_prompt(content, "test-cjk");
        assert!(!eval.criteria.is_empty());
    }

    #[test]
    fn test_large_prompt() {
        // Generate a ~100KB prompt
        let base = "# Large Prompt\n\n";
        let repeated =
            "This is a test paragraph with enough content to simulate a real prompt. ".repeat(1500);
        let content = format!("{}{}", base, repeated);
        assert!(content.len() > 100_000);

        let start = std::time::Instant::now();
        let eval = evaluate_prompt(&content, "test-large");
        let duration = start.elapsed();

        assert!(!eval.criteria.is_empty());
        assert!(
            duration.as_secs() < 5,
            "Large prompt took too long: {:?}",
            duration
        );
    }

    #[test]
    #[cfg_attr(debug_assertions, ignore)]
    fn test_many_prompts_analysis() {
        // Generate 100 prompts and analyze them
        let mut prompts = Vec::new();
        for i in 0..100 {
            let content = format!(
                "---\ntitle: \"Prompt {}\"\ndescription: \"Test {}\"\ncategory: \"test\"\ntags: [\"test\", \"perf\"]\n---\n\n# Prompt {}\n\nThis is test content for prompt {}. It has multiple paragraphs.\n\n## Section\n\nMore content here with some keywords and structure.\n\n```rust\nfn main() {{\n    println!(\"Hello\");\n}}\n```",
                i, i, i, i
            );
            prompts.push(content);
        }

        let start = std::time::Instant::now();
        for (i, content) in prompts.iter().enumerate() {
            let eval = evaluate_prompt(content, &format!("perf-{}", i));
            assert!(!eval.criteria.is_empty());
        }
        let duration = start.elapsed();
        println!("100 prompts analyzed in {:?}", duration);
    }
}
