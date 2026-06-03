use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptItem {
    pub id: String,
    pub file_path: String,
    pub file_name: String,
    pub title: String,
    pub description: String,
    pub category: String,
    pub version: String,
    pub tags: Vec<String>,
    pub content: String,
    pub raw_frontmatter: serde_json::Value,
    pub created_at: String,
    pub updated_at: String,
    pub is_favorite: bool,
}

impl PromptItem {
    pub fn new(
        file_path: String,
        file_name: String,
        title: String,
        description: String,
        category: String,
        version: String,
        tags: Vec<String>,
        content: String,
        raw_frontmatter: serde_json::Value,
    ) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            file_path,
            file_name,
            title,
            description,
            category,
            version,
            tags,
            content,
            raw_frontmatter,
            created_at: now.clone(),
            updated_at: now,
            is_favorite: false,
        }
    }
}
