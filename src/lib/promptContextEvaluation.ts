// =============================================================================
// PromptVault Lite — Prompt & Context Engineering Evaluation
// =============================================================================
// Core evaluation function. Pure, deterministic, no side effects.
//
// Corrections applied per Human Approval 2026-06-14:
//   - Deterministic: no Date.now() in core; optional evaluatedAt param
//   - No promptId in core function — Store handles mapping
//   - robustnessScore (not riskScore) — higher = better
//   - Agent readiness only for true agentic prompts (robust threshold: >=3 signals)
//   - Explicit false positive/negative prevention
//
// Architecture: Local-only, no network, no LLM, no API, no new dependencies.
// =============================================================================

import type {
  PromptContextEvaluation,
  ContextCriterion,
  SuggestedImprovement,
  RiskFlag,
  PromptType,
  ContextProfile,
} from "@/types";

// =============================================================================
// Types
// =============================================================================

interface EvaluationOptions {
  evaluatedAt?: string;
}

type Dimension =
  | "prompt_engineering"
  | "context_engineering"
  | "agent_readiness";

interface CriterionDef {
  dimension: Dimension;
  name: string;
  detect: (content: string) => number; // returns 0, 1, or 2
}

interface RiskFlagDef {
  flag: RiskFlag["flag"];
  severity: RiskFlag["severity"];
  message: string;
  score_penalty: number;
  detect: (content: string, isAgentic: boolean) => boolean;
}

// =============================================================================
// Helper: safe score calculation
// =============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeScore(
  criteria: CriterionDef[],
  content: string,
): {
  totalScore: number;
  maxScore: number;
  percentage: number;
  details: ContextCriterion[];
} {
  const details: ContextCriterion[] = [];
  let totalScore = 0;
  const maxScore = criteria.length * 2;

  for (const c of criteria) {
    const score = c.detect(content);
    totalScore += clamp(score, 0, 2);
    details.push({
      dimension: c.dimension,
      name: c.name,
      score,
      max_score: 2,
      details: scoreDescription(c.name, score),
    });
  }

  return {
    totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 100),
    details,
  };
}

function scoreDescription(name: string, score: number): string {
  if (score === 0) return `Missing: ${name} is not addressed in the prompt.`;
  if (score === 1)
    return `Partially present: ${name} is mentioned but could be strengthened.`;
  return `Clearly defined: ${name} is well-specified in the prompt.`;
}

// =============================================================================
// Helper: section extraction
// =============================================================================

