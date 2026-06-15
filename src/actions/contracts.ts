// =============================================================================
// Typed Action Contracts — Schema validators and contract definitions
// =============================================================================
// No external validation library. Manual validators for zero-dependency operation.

import type { ActionContract, ActionName, ValidationResult } from "@/types";

// =============================================================================
// Validation helpers
// =============================================================================

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

function fail(...errors: string[]): ValidationResult {
  return { valid: false, errors };
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

// =============================================================================
// prompts.search
// =============================================================================

function validateSearchInput(input: unknown): ValidationResult {
  if (!isObject(input)) return fail("Input must be an object");
  const obj = input;
  const errs: string[] = [];

  if (typeof obj.query !== "string" || obj.query.trim().length === 0) {
    errs.push("query: required non-empty string");
  }

  const limit = obj.limit;
  if (
    limit !== undefined &&
    (typeof limit !== "number" || limit < 1 || limit > 1000)
  ) {
    errs.push("limit: optional number 1-1000");
  }

  const offset = obj.offset;
  if (offset !== undefined && (typeof offset !== "number" || offset < 0)) {
    errs.push("offset: optional number >= 0");
  }

  return errs.length ? fail(...errs) : ok();
}

function validateSearchOutput(output: unknown): ValidationResult {
  if (!isObject(output)) return fail("Output must be an object");
  const obj = output;
  const errs: string[] = [];
  if (!Array.isArray(obj.results)) errs.push("results: must be array");
  if (typeof obj.total !== "number") errs.push("total: must be number");
  if (typeof obj.query !== "string") errs.push("query: must be string");
  return errs.length ? fail(...errs) : ok();
}

// =============================================================================
// prompts.get
// =============================================================================

function validateGetInput(input: unknown): ValidationResult {
  if (!isObject(input)) return fail("Input must be an object");
  if (typeof input.prompt_id !== "string") {
    return fail("prompt_id: required string");
  }
  return ok();
}

function validateGetOutput(output: unknown): ValidationResult {
  if (!isObject(output)) return fail("Output must be an object");
  const obj = output;
  if (typeof obj.found !== "boolean") return fail("found: must be boolean");
  return ok();
}

// =============================================================================
// prompts.score
// =============================================================================

function validateScoreInput(input: unknown): ValidationResult {
  if (!isObject(input)) return fail("Input must be an object");
  const errs: string[] = [];
  if (typeof input.prompt_id !== "string") {
    errs.push("prompt_id: required string");
  }
  return errs.length ? fail(...errs) : ok();
}

function validateScoreOutput(output: unknown): ValidationResult {
  if (!isObject(output)) return fail("Output must be an object");
  const obj = output;
  const errs: string[] = [];
  if (!isObject(obj.quality)) errs.push("quality: must be object");
  if (!isObject(obj.hygiene)) errs.push("hygiene: must be object");
  if (!isObject(obj.context)) errs.push("context: must be object");
  if (typeof obj.combined_score !== "number")
    errs.push("combined_score: must be number");
  return errs.length ? fail(...errs) : ok();
}

// =============================================================================
// prompts.detect_artifacts
// =============================================================================

function validateDetectArtifactsInput(input: unknown): ValidationResult {
  if (!isObject(input)) return fail("Input must be an object");
  if (typeof input.content !== "string") {
    return fail("content: required string");
  }
  return ok();
}

function validateDetectArtifactsOutput(output: unknown): ValidationResult {
  if (!isObject(output)) return fail("Output must be an object");
  const obj = output;
  const errs: string[] = [];
  if (!Array.isArray(obj.artifacts)) errs.push("artifacts: must be array");
  if (typeof obj.hygiene_score !== "number")
    errs.push("hygiene_score: must be number");
  return errs.length ? fail(...errs) : ok();
}

// =============================================================================
// prompts.optimize
// =============================================================================

const VALID_OPTIMIZATION_MODES = ["conservative", "balanced", "aggressive"];

function validateOptimizeInput(input: unknown): ValidationResult {
  if (!isObject(input)) return fail("Input must be an object");
  const obj = input;
  const errs: string[] = [];

  if (typeof obj.content !== "string") {
    errs.push("content: required string");
  }

  if (!isString(obj.mode) || !VALID_OPTIMIZATION_MODES.includes(obj.mode)) {
    errs.push("mode: must be 'conservative' | 'balanced' | 'aggressive'");
  }

  const fmt = obj.target_format;
  if (fmt !== undefined && fmt !== "standard" && fmt !== "agentic") {
    errs.push("target_format: optional 'standard' | 'agentic'");
  }

  return errs.length ? fail(...errs) : ok();
}

function validateOptimizeOutput(output: unknown): ValidationResult {
  if (!isObject(output)) return fail("Output must be an object");
  const obj = output;
  const errs: string[] = [];
  if (typeof obj.original !== "string") errs.push("original: must be string");
  if (typeof obj.optimized !== "string") errs.push("optimized: must be string");
  if (!Array.isArray(obj.changes)) errs.push("changes: must be array");
  return errs.length ? fail(...errs) : ok();
}

// =============================================================================
// prompts.create
// =============================================================================

function validateCreateInput(input: unknown): ValidationResult {
  if (!isObject(input)) return fail("Input must be an object");
  const obj = input;
  const errs: string[] = [];

  if (!isString(obj.title) || obj.title.trim().length === 0) {
    errs.push("title: required non-empty string");
  }
  if (!isString(obj.content) || obj.content.trim().length === 0) {
    errs.push("content: required non-empty string");
  }

  const tags = obj.tags;
  if (tags !== undefined && !isStringArray(tags)) {
    errs.push("tags: optional string array");
  }

  return errs.length ? fail(...errs) : ok();
}

function validateCreateOutput(output: unknown): ValidationResult {
  if (!isObject(output)) return fail("Output must be an object");
  const obj = output;
  const errs: string[] = [];
  if (!isObject(obj.prompt)) errs.push("prompt: must be object");
  if (typeof obj.created !== "boolean") errs.push("created: must be boolean");
  return errs.length ? fail(...errs) : ok();
}

// =============================================================================
// prompts.update
// =============================================================================

function validateUpdateInput(input: unknown): ValidationResult {
  if (!isObject(input)) return fail("Input must be an object");
  const obj = input;
  const errs: string[] = [];

  if (!isString(obj.prompt_id)) {
    errs.push("prompt_id: required string");
  }

  // At least one field to update must be provided
  const hasContent = isString(obj.content);
  const hasTitle = isString(obj.title);
  const hasCategory = isString(obj.category);
  const hasTags = isStringArray(obj.tags);
  const hasDescription = isString(obj.description);

  if (!hasContent && !hasTitle && !hasCategory && !hasTags && !hasDescription) {
    errs.push(
      "At least one of content, title, category, tags, or description is required",
    );
  }

  return errs.length ? fail(...errs) : ok();
}

function validateUpdateOutput(output: unknown): ValidationResult {
  if (!isObject(output)) return fail("Output must be an object");
  const obj = output;
  const errs: string[] = [];
  if (!isObject(obj.prompt)) errs.push("prompt: must be object");
  if (typeof obj.updated !== "boolean") errs.push("updated: must be boolean");
  return errs.length ? fail(...errs) : ok();
}

// =============================================================================
// collections.list
// =============================================================================

function validateCollectionsListInput(_input: unknown): ValidationResult {
  // No input required
  return ok();
}

function validateCollectionsListOutput(output: unknown): ValidationResult {
  if (!isObject(output)) return fail("Output must be an object");
  const obj = output;
  const errs: string[] = [];
  if (!Array.isArray(obj.collections)) errs.push("collections: must be array");
  if (typeof obj.total_prompts !== "number")
    errs.push("total_prompts: must be number");
  return errs.length ? fail(...errs) : ok();
}

// =============================================================================
// qa.load_fixture
// =============================================================================

function validateLoadFixtureInput(input: unknown): ValidationResult {
  if (!isObject(input)) return fail("Input must be an object");
  const obj = input;
  const errs: string[] = [];

  if (!isString(obj.fixture_name) || obj.fixture_name.trim().length === 0) {
    errs.push("fixture_name: required non-empty string");
    return fail(...errs);
  }

  // Path boundary check: reject path traversal attempts
  const name = obj.fixture_name;
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    errs.push(
      "fixture_name: path traversal rejected (must be simple filename)",
    );
  }

  // Reject absolute path indicators
  if (/^[A-Za-z]:[/\\]/.test(name) || name.startsWith("/")) {
    errs.push("fixture_name: absolute path rejected");
  }

  // Reject path with null bytes
  if (name.includes("\0")) {
    errs.push("fixture_name: null byte rejected");
  }

  return errs.length ? fail(...errs) : ok();
}

