// =============================================================================
// Action Handlers — Implementations for all 13 registered actions
// =============================================================================
// Handlers receive typed input (already validated) and return typed output.
// They access the app store and Tauri backend through a handler context.

import type {
  PromptItem,
  PromptEvaluation,
  PromptHygiene,
  PromptContextEvaluation,
  SearchInput,
  SearchOutput,
  ScoreInput,
  ScoreOutput,
  DetectArtifactsInput,
  DetectArtifactsOutput,
  OptimizeInput,
  OptimizeOutput,
  CreatePromptInput,
  CreatePromptOutput,
  UpdatePromptInput,
  UpdatePromptOutput,
  CollectionListOutput,
  LoadFixtureInput,
  LoadFixtureOutput,
  CompareScoreInput,
  CompareScoreOutput,
  ArtifactCategory,
  BlueprintDetectInput,
  BlueprintDetectOutput,
  BlueprintEvaluateInput,
  BlueprintEvaluateOutput,
  BlueprintOptimizeInput,
  BlueprintOptimizeOutput,
} from "@/types";
import { optimizePrompt } from "@/lib/promptOptimizer";
import { evaluatePromptContext } from "@/lib/promptContextEvaluation";
import { classifyContent, evaluateBlueprint } from "@/lib/blueprintDetection";
import { optimizeBlueprint } from "@/lib/blueprintOptimizer";

// =============================================================================
// Handler Context — provides access to app state and backend
// =============================================================================

export interface HandlerContext {
  /** Get all loaded prompts */
  getPrompts: () => PromptItem[];
  /** Get evaluation for a prompt */
  getEvaluation: (promptId: string) => PromptEvaluation | null;
  /** Get hygiene for a prompt */
  getHygiene: (promptId: string) => PromptHygiene | null;
  /** Get context evaluation for a prompt */
  getContextEvaluation: (promptId: string) => PromptContextEvaluation | null;
  /** Run Tauri evaluate_prompt command */
  evaluatePrompt: (
    promptId: string,
    content: string,
  ) => Promise<PromptEvaluation>;
  /** Run Tauri analyze_hygiene command */
  analyzeHygiene: (promptId: string, content: string) => Promise<PromptHygiene>;
  /** Create a new prompt via Tauri */
  createPrompt: (input: CreatePromptInput) => Promise<PromptItem>;
  /** Update an existing prompt via Tauri */
  updatePrompt: (input: UpdatePromptInput) => Promise<PromptItem>;
}

/** Default no-op context (for testing) */
let _context: HandlerContext | null = null;

export function setHandlerContext(ctx: HandlerContext): void {
  _context = ctx;
}

export function getHandlerContext(): HandlerContext {
  if (!_context) {
    throw new Error(
      "Handler context not initialized. Call setHandlerContext() before using action handlers.",
    );
  }
  return _context;
}

// =============================================================================
// Fixture Path Validation (Security: path traversal prevention)
// =============================================================================

const FIXTURES_DIR = "fixtures";

