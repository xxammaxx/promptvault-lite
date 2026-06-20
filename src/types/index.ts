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
  | "SECRET"
  | "CHAT_META"
  | "SCOPE_POLLUTION"
  | "OCR_RESIDUE"
  | "ROLE_MISMATCH"
  | "MISSING_STRUCTURE"
  | "EVIDENCE_BLOCK";

export interface AnalysisReport {
  evaluations: PromptEvaluation[];
  hygiene: PromptHygiene[];
  total_prompts: number;
  average_score: number;
}

// --- Filter Types ---

// --- Export Types ---

export type ExportFormat = "json" | "markdown" | "zip";

export interface ExportProgressPayload {
  current: number;
  total: number;
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
  /** Transient: Map used during tree construction (O(1) lookup). Removed before rendering. */
  _childrenMap?: Map<string, FileTreeNode>;
}

// =============================================================================
// Prompt & Context Engineering Evaluation Types
// =============================================================================

export type PromptType =
  | "simple_prompt"
  | "structured_prompt"
  | "agentic_prompt";

export type ContextProfile = "minimal" | "moderate" | "rich" | "overloaded";

export interface ContextCriterion {
  dimension: "prompt_engineering" | "context_engineering" | "agent_readiness";
  name: string;
  score: number; // 0, 1, or 2
  max_score: number; // always 2
  details: string;
}

export interface SuggestedImprovement {
  dimension: "prompt_engineering" | "context_engineering" | "agent_readiness";
  criterion: string;
  message: string;
  priority: "high" | "medium" | "low";
}

export type RiskFlagType =
  | "ambiguous_task"
  | "missing_goal"
  | "missing_output_format"
  | "missing_constraints"
  | "missing_verification"
  | "context_missing"
  | "context_overload"
  | "source_of_truth_missing"
  | "mixed_objectives"
  | "scope_creep_risk"
  | "no_human_approval"
  | "no_evidence_contract"
  | "unbounded_agent_autonomy"
  | "stale_or_undated_context";

export interface RiskFlag {
  flag: RiskFlagType;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  score_penalty: number;
}

export interface PromptContextEvaluation {
  // Type detection
  detected_prompt_type: PromptType;
  detected_context_profile: ContextProfile;

  // Scores (0-100, higher is better)
  prompt_engineering_score: number;
  context_engineering_score: number;
  agent_readiness_score: number;
  robustness_score: number; // 100 = low risk, 0 = high risk
  overall_score: number;

  // Structured findings
  criteria: ContextCriterion[];
  strengths: string[];
  warnings: string[];
  missing_elements: string[];
  suggested_improvements: SuggestedImprovement[];
  risk_flags: RiskFlag[];

  // Metadata
  confidence: number; // 0.0-1.0
  evaluated_at: string;
}

// =============================================================================
// Prompt Optimization Engine Types
// =============================================================================

export type OptimizationMode = "conservative" | "balanced" | "aggressive";

export interface OptimizationDiff {
  original: string;
  optimized: string;
  changes: OptimizationChange[];
  warnings: string[];
}

export interface OptimizationChange {
  type:
    | "whitespace"
    | "structure"
    | "content"
    | "format"
    | "add_section"
    | "reorder";
  description: string;
}

/** Result of optimized prompt quality validation */
export interface OptimizationQualityResult {
  passed: boolean;
  unresolved_placeholders: string[];
  empty_sections: string[];
  warnings: string[];
  structural_improvement_confirmed: boolean;
}

// =============================================================================
// Typed Local Action Layer Types
// =============================================================================

/** All registered action names */
export type ActionName =
  | "prompts.search"
  | "prompts.get"
  | "prompts.create"
  | "prompts.update"
  | "prompts.score"
  | "prompts.detect_artifacts"
  | "prompts.optimize"
  | "collections.list"
  | "qa.load_fixture"
  | "qa.compare_score";

