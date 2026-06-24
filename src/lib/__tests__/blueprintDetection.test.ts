// =============================================================================
// PromptVault Lite - Blueprint Detection & Optimization Tests
// =============================================================================
// Red Tests: verify blueprint classification, evaluation, optimization,
// and contamination detection without modifying existing prompt behavior.
// =============================================================================

import { describe, it, expect } from "vitest";
import { classifyContent, evaluateBlueprint } from "../blueprintDetection";
import {
  optimizeBlueprint,
  validateBlueprintQuality,
} from "../blueprintOptimizer";

// =============================================================================
// Test Fixtures
// =============================================================================

const CLEAR_PROMPT = `## Role
You are a senior TypeScript engineer.

## Task
Implement a REST API client for the weather service.

## Output Format
Return a TypeScript class with typed methods for each endpoint.

## Constraints
- Use fetch API only, no external HTTP libraries
- Must work in browser and Node.js
- Include error handling for network failures`;

const CLEAR_BLUEPRINT = `## Goal
Build a local-first prompt management desktop application.

## Scope
### In Scope
- Markdown prompt scanning and indexing
- Local quality scoring (no network, no LLM)
- Prompt optimization engine

### Out of Scope
- Cloud sync or SaaS
- Collaborative editing

### MVP Cut
- Prompt import, search, filter, score, optimize
- Dark mode

## Architecture
- Frontend: React + TypeScript + Vite
- Backend: Rust (Tauri commands)
- Storage: SQLite (via Tauri plugin)

## Data Flow
1. User imports markdown files
2. Tauri scanner indexes files
3. Scoring engine runs locally

## Security & Privacy
- All processing is local - no cloud backend
- No telemetry or analytics

## Risks & Known Limitations
- Scoring is heuristic, not LLM-based
- Large vaults may need pagination

## Implementation Plan
### Phase 1: Core Scanner (complete)
### Phase 2: Scoring Engine (complete)

## Testing & Verification
- Unit tests: Vitest (frontend), Cargo test (Rust)
- CI gates: pnpm test, cargo test, pnpm lint

## Evidence & Verification Contract
- All CI gates must be green before merge
- Test output posted as evidence in GitHub issues

## Next Steps
1. Complete accessibility improvements
2. Implement blueprint detection
3. Prepare v1.7.0 release`;

const HYBRID_PROMPT_BLUEPRINT = `## Role
You are a senior software architect.

## Task
Based on the following architecture blueprint, implement the scanner module.

## Blueprint (for reference)
### Architecture
- Scanner module: Rust, recursive directory walk
- Parser: markdown frontmatter extraction

### Implementation Plan
#### Phase 1: Basic file walker
#### Phase 2: Markdown parsing

### Security
- Path traversal prevention via canonicalize()

## Output Format
Return the complete Rust module with tests.

## Verification
Run cargo test and confirm all tests pass`;

const SIMPLE_NOTE = "Meeting notes for June 19, 2026. Discussed Q3 roadmap.";

const DOCUMENTATION = `# PromptVault Lite User Guide

## Installation
Download from GitHub Releases.

## Features
### Prompt Explorer
Browse your prompts in a file tree view.

### Quality Scoring
Each prompt is scored on prompt engineering quality.`;

const CODE_FRAGMENT = `\`\`\`typescript
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\``;

const CONTAMINATED_BLUEPRINT = `## Goal
Build a prompt management tool.

## Architecture
The system should integrate with Positron for deployment.
Originally called Prompt_Archiv but has been renamed.

## Risks
- Integration with CiviPet database may cause conflicts`;

const STALE_RUN_BLUEPRINT = `## Goal
Blueprint for the optimizer module.

## Evidence
Run report from 2025-03-15 shows all tests passing.
Test run dated 2024-11-01 confirms stability.`;

const SECRET_BLUEPRINT = `## Goal
API integration blueprint.

## Configuration
API key: "sk-abc123def456ghi789jkl"
Secret: "my-super-secret-value-here123"`;

// =============================================================================
// 1. Content Classification Tests
// =============================================================================

