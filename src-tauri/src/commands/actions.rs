// =============================================================================
// Tauri Commands: Typed Local Action Layer (Issue #90)
// =============================================================================
// These commands expose the local action layer via Tauri IPC.
// They delegate to existing analysis modules and provide create/update CRUD.

use crate::analysis;
use crate::models::PromptItem;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::State;

use crate::commands::scan::AppState;

// =============================================================================
// Input/Output types (mirror TypeScript side)
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct DetectArtifactsInput {
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct DetectArtifactsOutput {
    pub artifacts: Vec<crate::models::DetectedArtifact>,
    pub hygiene_score: u8,
    pub status: crate::models::HygieneStatus,
}

#[derive(Debug, Deserialize)]
pub struct CreatePromptInput {
    pub title: String,
    pub content: String,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreatePromptOutput {
    pub prompt: PromptItem,
    pub created: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePromptInput {
    pub prompt_id: String,
    pub content: Option<String>,
    pub title: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct UpdatePromptOutput {
    pub prompt: PromptItem,
    pub updated: bool,
    pub changed_fields: Vec<String>,
}

// =============================================================================
// Commands
// =============================================================================

/// Escape a string value for safe embedding in YAML double-quoted strings.
fn yaml_escape(s: &str) -> String {
    s.replace('\\', "\\\\").replace('"', "\\\"")
}

#[tauri::command]
pub async fn detect_artifacts_action(
    input: DetectArtifactsInput,
) -> Result<DetectArtifactsOutput, String> {
    let hygiene = analysis::hygiene::analyze_hygiene(&input.content, "_action_detect");

    Ok(DetectArtifactsOutput {
        hygiene_score: hygiene.hygiene_score,
        status: hygiene.status,
        artifacts: hygiene.artifacts,
    })
}

#[tauri::command]
pub async fn create_prompt(
    input: CreatePromptInput,
    state: State<'_, AppState>,
) -> Result<CreatePromptOutput, String> {
    // Get vault path
    let vault_path = {
        let vp = state
            .vault_path
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        vp.clone()
            .ok_or_else(|| "No vault path set. Scan a directory first.".to_string())?
    };

    // Generate a new prompt ID
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // Extract fields (avoid move-after-use issues)
    let title = input.title.clone();
    let description = input.description.clone().unwrap_or_default();
    let category = input.category.clone().unwrap_or_else(|| "general".into());
    let tags = input.tags.clone().unwrap_or_default();
    let content = input.content.clone();

    // Sanitize filename
    let safe_name = title
        .replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_")
        .trim()
        .to_string();
    let file_name = format!("{}.md", safe_name);
    let full_path = PathBuf::from(&vault_path).join(&file_name);

    // Build frontmatter
    let frontmatter = format!(
        "---\ntitle: \"{}\"\ndescription: \"{}\"\ncategory: \"{}\"\nversion: \"1.0.0\"\ntags: [{}]\ncreated_at: \"{}\"\n---\n\n{}",
        yaml_escape(&title),
        yaml_escape(&description),
        yaml_escape(&category),
        tags.join(", "),
        now,
        content,
    );

    // Write to file
    fs::write(&full_path, &frontmatter)
        .map_err(|e| format!("Failed to write prompt file: {}", e))?;

    let prompt = PromptItem {
        id: id.clone(),
        file_path: full_path.to_string_lossy().to_string(),
        file_name,
        title,
        description: description.clone(),
        category: category.clone(),
        version: "1.0.0".into(),
        tags: tags.clone(),
        content,
        raw_frontmatter: serde_json::json!({
            "title": input.title,
            "description": description,
            "category": category,
            "version": "1.0.0",
            "tags": tags,
        }),
        created_at: now.clone(),
        updated_at: now,
        is_favorite: false,
    };

    // Add to in-memory state (file already on disk, so warn but don't fail)
    match state.prompts.lock() {
        Ok(mut prompts) => {
            prompts.push(prompt.clone());
        }
        Err(e) => {
            log::warn!(
                "Prompt file written to disk but failed to update in-memory state: {}. \
                 A subsequent scan will recover the file.",
                e
            );
        }
    }

    Ok(CreatePromptOutput {
        prompt,
        created: true,
    })
}

#[tauri::command]
pub async fn update_prompt(
    input: UpdatePromptInput,
    state: State<'_, AppState>,
) -> Result<UpdatePromptOutput, String> {
    // Verify vault path is set (write goes to file_path from the prompt record)
    let _vault_path = {
        let vp = state
            .vault_path
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        vp.clone()
            .ok_or_else(|| "No vault path set. Scan a directory first.".to_string())?
    };

    // Find and update prompt in memory
    let mut prompts = state
        .prompts
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    let idx = prompts
        .iter()
        .position(|p| p.id == input.prompt_id)
        .ok_or_else(|| format!("Prompt not found: {}", input.prompt_id))?;

    let prompt = &mut prompts[idx];
    let mut changed_fields: Vec<String> = Vec::new();

    if let Some(ref content) = input.content {
        prompt.content = content.clone();
        changed_fields.push("content".into());
    }
    if let Some(ref title) = input.title {
        prompt.title = title.clone();
        changed_fields.push("title".into());
    }
    if let Some(ref category) = input.category {
        prompt.category = category.clone();
        changed_fields.push("category".into());
    }
    if let Some(ref tags) = input.tags {
        prompt.tags = tags.clone();
        changed_fields.push("tags".into());
    }
    if let Some(ref description) = input.description {
        prompt.description = description.clone();
        changed_fields.push("description".into());
    }

    prompt.updated_at = chrono::Utc::now().to_rfc3339();

    // Write updated content back to file
    let file_path = prompt.file_path.clone();
    let full_content = format!(
        "---\ntitle: \"{}\"\ndescription: \"{}\"\ncategory: \"{}\"\nversion: \"{}\"\ntags: [{}]\nupdated_at: \"{}\"\n---\n\n{}",
        yaml_escape(&prompt.title),
        yaml_escape(&prompt.description),
        yaml_escape(&prompt.category),
        prompt.version,
        prompt.tags.join(", "),
        prompt.updated_at,
        prompt.content,
    );

    fs::write(&file_path, &full_content)
        .map_err(|e| format!("Failed to write updated prompt file: {}", e))?;

    let updated_prompt = prompt.clone();
    drop(prompts); // Release lock

    Ok(UpdatePromptOutput {
        prompt: updated_prompt,
        updated: true,
        changed_fields,
    })
}