/** Risk level for an action */
export type ActionRisk = "low" | "medium" | "high" | "critical";

/** Read/Write classification */
export type ActionAccess = "read" | "write";

/** UI state impact of an action */
export type UIStateImpact = "none" | "selection" | "navigation" | "modal";

/** Typed contract for a single action */
export interface ActionContract {
  name: ActionName;
  description: string;
  risk: ActionRisk;
  access: ActionAccess;
  uiStateImpact: UIStateImpact;
  approvalRequired: boolean;
  evidenceRequired: boolean;
  validateInput: (input: unknown) => ValidationResult;
  validateOutput: (output: unknown) => ValidationResult;
}

/** Validation result with optional errors */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Evidence log result types */
export type EvidenceResult =
  | "success"
  | "error"
  | "blocked"
  | "approved"
  | "denied";

/** Evidence log entry for every action call */
export interface EvidenceLogEntry {
  timestamp: string;
  action: ActionName | "(unknown)";
  input_hash: string;
  result: EvidenceResult;
  duration_ms: number;
  error?: string;
}

/** Input type for prompts.search */
export interface SearchInput {
  query: string;
  filters?: PromptFilters;
  limit?: number;
  offset?: number;
}

/** Output type for prompts.search */
export interface SearchOutput {
  results: PromptItem[];
  total: number;
  query: string;
  duration_ms: number;
}

/** Input type for prompts.score */
export interface ScoreInput {
  prompt_id: string;
  content?: string;
}

/** Output type for prompts.score */
export interface ScoreOutput {
  quality: PromptEvaluation;
  hygiene: PromptHygiene;
  context: PromptContextEvaluation;
  combined_score: number;
}

/** Input type for prompts.detect_artifacts */
export interface DetectArtifactsInput {
  content: string;
}

/** Output type for prompts.detect_artifacts */
export interface DetectArtifactsOutput {
  artifacts: DetectedArtifact[];
  hygiene_score: number;
  status: HygieneStatus;
  categories_found: ArtifactCategory[];
}

/** Input type for prompts.optimize */
export interface OptimizeInput {
  content: string;
  mode: OptimizationMode;
  target_format?: "standard" | "agentic";
}

/** Output type for prompts.optimize */
export interface OptimizeOutput {
  original: string;
  optimized: string;
  changes: OptimizationChange[];
  warnings: string[];
  before_score?: number;
  after_score?: number;
}

/** Input type for prompts.create */
export interface CreatePromptInput {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  description?: string;
}

/** Output type for prompts.create */
export interface CreatePromptOutput {
  prompt: PromptItem;
  created: boolean;
}

/** Input type for prompts.update */
export interface UpdatePromptInput {
  prompt_id: string;
  content?: string;
  title?: string;
  category?: string;
  tags?: string[];
  description?: string;
}

/** Output type for prompts.update */
export interface UpdatePromptOutput {
  prompt: PromptItem;
  updated: boolean;
  changed_fields: string[];
}

/** Output type for collections.list */
export interface CollectionListOutput {
  collections: CollectionSummary[];
  total_prompts: number;
}

export interface CollectionSummary {
  category: string;
  count: number;
  avg_score: number;
}

/** Input type for qa.load_fixture */
export interface LoadFixtureInput {
  fixture_name: string;
}

/** Output type for qa.load_fixture */
export interface LoadFixtureOutput {
  content: string;
  loaded: boolean;
}

/** Input type for qa.compare_score */
export interface CompareScoreInput {
  prompt_id_a: string;
  prompt_id_b: string;
}

/** Output type for qa.compare_score */
export interface CompareScoreOutput {
  a: { overall_score: number; prompt_engineering_score: number };
  b: { overall_score: number; prompt_engineering_score: number };
  delta: number;
  better: "a" | "b" | "tie";
}

/** Action dispatch result */
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  evidence?: EvidenceLogEntry;
}
