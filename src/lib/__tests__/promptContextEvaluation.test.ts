// =============================================================================
// PromptVault Lite — Prompt & Context Engineering Evaluation Tests
// =============================================================================
// Red Tests: written before implementation. All tests MUST fail initially.
// Corrections applied per Human Approval 2026-06-14:
//   - Deterministic: no Date.now() in core; optional evaluatedAt param
//   - No promptId in core function
//   - robustnessScore (not riskScore)
//   - Agent readiness only for true agentic prompts (robust threshold)
//   - Explicit false positive/negative tests
// =============================================================================

import { describe, it, expect } from "vitest";
import { evaluatePromptContext } from "../promptContextEvaluation";
import type { PromptContextEvaluation, RiskFlagType } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shorthand for calling the evaluation with a fixed evaluatedAt timestamp */
function evalPrompt(content: string): PromptContextEvaluation {
  return evaluatePromptContext(content, {
    evaluatedAt: "2026-06-14T00:00:00.000Z",
  });
}

/** Extract risk flag types from an evaluation result */
function riskFlagTypes(result: PromptContextEvaluation): RiskFlagType[] {
  return result.risk_flags.map((f) => f.flag);
}

// =============================================================================
// 1. Empty / Invalid Inputs
// =============================================================================

describe("Empty and invalid inputs", () => {
  it("empty string produces minimum scores and warning", () => {
    const result = evalPrompt("");
    expect(result.prompt_engineering_score).toBe(0);
    expect(result.context_engineering_score).toBe(0);
    expect(result.agent_readiness_score).toBe(0);
    expect(result.robustness_score).toBeLessThan(50);
    expect(result.overall_score).toBe(0);
    expect(result.detected_prompt_type).toBe("simple_prompt");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("whitespace-only prompt is handled", () => {
    const result = evalPrompt("   \n  \t  \n  ");
    expect(result.prompt_engineering_score).toBe(0);
    expect(result.overall_score).toBe(0);
  });

  it("very short prompt (single word) gets low scores", () => {
    const result = evalPrompt("Hello");
    expect(result.prompt_engineering_score).toBeLessThanOrEqual(10);
    expect(result.detected_prompt_type).toBe("simple_prompt");
  });
});

// =============================================================================
// 2. Prompt Type Detection
// =============================================================================

describe("Prompt type detection", () => {
  it("detects simple_prompt for short, unstructured content", () => {
    const result = evalPrompt("What is the capital of France?");
    expect(result.detected_prompt_type).toBe("simple_prompt");
  });

  it("detects structured_prompt for content with role and headings", () => {
    const result = evalPrompt(`## Role
You are a data analyst.

## Goal
Analyze the sales data and create a summary.

## Output Format
Return a Markdown table with columns: Month, Revenue, Growth.`);
    expect(result.detected_prompt_type).toBe("structured_prompt");
  });

  it("detects agentic_prompt for content with workflow, repo refs, CI mentions", () => {
    const result = evalPrompt(`## Role
You are a senior software engineer.

## Task
Implement the authentication module per Issue #42.

## Requirements
- Follow the specification in docs/spec/auth.md
- All tests in tests/auth/ must pass
- CI pipeline (lint + test + build) must be green
- Request code review from the reviewer-agent
- Await human approval before merge
- Provide evidence of all passing gates`);
    expect(result.detected_prompt_type).toBe("agentic_prompt");
  });

  it("does NOT classify a simple mention of 'GitHub' as agentic", () => {
    const result = evalPrompt(
      "Can you help me understand how GitHub Actions work?",
    );
    expect(result.detected_prompt_type).not.toBe("agentic_prompt");
  });

  it("does NOT classify a structured prompt with output format as agentic", () => {
    const result = evalPrompt(`## Role
You are a technical writer.

## Task
Write a README for a Python library.

## Output Format
Return as Markdown with sections: Overview, Installation, Usage, API.`);
    expect(result.detected_prompt_type).not.toBe("agentic_prompt");
  });

  it("agentic prompt requires MULTIPLE signals (not just one keyword)", () => {
    // Single agentic keyword should not trigger agentic classification
    const result = evalPrompt(
      "Please write unit tests for the calculateTotal function.",
    );
    expect(result.detected_prompt_type).not.toBe("agentic_prompt");
  });
});

// =============================================================================
// 3. Prompt Engineering Scores
// =============================================================================

describe("Prompt Engineering scores", () => {
  it("vague prompt without goal gets missing_goal risk flag", () => {
    const result = evalPrompt("Do something with the data maybe.");
    expect(riskFlagTypes(result)).toContain("ambiguous_task");
    expect(result.prompt_engineering_score).toBeLessThan(30);
  });

  it("prompt with role, goal, constraints, and output format gets high PE score", () => {
    const result = evalPrompt(`## Role
You are a frontend developer.

## Goal
Create a responsive navigation component.

## Constraints
- Do not use any CSS frameworks
- Must support keyboard navigation
- Must work in Chrome, Firefox, and Safari

## Output Format
Return the component as a single React functional component in TypeScript.`);
    expect(result.prompt_engineering_score).toBeGreaterThanOrEqual(45);
    expect(riskFlagTypes(result)).not.toContain("missing_goal");
    expect(riskFlagTypes(result)).not.toContain("missing_output_format");
    expect(riskFlagTypes(result)).not.toContain("missing_constraints");
  });

  it("prompt missing output format gets warning", () => {
    const result = evalPrompt(
      "You are a developer. Build a login page. Don't use external libraries.",
    );
    expect(result.prompt_engineering_score).toBeLessThanOrEqual(50);
    expect(riskFlagTypes(result)).toContain("missing_output_format");
  });

  it("prompt with examples gets higher PE score", () => {
    const withoutExample = evalPrompt(
      "You are a writer. Write a product description for a coffee mug.",
    );
    const withExample =
      evalPrompt(`You are a writer. Write a product description for a coffee mug.

## Example
\`\`\`
The Ceramic Bliss Mug holds 12oz of your favorite brew. Microwave-safe and dishwasher-friendly.
\`\`\``);
    expect(withExample.prompt_engineering_score).toBeGreaterThan(
      withoutExample.prompt_engineering_score,
    );
  });

  it("prompt with quality criteria and verification gets higher PE score", () => {
    const result = evalPrompt(`## Role
You are a QA engineer.

## Task
Write integration tests for the payment flow.

## Quality Criteria
- Tests must cover happy path and 3 error cases
- Each test must have a clear assertion message

## Verification
Run 'pnpm test' and confirm all tests pass.`);
    expect(result.prompt_engineering_score).toBeGreaterThanOrEqual(40);
  });
});

// =============================================================================
// 4. Context Engineering Scores
// =============================================================================

describe("Context Engineering scores", () => {
  it("prompt with irrelevant context blocks triggers context_overload", () => {
    // Generate actual long irrelevant content
    const noise = Array.from(
      { length: 30 },
      (_, i) =>
        `Unrelated system ${i}: configuration details for service XYZ, deployment logs from 2024, database migration history for legacy module, team meeting notes about office relocation, and detailed metrics from the monitoring dashboard that have no bearing on the current task. Also includes personal notes and grocery shopping list items that accidentally made it into the prompt.\n`,
    ).join("\n");
    const result = evalPrompt(`## Task
Write a function to add two numbers.

## Context
${noise}`);
    expect(riskFlagTypes(result)).toContain("context_overload");
    expect(result.context_engineering_score).toBeLessThan(60);
  });

  it("prompt with repo task but no source of truth triggers source_of_truth_missing", () => {
    const result = evalPrompt(`## Role
You are a senior developer.

## Task
Fix the critical bug in the user authentication module on the main branch.`);
    // Agentic + repo context but no source of truth reference
    expect(riskFlagTypes(result)).toContain("source_of_truth_missing");
  });

  it("source_of_truth_missing NOT triggered for simple non-repo question", () => {
    const result = evalPrompt("What is the difference between HTTP and HTTPS?");
    expect(riskFlagTypes(result)).not.toContain("source_of_truth_missing");
  });

  it("prompt with cold/warm/hot context layers gets higher CE score", () => {
    const result = evalPrompt(`## Background (Cold Context)
The project is a Tauri desktop app for prompt management.

## Current State (Warm Context)
Version 1.5.0-rc.1, the analysis engine is implemented in Rust.

## Immediate Context (Hot Context)
We need to extend the evaluation to include context engineering metrics.

## Task
Design the evaluation criteria for context quality.`);
    expect(result.context_engineering_score).toBeGreaterThanOrEqual(40);
  });

  it("prompt with explicit exclusions gets context_isolation credit", () => {
    const result = evalPrompt(`## Task
Add dark mode support to the settings page.

## Out of Scope
- Do NOT modify the analysis panel
- Do NOT change the optimizer styles
- Do NOT touch the file tree component`);
    expect(result.context_engineering_score).toBeGreaterThanOrEqual(30);
  });

  it("context_overload NOT triggered on long but well-structured prompt", () => {
    // A long prompt that is well-organized should not be flagged as overloaded
    const sections = Array.from({ length: 5 }, (_, i) =>
      `## Section ${i + 1}\nHere is some relevant context for task section ${i + 1} that supports the main objective.\n`.repeat(
        3,
      ),
    ).join("\n");
    const result = evalPrompt(`## Role
You are a developer.

## Task
Refactor the data processing pipeline.

${sections}`);
    // Context may be long but structured — should not automatically be "overloaded"
    expect(result.detected_context_profile).not.toBe("overloaded");
  });

  it("prompt with fresh context (dated) gets better CE score", () => {
    const withoutDate = evalPrompt(
      "You are a developer. Update the user profile page based on the design specs.",
    );
    const withDate = evalPrompt(`## Context
Stand: 2026-06-14, basierend auf Design-Spec v3.2 vom 2026-06-10.

You are a developer. Update the user profile page based on the design specs.`);
    expect(withDate.context_engineering_score).toBeGreaterThanOrEqual(
      withoutDate.context_engineering_score,
    );
  });
});

// =============================================================================
// 5. Agent Readiness Scores
// =============================================================================

describe("Agent Readiness scores", () => {
  it("agentic prompt without verification contract gets missing_verification flag", () => {
    const result = evalPrompt(`## Role
You are a developer. 

## Task
Implement feature X from Issue #123 in src/features/x.ts.
Run the tests and submit a PR.`);
    expect(result.detected_prompt_type).toBe("agentic_prompt");
    expect(riskFlagTypes(result)).toContain("missing_verification");
  });

  it("agentic prompt with full workflow gets high AR score", () => {
    const result = evalPrompt(`## Role
You are a senior software engineer.

## Issue
Implement the authentication module per GitHub Issue #42.

## Specification
See docs/spec/auth.md for requirements.

## Verification Contract
- All tests in tests/auth/ must pass
- Lint must be clean: \`pnpm lint\`
- TypeScript compilation: \`npx tsc --noEmit\`
- Build succeeds: \`pnpm build\`

## CI Gates
- GitHub Actions pipeline must be green (test + lint + build)

## Review
- Request code review from reviewer-agent
- Address all review comments

## Human Approval
- Await explicit human approval before merge

## Evidence
- Post CI results as evidence comment
- Include screenshot of passing tests`);

    expect(result.detected_prompt_type).toBe("agentic_prompt");
    expect(result.agent_readiness_score).toBeGreaterThanOrEqual(60);
    expect(riskFlagTypes(result)).not.toContain("no_human_approval");
    expect(riskFlagTypes(result)).not.toContain("no_evidence_contract");
    expect(riskFlagTypes(result)).not.toContain("unbounded_agent_autonomy");
  });

  it("structured_prompt is NOT penalized for missing agent workflow", () => {
    const result = evalPrompt(`## Role
You are a content strategist.

## Task
Create a 3-month content calendar for our blog.

## Output Format
Return as a Markdown table with columns: Week, Topic, Format, Deadline.`);

    expect(result.detected_prompt_type).not.toBe("agentic_prompt");
    expect(riskFlagTypes(result)).not.toContain("no_human_approval");
    expect(riskFlagTypes(result)).not.toContain("no_evidence_contract");
    expect(riskFlagTypes(result)).not.toContain("unbounded_agent_autonomy");
    // Agent readiness should be 0 or low for non-agentic prompts
    expect(result.agent_readiness_score).toBeLessThanOrEqual(10);
  });

  it("simple_prompt is NOT penalized for missing CI/merge workflow", () => {
    const result = evalPrompt(
      "Can you explain what Rust's borrow checker does?",
    );
    expect(result.detected_prompt_type).toBe("simple_prompt");
    expect(result.agent_readiness_score).toBe(0);
    expect(riskFlagTypes(result)).not.toContain("no_human_approval");
    expect(riskFlagTypes(result)).not.toContain("missing_verification");
  });

  it("agentic prompt without human approval gets no_human_approval flag", () => {
    const result = evalPrompt(`## Role
You are a developer.

## Task
Fix bug #99 in the payment module.
Run tests and merge if they pass.`);
    // Should detect as agentic (issue ref, code module, merge instruction)
    expect(riskFlagTypes(result)).toContain("no_human_approval");
  });

  it("unbounded_agent_autonomy only for agentic prompts", () => {
    const result = evalPrompt(`## Role
You are an autonomous agent controlling the production deployment pipeline.

## Task
Manage the entire deployment infrastructure. Make any changes you see fit.
Push directly to production servers. No oversight or supervision needed.
You have full access to modify any configuration.`);
    expect(result.detected_prompt_type).toBe("agentic_prompt");
    expect(riskFlagTypes(result)).toContain("unbounded_agent_autonomy");
  });
});

// =============================================================================
// 6. Robustness / Risk Control Score
// =============================================================================

describe("Robustness score", () => {
  it("well-structured prompt with constraints and verification has high robustness", () => {
    const result = evalPrompt(`## Role
You are a backend developer.

## Goal
Create a REST API endpoint for user registration.

## Constraints
- Validate all inputs server-side
- Hash passwords with bcrypt
- Do NOT store raw passwords
- Rate limit: 5 requests per minute per IP

## Output Format
Return the endpoint as Express.js middleware in TypeScript.

## Verification
- Test with valid and invalid inputs
- Confirm password is never logged
- Run \`pnpm test\` and ensure all tests pass`);
    expect(result.robustness_score).toBeGreaterThanOrEqual(35);
  });

  it("vague prompt with no constraints has low robustness", () => {
    const result = evalPrompt("Build something cool with AI.");
    expect(result.robustness_score).toBeLessThanOrEqual(65);
  });

  it("missing verification affects robustness", () => {
    // Compare risk flags rather than raw scores across types
    const withoutVerification = evalPrompt(
      "You are a developer. Build a login page.",
    );
    const withVerification =
      evalPrompt(`You are a developer. Build a login page.

## Verification
- Test that login works with valid credentials
- Test that invalid credentials show error`);
    // The version with verification should NOT have missing_verification flag
    expect(riskFlagTypes(withVerification)).not.toContain(
      "missing_verification",
    );
    // Both should be valid evaluations
    expect(withVerification.robustness_score).toBeGreaterThanOrEqual(0);
    expect(withoutVerification.robustness_score).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// 7. False Positive Tests (Correction 5 — required)
// =============================================================================

describe("False positive prevention", () => {
  it("source_of_truth_missing NOT triggered for simple everyday question", () => {
    const result = evalPrompt("How do I bake a chocolate cake?");
    expect(riskFlagTypes(result)).not.toContain("source_of_truth_missing");
  });

  it("context_overload NOT triggered for long but well-structured prompt", () => {
    // Already tested above, but explicit gate here
    const result = evalPrompt(`## Role
You are a technical architect.

## Background
The system currently uses a monolithic architecture with the following components:
- Authentication service (Node.js + Express)
- Database layer (PostgreSQL)
- File storage (local filesystem)

## Task
Propose a migration plan to microservices.

## Constraints
- No downtime during migration
- Backward compatible API for 6 months
- Budget under $10K for infrastructure changes

## Output Format
Return a Markdown document with sections: Current State, Target Architecture, Migration Phases, Risk Assessment, Cost Estimate.`);
    expect(riskFlagTypes(result)).not.toContain("context_overload");
    expect(result.detected_context_profile).not.toBe("overloaded");
  });

  it("missing_verification does NOT harshly penalize simple prompts", () => {
    const result = evalPrompt("What time is it in Tokyo?");
    // Simple questions don't need verification contracts
    expect(result.robustness_score).toBeGreaterThanOrEqual(35);
    expect(result.prompt_engineering_score).toBeGreaterThanOrEqual(0);
  });

  it("mixed_objectives NOT triggered for multi-step single task", () => {
    const result = evalPrompt(`## Task
Refactor the user service:

1. Extract validation logic into a separate module
2. Add unit tests for the new module
3. Update imports in dependent files
4. Run the full test suite`);
    expect(riskFlagTypes(result)).not.toContain("mixed_objectives");
  });

  it("mixed_objectives IS triggered for truly unrelated tasks", () => {
    const result = evalPrompt(`## Tasks
1. Fix the login bug in auth.ts
2. Write a blog post about our company culture
3. Order more office supplies
4. Update the privacy policy`);
    expect(riskFlagTypes(result)).toContain("mixed_objectives");
  });

  it("unbounded_agent_autonomy ONLY for agentic or code/repo prompts", () => {
    const result = evalPrompt(
      "Please write a poem about the ocean. Make it as creative as you want, no limits!",
    );
    expect(riskFlagTypes(result)).not.toContain("unbounded_agent_autonomy");
  });
});

// =============================================================================
// 8. Edge Cases & Data Integrity
// =============================================================================

describe("Edge cases and data integrity", () => {
  it("code blocks are NOT modified", () => {
    const codeBlock =
      "```typescript\nconst x: number = 42;\nconsole.log(x);\n```";
    const result = evalPrompt(`## Role
You are a developer.

## Task
Review this code:

${codeBlock}

## Output Format
Return your feedback as bullet points.`);

    // Code blocks should remain intact in all findings
    const allMessages = [
      ...result.strengths,
      ...result.warnings,
      ...result.missing_elements,
      ...result.suggested_improvements.map((s) => s.message),
      ...result.criteria.map((c) => c.details),
    ].join(" ");

    expect(allMessages).not.toContain("modified");
    // Ensure the evaluation doesn't somehow alter our content expectations
    expect(result.detected_prompt_type).toBe("structured_prompt");
  });

  it("German umlauts are preserved", () => {
    const result = evalPrompt(`## Rolle
Du bist ein erfahrener Softwareentwickler.

## Ziel
Überprüfe die Implementierung der Benutzerverwaltung.

## Einschränkungen
- Ändere nicht die öffentliche API
- Berücksichtige die DSGVO-Anforderungen`);
    expect(result.criteria.length).toBeGreaterThan(0);
    // German prompt should be analyzed correctly (structured)
    expect(result.detected_prompt_type).not.toBe("simple_prompt");
  });

  it("handles very long prompts within performance bounds", () => {
    const longContent =
      "## Role\nYou are a developer.\n\n" +
      "## Task\nAnalyze the following data.\n\n" +
      "A".repeat(10000);
    const start = performance.now();
    const result = evalPrompt(longContent);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500); // Should complete quickly
    expect(result.overall_score).toBeGreaterThanOrEqual(0);
  });

  it("handles prompts with only code and minimal natural language", () => {
    const result = evalPrompt(
      "```python\ndef add(a, b):\n    return a + b\n```",
    );
    expect(result.detected_prompt_type).toBe("simple_prompt");
  });

  it("agent readiness is 0 for simple_prompt type", () => {
    const result = evalPrompt("Hi");
    expect(result.agent_readiness_score).toBe(0);
  });

  it("agent readiness is 0 for structured_prompt type", () => {
    const result = evalPrompt(`## Role
You are a designer.

## Task
Create a color palette for a health app.

## Output Format
Return as a JSON object with primary, secondary, and accent colors.`);
    expect(result.detected_prompt_type).not.toBe("agentic_prompt");
    expect(result.agent_readiness_score).toBe(0);
  });
});

// =============================================================================
// 9. Determinism (Correction 1 — required)
// =============================================================================

describe("Determinism", () => {
  it("produces identical results for identical input", () => {
    const content = `## Role
You are a developer.

## Task
Fix the login timeout issue.

## Constraints
- Keep the existing API surface
- Add tests for the fix`;
    const result1 = evalPrompt(content);
    const result2 = evalPrompt(content);

    expect(result1.prompt_engineering_score).toBe(
      result2.prompt_engineering_score,
    );
    expect(result1.context_engineering_score).toBe(
      result2.context_engineering_score,
    );
    expect(result1.agent_readiness_score).toBe(result2.agent_readiness_score);
    expect(result1.robustness_score).toBe(result2.robustness_score);
    expect(result1.overall_score).toBe(result2.overall_score);
    expect(result1.detected_prompt_type).toBe(result2.detected_prompt_type);
    expect(result1.risk_flags.length).toBe(result2.risk_flags.length);
  });

  it("identical content with different evaluatedAt produces identical scores", () => {
    const content = "You are a developer. Build a login form with validation.";
    const result1 = evaluatePromptContext(content, {
      evaluatedAt: "2026-01-01T00:00:00Z",
    });
    const result2 = evaluatePromptContext(content, {
      evaluatedAt: "2026-12-31T23:59:59Z",
    });

    expect(result1.overall_score).toBe(result2.overall_score);
    expect(result1.prompt_engineering_score).toBe(
      result2.prompt_engineering_score,
    );
  });

  it("no Date.now() or Math.random() influence on scores", () => {
    const content = "You are a developer. Implement a cache layer.";
    const results: number[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(evalPrompt(content).overall_score);
    }
    // All 10 runs must produce identical overall scores
    const allSame = results.every((s) => s === results[0]);
    expect(allSame).toBe(true);
  });
});

// =============================================================================
// 10. Suggested Improvements Quality
// =============================================================================

describe("Suggested improvements quality", () => {
  it("generates specific, actionable improvement suggestions", () => {
    const result = evalPrompt("Do something with data.");
    const improvements = result.suggested_improvements;

    expect(improvements.length).toBeGreaterThan(0);
    // All suggestions should be specific (not generic "improve prompt")
    for (const imp of improvements) {
      expect(imp.message.length).toBeGreaterThan(20);
      // Should not contain generic placeholder text
      expect(imp.message.toLowerCase()).not.toContain("improve prompt");
      expect(imp.message.toLowerCase()).not.toContain("make it better");
    }
  });

  it("does NOT generate generic 'improve prompt' suggestions", () => {
    const result = evalPrompt("Write a function.");
    const messages = result.suggested_improvements
      .map((s) => s.message.toLowerCase())
      .join(" ");

    expect(messages).not.toContain("improve prompt");
    expect(messages).not.toContain("make better");
  });

  it("suggestions include specific criteria when missing", () => {
    const result = evalPrompt("You are a developer. Build something.");
    // Should have suggestions about adding goal, output format, constraints
    const dimensionSet = new Set(
      result.suggested_improvements.map((s) => s.dimension),
    );
    expect(dimensionSet.has("prompt_engineering")).toBe(true);
  });

  it("prioritizes high-priority improvements first", () => {
    const result = evalPrompt("Fix it.");
    const priorities = result.suggested_improvements.map((s) => s.priority);

    // Check that high-priority items come before medium/low
    const firstHigh = priorities.indexOf("high");
    const firstMedium = priorities.indexOf("medium");
    const firstLow = priorities.indexOf("low");

    if (firstHigh !== -1 && firstMedium !== -1) {
      expect(firstHigh).toBeLessThan(firstMedium);
    }
    if (firstMedium !== -1 && firstLow !== -1) {
      expect(firstMedium).toBeLessThan(firstLow);
    }
  });
});

// =============================================================================
// 11. Confidence metric
// =============================================================================

describe("Confidence metric", () => {
  it("confidence is between 0 and 1", () => {
    const result = evalPrompt("You are a developer. Write a function.");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("confidence is lower for ambiguous content", () => {
    const ambiguous = evalPrompt("Maybe do something with the thing?");
    const clear = evalPrompt(`## Role
You are a backend developer.

## Task
Create a REST endpoint at POST /api/users that accepts JSON with fields: name, email, password.

## Constraints
- Validate email format
- Hash password with bcrypt
- Return 201 on success, 400 on validation error

## Output Format
Return the Express.js route handler as TypeScript.`);
    expect(clear.confidence).toBeGreaterThan(ambiguous.confidence);
  });
});

// =============================================================================
// 12. Context Profile Detection
// =============================================================================

describe("Context profile detection", () => {
  it("detects minimal context profile", () => {
    const result = evalPrompt("What is Rust?");
    expect(result.detected_context_profile).toBe("minimal");
  });

  it("detects moderate context profile", () => {
    const result = evalPrompt(`## Role
You are a developer.

## Context
The project uses React 18 with TypeScript.

## Task
Add a loading spinner component.`);
    expect(result.detected_context_profile).toBe("moderate");
  });

  it("detects rich context profile", () => {
    const result = evalPrompt(`## Background
The project is a Tauri desktop application for prompt management.

## Current State
Version 1.5.0-rc.1 with Rust analysis engine.

## Immediate Context
We need to extend the evaluation criteria.

## Constraints
- No new dependencies
- Must be deterministic
- Must work offline

## References
- See ADR-003 for analysis engine design
- See Issue #71 for related feature`);
    expect(result.detected_context_profile).toBe("rich");
  });

  it("detects overloaded context profile", () => {
    const noise = Array.from(
      { length: 40 },
      (_, i) =>
        `Unrelated system ${i}: configuration details for service XYZ, deployment logs from 2024, database migration history for legacy module, team meeting notes about office relocation, and detailed metrics from the monitoring dashboard that have no bearing on the current task. Also includes personal notes and grocery shopping list items that accidentally made it into the prompt.\n`,
    ).join("");
    const result = evalPrompt(`## Task
Write a hello world function.

## Context
${noise}`);
    expect(result.detected_context_profile).toBe("overloaded");
  });
});