function validateLoadFixtureOutput(output: unknown): ValidationResult {
  if (!isObject(output)) return fail("Output must be an object");
  const obj = output;
  const errs: string[] = [];
  if (typeof obj.content !== "string") errs.push("content: must be string");
  if (typeof obj.loaded !== "boolean") errs.push("loaded: must be boolean");
  return errs.length ? fail(...errs) : ok();
}

// =============================================================================
// qa.compare_score
// =============================================================================

function validateCompareScoreInput(input: unknown): ValidationResult {
  if (!isObject(input)) return fail("Input must be an object");
  const obj = input;
  const errs: string[] = [];

  if (!isString(obj.prompt_id_a)) errs.push("prompt_id_a: required string");
  if (!isString(obj.prompt_id_b)) errs.push("prompt_id_b: required string");

  return errs.length ? fail(...errs) : ok();
}

function validateCompareScoreOutput(output: unknown): ValidationResult {
  if (!isObject(output)) return fail("Output must be an object");
  const obj = output;
  const errs: string[] = [];
  if (!isObject(obj.a)) errs.push("a: must be object");
  if (!isObject(obj.b)) errs.push("b: must be object");
  if (typeof obj.delta !== "number") errs.push("delta: must be number");
  if (!["a", "b", "tie"].includes(obj.better as string))
    errs.push("better: must be 'a' | 'b' | 'tie'");
  return errs.length ? fail(...errs) : ok();
}

