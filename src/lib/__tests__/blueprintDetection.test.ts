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

const GUIDELINE_DOCUMENT = `# System-Richtlinie: Effiziente Prompt-Ausgabe

Diese Richtlinie definiert die Regeln für effiziente Kommunikation mit KI-Systemen.

## 1. Direkte Kommunikation

Verzichte auf Füllwörter. Verwende klare Imperative.

## 2. Output-Management

Nutze strukturierte Formate wie JSON, YAML oder Markdown.

## 3. Batch-Verarbeitung

Fasse gleichartige Aufgaben in Batches zusammen.
BatchPrompting reduziert Overhead und verbessert Konsistenz.`;

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

  it("8. Guideline/policy document classified as GUIDELINE", () => {
    const result = classifyContent(GUIDELINE_DOCUMENT);
    expect(result.content_class).toBe("GUIDELINE");
    expect(result.confidence).toBeGreaterThan(0.5);
    // Should have guideline signals
    expect(result.guideline_signals).toBeDefined();
    expect(result.guideline_signals?.length).toBeGreaterThan(0);
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

## Acceptance Criteria
- Architecture overview matches current deployment
- Data flow accuracy verified against implementation
- All components identified correctly

## Aufgabe
Analysiere die Systemarchitektur und schlage Verbesserungen vor.`;

  it("38. Agent prompt with architecture + acceptance criteria becomes HYBRID", () => {
    const result = classifyContent(AGENT_PROMPT_WITH_ARCHITECTURE);
    // Strong blueprint signal (acceptance criteria) + weak (architecture, data_flow)
    // with prompt signals SHOULD trigger HYBRID
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

// =============================================================================
// 8. BLUEPRINT / DOCUMENTATION Boundary Regression Tests
// =============================================================================

describe("BLUEPRINT / DOCUMENTATION Boundary", () => {
  const DOC_ARCHITECTURE_OVERVIEW = `# Architecture Overview

## System Architecture
The application uses a three-tier architecture with React frontend,
Rust backend, and SQLite storage.

## Component Architecture
- Frontend Layer: React components with TypeScript
- Backend Layer: Rust/Tauri command handlers
- Storage Layer: SQLite database

## Data Flow
1. User action triggers React event
2. Event dispatches Tauri command
3. Rust handler processes and returns result

## Technology Stack
- React 18, TypeScript, Vite
- Rust, Tauri 2.x
- SQLite

## Known Limitations
- Scoring is heuristic, not LLM-based
- Large vaults may need pagination`;

  it("40. Architecture overview doc stays DOC, not BLUEPRINT", () => {
    const result = classifyContent(DOC_ARCHITECTURE_OVERVIEW);
    // Has weak blueprint signals (system_architecture, data_flow) but no
    // strong signals (no acceptance criteria, verification, implementation plan)
    expect(result.content_class).toBe("DOC");
  });

  const DOC_ROADMAP_WITH_ARCHITECTURE = `# Project Status and Roadmap

## Current Status
v1.7.1 released. Core features stable.

## Roadmap
### Phase 1: Core (completed)
### Phase 2: Classification (completed)
### Phase 3: Optimization (in progress)

## Architecture Decisions
Hybrid Rust/TypeScript architecture where performance-critical
operations run in Rust via Tauri commands.

## System Components
- Scanner Module: Rust file discovery
- Classifier: TypeScript content analysis
- Optimizer: TypeScript optimization engine`;

  it("41. Roadmap/status doc with architecture terms stays DOC", () => {
    const result = classifyContent(DOC_ROADMAP_WITH_ARCHITECTURE);
    // Has weak signals (roadmap_phases, system_architecture) but no strong
    expect(result.content_class).toBe("DOC");
  });

  const BLUEPRINT_WITH_AC = `# Blueprint: Export Enhancement

## Goal
Add batch export functionality for multiple formats.

## Acceptance Criteria
- Multi-select with checkboxes
- Export to Markdown, JSON, CSV
- Progress bar with cancel
- Path traversal safety

## Requirements
### Functional
- FR1: Multi-select
- FR2: Export dialog

### Non-Functional
- NFR1: Memory under 200MB
- NFR2: Cancel within 2s

## Implementation Phases
### Phase 1: Selection
### Phase 2: Export engine

## Verification Contract
- Selection tests pass
- Export format tests pass
- Security tests pass`;

  it("42. Blueprint with AC + requirements + verification becomes BLUEPRINT", () => {
    const result = classifyContent(BLUEPRINT_WITH_AC);
    // Strong signals (acceptance criteria, verification, implementation plan)
    expect(result.content_class).toBe("BLUEPRINT");
    expect(result.blueprint_signals.length).toBeGreaterThan(0);
  });

  const BLUEPRINT_WITH_VERIFICATION = `# System Design: Classification Pipeline

## Overview
Design a multi-stage classification pipeline.

## System Components
### Stage 1: Preprocessor
### Stage 2: Signal Detector
### Stage 3: Decision Engine

## Verification Contract
### Gate 1: Unit Tests - 90% coverage
### Gate 2: Integration Tests - all fixtures
### Gate 3: Acceptance - >= 85% accuracy

## Implementation Plan
### Step 1: Signal definitions
### Step 2: Decision chain
### Step 3: Quality evaluation

## Constraints
- No LLM or network calls
- Pure deterministic classification`;

  it("43. System design with verification contract becomes BLUEPRINT", () => {
    const result = classifyContent(BLUEPRINT_WITH_VERIFICATION);
    // Strong signals (verification_contract, implementation_plan)
    expect(result.content_class).toBe("BLUEPRINT");
    expect(result.blueprint_type).not.toBeNull();
  });

  const HYBRID_AGENT_BLUEPRINT = `## Role
You are a full-stack developer.

## Task
Implement the batch export feature.

## System Architecture
The application uses React frontend and Rust backend.
Components communicate via Tauri IPC.

## Data Flow
Export data flows from SQLite through Rust to filesystem.

## Acceptance Criteria
- AC1: Multi-select checkbox column
- AC2: Export dialog with format picker
- AC3: Progress bar with cancel

## Verification Contract
- All gates must pass
- Path traversal validated

## Ergebnisformat
Return implementation with tests and evidence.`;

  it("44. Agent prompt with verification + architecture becomes HYBRID", () => {
    const result = classifyContent(HYBRID_AGENT_BLUEPRINT);
    // Has prompt signals (role, task, output format) AND
    // strong blueprint signals (acceptance criteria, verification contract)
    // This is a true hybrid
    expect(result.content_class).toBe("PROMPT_BLUEPRINT_HYBRID");
  });

  const AGENT_PROMPT_WITH_WEAK_ARCHITECTURE = `# Architecture Review Prompt

## Rolle
Du bist System Architect.

## System Architecture Overview
Die Anwendung hat drei Schichten: Frontend, Backend, Datenbank.

## Data Flow & Integration
Daten fliessen vom Frontend zum Backend ueber IPC.

## Aufgabe
Analysiere die Systemarchitektur.`;

  it("45. Agent prompt with weak architecture signals only stays PROMPT, not HYBRID", () => {
    const result = classifyContent(AGENT_PROMPT_WITH_WEAK_ARCHITECTURE);
    // Has prompt signals + weak blueprint signals (architecture, data_flow)
    // but NO strong blueprint signals → should stay PROMPT, not hybrid
    expect(result.content_class).not.toBe("PROMPT_BLUEPRINT_HYBRID");
    expect(result.content_class).toBe("PROMPT");
  });

  const GUIDELINE_WITH_ARCHITECTURE = `# System-Richtlinie: Architektur-Governance

## 1. Review-Pflicht
Verzichte auf Merges ohne Review.

## 2. Architektur-Entscheidungen
Nutze ADR-Dokumente fuer jede Entscheidung.

## 3. System-Komponenten
Achte auf saubere Trennung: Frontend und Backend getrennt.

## 4. Datenfluss
Stelle sicher, dass Daten validiert werden.

## 5. Regel: Scope
Halte PRs klein und fokussiert.`;

  it("46. Guideline with architecture terms stays GUIDELINE", () => {
    const result = classifyContent(GUIDELINE_WITH_ARCHITECTURE);
    // Has guideline signals + weak blueprint (system_architecture, data_flow)
    // Must remain GUIDELINE even with architecture mentions
    expect(result.content_class).toBe("GUIDELINE");
  });

  const PROMPT_WITH_WEAK_ARCH = `## Role
You are a React developer.

## Task
Refactor the export dialog. The system architecture uses React.
Follow the existing component structure.

## Output Format
Return the refactored code.`;

  it("47. Prompt with single weak architecture mention stays PROMPT", () => {
    const result = classifyContent(PROMPT_WITH_WEAK_ARCH);
    // Has 1 weak blueprint signal from architecture mention,
    // but primarily a task prompt
    expect(result.content_class).toBe("PROMPT");
  });

  // Verify that existing PR #190 guideline regression tests remain functional
  it("48. PR #190 guideline protection still works", () => {
    const result = classifyContent(
      "# System-Richtlinie: Effiziente Prompt-Ausgabe\n\n## 1. Direkte Kommunikation\nVerzichte auf Fuellwoerter.\n\n## 2. Output-Management\nNutze strukturierte Formate.",
    );
    expect(result.content_class).toBe("GUIDELINE");
  });

  // Verify that PR #196 regex performance fix is preserved
  it("49. PR #196 regex backtracking protection preserved", () => {
    // Long content with potentially backtracking patterns
    const longDoc =
      "# A\n" +
      "a".repeat(500) +
      "\n## Architecture\nComponents.\n## Data Flow\nData.\n";
    // Should classify cleanly without timeout/stack overflow
    const result = classifyContent(longDoc);
    expect(result.content_class).toBe("DOC");
  });
});

// =============================================================================
// 9. UNKNOWN Confidence / Fallback Explanation Tests
// =============================================================================

describe("UNKNOWN Confidence / Fallback Explanations", () => {
  // Test 50: Empty file returns UNKNOWN with empty/whitespace reason
  it("50. Empty file returns UNKNOWN with EMPTY_OR_WHITESPACE reason", () => {
    const result = classifyContent("");
    expect(result.content_class).toBe("UNKNOWN_NEEDS_REVIEW");
    expect(Array.isArray(result.reasons)).toBe(true);
    expect(result.reasons?.length ?? 0).toBeGreaterThan(0);
    expect((result.reasons ?? [""])[0]).toContain("Empty or whitespace-only");
    // Confidence should be honest — empty content can't be confident
    expect(result.confidence).toBeLessThan(0.6);
  });

  // Test 51: Whitespace-only returns UNKNOWN with reason
  it("51. Whitespace-only returns UNKNOWN with explicit reason", () => {
    const result = classifyContent("   \n\n  \t  \n");
    expect(result.content_class).toBe("UNKNOWN_NEEDS_REVIEW");
    expect(Array.isArray(result.reasons)).toBe(true);
    expect(result.reasons?.length ?? 0).toBeGreaterThan(0);
  });

  // Test 52: Very short content gets NOTE (not UNKNOWN) — acceptable, but reasons must exist
  it("52. Short generic note returns NOTE or UNKNOWN with reasons", () => {
    const result = classifyContent("Hello world, just a quick note.");
    // NOTE is a valid honest outcome for short content with no signals
    expect(result.reasons).toBeDefined();
    expect(result.confidence).toBeLessThan(0.9);
  });

  // Test 53: Short content with ambiguous signals returns UNKNOWN or NOTE with reasons
  it("53. Short content returns UNKNOWN or NOTE with reasons", () => {
    const result = classifyContent(
      "Meeting notes for June 19, 2026. Discussed Q3 roadmap.",
    );
    if (result.content_class === "UNKNOWN_NEEDS_REVIEW") {
      expect(Array.isArray(result.reasons)).toBe(true);
      expect(result.reasons?.length ?? 0).toBeGreaterThan(0);
    }
    expect(result.confidence).toBeLessThan(0.9);
  });

  // Test 54: Heading-only content gets DOC — acceptable, DOC also needs reasons
  it("54. Heading-only content gets DOC or UNKNOWN with reasons", () => {
    const result = classifyContent(
      "# Meeting Notes\n\n## Agenda\n\n## Action Items\n",
    );
    expect(Array.isArray(result.reasons)).toBe(true);
    expect(result.reasons?.length ?? 0).toBeGreaterThan(0);
  });

  // Test 55: List-only content gets NOTE (valid honest outcome for short content)
  it("55. List-only content returns NOTE or UNKNOWN", () => {
    const result = classifyContent(
      "- Item one\n- Item two\n- Item three\n- Item four\n- Item five\n- Item six",
    );
    // NOTE or UNKNOWN are both honest outcomes for short list content
    expect(
      result.content_class === "NOTE" ||
        result.content_class === "UNKNOWN_NEEDS_REVIEW",
    ).toBe(true);
    expect(result.confidence).toBeLessThan(0.95);
  });

  // Test 56: Mixed weak signals with headings gets DOC — acceptable
  it("56. Content with headings but weak signals gets DOC or UNKNOWN with reasons", () => {
    const result = classifyContent(
      "## Architecture Overview\nFrontend uses React.\n## Workflow\nStep 1: Build.\n## Note\nSome random text without structure.",
    );
    expect(Array.isArray(result.reasons)).toBe(true);
    expect(result.reasons?.length ?? 0).toBeGreaterThan(0);
  });

  // Test 57: Inline code fragment without code blocks — content_class varies by signal match
  // The classifier uses code blocks (```) for CODE_FRAGMENT detection
  it("57. Inline code without backticks still has reasons", () => {
    const result = classifyContent(
      "function foo() {\n  const x = 42;\n  return x + 1;\n}\n\nconst y = { a: 1, b: 2 };",
    );
    expect(result.reasons).toBeDefined();
  });

  // Test 57b: Symbol-heavy content — verify reasons exist regardless of class
  it("57b. Symbol-rich content always has reasons", () => {
    const result = classifyContent(
      "<div class='foo'>{items.map(i => <span>{i}</span>)}</div>",
    );
    expect(result.reasons).toBeDefined();
  });

  // Test 58: Real code block still gets CODE_FRAGMENT (not regressed)
  it("58. Code block content still gets CODE_FRAGMENT", () => {
    const result = classifyContent(
      "```typescript\nfunction add(a: number, b: number): number {\n  return a + b;\n}\n```",
    );
    expect(result.content_class).toBe("CODE_FRAGMENT");
  });

  // Test 59: Minimal clear prompt gets PROMPT, not UNKNOWN
  it("59. Minimal clear prompt gets PROMPT", () => {
    const result = classifyContent(
      "## Role\nYou are a helpful assistant.\n\n## Task\nExplain recursion.\n\n## Output Format\nReturn a clear explanation.",
    );
    expect(result.content_class).toBe("PROMPT");
  });

  // Test 60: Minimal doc stays DOC, not UNKNOWN
  it("60. Minimal documentation stays DOC", () => {
    const result = classifyContent(
      "# Status Report\n\n## Current Status\nv1.7.1 stable.\n\n## Known Issues\nNone.",
    );
    expect(result.content_class).toBe("DOC");
  });

  // Test 61: Minimal guideline stays GUIDELINE
  it("61. Minimal guideline stays GUIDELINE", () => {
    const result = classifyContent(
      "# System-Richtlinie\n\n## 1. Regel\nVerzichte auf Fuellwoerter.\n\n## 2. Regel\nNutze strukturierte Formate.",
    );
    expect(result.content_class).toBe("GUIDELINE");
  });

  // Test 62: BLUEPRINT/DOC boundary still works (PR #197)
  it("62. BLUEPRINT/DOC boundary preserved (PR #197)", () => {
    const doc = `# Architecture Overview

## System Architecture
Three-tier architecture.

## Data Flow
Frontend to backend via IPC.

## Known Limitations
None.`;
    const result = classifyContent(doc);
    expect(result.content_class).toBe("DOC");
    expect(result.content_class).not.toBe("BLUEPRINT");
  });

  // Test 63: GUIDELINE regression test from PR #190 preserved
  it("63. GUIDELINE regression (PR #190) preserved", () => {
    const result = classifyContent(
      "# System-Richtlinie: Effiziente Prompt-Ausgabe\n\n## 1. Direkte Kommunikation\nVerzichte auf Fuellwoerter.\n\n## 2. Output-Management\nNutze strukturierte Formate.",
    );
    expect(result.content_class).toBe("GUIDELINE");
  });

  // Test 64: UNKNOWN always has at least one actionable explanation
  it("64. UNKNOWN classifications always have at least one actionable explanation", () => {
    const fixtures = [
      "",
      "   \n\n  ",
      "Hello world.",
      "# Title Only\n\n## Subtitle\n",
      "- a\n- b\n- c\n- d\n- e",
      "## Architecture\nFrontend uses React.\n## Data Flow\nVia API.",
      "function foo(x) { return x + 1; }",
    ];
    for (const fixture of fixtures) {
      const result = classifyContent(fixture);
      if (result.content_class === "UNKNOWN_NEEDS_REVIEW") {
        expect(
          result.reasons,
          `UNKNOWN fixture missing reasons: "${fixture.substring(0, 40)}..."`,
        ).toBeDefined();
        expect(
          result.reasons?.length ?? 0,
          `UNKNOWN fixture has empty reasons: "${fixture.substring(0, 40)}..."`,
        ).toBeGreaterThan(0);
      }
    }
  });

  // Test 65: UNKNOWN confidence remains honest (low/moderate)
  it("65. UNKNOWN confidence is honest (low/moderate)", () => {
    const fixtures = [
      "",
      "   \n\n  ",
      "Hello world.",
      "# Title Only\n\n## Subtitle\n",
      "- a\n- b\n- c\n- d\n- e",
      "## Architecture\nFrontend uses React.\n## Data Flow\nVia API.",
    ];
    for (const fixture of fixtures) {
      const result = classifyContent(fixture);
      if (result.content_class === "UNKNOWN_NEEDS_REVIEW") {
        expect(
          result.confidence,
          `UNKNOWN confidence too high for: "${fixture.substring(0, 40)}..."`,
        ).toBeLessThanOrEqual(0.6);
      }
    }
  });
});
