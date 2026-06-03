use crate::models::PromptItem;
use crate::parser::frontmatter::parse_frontmatter;
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Gescannter Datei-Eintrag vor dem Parsing
#[derive(Debug, Clone)]
struct ScannedFile {
    path: PathBuf,
    file_name: String,
    size: u64,
    modified: String,
}

/// Rekursives Scannen eines Verzeichnisses nach Markdown-Dateien
///
/// # Arguments
/// * `dir_path` - Absoluter Pfad zum zu scannenden Verzeichnis
///
/// # Returns
/// * `Vec<PromptItem>` - Liste aller gefundenen und geparsten Prompts
///
/// # Errors
/// * Unlesbare Verzeichnisse/Dateien werden geloggt aber nicht als Fehler zurückgegeben
pub fn scan_directory(dir_path: &str) -> Result<Vec<PromptItem>, String> {
    let root = Path::new(dir_path);

    if !root.exists() {
        return Err(format!("Verzeichnis existiert nicht: {}", dir_path));
    }

    if !root.is_dir() {
        return Err(format!("Pfad ist kein Verzeichnis: {}", dir_path));
    }

    let mut scanned_files: Vec<ScannedFile> = Vec::new();
    let mut errors: Vec<String> = Vec::new();

    // Rekursives Durchlaufen mit walkdir
    for entry in WalkDir::new(root)
        .follow_links(true)
        .max_depth(50) // Schutz vor zu tiefer Rekursion
        .into_iter()
        .filter_map(|e| match e {
            Ok(entry) => {
                // Symlink-Tiefe prüfen
                if entry.path_is_symlink() {
                    if let Ok(link_depth) = symlink_depth(entry.path()) {
                        if link_depth > 5 {
                            log::warn!(
                                "Symlink-Tiefe > 5, überspringe: {}",
                                entry.path().display()
                            );
                            return None;
                        }
                    }
                }
                Some(entry)
            }
            Err(err) => {
                if let Some(path) = err.path() {
                    log::warn!("Fehler beim Lesen von '{}': {}", path.display(), err);
                    errors.push(format!("Lesefehler bei '{}': {}", path.display(), err));
                }
                None
            }
        })
    {
        // Nur Markdown-Dateien (.md)
        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();

        if path.extension().map_or(false, |ext| ext == "md") {
            match fs::metadata(path) {
                Ok(meta) => {
                    let modified = meta
                        .modified()
                        .ok()
                        .and_then(|t| {
                            chrono::DateTime::from_timestamp(
                                t.duration_since(std::time::UNIX_EPOCH)
                                    .unwrap_or_default()
                                    .as_secs() as i64,
                                0,
                            )
                        })
                        .map(|dt| dt.to_rfc3339())
                        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

                    scanned_files.push(ScannedFile {
                        path: path.to_path_buf(),
                        file_name: path
                            .file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string(),
                        size: meta.len(),
                        modified,
                    });
                }
                Err(err) => {
                    log::warn!(
                        "Konnte Metadaten nicht lesen für '{}': {}",
                        path.display(),
                        err
                    );
                }
            }
        }
    }

    // Scanned-Files in PromptItems umwandeln
    let mut prompts: Vec<PromptItem> = Vec::with_capacity(scanned_files.len());

    for file in &scanned_files {
        match fs::read_to_string(&file.path) {
            Ok(content) => {
                let frontmatter_result = parse_frontmatter(&content);

                // Titel: Frontmatter > Dateiname (ohne .md)
                let title = frontmatter_result
                    .metadata
                    .get("title")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| {
                        file.file_name
                            .strip_suffix(".md")
                            .unwrap_or(&file.file_name)
                            .to_string()
                    });

                // Kategorie: Frontmatter > Ordnername
                let category = frontmatter_result
                    .metadata
                    .get("category")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| {
                        file.path
                            .parent()
                            .and_then(|p| p.file_name())
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_else(|| "Uncategorized".to_string())
                    });

                // Beschreibung
                let description = frontmatter_result
                    .metadata
                    .get("description")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_default();

                // Version
                let version = frontmatter_result
                    .metadata
                    .get("version")
                    .and_then(|v| {
                        if let Some(s) = v.as_str() {
                            Some(s.to_string())
                        } else if let Some(n) = v.as_f64() {
                            Some(n.to_string())
                        } else {
                            None
                        }
                    })
                    .unwrap_or_else(|| "1.0".to_string());

                // Tags
                let tags = frontmatter_result
                    .metadata
                    .get("tags")
                    .map(|v| match v {
                        serde_json::Value::Array(arr) => arr
                            .iter()
                            .filter_map(|t| t.as_str().map(|s| s.to_string()))
                            .collect(),
                        serde_json::Value::String(s) => vec![s.clone()],
                        _ => Vec::new(),
                    })
                    .unwrap_or_default();

                // Datum aus Frontmatter oder Dateisystem
                let created_at = frontmatter_result
                    .metadata
                    .get("created")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| file.modified.clone());

                let updated_at = frontmatter_result
                    .metadata
                    .get("updated")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| file.modified.clone());

                let prompt = PromptItem {
                    id: uuid::Uuid::new_v4().to_string(),
                    file_path: file.path.to_string_lossy().to_string(),
                    file_name: file.file_name.clone(),
                    title,
                    description,
                    category,
                    version,
                    tags,
                    content: frontmatter_result.content,
                    raw_frontmatter: frontmatter_result.metadata,
                    created_at,
                    updated_at,
                    is_favorite: false,
                };

                prompts.push(prompt);
            }
            Err(err) => {
                log::error!(
                    "Konnte Datei nicht lesen '{}': {}",
                    file.path.display(),
                    err
                );
                errors.push(format!("Lesefehler bei '{}': {}", file.path.display(), err));
            }
        }
    }

    // Sortiere: Ordner-Struktur erhalten (nach Pfad sortieren)
    prompts.sort_by(|a, b| a.file_path.cmp(&b.file_path));

    if !errors.is_empty() {
        log::warn!(
            "Scan abgeschlossen mit {} Warnungen bei {} Prompts",
            errors.len(),
            prompts.len()
        );
    }

    Ok(prompts)
}

