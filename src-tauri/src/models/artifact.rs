use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ArtifactCategory {
    #[serde(rename = "PROJECT_ARTIFACT")]
    ProjectArtifact,
    #[serde(rename = "REPO_REFERENCE")]
    RepoReference,
    #[serde(rename = "FILE_PATH")]
    FilePath,
    #[serde(rename = "ISSUE_REFERENCE")]
    IssueReference,
    #[serde(rename = "TEST_REPORT")]
    TestReport,
    #[serde(rename = "LOG_LINE")]
    LogLine,
    #[serde(rename = "STACKTRACE")]
    Stacktrace,
    #[serde(rename = "BUILD_OUTPUT")]
    BuildOutput,
    #[serde(rename = "JSON_DUMP")]
    JsonDump,
    #[serde(rename = "CODE_DUMP")]
    CodeDump,
    #[serde(rename = "PII")]
    Pii,
    #[serde(rename = "SECRET")]
    Secret,
}

impl ArtifactCategory {
    pub fn default_severity(&self) -> &str {
        match self {
            Self::Secret | Self::Pii => "critical",
            Self::ProjectArtifact | Self::RepoReference | Self::FilePath => "warning",
            Self::IssueReference
            | Self::TestReport
            | Self::LogLine
            | Self::Stacktrace
            | Self::BuildOutput
            | Self::JsonDump
            | Self::CodeDump => "info",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedArtifact {
    pub id: String,
    pub category: ArtifactCategory,
    pub severity: String,
    pub r#match: String,
    pub line: usize,
    pub column: usize,
    pub replacement_suggestion: Option<String>,
}

impl DetectedArtifact {
    pub fn new(
        category: ArtifactCategory,
        severity: String,
        matched: String,
        line: usize,
        column: usize,
        replacement_suggestion: Option<String>,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            category,
            severity,
            r#match: matched,
            line,
            column,
            replacement_suggestion,
        }
    }
}