describe("Content Classification", () => {
  it("1. Clear prompt classified as PROMPT", () => {
    const result = classifyContent(CLEAR_PROMPT);
    expect(result.content_class).toBe("PROMPT");
    expect(result.blueprint_type).toBeNull();
    expect(result.prompt_signals.length).toBeGreaterThan(0);
  });

  it("2. Clear blueprint classified as BLUEPRINT", () => {
    const result = classifyContent(CLEAR_BLUEPRINT);
    expect(result.content_class).toBe("BLUEPRINT");
    expect(result.blueprint_signals.length).toBeGreaterThan(0);
    expect(result.blueprint_type).not.toBeNull();
  });

  it("3. Hybrid classified as PROMPT_BLUEPRINT_HYBRID", () => {
    const result = classifyContent(HYBRID_PROMPT_BLUEPRINT);
    expect(result.content_class).toBe("PROMPT_BLUEPRINT_HYBRID");
    expect(result.prompt_signals.length).toBeGreaterThan(0);
    expect(result.blueprint_signals.length).toBeGreaterThan(0);
  });

  it("4. Simple note NOT classified as BLUEPRINT", () => {
    const result = classifyContent(SIMPLE_NOTE);
    expect(result.content_class).not.toBe("BLUEPRINT");
    expect(result.content_class).not.toBe("PROMPT_BLUEPRINT_HYBRID");
  });

  it("5. Code fragment classified as CODE_FRAGMENT", () => {
    const result = classifyContent(CODE_FRAGMENT);
    expect(result.content_class).toBe("CODE_FRAGMENT");
    expect(result.blueprint_type).toBeNull();
  });

  it("6. Documentation classified as DOC", () => {
    const result = classifyContent(DOCUMENTATION);
    expect(result.content_class).toBe("DOC");
  });

  it("7. Empty content is UNKNOWN_NEEDS_REVIEW", () => {
    const result = classifyContent("");
    expect(result.content_class).toBe("UNKNOWN_NEEDS_REVIEW");
  });
});

// =============================================================================
// 2. Blueprint Evaluation Tests
// =============================================================================