/// Berechnet die Tiefe einer Symlink-Kette
fn symlink_depth(path: &Path) -> Result<usize, std::io::Error> {
    let mut depth = 0;
    let mut current = path.to_path_buf();

    while depth < 10 {
        if !current.is_symlink() {
            break;
        }
        let target = fs::read_link(&current)?;
        current = if target.is_absolute() {
            target
        } else {
            current.parent().unwrap_or(Path::new("/")).join(target)
        };
        depth += 1;
    }

    Ok(depth)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::TempDir;

    fn create_test_md(dir: &Path, name: &str, content: &str) {
        let file_path = dir.join(name);
        let mut file = fs::File::create(&file_path).unwrap();
        file.write_all(content.as_bytes()).unwrap();
    }

    #[test]
    fn test_scan_empty_directory() {
        let dir = TempDir::new().unwrap();
        let result = scan_directory(dir.path().to_str().unwrap());
        assert!(result.is_ok());
        assert_eq!(result.unwrap().len(), 0);
    }

    #[test]
    fn test_scan_single_md_file() {
        let dir = TempDir::new().unwrap();
        create_test_md(dir.path(), "test.md", "# Test Prompt\n\nHello World");

        let result = scan_directory(dir.path().to_str().unwrap()).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].title, "test");
        assert_eq!(result[0].file_name, "test.md");
        assert_eq!(
            result[0].category,
            dir.path().file_name().unwrap().to_str().unwrap()
        );
    }

    #[test]
    fn test_scan_with_frontmatter() {
        let dir = TempDir::new().unwrap();
        let content = "---\ntitle: My Prompt\ncategory: coding\nversion: \"2.0\"\ntags:\n  - rust\n  - testing\ndescription: A test prompt\n---\n\n# Prompt\n\nContent here";
        create_test_md(dir.path(), "prompt.md", content);

        let result = scan_directory(dir.path().to_str().unwrap()).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].title, "My Prompt");
        assert_eq!(result[0].category, "coding");
        assert_eq!(result[0].version, "2.0");
        assert_eq!(result[0].tags, vec!["rust", "testing"]);
        assert_eq!(result[0].description, "A test prompt");
        assert!(!result[0].content.contains("---"));
        assert!(result[0].content.contains("# Prompt"));
    }

    #[test]
    fn test_scan_nested_directories() {
        let dir = TempDir::new().unwrap();
        let sub_dir = dir.path().join("sub");
        fs::create_dir(&sub_dir).unwrap();

        create_test_md(dir.path(), "root.md", "# Root");
        create_test_md(&sub_dir, "nested.md", "# Nested");

        let result = scan_directory(dir.path().to_str().unwrap()).unwrap();
        assert_eq!(result.len(), 2);

        let titles: Vec<&str> = result.iter().map(|p| p.title.as_str()).collect();
        assert!(titles.contains(&"root"));
        assert!(titles.contains(&"nested"));
    }

    #[test]
    fn test_ignores_non_md_files() {
        let dir = TempDir::new().unwrap();
        create_test_md(dir.path(), "prompt.md", "# Prompt");
        // Erstelle eine nicht-.md Datei
        let mut txt_file = fs::File::create(dir.path().join("notes.txt")).unwrap();
        txt_file.write_all(b"Not a prompt").unwrap();

        let result = scan_directory(dir.path().to_str().unwrap()).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].file_name, "prompt.md");
    }

    #[test]
    fn test_nonexistent_directory() {
        let result = scan_directory("/nonexistent/path/12345");
        assert!(result.is_err());
    }

    #[test]
    fn test_missing_frontmatter_fallback() {
        let dir = TempDir::new().unwrap();
        let content = "# Just a prompt\n\nNo frontmatter here";
        create_test_md(dir.path(), "simple.md", content);

        let result = scan_directory(dir.path().to_str().unwrap()).unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].title, "simple");
        assert_eq!(result[0].description, "");
        assert_eq!(result[0].version, "1.0");
        assert!(result[0].tags.is_empty());
    }
}
