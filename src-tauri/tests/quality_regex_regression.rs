// ---------------------------------------------------------------------------
// Synthetic Regression Tests: Rust Regex Backtracking in Prompt Quality Analysis
// ---------------------------------------------------------------------------
//
// These tests exercise evaluate_prompt with large, complex, or adversarial
// Markdown-like documents to detect regex backtracking or performance
// degradation.
//
// SAFETY:
// - All content is synthetic. No real prompt files, contents, or paths.
// - No private data.
// - No corpus files.
// ---------------------------------------------------------------------------

use promptvault_lite_lib::analysis::evaluate_prompt;

/// Helper: generate a large document with many headings and list items.
fn make_large_synthetic_doc(heading_lines: usize, items_per_section: usize) -> String {
    let mut parts = Vec::new();
    parts.push("# Synthetischer Großtest\n\n".to_string());
    for section in 0..heading_lines {
        parts.push(format!("## Abschnitt {}\n\n", section));
        for item in 0..items_per_section {
            parts.push(format!(
                "- Aufgabe {}: Prüfe die Struktur und analysiere den Kontext.\n",
                item
            ));
        }
        parts.push("\n".to_string());
    }
    parts.concat()
}

/// Helper: generate long lines with prompt-like tokens.
fn make_long_line_doc(num_lines: usize, line_length: usize) -> String {
    let token = "Beispieltext Token Kontext Analyse ";
    let repeat = (line_length / token.len()).max(1) + 1;
    let base = token
        .repeat(repeat)
        .chars()
        .take(line_length)
        .collect::<String>();
    let mut lines = Vec::with_capacity(num_lines + 2);
    lines.push("# Langzeilen Analyse\n\n".to_string());
    for i in 0..num_lines {
        lines.push(format!(
            "{}\n",
            base.replace("Kontext", &format!("Kontext{}", i % 10))
        ));
    }
    lines.concat()
}

/// Helper: generate adversarial-ish Markdown with many backtick fences
/// that never close — can trigger backtracking in naive regex.
fn make_unclosed_backtick_doc(num_fences: usize, inner_lines: usize) -> String {
    let mut parts = Vec::new();
    parts.push("# Fenced Blocks\n\n".to_string());
    for f in 0..num_fences {
        parts.push("```\n".to_string());
        for _ in 0..inner_lines {
            parts.push("some code content with plenty of `backticks` inside\n".to_string());
        }
        // Intentionally leave the fence open for some blocks
        if f % 3 != 0 {
            parts.push("```\n".to_string());
        }
    }
    parts.concat()
}

/// Helper: many repeated heading patterns — tests heading regex performance.
fn make_heading_heavy_doc(num_headings: usize) -> String {
    let mut parts = Vec::new();
    parts.push("# Start Dokument\n\n".to_string());
    for i in 0..num_headings {
        let level = (i % 6) + 1;
        let pound = "#".repeat(level);
        parts.push(format!(
            "{} Überschrift {} — Scope und Zieldefinition\n\nTestinhalt mit etwas Kontext.\n\n",
            pound, i
        ));
    }
    parts.concat()
}

// -----------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------

#[test]
fn test_large_heading_doc() {
    let doc = make_heading_heavy_doc(3000);
    assert!(
        doc.len() > 200_000,
        "doc should be large, got {} bytes",
        doc.len()
    );
    let start = std::time::Instant::now();
    let eval = evaluate_prompt(&doc, "large-headings");
    let duration = start.elapsed();
    assert!(!eval.criteria.is_empty(), "should produce valid criteria");
    assert!(
        duration.as_secs() < 10,
        "heading-heavy doc took too long: {:?}",
        duration
    );
}

#[test]
fn test_large_list_and_section_doc() {
    let doc = make_large_synthetic_doc(500, 20);
    assert!(
        doc.len() > 100_000,
        "doc should be large, got {} bytes",
        doc.len()
    );
    let start = std::time::Instant::now();
    let eval = evaluate_prompt(&doc, "large-sections");
    let duration = start.elapsed();
    assert!(!eval.criteria.is_empty(), "should produce valid criteria");
    assert!(
        duration.as_secs() < 10,
        "large list doc took too long: {:?}",
        duration
    );
}

#[test]
fn test_long_lines_doc() {
    let doc = make_long_line_doc(500, 2000);
    assert!(
        doc.len() > 100_000,
        "doc should be large, got {} bytes",
        doc.len()
    );
    let start = std::time::Instant::now();
    let eval = evaluate_prompt(&doc, "long-lines");
    let duration = start.elapsed();
    assert!(!eval.criteria.is_empty(), "should produce valid criteria");
    assert!(
        duration.as_secs() < 10,
        "long lines doc took too long: {:?}",
        duration
    );
}

#[test]
fn test_unclosed_backtick_fences() {
    // This exercises the `[\s\S]*?` pattern in evaluate_output_format
    let doc = make_unclosed_backtick_doc(200, 5);
    assert!(
        doc.len() > 20_000,
        "doc should be decent size, got {} bytes",
        doc.len()
    );
    let start = std::time::Instant::now();
    let eval = evaluate_prompt(&doc, "backtick-fences");
    let duration = start.elapsed();
    assert!(!eval.criteria.is_empty(), "should produce valid criteria");
    assert!(
        duration.as_secs() < 10,
        "unclosed backtick doc took too long: {:?}",
        duration
    );
}

#[test]
fn test_adversarial_mixed_heavy_doc() {
    // Combine all the above patterns into one massive document
    let doc = [
        make_heading_heavy_doc(1000),
        make_large_synthetic_doc(300, 10),
        make_long_line_doc(200, 3000),
    ]
    .concat();
    assert!(
        doc.len() > 200_000,
        "doc should be very large, got {} bytes",
        doc.len()
    );
    let start = std::time::Instant::now();
    let eval = evaluate_prompt(&doc, "adversarial-mixed");
    let duration = start.elapsed();
    assert!(!eval.criteria.is_empty(), "should produce valid criteria");
    assert!(
        duration.as_secs() < 15,
        "adversarial mixed doc took too long: {:?}",
        duration
    );
}
