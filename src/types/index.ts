// =============================================================================
// PromptVault Lite — Typisierte Datenmodelle
// =============================================================================

export interface PromptItem {
  id: string;
  file_path: string;
  file_name: string;
  title: string;
  description: string;
  category: string;
  version: string;
  tags: string[];
  content: string;
  raw_frontmatter: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

export interface PromptEvaluation {
  id: string;
  prompt_id: string;
  overall_score: number;
  criteria: EvaluationCriterion[];
  missing_sections: string[];
  recommendations: string[];
  evaluated_at: string;
}

export interface EvaluationCriterion {
  name: string;
  score: number;
  max_score: number;
  weight: number;
  details: string;
}

export interface PromptHygiene {
  id: string;
  prompt_id: string;
  hygiene_score: number;
  status: HygieneStatus;
  artifacts: DetectedArtifact[];
  analyzed_at: string;
}

export type HygieneStatus = "clean" | "warning" | "critical";

export interface DetectedArtifact {
  id: string;
  category: ArtifactCategory;
  severity: "info" | "warning" | "critical";
  match: string;
  line: number;
  column: number;
  replacement_suggestion: string | null;
}

export type ArtifactCategory =
  | "PROJECT_ARTIFACT"
  | "REPO_REFERENCE"
  | "FILE_PATH"
  | "ISSUE_REFERENCE"
  | "TEST_REPORT"
  | "LOG_LINE"
  | "STACKTRACE"
  | "BUILD_OUTPUT"
  | "JSON_DUMP"
  | "CODE_DUMP"
  | "PII"
  | "SECRET";

export interface AnalysisReport {
  evaluations: PromptEvaluation[];
  hygiene: PromptHygiene[];
  total_prompts: number;
  average_score: number;
}

// --- Filter Types ---

export interface PromptFilters {
  search: string;
  category: string | null;
  minScore: number;
  maxScore: number;
  hygieneStatus: HygieneStatus | null;
  tags: string[];
  favoritesOnly: boolean;
}

export const DEFAULT_FILTERS: PromptFilters = {
  search: "",
  category: null,
  minScore: 0,
  maxScore: 100,
  hygieneStatus: null,
  tags: [],
  favoritesOnly: false,
};

// --- File Tree Types ---

export interface FileTreeNode {
  name: string;
  path: string;
  is_directory: boolean;
  children: FileTreeNode[];
  prompt_id?: string;
  score?: number;
  is_favorite?: boolean;
}