// =============================================================================
// Full Action Contract Registry
// =============================================================================

export const ACTION_CONTRACTS: Record<ActionName, ActionContract> = {
  "prompts.search": {
    name: "prompts.search",
    description: "Full-text search across all prompts in the vault",
    risk: "low",
    access: "read",
    uiStateImpact: "none",
    approvalRequired: false,
    evidenceRequired: true,
    validateInput: validateSearchInput,
    validateOutput: validateSearchOutput,
  },
  "prompts.get": {
    name: "prompts.get",
    description: "Get a single prompt by ID with all metadata",
    risk: "low",
    access: "read",
    uiStateImpact: "selection",
    approvalRequired: false,
    evidenceRequired: true,
    validateInput: validateGetInput,
    validateOutput: validateGetOutput,
  },
  "prompts.create": {
    name: "prompts.create",
    description: "Create a new prompt in the vault",
    risk: "medium",
    access: "write",
    uiStateImpact: "navigation",
    approvalRequired: true,
    evidenceRequired: true,
    validateInput: validateCreateInput,
    validateOutput: validateCreateOutput,
  },
  "prompts.update": {
    name: "prompts.update",
    description: "Update an existing prompt's content or metadata",
    risk: "high",
    access: "write",
    uiStateImpact: "none",
    approvalRequired: true,
    evidenceRequired: true,
    validateInput: validateUpdateInput,
    validateOutput: validateUpdateOutput,
  },
  "prompts.score": {
    name: "prompts.score",
    description: "Run quality, context, and hygiene scoring on a prompt",
    risk: "low",
    access: "read",
    uiStateImpact: "none",
    approvalRequired: false,
    evidenceRequired: true,
    validateInput: validateScoreInput,
    validateOutput: validateScoreOutput,
  },
  "prompts.detect_artifacts": {
    name: "prompts.detect_artifacts",
    description: "Detect foreign artifacts and contamination in prompt text",
    risk: "low",
    access: "read",
    uiStateImpact: "none",
    approvalRequired: false,
    evidenceRequired: true,
    validateInput: validateDetectArtifactsInput,
    validateOutput: validateDetectArtifactsOutput,
  },
  "prompts.optimize": {
    name: "prompts.optimize",
    description: "Optimize prompt text to a target format",
    risk: "low",
    access: "read",
    uiStateImpact: "none",
    approvalRequired: false,
    evidenceRequired: true,
    validateInput: validateOptimizeInput,
    validateOutput: validateOptimizeOutput,
  },
  "collections.list": {
    name: "collections.list",
    description: "List all collections/categories with counts and scores",
    risk: "low",
    access: "read",
    uiStateImpact: "none",
    approvalRequired: false,
    evidenceRequired: true,
    validateInput: validateCollectionsListInput,
    validateOutput: validateCollectionsListOutput,
  },
  "qa.load_fixture": {
    name: "qa.load_fixture",
    description: "Load a QA test fixture (path-bounded to fixtures/ directory)",
    risk: "low",
    access: "read",
    uiStateImpact: "none",
    approvalRequired: false,
    evidenceRequired: true,
    validateInput: validateLoadFixtureInput,
    validateOutput: validateLoadFixtureOutput,
  },
  "qa.compare_score": {
    name: "qa.compare_score",
    description: "Compare evaluation scores between two prompts",
    risk: "low",
    access: "read",
    uiStateImpact: "none",
    approvalRequired: false,
    evidenceRequired: true,
    validateInput: validateCompareScoreInput,
    validateOutput: validateCompareScoreOutput,
  },
};

/** All valid action names for runtime checks */
export const VALID_ACTION_NAMES: ReadonlySet<string> = new Set(
  Object.keys(ACTION_CONTRACTS),
);

/** Get contract by name, returns undefined for invalid names */
export function getActionContract(name: string): ActionContract | undefined {
  if (!VALID_ACTION_NAMES.has(name)) return undefined;
  return ACTION_CONTRACTS[name as ActionName];
}