describe("Blueprint Evaluation", () => {
  it("8. Well-structured blueprint gets high score", () => {
    const result = evaluateBlueprint(
      CLEAR_BLUEPRINT,
      "2026-06-19T00:00:00.000Z",
    );
    expect(result.content_class).toBe("BLUEPRINT");
    expect(result.overall_score).toBeGreaterThan(50);
    expect(result.goal_clarity_score).toBeGreaterThan(0);
    expect(result.scope_sharpness_score).toBeGreaterThan(0);
  });

  it("9. Evaluation includes all 10 dimensions", () => {
    const result = evaluateBlueprint(
      CLEAR_BLUEPRINT,
      "2026-06-19T00:00:00.000Z",
    );
    expect(result.dimensions.length).toBe(10);
    const names = result.dimensions.map((d) => d.name);
    expect(names).toContain("Goal Clarity");
    expect(names).toContain("Scope Sharpness");
    expect(names).toContain("Architecture Completeness");
    expect(names).toContain("Feasibility / Implementability");
    expect(names).toContain("Risk Coverage");
    expect(names).toContain("Security & Privacy");
    expect(names).toContain("Testability");
    expect(names).toContain("Evidence Readiness");
    expect(names).toContain("Context Purity");
    expect(names).toContain("Next Step Clarity");
  });

  it("10. Blueprint without verification gets improvement suggestion", () => {
    const noVerification =
      "## Goal\nBuild a feature.\n\n## Scope\nDo it within 2 weeks.\n\n## Architecture\nUse React and TypeScript.";
    const result = evaluateBlueprint(
      noVerification,
      "2026-06-19T00:00:00.000Z",
    );
    const ev = result.suggested_improvements.filter(
      (i) => i.criterion === "Evidence Readiness",
    );
    expect(ev.length).toBeGreaterThan(0);
    expect(ev[0].priority).toBe("high");
  });

  it("11. Blueprint without tests gets improvement suggestion", () => {
    const noTests =
      "## Goal\nBuild a feature.\n\n## Architecture\nReact components.\n\n## Implementation\nPhase 1: Basic UI";
    const result = evaluateBlueprint(noTests, "2026-06-19T00:00:00.000Z");
    const ti = result.suggested_improvements.filter(
      (i) => i.criterion === "Testability",
    );
    expect(ti.length).toBeGreaterThan(0);
  });

  it("12. Empty blueprint returns zero scores", () => {
    const result = evaluateBlueprint("", "2026-06-19T00:00:00.000Z");
    expect(result.overall_score).toBe(0);
    expect(result.goal_clarity_score).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// 3. Contamination Detection Tests
// =============================================================================

describe("Blueprint Contamination Detection", () => {
  it("13. Foreign project names marked contaminated", () => {
    const result = classifyContent(CONTAMINATED_BLUEPRINT);
    expect(result.contamination_status).toBe("CONTAMINATED_NEEDS_REVIEW");
    expect(result.contamination_signals).toContain("foreign_app_name");
    expect(result.contamination_signals).toContain("stale_project_name");
  });

  it("14. Stale run reports marked POSSIBLE_CONTAMINATION", () => {
    const result = classifyContent(STALE_RUN_BLUEPRINT);
    expect(result.contamination_signals).toContain("stale_run_report");
    expect(result.contamination_status).toBe("POSSIBLE_CONTAMINATION");
  });

  it("15. Secrets BLOCKING but not output", () => {
    const result = classifyContent(SECRET_BLUEPRINT);
    expect(result.contamination_status).toBe("BLOCKING_SENSITIVE_CONTENT");
    expect(result.contamination_signals).toContain("potential_secret");
    const json = JSON.stringify(result);
    expect(json).not.toContain("sk-abc123");
    expect(json).not.toContain("my-super-secret");
  });

  it("16. Clean blueprint has CLEAN status", () => {
    const result = classifyContent(CLEAR_BLUEPRINT);
    expect(result.contamination_status).toBe("CLEAN");
    expect(result.contamination_signals.length).toBe(0);
  });

  it("17. Contradictory runtime info flagged", () => {
    const c =
      "## Architecture\nThe system runs on Linux using bash.\nWindows PowerShell is used for deployment.\nmacOS is the dev environment.";
    const result = classifyContent(c);
    expect(result.contamination_signals).toContain("contradictory_runtime");
  });
});

// =============================================================================
// 4. Blueprint Optimization Tests
// =============================================================================

describe("Blueprint Optimization", () => {
  it("18. Conservative preserves content", () => {
    const result = optimizeBlueprint(CLEAR_BLUEPRINT, "conservative");
    expect(result.optimized.length).toBeGreaterThan(0);
    expect(result.optimized).toContain("Goal");
    expect(result.optimized).toContain("Scope");
    expect(result.optimized).toContain("Architecture");
  });

  it("19. Balanced does not inject TODOs/placeholders", () => {
    const result = optimizeBlueprint(CLEAR_BLUEPRINT, "balanced");
    expect(result.optimized).not.toMatch(/<!--\s*TODO/i);
    expect(result.optimized).not.toMatch(/\bTBD\b/);
  });

  it("20. Aggressive adds scaffolding sections", () => {
    const input =
      "## Goal\nBuild a simple CLI tool.\n\n## Architecture\nRust binary with clap.";
    const result = optimizeBlueprint(input, "aggressive");
    expect(result.optimized).toContain("Verification Contract");
    expect(result.optimized).toContain("Human Approval Gate");
    expect(result.optimized).toContain("Evidence & Portfolio");
    expect(result.optimized).toContain(
      "Was kann die Software jetzt im Vergleich",
    );
    expect(result.changes.some((c) => c.type === "add_section")).toBe(true);
  });

  it("21. Contamination cleanup marks foreign names", () => {
    const result = optimizeBlueprint(CONTAMINATED_BLUEPRINT, "conservative");
    expect(result.optimized).toContain("~~CONTAMINATED:");
    expect(result.contamination_cleaned).toBe(true);
  });

  it("22. Quality validation passes for clean output", () => {
    const result = optimizeBlueprint(CLEAR_BLUEPRINT, "balanced");
    const quality = validateBlueprintQuality(CLEAR_BLUEPRINT, result.optimized);
    expect(quality.passed).toBe(true);
    expect(quality.unresolved_placeholders.length).toBe(0);
    expect(quality.contamination_resolved).toBe(true);
  });

  it("23. Validation detects unresolved placeholders", () => {
    const wp =
      "## Goal\nBuild a feature.\n\n## Scope\n<!-- TODO: Define scope -->\nTBD";
    const quality = validateBlueprintQuality("", wp);
    expect(quality.passed).toBe(false);
    expect(quality.warnings.length).toBeGreaterThan(0);
  });

  it("24. Aggressive adds evidence/portfolio handoff", () => {
    const input = "## Goal\nCreate a simple utility.";
    const result = optimizeBlueprint(input, "aggressive");
    expect(result.optimized).toContain("Evidence & Portfolio");
    expect(result.optimized).toContain("Test results");
    expect(result.optimized).toContain("CI pipeline status");
  });

  it("25. Aggressive adds Human Approval Gate", () => {
    const input = "## Goal\nCreate a simple utility.";
    const result = optimizeBlueprint(input, "aggressive");
    expect(result.optimized).toContain("Human Approval Gate");
    expect(result.optimized).toContain(
      "No merge, commit, or deploy without explicit Human Approval",
    );
  });

  it("26. Aggressive adds comparison section", () => {
    const input = "## Goal\nCreate a simple utility.";
    const result = optimizeBlueprint(input, "aggressive");
    expect(result.optimized).toContain(
      "Was kann die Software jetzt im Vergleich",
    );
    expect(result.optimized).toContain("Neue F");
    expect(result.optimized).toContain("Entfernte Blocker");
    expect(result.optimized).toContain("chster sinnvoller Schritt");
  });

  it("27. Changes array is well-formed", () => {
    const result = optimizeBlueprint(CLEAR_BLUEPRINT, "balanced");
    expect(Array.isArray(result.changes)).toBe(true);
    for (const change of result.changes) {
      expect(change.type).toBeDefined();
      expect(typeof change.description).toBe("string");
    }
  });

  it("28. Short input gets warning", () => {
    const result = optimizeBlueprint("Just a goal", "conservative");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("29. Empty input returns early", () => {
    const result = optimizeBlueprint("", "aggressive");
    expect(result.optimized).toBe("");
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.changes.length).toBe(0);
  });
});

// =============================================================================
// 5. Regression: Existing Prompt Evaluation Unchanged
// =============================================================================

describe("Regression: Existing Prompt Evaluation", () => {
  it("30. promptContextEvaluation still exports evaluatePromptContext", async () => {
    const mod = await import("../promptContextEvaluation");
    expect(mod.evaluatePromptContext).toBeDefined();
    expect(typeof mod.evaluatePromptContext).toBe("function");
  });

  it("31. promptOptimizer still exports optimizePrompt", async () => {
    const mod = await import("../promptOptimizer");
    expect(mod.optimizePrompt).toBeDefined();
    expect(typeof mod.optimizePrompt).toBe("function");
  });
});

// =============================================================================
// 6. Blueprint Type Detection
// =============================================================================

describe("Blueprint Type Detection", () => {
  it("32. Security blueprint detected", () => {
    const sec = classifyContent(
      "## Goal\nSecurity and compliance blueprint for the API gateway and all backend services.\n\n## Security & Privacy\n- JWT-based authentication with refresh tokens\n- OAuth2 for third-party access protocols\n- Rate limiting on all public endpoints\n- GDPR compliance for EU user data\n\n## Threat Model\n- SQL injection via user input fields\n- Token theft via XSS in user-facing pages\n- Credential stuffing through brute force\n\n## Compliance\n- DSGVO requirements for data retention\n- Consent tracking mechanism\n\n## Risks & Known Limitations\n- Zero-day vulnerabilities in OAuth libraries\n- Compliance audit may require penetration testing\n\n## Implementation Plan\n### Phase 1: Auth hardening\n### Phase 2: Compliance audit prep\n\n## Next Steps\n1. Review OAuth2 implementation\n2. Run penetration test\n3. Schedule compliance audit",
    );
    expect(sec.blueprint_type).toBe("security_blueprint");
  });

  it("33. Architecture blueprint detected", () => {
    const arch = classifyContent(
      "## Goal\nDesign the microservice architecture for the next-gen platform.\n\n## Architecture\nMicroservice architecture with event-driven communication between services.\n\n## Component Diagram\n- API Gateway routes requests\n- Auth Service handles authentication\n- Product Service manages catalog\n\n## Data Flow\n1. Request enters through API Gateway\n2. Gateway authenticates via Auth Service\n3. Request routed to appropriate microservice\n\n## Implementation Plan\n### Phase 1: Gateway and Auth\n### Phase 2: Product Service\n\n## Risks\n- Service discovery complexity\n- Event ordering challenges",
    );
    expect(arch.blueprint_type).toBe("architecture_blueprint");
  });

  it("34. Prompt has null blueprint_type", () => {
    const result = classifyContent(CLEAR_PROMPT);
    expect(result.blueprint_type).toBeNull();
  });
});

// =============================================================================
// 7. Secret Non-Output Verification
// =============================================================================

describe("Secret Non-Output", () => {
  it("35. Classification never contains detected secret values", () => {
    const tests = [
      SECRET_BLUEPRINT,
      "API_KEY=my-secret-123\nPASSWORD=superpass",
      'token: "abc123xyz"',
    ];

    for (const content of tests) {
      const result = classifyContent(content);
      const json = JSON.stringify(result);
      expect(json).not.toContain("sk-abc123");
      expect(json).not.toContain("my-super-secret");
      expect(json).not.toContain("my-secret-123");
      expect(json).not.toContain("superpass");
      expect(json).not.toContain("abc123xyz");
    }
  });
});

// =============================================================================
// Regression: HYBRID threshold guard (second follow-up)
// =============================================================================

describe("HYBRID threshold regression", () => {
  const AGENT_PROMPT_WITH_WORKFLOW = `# Agenten-Prompt

## Rolle
Du bist ein Senior Code Reviewer.

## Aufgabe
Prüfe den folgenden Pull Request auf Sicherheitslücken.

## Verification Contract
- Alle Tests müssen grün sein
- Kein Merge ohne Human Approval

## Ergebnisformat
Gib einen strukturierten Review-Report aus.`;

  it("36. Agent prompt with only workflow governance signals stays PROMPT, not HYBRID", () => {
    const result = classifyContent(AGENT_PROMPT_WITH_WORKFLOW);
    // A single workflow_governance blueprint signal with dominant prompt signals
    // should NOT trigger HYBRID classification
    expect(result.content_class).not.toBe("PROMPT_BLUEPRINT_HYBRID");
    expect(result.content_class).toBe("PROMPT");
  });

  it("37. Agent prompt with workflow still has AGENT_PROMPT and WORKFLOW tags", () => {
    const result = classifyContent(AGENT_PROMPT_WITH_WORKFLOW);
    expect(result.tags).toContain("AGENT_PROMPT");
    expect(result.tags).toContain("WORKFLOW");
  });

  const AGENT_PROMPT_WITH_ARCHITECTURE = `# System Design Agent Prompt

## Rolle
Du bist System Architect.

## System Architecture Overview
Die Anwendung besteht aus einem React Frontend und einem Rust Backend.
Die Komponenten kommunizieren über lokale IPC.

## Data Flow & Integration
Daten fließen vom Frontend über Tauri-Commands zum Rust-Backend.
SQLite dient als lokale Datenbank für Prompts und Evaluations.

## Aufgabe
Analysiere die Systemarchitektur und schlage Verbesserungen vor.`;

  it("38. Agent prompt with multiple architecture blueprint signals becomes HYBRID", () => {
    const result = classifyContent(AGENT_PROMPT_WITH_ARCHITECTURE);
    // Multiple blueprint signals (architecture + data_flow) with prompt signals
    // SHOULD trigger HYBRID — this is a real hybrid
    expect(result.content_class).toBe("PROMPT_BLUEPRINT_HYBRID");
  });

  it("39. Pure agent prompt without any blueprint signals stays PROMPT", () => {
    const result = classifyContent(
      "# My Prompt\n\n## Rolle\nDu bist Assistant.\n\n## Aufgabe\nHilf mir.",
    );
    expect(result.content_class).toBe("PROMPT");
    expect(result.content_class).not.toBe("PROMPT_BLUEPRINT_HYBRID");
  });
});