function sanitizeFixtureName(name: string): string {
  // Remove path traversal sequences
  let sanitized = name.replace(/\.\./g, "").replace(/[\/\\]/g, "");
  // Remove any drive letter prefixes
  sanitized = sanitized.replace(/^[A-Za-z]:/, "");
  // Remove leading slashes/dots
  sanitized = sanitized.replace(/^[.\/\\]+/, "");
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");
  // Remove any remaining special path chars
  sanitized = sanitized.replace(/[<>:"|?*]/g, "");
  return sanitized;
}

// =============================================================================
// prompts.search
// =============================================================================

export function handleSearch(input: unknown): SearchOutput {
  const { query, filters, limit = 50, offset = 0 } = input as SearchInput;
  const ctx = getHandlerContext();
  const prompts = ctx.getPrompts();
  const startTime = performance.now();

  const q = query.toLowerCase();
  let results = prompts.filter((p) => {
    // Apply filters if provided
    if (filters) {
      if (filters.favoritesOnly && !p.is_favorite) return false;
      if (filters.category && p.category !== filters.category) return false;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime safety: input is `unknown` cast to SearchInput, tags may be absent
      if (filters.tags && filters.tags.length > 0) {
        if (!filters.tags.some((t) => p.tags.includes(t))) return false;
      }
    }
    // Full-text search
    return (
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.content.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  });

  const total = results.length;
  results = results.slice(offset, offset + Math.min(limit, 1000));

  const duration_ms = Math.round(performance.now() - startTime);

  return { results, total, query, duration_ms };
}

// =============================================================================
// prompts.get
// =============================================================================

export function handleGet(input: unknown): {
  prompt: PromptItem | null;
  found: boolean;
} {
  const { prompt_id } = input as { prompt_id: string };
  const ctx = getHandlerContext();
  const prompt = ctx.getPrompts().find((p) => p.id === prompt_id) || null;
  return { prompt, found: prompt !== null };
}

// =============================================================================
// prompts.score
// =============================================================================

export async function handleScore(input: unknown): Promise<ScoreOutput> {
  const { prompt_id, content } = input as ScoreInput;
  const ctx = getHandlerContext();

  let promptContent = content;
  if (!promptContent) {
    const prompt = ctx.getPrompts().find((p) => p.id === prompt_id);
    if (!prompt) {
      throw new Error(`Prompt not found: ${prompt_id}`);
    }
    promptContent = prompt.content;
  }

  // Run all three evaluation dimensions
  const [quality, hygiene] = await Promise.all([
    ctx.evaluatePrompt(prompt_id, promptContent),
    ctx.analyzeHygiene(prompt_id, promptContent),
  ]);

  // Context evaluation is synchronous (pure TypeScript)
  const context = evaluatePromptContext(promptContent);

  // Combined score: weighted average
  const combined_score = Math.round(
    quality.overall_score * 0.4 +
      hygiene.hygiene_score * 0.2 +
      context.overall_score * 0.4,
  );

  return {
    quality,
    hygiene,
    context,
    combined_score,
  };
}

// =============================================================================
// prompts.detect_artifacts
// =============================================================================

export async function handleDetectArtifacts(
  input: unknown,
): Promise<DetectArtifactsOutput> {
  const { content } = input as DetectArtifactsInput;
  const ctx = getHandlerContext();

  // Run Tauri hygiene analysis (which includes all artifact detectors)
  const hygiene = await ctx.analyzeHygiene("_ad_hoc", content);

  // Gather categories found
  const categories = new Set<ArtifactCategory>();
  for (const artifact of hygiene.artifacts) {
    categories.add(artifact.category);
  }

  return {
    artifacts: hygiene.artifacts,
    hygiene_score: hygiene.hygiene_score,
    status: hygiene.status,
    categories_found: Array.from(categories),
  };
}

// =============================================================================
// prompts.optimize
// =============================================================================

export function handleOptimize(input: unknown): OptimizeOutput {
  const { content, mode } = input as OptimizeInput;

  // Run optimization
  const diff = optimizePrompt(content, mode);

  // Optionally compute before/after scores
  let before_score: number | undefined;
  let after_score: number | undefined;

  if (content.trim().length > 0 && diff.optimized.trim().length > 0) {
    try {
      const beforeCtx = evaluatePromptContext(content);
      const afterCtx = evaluatePromptContext(diff.optimized);
      before_score = beforeCtx.overall_score;
      after_score = afterCtx.overall_score;
    } catch {
      // Scoring is best-effort; don't fail optimization on scoring error
    }
  }

  return {
    original: diff.original,
    optimized: diff.optimized,
    changes: diff.changes,
    warnings: diff.warnings,
    before_score,
    after_score,
  };
}

// =============================================================================
// prompts.create
// =============================================================================

export async function handleCreate(
  input: unknown,
): Promise<CreatePromptOutput> {
  const ctx = getHandlerContext();
  const prompt = await ctx.createPrompt(input as CreatePromptInput);
  return { prompt, created: true };
}

// =============================================================================
// prompts.update
// =============================================================================

export async function handleUpdate(
  input: unknown,
): Promise<UpdatePromptOutput> {
  const ctx = getHandlerContext();
  const updateInput = input as UpdatePromptInput;

  // Determine changed fields
  const changed_fields: string[] = [];
  if (updateInput.content !== undefined) changed_fields.push("content");
  if (updateInput.title !== undefined) changed_fields.push("title");
  if (updateInput.category !== undefined) changed_fields.push("category");
  if (updateInput.tags !== undefined) changed_fields.push("tags");
  if (updateInput.description !== undefined) changed_fields.push("description");

  const prompt = await ctx.updatePrompt(updateInput);
  return { prompt, updated: true, changed_fields };
}

// =============================================================================
// collections.list
// =============================================================================

export function handleCollectionsList(): CollectionListOutput {
  const ctx = getHandlerContext();
  const prompts = ctx.getPrompts();

  // Group by category
  const byCategory = new Map<string, PromptItem[]>();
  for (const p of prompts) {
    const cat = p.category || "uncategorized";
    if (!byCategory.has(cat)) {
      byCategory.set(cat, []);
    }
    const bucket = byCategory.get(cat);
    if (bucket) {
      bucket.push(p);
    }
  }

  const collections = Array.from(byCategory.entries())
    .map(([category, items]) => {
      let totalScore = 0;
      let scoredCount = 0;
      for (const item of items) {
        const eval_ = ctx.getEvaluation(item.id);
        if (eval_) {
          totalScore += eval_.overall_score;
          scoredCount++;
        }
      }
      return {
        category,
        count: items.length,
        avg_score: scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0,
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category));

  return {
    collections,
    total_prompts: prompts.length,
  };
}

// =============================================================================
// qa.load_fixture
// =============================================================================

export async function handleLoadFixture(
  input: unknown,
): Promise<LoadFixtureOutput> {
  const { fixture_name } = input as LoadFixtureInput;

  // Sanitize fixture name (prevent path traversal)
  const safeName = sanitizeFixtureName(fixture_name);

  if (safeName.length === 0) {
    throw new Error(
      `Invalid fixture name after sanitization: "${fixture_name}"`,
    );
  }

  // In browser/Vite context, we can use dynamic import or fetch
  // Since this is a local app, try fetch from the fixtures directory
  try {
    const fixturePath = `/${FIXTURES_DIR}/${safeName}`;
    const response = await fetch(fixturePath);

    if (!response.ok) {
      throw new Error(
        `Fixture not found: ${safeName} (HTTP ${response.status})`,
      );
    }

    const content = await response.text();

    if (content.trim().length === 0) {
      throw new Error(`Fixture is empty: ${safeName}`);
    }

    return { content, loaded: true };
  } catch (err) {
    if (err instanceof Error && err.message.includes("Fixture")) {
      throw err;
    }
    throw new Error(
      `Failed to load fixture "${safeName}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// =============================================================================
// qa.compare_score
// =============================================================================

export function handleCompareScore(input: unknown): CompareScoreOutput {
  const { prompt_id_a, prompt_id_b } = input as CompareScoreInput;
  const ctx = getHandlerContext();

  const evalA = ctx.getContextEvaluation(prompt_id_a);
  const evalB = ctx.getContextEvaluation(prompt_id_b);

  if (!evalA)
    throw new Error(`Evaluation not found for prompt A: ${prompt_id_a}`);
  if (!evalB)
    throw new Error(`Evaluation not found for prompt B: ${prompt_id_b}`);

  const a = {
    overall_score: evalA.overall_score,
    prompt_engineering_score: evalA.prompt_engineering_score,
  };
  const b = {
    overall_score: evalB.overall_score,
    prompt_engineering_score: evalB.prompt_engineering_score,
  };
  const delta = a.overall_score - b.overall_score;

  let better: "a" | "b" | "tie";
  if (delta > 0) better = "a";
  else if (delta < 0) better = "b";
  else better = "tie";

  return { a, b, delta, better };
}

// =============================================================================
// blueprints.detect
// =============================================================================

export function handleBlueprintDetect(input: unknown): BlueprintDetectOutput {
  const { content } = input as BlueprintDetectInput;

  if (!content || content.trim().length === 0) {
    return {
      content_class: "UNKNOWN_NEEDS_REVIEW",
      blueprint_type: null,
      contamination_status: "CLEAN",
      confidence: 0.95,
      prompt_signals: [],
      blueprint_signals: [],
      contamination_signals: [],
    };
  }

  return classifyContent(content);
}

// =============================================================================
// blueprints.evaluate
// =============================================================================

export function handleBlueprintEvaluate(
  input: unknown,
): BlueprintEvaluateOutput {
  const { content } = input as BlueprintEvaluateInput;
  const evaluation = evaluateBlueprint(content, new Date().toISOString());
  return { evaluation };
}

// =============================================================================
// blueprints.optimize
// =============================================================================

export function handleBlueprintOptimize(
  input: unknown,
): BlueprintOptimizeOutput {
  const { content, mode } = input as BlueprintOptimizeInput;

  // Run optimization
  const diff = optimizeBlueprint(content, mode);

  // Compute before/after evaluations
  const beforeEvaluation = evaluateBlueprint(content, new Date().toISOString());
  const afterEvaluation =
    diff.optimized.trim().length > 0
      ? evaluateBlueprint(diff.optimized, new Date().toISOString())
      : beforeEvaluation;

  return {
    original: diff.original,
    optimized: diff.optimized,
    changes: diff.changes,
    warnings: diff.warnings,
    contamination_cleaned: diff.contamination_cleaned,
    before_evaluation: beforeEvaluation,
    after_evaluation: afterEvaluation,
  };
}