function countHeadings(content: string): number {
  const matches = content.match(/^#{1,3}\s+.+$/gm);
  return matches ? matches.length : 0;
}

function contentLengthWithoutCode(content: string): number {
  // Remove fenced code blocks before measuring
  return content.replace(/```[\s\S]*?```/g, "").length;
}

function codeBlockLength(content: string): number {
  const matches = content.match(/```[\s\S]*?```/g);
  if (!matches) return 0;
  return matches.reduce((sum, m) => sum + m.length, 0);
}

// =============================================================================
// Agentic signal detection (robust threshold: >= 3 signals required)
// =============================================================================

const AGENTIC_SIGNALS: { name: string; pattern: RegExp }[] = [
  {
    name: "workflow_steps",
    pattern:
      /(?:workflow|pipeline|step\s+\d|phase\s+\d|process\s+flow|implement.*then.*test|code.*review.*merge|deploy|deployment|run\s+(?:the\s+)?tests?|submit\s+(?:a\s+)?PR|merge\s+(?:if|when|after))/i,
  },
  {
    name: "repo_reference",
    pattern:
      /(?:github\.com\/\w+\/\w+|gitlab\.com|bitbucket\.org|repository|repo\b|branch|commit|merge|pull request|PR\b|push\s+(?:to|directly)|production)/i,
  },
  {
    name: "code_context",
    pattern:
      /(?:src\/|tests\/|components\/|Cargo\.toml|package\.json|\.ts\b|\.rs\b|\.py\b|\.js\b|module|function\s+\w+\s*\(|class\s+\w+|autonomous\s+agent)/i,
  },
  {
    name: "ci_gate",
    pattern:
      /(?:CI\b|continuous integration|pipeline|build\s+step|lint|linter|gate|check\s+pass)/i,
  },
  {
    name: "review_approval",
    pattern:
      /(?:code\s+review|reviewer|approval|human\s+approval|genehmigung|freigabe|sign.?off|without\s+review)/i,
  },
  {
    name: "issue_tracking",
    pattern:
      /(?:issue\s*[#:]\s*\d+|ticket\s*[#:]\s*\d+|task\s*[#:]\s*\d+|bug\s*[#:]\s*\d+)/i,
  },
  {
    name: "spec_requirement",
    pattern:
      /(?:specification|spec\b|requirements?\s*doc|anforderung|lastenheft|pflichtenheft)/i,
  },
  {
    name: "evidence_required",
    pattern:
      /(?:evidence|nachweis|beleg|screenshot|log\s+(?:file|output)|proof|verify\s+that)/i,
  },
];

const AGENTIC_THRESHOLD = 3;

// Active (strong) agentic signals indicate the user expects autonomous workflow execution,
// not just passive repository/file references. At least one active signal is required
// for agentic classification, preventing false positives on structured prompts that
// merely reference repos, issues, or file paths.
const ACTIVE_AGENTIC_SIGNAL_NAMES = new Set([
  "workflow_steps",
  "ci_gate",
  "review_approval",
  "spec_requirement",
]);

function countAgenticSignals(content: string): number {
  return AGENTIC_SIGNALS.filter((s) => s.pattern.test(content)).length;
}

function countActiveAgenticSignals(content: string): number {
  return AGENTIC_SIGNALS.filter(
    (s) => ACTIVE_AGENTIC_SIGNAL_NAMES.has(s.name) && s.pattern.test(content),
  ).length;
}

function isAgenticPrompt(content: string): boolean {
  const totalSignals = countAgenticSignals(content);
  const activeSignals = countActiveAgenticSignals(content);
  // Require >=3 total signals AND at least 1 active (workflow/CI/review/spec) signal.
  // Passive signals alone (repo_reference, code_context, issue_tracking,
  // evidence_required) are insufficient — they appear in structured non-agentic prompts.
  return totalSignals >= AGENTIC_THRESHOLD && activeSignals >= 1;
}

function isStructuredPrompt(content: string): boolean {
  const headingCount = countHeadings(content);
  const hasRole =
    /(?:role|rolle|you are|du bist|act as|agiere als|perspective|perspektive)/i.test(
      content,
    );
  const hasOutputFormat =
    /(?:output|format|return as|gib zurück|ausgabe|response format)/i.test(
      content,
    );
  const hasConstraints =
    /(?:constraint|einschränkung|do not|nicht|avoid|vermeide|begrenzung|limitation)/i.test(
      content,
    );

  const structureSignals = [
    headingCount >= 1,
    hasRole,
    hasOutputFormat,
    hasConstraints,
  ];
  const structureCount = structureSignals.filter(Boolean).length;

  return structureCount >= 2;
}

function detectPromptType(content: string): PromptType {
  const trimmed = content.trim();
  if (trimmed.length === 0) return "simple_prompt";

  if (isAgenticPrompt(trimmed)) return "agentic_prompt";
  if (isStructuredPrompt(trimmed)) return "structured_prompt";

  // Fallback: if content is short and has no structure, it's simple
  const cleanLength = contentLengthWithoutCode(trimmed);
  if (cleanLength < 200 && countHeadings(trimmed) === 0) return "simple_prompt";

  return "simple_prompt";
}

// =============================================================================
// Context Profile Detection
// =============================================================================

function detectContextProfile(content: string): ContextProfile {
  const trimmed = content.trim();
  if (trimmed.length === 0) return "minimal";

  const cleanLength = contentLengthWithoutCode(trimmed);

  // Check for context section headings
  const coldPattern =
    /^#+\s*(?:context|kontext|background|hintergrund|umgebung|environment|history|overview|überblick)/im;
  const warmPattern =
    /^#+\s*(?:current\s*state|aktueller\s*stand|status|situation)/im;
  const hotPattern =
    /^#+\s*(?:immediate\s*context|task|aufgabe|goal|ziel|request|problem)/im;

  const layerCount = [coldPattern, warmPattern, hotPattern].filter((p) =>
    p.test(trimmed),
  ).length;

  const anyContextHeading = coldPattern.test(trimmed);
  const hasTaskHeading = hotPattern.test(trimmed);

  // Overloaded: large content with context but poorly structured
  if (
    cleanLength > 2000 &&
    hasTaskHeading &&
    anyContextHeading &&
    layerCount < 3
  ) {
    return "overloaded";
  }

  if (layerCount >= 3) return "rich";
  if (layerCount >= 2) return "moderate";

  if (anyContextHeading && cleanLength > 100) return "moderate";
  if (hasTaskHeading && cleanLength > 200) return "moderate";

  if (cleanLength < 150) return "minimal";

  return "minimal";
}

// =============================================================================
// Prompt Engineering Criteria (10)
// =============================================================================

const PE_CRITERIA: CriterionDef[] = [
  {
    dimension: "prompt_engineering",
    name: "Task Clarity",
    detect: (content: string): number => {
      const hasActionVerb =
        /(?:schreibe|erstelle|analysiere|implementiere|konfiguriere|optimiere|refaktoriere|build|create|implement|analyze|configure|generate|refactor|fix|add|remove|update|migrate|develop|design|write|deploy|test|review|document)\s+\w+/i.test(
          content,
        );
      const isVague =
        /^(?:help|hilf|can you|kannst du|do something|irgendwas|maybe|vielleicht|i need|ich brauche)\b/im.test(
          content.trim(),
        );
      const hasSpecific =
        /\b(?:specific|konkret|exactly|genau|precisely|präzise)\b/i.test(
          content,
        );
      // Also treat named tasks/components as specific
      const hasNamedTask =
        /\b(?:create|build|implement|develop|design|write|fix|add)\s+(?:a|an|the)\s+[\w\s-]{5,}/i.test(
          content,
        );

      if (hasActionVerb && !isVague && (hasSpecific || hasNamedTask)) return 2;
      if (hasActionVerb && !isVague) return 1;
      if (hasActionVerb && isVague) return 1;
      return 0;
    },
  },
  {
    dimension: "prompt_engineering",
    name: "Goal Definition",
    detect: (content: string): number => {
      const goalPatterns =
        /(?:ziel|goal|objective|outcome|ergebnis|result should|das ergebnis|soll\s+\w+\s+(?:werden|sein|liefern|produzieren)|purpose|zweck)/i;
      const measurable =
        /(?:messbar|measurable|quantit|prozent|percent|\d+%|akkurat|accurate|specific|konkret|metric|kennzahl)/i;

      if (goalPatterns.test(content) && measurable.test(content)) return 2;
      if (goalPatterns.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "prompt_engineering",
    name: "Role Definition",
    detect: (content: string): number => {
      const rolePatterns =
        /(?:you are (?:a|an)\s|du bist (?:ein|eine)\s|als\s+(?:ein|eine)\s|role\s*:\s|rolle\s*:\s|act as (?:a|an)\s|agiere als\s|perspective\s*:|perspektive\s*:)/i;

      if (rolePatterns.test(content)) return 2;
      if (
        /(?:developer|engineer|designer|architect|analyst|writer|expert|specialist|entwickler|ingenieur)/i.test(
          content,
        )
      )
        return 1;
      return 0;
    },
  },
  {
    dimension: "prompt_engineering",
    name: "Constraints",
    detect: (content: string): number => {
      // Match explicit constraints sections (with or without colon after heading)
      const constraintPatterns =
        /(?:constraints?\s*:|einschränkungen?\s*:|do not|nicht\s|avoid|vermeide|must not|darf nicht|limitations?\s*:|begrenzungen?\s*:)/i;
      const constraintHeadings =
        /^#+\s*(?:constraints?|einschränkungen?|limitations?|begrenzungen?)\s*$/im;
      const negativeInstructions =
        /(?:never|niemals|under no circumstances|auf keinen fall|forbidden|verboten|prohibited)/i;

      const hasConstraintSection =
        constraintPatterns.test(content) || constraintHeadings.test(content);

      if (hasConstraintSection && negativeInstructions.test(content)) return 2;
      if (hasConstraintSection) return 1;
      if (
        (content.match(/\b(?:do not|don't|nicht|kein)\b/gi)?.length ?? 0) >= 2
      )
        return 1;
      return 0;
    },
  },
  {
    dimension: "prompt_engineering",
    name: "Output Format",
    detect: (content: string): number => {
      const formatPatterns =
        /(?:output\s*(?:format|as|should be)|ausgabe\s*(?:format|als)|return\s+(?:as|a|in|the)|gib\s+(?:zurück|aus)\s+(?:als|in)|format\s*:\s*(?:json|markdown|md|yaml|xml|csv|table|tabelle|list|liste|bullet|code)|response\s*(?:format|as|in))/i;
      // Also detect headings like "## Output Format" or "## Ausgabeformat" without colon
      const formatHeadings =
        /^#+\s*(?:output\s*format|ausgabe\s*format|ausgabeformat|output|ausgabe)\s*$/im;
      const explicitFormat =
        /(?:JSON|Markdown|YAML|XML|CSV|plain text|code block|React component|function|class|module|endpoint|REST|GraphQL|TypeScript|JavaScript)/i;

      const hasFormatSection =
        formatPatterns.test(content) || formatHeadings.test(content);

      if (hasFormatSection && explicitFormat.test(content)) return 2;
      if (hasFormatSection) return 1;
      return 0;
    },
  },
  {
    dimension: "prompt_engineering",
    name: "Quality Criteria",
    detect: (content: string): number => {
      const qualityPatterns =
        /(?:quality\s*(?:criteria|requirements|gates)|qualität\s*(?:skriterien|sanforderungen)|acceptance\s*criteria|akzeptanzkriterien|must\s+(?:include|contain|have)|soll\s+(?:enthalten|beinhalten)|should\s+(?:include|contain|have))/i;
      const specificQuality =
        /(?:performance|security|accessibility|usability|testability|maintainability|performance|sicherheit|barrierefreiheit|testbarkeit|wartbarkeit)/i;

      if (qualityPatterns.test(content) && specificQuality.test(content))
        return 2;
      if (qualityPatterns.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "prompt_engineering",
    name: "Examples",
    detect: (content: string): number => {
      const examplePatterns =
        /(?:example|beispiel|reference|referenz|vorlage|template|sample|muster|e\.g\.|for instance|zum beispiel|z\.b\.)/i;
      const hasCodeExample =
        /```[\s\S]*?```/.test(content) &&
        /(?:example|beispiel|sample)/i.test(content);

      if (examplePatterns.test(content) && hasCodeExample) return 2;
      if (examplePatterns.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "prompt_engineering",
    name: "Verification",
    detect: (content: string): number => {
      const verifyPatterns =
        /(?:verify|prüfe|überprüfe|validate|bestätige|confirm|check\s+(?:that|if)|test\s+(?:that|if|whether)|ensure|sicherstellen|stell\s+sicher)/i;
      const testCommand =
        /(?:pnpm test|npm test|cargo test|pytest|go test|run tests?|führe tests? aus)/i;

      if (verifyPatterns.test(content) && testCommand.test(content)) return 2;
      if (verifyPatterns.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "prompt_engineering",
    name: "Uncertainty Handling",
    detect: (content: string): number => {
      const uncertaintyPatterns =
        /(?:if\s+(?:unclear|uncertain|unsure|ambiguous|in doubt)|falls?\s+(?:unklar|unsicher|mehrdeutig|zweifel)|when in doubt|im zweifelsfall|ask\s+(?:if|when|for clarification)|frag\s+(?:nach|wenn)|clarify|kläre)/i;
      const fallbackPatterns =
        /(?:default\s+to|fallback|alternative|otherwise|andernfalls|stattdessen|instead)/i;

      if (uncertaintyPatterns.test(content) && fallbackPatterns.test(content))
        return 2;
      if (uncertaintyPatterns.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "prompt_engineering",
    name: "Language Clarity",
    detect: (content: string): number => {
      // Heuristic: check for contradictions, excessive ambiguity markers
      const contradictionMarkers =
        /(?:but also|however|on the other hand|andererseits|wobei|allerdings|jedoch.*nicht|sowohl.*als auch.*nicht)/gi;
      const ambiguityMarkers = content.match(
        /(?:maybe|vielleicht|perhaps|eventuell|possibly|möglicherweise|or maybe|oder so|kind of|irgendwie)/gi,
      );
      const ambiguityCount = ambiguityMarkers ? ambiguityMarkers.length : 0;

      const hasExcessiveAmbiguity = ambiguityCount > 3;

      if (!hasExcessiveAmbiguity && !contradictionMarkers.test(content))
        return 2;
      if (!hasExcessiveAmbiguity || !contradictionMarkers.test(content))
        return 1;
      return 0;
    },
  },
];

// =============================================================================
// Context Engineering Criteria (10)
// =============================================================================

const CE_CRITERIA: CriterionDef[] = [
  {
    dimension: "context_engineering",
    name: "Context Relevance",
    detect: (content: string): number => {
      const contextHeadings =
        /^#+\s*(?:context|kontext|background|hintergrund|environment|umgebung|situation)/im;
      if (!contextHeadings.test(content)) return 0;

      // Check if context section contains task-related terms
      const hasTaskTerms =
        /(?:project|projekt|system|application|anwendung|codebase|codebasis|module|component|komponente|feature|funktion|api|database|datenbank)/i.test(
          content,
        );

      if (hasTaskTerms) return 2;
      return 1;
    },
  },
  {
    dimension: "context_engineering",
    name: "Context Sufficiency",
    detect: (content: string): number => {
      const hasTask = /^#+\s*(?:task|aufgabe|goal|ziel|auftrag)/im.test(
        content,
      );
      const hasContext =
        /^#+\s*(?:context|kontext|background|hintergrund|environment|umgebung)/im.test(
          content,
        );
      const hasData =
        /(?:data|daten|input|eingabe|file|datei|schema|api|endpoint|database|datenbank)/i.test(
          content,
        );

      if (hasTask && hasContext && hasData) return 2;
      if (hasTask && (hasContext || hasData)) return 1;
      if (hasTask) return 0;
      // No explicit task heading but content may be self-contained
      if (contentLengthWithoutCode(content) > 200) return 1;
      return 0;
    },
  },
  {
    dimension: "context_engineering",
    name: "Context Economy",
    detect: (content: string): number => {
      const cleanLen = contentLengthWithoutCode(content);
      const totalLen = content.length;
      const codeLen = codeBlockLength(content);
      const taskLen = totalLen - codeLen;

      // No code: check if content is concise relative to number of sections
      if (cleanLen === 0) return 2; // Empty or all-code, economy is perfect

      const headingCount = countHeadings(content);

      // Economy ratio: average content per heading
      if (headingCount === 0) {
        // Single block: short is economical, very long is not
        if (cleanLen < 500) return 2;
        if (cleanLen < 1500) return 1;
        return 0;
      }

      const avgPerSection = taskLen / headingCount;
      if (avgPerSection < 500) return 2;
      if (avgPerSection < 1500) return 1;
      return 0;
    },
  },
  {
    dimension: "context_engineering",
    name: "Context Isolation",
    detect: (content: string): number => {
      const taskHeadings = content.match(
        /^#+\s*(?:task|aufgabe|goal|ziel|auftrag)/gim,
      );
      const taskCount = taskHeadings ? taskHeadings.length : 0;

      // Multiple task headings suggest mixed objectives
      if (taskCount > 2) return 0;

      // Check for "out of scope" / "excluded" sections (good isolation)
      const hasExclusions =
        /(?:out of scope|nicht teil|ausgeschlossen|excluded|not included|nicht enthalten|scope\s*:|umfang\s*:)/i.test(
          content,
        );

      if (taskCount <= 1 && hasExclusions) return 2;
      if (taskCount <= 1) return 1;
      if (taskCount === 2 && hasExclusions) return 1;
      return 0;
    },
  },
  {
    dimension: "context_engineering",
    name: "Source of Truth",
    detect: (content: string): number => {
      const sotPatterns =
        /(?:source of truth|authoritative|maßgebend|referenz|reference|see issue|siehe issue|github\.com\/\w+\/\w+\/issues\/\d+|gemäß|according to|based on|basierend auf|per\s+(?:spec|issue|ticket|doc))/i;
      const fileRefs = /(?:file|datei|path|pfad):\s*[^\s,;]+\.[a-z]{2,4}/i;

      if (sotPatterns.test(content)) return 2;
      if (fileRefs.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "context_engineering",
    name: "Freshness",
    detect: (content: string): number => {
      const datePatterns =
        /(?:stand\s*:|as of\s*:|dated?\s*:|vom\s*:|last updated|zuletzt aktualisiert|current as of|gültig\s+(?:ab|seit)|version\s+\d+\.\d+)/i;
      const hasDate =
        /\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4}|\d{2}\/\d{2}\/\d{4}/.test(
          content,
        );

      if (datePatterns.test(content) && hasDate) return 2;
      if (datePatterns.test(content) || hasDate) return 1;
      return 0;
    },
  },
  {
    dimension: "context_engineering",
    name: "Context Layers",
    detect: (content: string): number => {
      const coldPattern =
        /^#+\s*(?:background|hintergrund|history|historie|overview|überblick|foundation|grundlage)/im;
      const warmPattern =
        /^#+\s*(?:current\s*state|aktueller\s*stand|status|environment|umgebung|situation)/im;
      const hotPattern =
        /^#+\s*(?:immediate\s*context|task|aufgabe|goal|ziel|request|anfrage|problem)/im;

      const layerCount = [coldPattern, warmPattern, hotPattern].filter((p) =>
        p.test(content),
      ).length;

      if (layerCount >= 3) return 2;
      if (layerCount >= 1) return 1;
      return 0;
    },
  },
  {
    dimension: "context_engineering",
    name: "Excluded Context",
    detect: (content: string): number => {
      const exclusionPatterns =
        /(?:out of scope|nicht\s+(?:im\s+)?(?:scope|umfang|teil)|ausgeschlossen|excluded|not\s+(?:relevant|included|needed|required)|nicht\s+(?:relevant|enthalten|benötigt|erforderlich)|ignore|ignoriere|disregard|außer\s+acht\s+lassen)/i;

      const explicitExclusion =
        /^#+\s*(?:out of scope|nicht im scope|excluded|ausgeschlossen|not included)/im;

      if (explicitExclusion.test(content)) return 2;
      if (exclusionPatterns.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "context_engineering",
    name: "Tool Boundaries",
    detect: (content: string): number => {
      const toolPatterns =
        /(?:only\s+(?:modify|change|edit|update|read|access)|nur\s+(?:ändern|lesen|zugreifen)|available tools?\s*:|verfügbare tools?\s*:|do not\s+(?:modify|change|touch|access)|nicht\s+(?:ändern|anfassen|zugreifen))/i;
      const fileBounds =
        /(?:only\s+(?:in|within)\s|nur\s+(?:in|innerhalb)\s|restrict\s+(?:to|changes to)|beschränke?\s+(?:auf|änderungen auf))/i;

      if (toolPatterns.test(content) && fileBounds.test(content)) return 2;
      if (toolPatterns.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "context_engineering",
    name: "Evidence Requirements",
    detect: (content: string): number => {
      const evidencePatterns =
        /(?:evidence|nachweis|beleg|proof|beweis|show\s+(?:your\s+)?work|zeige\s+(?:deine\s+)?arbeit|document\s+(?:your|the)|dokumentiere|provide\s+(?:evidence|proof|logs?|screenshots?))/i;
      const artifactPatterns =
        /(?:screenshot|bildschirmfoto|log\s+file|logdatei|test\s+output|testergebnis|build\s+output|report)/i;

      if (evidencePatterns.test(content) && artifactPatterns.test(content))
        return 2;
      if (evidencePatterns.test(content)) return 1;
      return 0;
    },
  },
];

// =============================================================================
// Agent Readiness Criteria (10) — only scored for agentic prompts
// =============================================================================

const AR_CRITERIA: CriterionDef[] = [
  {
    dimension: "agent_readiness",
    name: "Issue Reference",
    detect: (content: string): number => {
      if (/(?:issue|ticket|task|bug)\s*[#:]\s*\d+/i.test(content)) return 2;
      if (/(?:issue|ticket|task)\b/i.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "agent_readiness",
    name: "Specification Reference",
    detect: (content: string): number => {
      if (
        /(?:spec\s*:|specification\s*:|requirements?\s*doc|anforderungsdokument|lastenheft|pflichtenheft)/i.test(
          content,
        )
      )
        return 2;
      if (
        /(?:spec|specification|anforderung|requirements?\s*(?:doc|document))/i.test(
          content,
        )
      )
        return 1;
      return 0;
    },
  },
  {
    dimension: "agent_readiness",
    name: "Verification Contract",
    detect: (content: string): number => {
      const contractPatterns =
        /(?:verification\s*contract|verify\s+that|verify\s+the|prüfe\s+dass|überprüfe|validate\s+(?:that|the)|bestätige|confirm|acceptance\s*(?:criteria|tests|check))/i;
      if (contractPatterns.test(content)) return 2;
      if (/(?:verify|prüfe|validate|check|test)/i.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "agent_readiness",
    name: "Testing Requirements",
    detect: (content: string): number => {
      const testPatterns =
        /(?:tests?\s*(?:must|should|need to|sollen|müssen)\s*(?:pass|succeed|be green)|red tests?|unit tests?|integration tests?|e2e tests?|test suite|pnpm test|npm test|cargo test)/i;
      if (testPatterns.test(content)) return 2;
      if (/(?:tests?|testing|testen)/i.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "agent_readiness",
    name: "CI Gate Awareness",
    detect: (content: string): number => {
      const ciPatterns =
        /(?:CI\s*(?:pipeline|gate|check|must|should)|continuous integration|lint\s*(?:must|should|check)|build\s*(?:must|should|succeed|pass)|green\s*(?:pipeline|build|CI))/i;
      if (ciPatterns.test(content)) return 2;
      if (/(?:CI\b|pipeline|lint|linter|build\s+step)/i.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "agent_readiness",
    name: "Review Process",
    detect: (content: string): number => {
      const reviewPatterns =
        /(?:code\s*review|reviewer|PR\s*review|pull\s*request\s*review|review\s*(?:required|needed|mandatory)|review-agent)/i;
      if (reviewPatterns.test(content)) return 2;
      if (/(?:review|prüfung|begutachtung)/i.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "agent_readiness",
    name: "Human Approval",
    detect: (content: string): number => {
      const approvalPatterns =
        /(?:human\s*approval|menschliche\s*(?:freigabe|genehmigung|prüfung)|approval\s*(?:required|needed|gate|step)|genehmigung\s*(?:erforderlich|notwendig)|freigabe\s*(?:erforderlich|notwendig)|sign.?off|abnahme)/i;
      if (approvalPatterns.test(content)) return 2;
      if (/(?:approval|genehmigung|freigabe|approve)/i.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "agent_readiness",
    name: "Evidence Requirements",
    detect: (content: string): number => {
      const evidencePatterns =
        /(?:evidence\s*(?:required|must|should|log|comment)|nachweis\s*(?:erforderlich|notwendig)|proof\s*of|beleg\s*(?:für|für)|screenshot\s*(?:required|of|showing)|log\s*(?:output|file|must))/i;
      if (evidencePatterns.test(content)) return 2;
      if (/(?:evidence|nachweis|beleg|proof)/i.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "agent_readiness",
    name: "Scope Boundaries",
    detect: (content: string): number => {
      const scopePatterns =
        /(?:in\s*scope\s*:|out\s*of\s*scope\s*:|scope\s*:\s|im\s*umfang\s*:|nicht\s*im\s*umfang\s*:|umfang\s*:\s|what\s*(?:is|'s)\s*(?:in|out)\s*of\s*scope)/i;
      if (scopePatterns.test(content)) return 2;
      if (/(?:scope|umfang|in scope|out of scope)/i.test(content)) return 1;
      return 0;
    },
  },
  {
    dimension: "agent_readiness",
    name: "Safety / Rollback",
    detect: (content: string): number => {
      const safetyPatterns =
        /(?:rollback|rücknahme|revert|rückgängig|backup|sicherung|safety\s*(?:measure|check|gate)|sicherheits\s*(?:maßnahme|check)|undo|disaster\s*recovery|fallback\s*plan)/i;
      if (safetyPatterns.test(content)) return 2;
      if (/(?:safety|sicherheit|backup|rollback)/i.test(content)) return 1;
      return 0;
    },
  },
];

// =============================================================================
// Risk Flag Detection
// =============================================================================

const RISK_FLAG_DEFS: RiskFlagDef[] = [
  {
    flag: "ambiguous_task",
    severity: "high",
    message:
      "Task is vague or ambiguous. Add a specific action verb and clear objective.",
    score_penalty: 15,
    detect: (content: string): boolean => {
      const hasActionVerb =
        /(?:schreibe|erstelle|analysiere|implementiere|build|create|implement|analyze|generate|refactor|fix|write|develop|design)/i.test(
          content,
        );
      const isVague =
        /^(?:help|hilf|can you|kannst du|do something|maybe|vielleicht)/im.test(
          content.trim(),
        );
      return !hasActionVerb || isVague;
    },
  },
  {
    flag: "missing_goal",
    severity: "high",
    message:
      "No clear goal or desired outcome defined. State what the prompt should achieve.",
    score_penalty: 20,
    detect: (content: string): boolean => {
      return !/(?:ziel|goal|objective|outcome|ergebnis|purpose|zweck|should\s+(?:produce|generate|create|output|return|result)|soll\s+\w+\s+(?:werden|sein|liefern))/i.test(
        content,
      );
    },
  },
  {
    flag: "missing_output_format",
    severity: "medium",
    message:
      "No output format specified. Define the expected response format (e.g., JSON, Markdown, code).",
    score_penalty: 10,
    detect: (content: string): boolean => {
      return !/(?:output\s*(?:format|as)|ausgabe\s*(?:format|als)|return\s+(?:as|a|in)|gib\s+(?:zurück|aus)|format\s*:|response\s*format)/i.test(
        content,
      );
    },
  },
  {
    flag: "missing_constraints",
    severity: "medium",
    message:
      "No constraints or boundaries defined. Add limitations, non-goals, or restrictions.",
    score_penalty: 10,
    detect: (content: string): boolean => {
      return !/(?:constraint|einschränkung|do not|nicht\s|avoid|vermeide|must not|limitation|begrenzung|restriction)/i.test(
        content,
      );
    },
  },
  {
    flag: "missing_verification",
    severity: "medium",
    message:
      "No verification criteria defined. Specify how to confirm successful completion.",
    score_penalty: 15,
    detect: (content: string, isAgentic: boolean): boolean => {
      // Only flag as risk if content is substantial enough to warrant verification
      const cleanLen = contentLengthWithoutCode(content);
      if (!isAgentic && cleanLen < 400) return false;
      return !/(?:verify|prüfe|überprüfe|validate|bestätige|confirm|check\s+(?:that|if)|test\s+(?:that|if)|ensure|sicherstellen)/i.test(
        content,
      );
    },
  },
  {
    flag: "context_missing",
    severity: "medium",
    message:
      "No context provided for a task that likely needs background information.",
    score_penalty: 15,
    detect: (content: string, isAgentic: boolean): boolean => {
      // Only flag if the prompt appears to need context
      const needsContext = isAgentic || contentLengthWithoutCode(content) > 300;
      if (!needsContext) return false;

      return !/(?:context|kontext|background|hintergrund|environment|umgebung|current\s*state|aktueller\s*stand)/i.test(
        content,
      );
    },
  },
  {
    flag: "context_overload",
    severity: "medium",
    message:
      "Context appears overloaded with excessive or irrelevant information. Focus on relevant context.",
    score_penalty: 15,
    detect: (content: string): boolean => {
      const cleanLen = contentLengthWithoutCode(content);
      const headingCount = countHeadings(content);

      // Large content with few headings = potential overload
      if (cleanLen > 1000 && headingCount < 3) return true;

      // Check if task-to-context ratio is very low
      const hasTaskHeading = /^#+\s*(?:task|aufgabe|goal|ziel|auftrag)/im.test(
        content,
      );
      if (!hasTaskHeading && cleanLen > 800) return true;

      // Multiple task-like headings in moderate content = scattered focus
      const taskHeadingCount =
        content.match(
          /^#+\s*(?:task|aufgabe|noch\s+eine\s+aufgabe|und\s+noch\s+was|goal|ziel|objective)/gim,
        )?.length ?? 0;
      if (taskHeadingCount >= 3 && cleanLen > 400) return true;

      return false;
    },
  },
  {
    flag: "source_of_truth_missing",
    severity: "high",
    message:
      "No source of truth or authoritative reference cited. Specify the canonical data, issue, or document.",
    score_penalty: 20,
    detect: (content: string, isAgentic: boolean): boolean => {
      // For non-agentic prompts, only flag SOT missing if there is explicit
      // code modification intent (fix/bug/repair). Mere mentions of repos,
      // file paths, or module names (e.g., in a writing task) should not
      // trigger this flag — those are natural references, not missing SOT.
      const hasFixBug =
        /(?:fix\s+(?:the|a)\s+(?:bug|issue|problem|critical)|bug\s+fix|behebe|repariere)/i.test(
          content,
        );

      if (!isAgentic && !hasFixBug) return false;

      return !/(?:source of truth|authoritative|maßgebend|referenz|reference|see issue|siehe issue|github\.com\/\w+\/\w+\/issues\/\d+|gemäß|according to|based on|basierend auf|per\s+(?:spec|issue|ticket|doc))/i.test(
        content,
      );
    },
  },
  {
    flag: "mixed_objectives",
    severity: "high",
    message:
      "Multiple unrelated objectives detected. Focus on a single task per prompt.",
    score_penalty: 20,
    detect: (content: string): boolean => {
      // Count task-like headings — more than 2 suggests mixed objectives
      const taskHeadings = content.match(
        /^#+\s*(?:task|aufgabe|goal|ziel|objective|aufgabe\s*\d|task\s*\d)/gim,
      );
      if (taskHeadings && taskHeadings.length > 2) return true;

      // Check for unrelated task keywords in the same content
      const unrelatedSignals = [
        /(?:blog\s*post|write\s*(?:a|an)\s*article)/i,
        /(?:order\s+more|office\s+supplies|buy|purchase)/i,
        /(?:privacy\s*policy|terms\s*of\s*service)/i,
        /(?:company\s*culture|team\s*building)/i,
      ];

      const codeSignals = [
        /(?:implement|fix\s+bug|refactor|deploy|merge|commit|PR\b|pull\s*request)/i,
      ];

      const hasUnrelated = unrelatedSignals.filter((p) =>
        p.test(content),
      ).length;
      const hasCodeTask = codeSignals.filter((p) => p.test(content)).length;

      // If we have both code tasks AND unrelated business tasks, that's mixed
      if (hasUnrelated >= 1 && hasCodeTask >= 1) return true;
      if (hasUnrelated >= 2) return true;

      return false;
    },
  },
  {
    flag: "scope_creep_risk",
    severity: "medium",
    message:
      "No clear scope boundaries. Task may expand beyond intended limits.",
    score_penalty: 15,
    detect: (content: string, isAgentic: boolean): boolean => {
      if (!isAgentic) return false;
      return !/(?:scope\s*:|umfang\s*:|in\s*scope|out\s*of\s*scope|what\s*(?:is|'s)\s*(?:in|out))/i.test(
        content,
      );
    },
  },
  {
    flag: "no_human_approval",
    severity: "high",
    message:
      "No human approval gate specified. Add an explicit approval step before finalization.",
    score_penalty: 20,
    detect: (content: string, isAgentic: boolean): boolean => {
      if (!isAgentic) return false;
      return !/(?:human\s*approval|menschliche\s*(?:freigabe|genehmigung)|approval\s*(?:required|needed|gate|step)|genehmigung|freigabe|sign.?off|abnahme)/i.test(
        content,
      );
    },
  },
  {
    flag: "no_evidence_contract",
    severity: "high",
    message:
      "No evidence contract defined. Specify what proof of completion is required.",
    score_penalty: 20,
    detect: (content: string, isAgentic: boolean): boolean => {
      if (!isAgentic) return false;
      return !/(?:evidence|nachweis|beleg|proof|verification\s*contract|verify\s+that)/i.test(
        content,
      );
    },
  },
  {
    flag: "unbounded_agent_autonomy",
    severity: "critical",
    message:
      "Agent is given unbounded autonomy without safety measures. Add rollback plan, scope limits, and approval gates.",
    score_penalty: 25,
    detect: (content: string, isAgentic: boolean): boolean => {
      if (!isAgentic) return false;

      const hasSafety =
        /(?:rollback|rücknahme|revert|safety|sicherheit|backup|fallback|undo)/i.test(
          content,
        );
      const hasApproval =
        /(?:approval|genehmigung|freigabe|review|prüfung|sign.?off)/i.test(
          content,
        );
      const hasScope =
        /(?:scope|umfang|boundary|grenze|limit|restrict|beschränk)/i.test(
          content,
        );

      // Unbounded = no safety + no approval + no scope
      return !hasSafety && !hasApproval && !hasScope;
    },
  },
  {
    flag: "stale_or_undated_context",
    severity: "low",
    message:
      "Context lacks temporal reference. Add a date or version to indicate freshness.",
    score_penalty: 10,
    detect: (content: string): boolean => {
      const hasContext =
        /^#+\s*(?:context|kontext|background|hintergrund)/im.test(content);
      if (!hasContext) return false;

      const hasDate =
        /(?:stand\s*:|as of|dated?|vom|last updated|current as of|\d{4}-\d{2}-\d{2}|\d{2}\.\d{2}\.\d{4})/i.test(
          content,
        );
      return !hasDate;
    },
  },
];

// =============================================================================
// Suggested Improvements Generator
// =============================================================================

function generateSuggestedImprovements(
  peResult: ReturnType<typeof normalizeScore>,
  ceResult: ReturnType<typeof normalizeScore>,
  arResult: ReturnType<typeof normalizeScore>,
  riskFlags: RiskFlag[],
  isAgentic: boolean,
): SuggestedImprovement[] {
  const improvements: SuggestedImprovement[] = [];

  // From criteria with score 0 (missing)
  for (const c of [...peResult.details, ...ceResult.details]) {
    if (c.score === 0) {
      improvements.push({
        dimension: c.dimension,
        criterion: c.name,
        message: generateMissingMessage(c.name, c.dimension),
        priority: c.dimension === "prompt_engineering" ? "high" : "medium",
      });
    }
  }

  // From criteria with score 1 (partial)
  for (const c of [...peResult.details, ...ceResult.details]) {
    if (c.score === 1) {
      improvements.push({
        dimension: c.dimension,
        criterion: c.name,
        message: generatePartialMessage(c.name, c.dimension),
        priority: "medium",
      });
    }
  }

  // Agent readiness improvements (only for agentic)
  if (isAgentic) {
    for (const c of arResult.details) {
      if (c.score === 0) {
        improvements.push({
          dimension: "agent_readiness",
          criterion: c.name,
          message: generateAgentMissingMessage(c.name),
          priority: "high",
        });
      } else if (c.score === 1) {
        improvements.push({
          dimension: "agent_readiness",
          criterion: c.name,
          message: generateAgentPartialMessage(c.name),
          priority: "medium",
        });
      }
    }
  }

  // From risk flags
  for (const flag of riskFlags) {
    if (flag.severity === "high" || flag.severity === "critical") {
      improvements.push({
        dimension: "prompt_engineering",
        criterion: flag.flag,
        message: flag.message,
        priority: "high",
      });
    }
  }

  // Sort: high priority first, then medium, then low
  improvements.sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  // Deduplicate by message
  const seen = new Set<string>();
  return improvements.filter((imp) => {
    if (seen.has(imp.message)) return false;
    seen.add(imp.message);
    return true;
  });
}

function generateMissingMessage(name: string, dimension: string): string {
  const messages: Record<string, string> = {
    "Task Clarity":
      'Add a clear action verb and specific task, e.g., "Implement the UserAuth module in TypeScript."',
    "Goal Definition":
      'Define the desired outcome, e.g., "The result should be a working REST endpoint that passes all tests."',
    "Role Definition":
      'Specify a role or perspective, e.g., "You are a senior backend developer."',
    Constraints:
      'Add constraints and boundaries, e.g., "Do not use external libraries. Must work offline."',
    "Output Format":
      'Define the expected output format, e.g., "Return a Markdown checklist with acceptance criteria."',
    "Quality Criteria":
      'Specify quality requirements, e.g., "The code must have >80% test coverage and pass lint."',
    Examples:
      'Provide an example or reference, e.g., "See auth.rs for the existing implementation pattern."',
    Verification:
      'Add verification criteria, e.g., "Run pnpm test and confirm all tests pass."',
    "Uncertainty Handling":
      'Define fallback behavior, e.g., "If the data format is unclear, ask for clarification before proceeding."',
    "Language Clarity":
      "Simplify and remove ambiguous language. Use specific terms and avoid contradictions.",
    "Context Relevance":
      "Add a relevant Context section that provides background directly related to the task.",
    "Context Sufficiency":
      "Provide enough context for the task, including relevant data, files, or system state.",
    "Context Economy":
      "Reduce context to only what is necessary. Move lengthy background to an appendix or reference.",
    "Context Isolation":
      'Separate this task from other concerns. Add an "Out of Scope" section to define boundaries.',
    "Source of Truth":
      'Define an authoritative source, e.g., "Use GitHub issue #67 and current master as authoritative context."',
    Freshness:
      'Add a date or version reference, e.g., "Stand: 2026-06-14, based on design v3.2."',
    "Context Layers":
      'Structure context in layers, e.g., "Background → Current State → Immediate Context."',
    "Excluded Context":
      'Explicitly state what is NOT relevant, e.g., "Not relevant: deployment configuration, monitoring setup."',
    "Tool Boundaries":
      'Define file and tool access boundaries, e.g., "Only modify files in src/components/."',
    "Evidence Requirements":
      'Specify evidence needed, e.g., "Provide a screenshot of passing tests and the CI pipeline status."',
  };

  return (
    messages[name] ||
    `Improve ${name.toLowerCase()} in the ${dimension.replace("_", " ")} section.`
  );
}

function generatePartialMessage(name: string, dimension: string): string {
  const messages: Record<string, string> = {
    "Task Clarity":
      "Strengthen the task description with a more specific action verb and objective.",
    "Goal Definition":
      "Make the goal more measurable. Add concrete success criteria.",
    "Role Definition":
      "Make the role more specific, e.g., add domain expertise level or context.",
    Constraints: "Add more specific constraints or non-goals to tighten scope.",
    "Output Format":
      "Be more specific about the output format. Name the exact format and structure.",
    "Quality Criteria":
      "Add measurable quality criteria, e.g., test coverage percentage, performance thresholds.",
    Examples: "Add a concrete code example or reference implementation.",
    Verification:
      "Make verification more specific. Add exact commands or expected outputs.",
    "Uncertainty Handling":
      "Add fallback instructions for edge cases or ambiguous situations.",
    "Language Clarity":
      "Reduce remaining ambiguity. Replace vague terms with specific ones.",
    "Context Relevance":
      "Focus context more tightly on task-relevant information.",
    "Context Sufficiency": "Add more task-relevant context details.",
    "Context Economy":
      "Further trim extraneous context to improve signal-to-noise ratio.",
    "Context Isolation":
      "Strengthen task isolation. Add clearer boundaries between concerns.",
    "Source of Truth":
      "Make the source of truth more explicit with a direct link or reference.",
    Freshness:
      "Add a specific date or version number to the freshness reference.",
    "Context Layers":
      "Add more context layers (Background, Current State, Immediate Context).",
    "Excluded Context":
      "Make exclusions more explicit with a dedicated section.",
    "Tool Boundaries":
      "Be more specific about which files and tools are in/out of scope.",
    "Evidence Requirements":
      "Specify exact evidence artifacts needed (screenshots, logs, test reports).",
  };

  return (
    messages[name] ??
    `Consider strengthening ${name.toLowerCase()} in the ${dimension.replace("_", " ")} dimension.`
  );
}

function generateAgentMissingMessage(name: string): string {
  const messages: Record<string, string> = {
    "Issue Reference":
      'Link to a specific issue, e.g., "Implement per GitHub Issue #42."',
    "Specification Reference":
      'Reference the specification, e.g., "Follow the requirements in docs/spec/auth.md."',
    "Verification Contract":
      'Define a verification contract, e.g., "Verify that all tests pass and the build is green."',
    "Testing Requirements":
      'Add testing requirements, e.g., "Run pnpm test and ensure all tests pass."',
    "CI Gate Awareness":
      'Reference CI gates, e.g., "The CI pipeline (lint + test + build) must be green."',
    "Review Process":
      'Add a review step, e.g., "Request a code review from the reviewer-agent."',
    "Human Approval":
      'Add a human approval gate, e.g., "Await human approval before merging."',
    "Evidence Requirements":
      'Require evidence of completion, e.g., "Post CI results as evidence in the issue."',
    "Scope Boundaries":
      'Define scope, e.g., "In scope: auth module. Out of scope: UI changes, deployment."',
    "Safety / Rollback":
      'Add a safety measure, e.g., "Create a backup branch before making changes."',
  };

  return messages[name] || `Add ${name.toLowerCase()} to the agent workflow.`;
}

function generateAgentPartialMessage(name: string): string {
  return `Strengthen the ${name.toLowerCase()} in the agent workflow with more specific details.`;
}

// =============================================================================
// Main Evaluation Function (pure, deterministic)
// =============================================================================

export function evaluatePromptContext(
  content: string,
  options?: EvaluationOptions,
): PromptContextEvaluation {
  const evaluatedAt = options?.evaluatedAt ?? "";

  // Empty/whitespace-only content: return minimal evaluation immediately
  const trimmedContent = content.trim();
  if (trimmedContent.length === 0) {
    const emptyCriteria: ContextCriterion[] = [
      ...PE_CRITERIA.map((c) => ({
        dimension: c.dimension,
        name: c.name,
        score: 0,
        max_score: 2,
        details: `Missing: prompt has no content.`,
      })),
      ...CE_CRITERIA.map((c) => ({
        dimension: c.dimension,
        name: c.name,
        score: 0,
        max_score: 2,
        details: `Missing: prompt has no content.`,
      })),
    ];
    return {
      detected_prompt_type: "simple_prompt",
      detected_context_profile: "minimal",
      prompt_engineering_score: 0,
      context_engineering_score: 0,
      agent_readiness_score: 0,
      robustness_score: 0,
      overall_score: 0,
      criteria: emptyCriteria,
      strengths: [],
      warnings: ["Prompt is empty. Add content to enable evaluation."],
      missing_elements: ["No prompt content to evaluate."],
      suggested_improvements: [
        {
          dimension: "prompt_engineering",
          criterion: "task_clarity",
          message:
            "Start by writing a clear task with an action verb and specific objective.",
          priority: "high",
        },
      ],
      risk_flags: [
        {
          flag: "ambiguous_task",
          severity: "high",
          message: "No prompt content provided.",
          score_penalty: 15,
        },
        {
          flag: "missing_goal",
          severity: "high",
          message: "No goal or objective specified.",
          score_penalty: 20,
        },
      ],
      confidence: 1.0,
      evaluated_at: evaluatedAt,
    };
  }

  // 1. Detect prompt type
  const detectedPromptType = detectPromptType(content);
  const isAgentic = detectedPromptType === "agentic_prompt";

  // 2. Score prompt engineering criteria
  const peResult = normalizeScore(PE_CRITERIA, content);

  // 3. Score context engineering criteria
  const ceResult = normalizeScore(CE_CRITERIA, content);

  // 4. Score agent readiness (only for agentic prompts)
  const arResult = isAgentic
    ? normalizeScore(AR_CRITERIA, content)
    : {
        totalScore: 0,
        maxScore: 20,
        percentage: 0,
        details: [] as ContextCriterion[],
      };

  // 5. Detect risk flags
  const detectedFlags = RISK_FLAG_DEFS.filter((def) =>
    def.detect(content, isAgentic),
  ).map(
    (def): RiskFlag => ({
      flag: def.flag,
      severity: def.severity,
      message: def.message,
      score_penalty: def.score_penalty,
    }),
  );

  // 6. Calculate robustness score (0-100, higher = better)
  let robustnessScore = 100;
  for (const flag of detectedFlags) {
    robustnessScore -= flag.score_penalty;
  }
  // Additionally penalize for fully missing criteria (score=0 in PE and CE)
  // For simple_prompt, only penalize core criteria (task clarity, goal)
  if (detectedPromptType === "simple_prompt") {
    // Only penalize missing task/role/goal for simple prompts
    const coreMissing = peResult.details.filter(
      (c) =>
        (c.name === "Task Clarity" ||
          c.name === "Goal Definition" ||
          c.name === "Language Clarity") &&
        c.score === 0,
    ).length;
    robustnessScore -= coreMissing * 3;
  } else {
    const missingPECount = peResult.details.filter((c) => c.score === 0).length;
    const missingCECount = ceResult.details.filter((c) => c.score === 0).length;
    robustnessScore -= missingPECount * 3;
    robustnessScore -= missingCECount * 3;
    if (isAgentic) {
      const missingARCount = arResult.details.filter(
        (c) => c.score === 0,
      ).length;
      robustnessScore -= missingARCount * 5;
    }
  }
  robustnessScore = clamp(robustnessScore, 0, 100);

  // 7. Calculate overall score (weighted by prompt type)
  let overallScore: number;
  if (isAgentic) {
    overallScore =
      peResult.percentage * 0.35 +
      ceResult.percentage * 0.25 +
      arResult.percentage * 0.25 +
      robustnessScore * 0.15;
  } else if (detectedPromptType === "structured_prompt") {
    overallScore =
      peResult.percentage * 0.45 +
      ceResult.percentage * 0.3 +
      robustnessScore * 0.25;
  } else {
    // simple_prompt
    overallScore =
      peResult.percentage * 0.6 +
      ceResult.percentage * 0.25 +
      robustnessScore * 0.15;
  }
  overallScore = clamp(Math.round(overallScore), 0, 100);

  // 8. Build strengths and warnings
  const strengths: string[] = [];
  const warnings: string[] = [];
  const missingElements: string[] = [];

  for (const c of peResult.details) {
    if (c.score === 2) strengths.push(`[PE] ${c.name}: ${c.details}`);
    else if (c.score === 1) warnings.push(`[PE] ${c.name}: ${c.details}`);
    else missingElements.push(`[PE] ${c.name}: ${c.details}`);
  }
  for (const c of ceResult.details) {
    if (c.score === 2) strengths.push(`[CE] ${c.name}: ${c.details}`);
    else if (c.score === 1) warnings.push(`[CE] ${c.name}: ${c.details}`);
    else missingElements.push(`[CE] ${c.name}: ${c.details}`);
  }
  if (isAgentic) {
    for (const c of arResult.details) {
      if (c.score === 2) strengths.push(`[AR] ${c.name}: ${c.details}`);
      else if (c.score === 1) warnings.push(`[AR] ${c.name}: ${c.details}`);
      else missingElements.push(`[AR] ${c.name}: ${c.details}`);
    }
  }

  // 9. Generate suggested improvements
  const suggestedImprovements = generateSuggestedImprovements(
    peResult,
    ceResult,
    arResult,
    detectedFlags,
    isAgentic,
  );

  // 10. Detect context profile
  const detectedContextProfile = detectContextProfile(content);
  // 11. Calculate confidence (based on how many criteria show positive signals)
  const allForConfidence = [
    ...peResult.details,
    ...ceResult.details,
    ...(isAgentic ? arResult.details : []),
  ];
  const totalForConfidence = allForConfidence.length;
  const nonZeroCount = allForConfidence.filter((c) => c.score > 0).length;
  const confidence =
    totalForConfidence > 0
      ? clamp(0.2 + (nonZeroCount / totalForConfidence) * 0.8, 0.2, 1.0)
      : 0.3;
  // 12. Combine all criteria for the full criteria list
  const allCriteria = [
    ...peResult.details,
    ...ceResult.details,
    ...(isAgentic ? arResult.details : []),
  ];

  return {
    detected_prompt_type: detectedPromptType,
    detected_context_profile: detectedContextProfile,
    prompt_engineering_score: peResult.percentage,
    context_engineering_score: ceResult.percentage,
    agent_readiness_score: arResult.percentage,
    robustness_score: robustnessScore,
    overall_score: overallScore,
    criteria: allCriteria,
    strengths,
    warnings,
    missing_elements: missingElements,
    suggested_improvements: suggestedImprovements,
    risk_flags: detectedFlags,
    confidence: Math.round(confidence * 100) / 100,
    evaluated_at: evaluatedAt,
  };
}
