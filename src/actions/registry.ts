// =============================================================================
// Action Registry — Central dispatch with validation, approval, and evidence
// =============================================================================

import type { ActionName, ActionRisk, ActionResult } from "@/types";
import { getActionContract } from "./contracts";
import { logEvidence } from "./evidence";
import {
  handleSearch,
  handleGet,
  handleCreate,
  handleUpdate,
  handleScore,
  handleDetectArtifacts,
  handleOptimize,
  handleBlueprintDetect,
  handleBlueprintEvaluate,
  handleBlueprintOptimize,
  handleCollectionsList,
  handleLoadFixture,
  handleCompareScore,
} from "./handlers";

// =============================================================================
// Dev Mode Gate
// =============================================================================

const DEV_MODE_KEY = "promptvault.devMode";

export function isDeveloperModeEnabled(): boolean {
  try {
    return localStorage.getItem(DEV_MODE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setDeveloperMode(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(DEV_MODE_KEY, "true");
    } else {
      localStorage.removeItem(DEV_MODE_KEY);
    }
  } catch {
    // silent fail (private browsing, etc.)
  }
}

// =============================================================================
// UI Approval Provider
// =============================================================================

/** Parameters passed to the UI for approval decision */
export interface ApprovalRequest {
  actionName: ActionName;
  description: string;
  risk: ActionRisk;
}

/** Callback type: the UI registers this to handle approval dialogs */
export type ApprovalProvider = (request: ApprovalRequest) => Promise<boolean>;

let approvalProvider: ApprovalProvider | null = null;

/**
 * Register an approval provider from the UI layer.
 * The provider receives an ApprovalRequest and must return a Promise<boolean>.
 * - `true` = user approved → action proceeds
 * - `false` = user cancelled → action blocked
 */
export function setApprovalProvider(provider: ApprovalProvider | null): void {
  approvalProvider = provider;
}

/** Get the current approval provider (for testing) */
export function getApprovalProvider(): ApprovalProvider | null {
  return approvalProvider;
}

// =============================================================================
// Dispatch
// =============================================================================

function requireDevMode(): boolean {
  if (!isDeveloperModeEnabled()) {
    return false;
  }
  return true;
}

/**
 * Dispatch an action by name with typed input.
 * Validates input schema, checks dev mode, enforces approval,
 * executes handler, validates output, and logs evidence.
 */
export async function dispatch<T = unknown>(
  actionName: string,
  input: unknown,
): Promise<ActionResult<T>> {
  const startTime = performance.now();

  // 1. Validate action name
  const contract = getActionContract(actionName);
  if (!contract) {
    const duration = performance.now() - startTime;
    logEvidence(
      "(unknown)",
      input,
      "error",
      duration,
      `Unknown action: "${actionName}"`,
    );
    return {
      success: false,
      error: `Unknown action: "${actionName}". Valid actions include: prompts.search, prompts.get, prompts.create, prompts.update, prompts.score, prompts.detect_artifacts, prompts.optimize, blueprints.detect, blueprints.evaluate, blueprints.optimize, collections.list, qa.load_fixture, qa.compare_score.`,
    };
  }

  // 2. Developer mode gate
  if (!requireDevMode()) {
    const duration = performance.now() - startTime;
    const evidence = logEvidence(
      contract.name,
      input,
      "blocked",
      duration,
      "Developer mode not enabled",
    );
    return {
      success: false,
      error:
        "Developer mode not enabled. Enable Developer Mode in Settings to use actions.",
      evidence,
    };
  }

  // 3. Validate input
  const inputResult = contract.validateInput(input);
  if (!inputResult.valid) {
    const duration = performance.now() - startTime;
    const evidence = logEvidence(
      contract.name,
      input,
      "error",
      duration,
      `Input validation failed: ${inputResult.errors.join("; ")}`,
    );
    return {
      success: false,
      error: `Input validation failed: ${inputResult.errors.join("; ")}`,
      evidence,
    };
  }

  // 4. Approval gate for write actions (UI-based)
  if (contract.approvalRequired) {
    if (!approvalProvider) {
      // No UI provider registered — block by default
      const duration = performance.now() - startTime;
      const evidence = logEvidence(
        contract.name,
        input,
        "blocked",
        duration,
        "Write action requires approval but no approval provider is registered.",
      );
      return {
        success: false,
        error: `Action "${contract.name}" is a write action and requires approval. No approval provider registered.`,
        evidence,
      };
    }

    // Ask the UI for approval (with error handling)
    let approved: boolean;
    try {
      approved = await approvalProvider({
        actionName: contract.name,
        description: contract.description,
        risk: contract.risk,
      });
    } catch (err) {
      const duration = performance.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      const evidence = logEvidence(
        contract.name,
        input,
        "error",
        duration,
        `Approval provider threw: ${errorMsg}`,
      );
      return {
        success: false,
        error: `Approval error: ${errorMsg}`,
        evidence,
      };
    }

    if (!approved) {
      const duration = performance.now() - startTime;
      const evidence = logEvidence(
        contract.name,
        input,
        "denied",
        duration,
        "User denied the write action approval request.",
      );
      return {
        success: false,
        error: `Action "${contract.name}" was cancelled by the user.`,
        evidence,
      };
    }

    // Log approval evidence immediately — before handler execution.
    // Ensures the audit trail records user consent even if the handler fails.
    logEvidence(
      contract.name,
      input,
      "approved",
      performance.now() - startTime,
      "User approved the write action via UI dialog.",
    );
  }

  // 5. Execute handler
  try {
    const output = await executeHandler(contract.name, input);
    const execTime = performance.now() - startTime;

    // 6. Validate output
    const outputResult = contract.validateOutput(output);
    if (!outputResult.valid) {
      const evidence = logEvidence(
        contract.name,
        input,
        "error",
        execTime,
        `Output validation failed: ${outputResult.errors.join("; ")}`,
      );
      return {
        success: false,
        error: `Output validation failed: ${outputResult.errors.join("; ")}`,
        evidence,
      };
    }

    // 7. Log success evidence
    const evidence = logEvidence(contract.name, input, "success", execTime);

    return {
      success: true,
      data: output as T,
      evidence,
    };
  } catch (err) {
    const execTime = performance.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    const evidence = logEvidence(
      contract.name,
      input,
      "error",
      execTime,
      errorMsg,
    );

    return {
      success: false,
      error: errorMsg,
      evidence,
    };
  }
}

// =============================================================================
// Handler Router
// =============================================================================

async function executeHandler(
  name: ActionName,
  input: unknown,
): Promise<unknown> {
  switch (name) {
    case "prompts.search":
      return handleSearch(input);
    case "prompts.get":
      return handleGet(input);
    case "prompts.create":
      return handleCreate(input);
    case "prompts.update":
      return handleUpdate(input);
    case "prompts.score":
      return handleScore(input);
    case "prompts.detect_artifacts":
      return handleDetectArtifacts(input);
    case "prompts.optimize":
      return handleOptimize(input);
    case "blueprints.detect":
      return handleBlueprintDetect(input);
    case "blueprints.evaluate":
      return handleBlueprintEvaluate(input);
    case "blueprints.optimize":
      return handleBlueprintOptimize(input);
    case "collections.list":
      return handleCollectionsList();
    case "qa.load_fixture":
      return handleLoadFixture(input);
    case "qa.compare_score":
      return handleCompareScore(input);
    default: {
      // Exhaustive check: TypeScript ensures all ActionName cases are handled
      const _exhaustive: never = name;
      throw new Error(`Unhandled action: ${String(_exhaustive)}`);
    }
  }
}
