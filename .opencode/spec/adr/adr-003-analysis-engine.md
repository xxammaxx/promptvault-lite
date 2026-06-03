# ADR-003: Analysis Engine

## Status
Accepted

## Context
PromptVault Lite evaluates Markdown prompt files for quality, completeness, reusability, hygiene, artifacts, project dependencies, and security risks. The specification explicitly calls for rule-based analysis and lists criteria such as role, goal, context, inputs, process, output format, quality requirements, safety boundaries, overspecialization, repository traces, paths, issue references, logs, stack traces, build output, JSON dumps, code dumps, personal data, and secrets.

The application is local-first and intended to work without cloud services. Analysis results must be explainable, deterministic, testable, and fast enough for large collections of 10,000+ prompts.

Architectural drivers:

- Deterministic scoring and findings for repeatable tests.
- Local-only operation without sending prompt content to third-party services.
- Explainable recommendations such as replacing concrete project names with placeholders.
- Low latency and low cost for bulk scans.
- Maintainable rules that can evolve with user needs.
- Strong security posture for prompts that may contain secrets or personal data.

## Decision
Use a rule-based analysis engine implemented in Rust using deterministic heuristics, regular expressions, parsers, scoring rules, and configurable artifact detectors.

The engine will produce structured outputs for at least:

- Quality score from 0 to 100.
- Hygiene score from 0 to 100.
- Hygiene status: clean, warning, or critical.
- Missing prompt sections.
- Detected artifacts with type, severity, location, excerpt, and recommendation.
- Reusability and overspecialization indicators.

Rules should be organized by cohesive detector modules, for example quality structure detectors, path/repository detectors, log/build-output detectors, PII detectors, secret detectors, and recommendation generators. Critical security findings such as API keys, tokens, passwords, and secrets must always be marked critical.

## Alternatives Considered

### Rule-based analysis with regex and heuristics
Rule-based analysis directly matches the project specification. It is deterministic, fast, testable, explainable, and suitable for local execution. It can detect many hygiene artifacts through patterns and can generate specific replacement recommendations such as `{PROJECT_NAME}`, `{ISSUE_ID}`, and `{FILE_PATH}`.

Tradeoffs:

- Excellent reproducibility and testability.
- Low runtime cost and no external service dependency.
- Easier to explain findings to users.
- Limited semantic understanding compared with ML/LLM approaches.
- Rules require maintenance to avoid false positives and false negatives.

### ML/LLM-based analysis
ML or LLM analysis could provide richer semantic judgments, nuanced quality feedback, and better detection of ambiguous issues. However, it introduces major concerns for a local desktop MVP: possible prompt-content exfiltration to remote providers, nondeterministic outputs, higher latency, model cost, offline availability problems, and harder test assertions. Local models reduce data-sharing risk but add large downloads, hardware variability, packaging complexity, and performance uncertainty.

Tradeoffs:

- Better potential semantic reasoning and natural-language feedback.
- Higher privacy and security risk if remote providers are used.
- Nondeterministic scoring complicates tests and user trust.
- Higher latency and cost for bulk analysis.
- Packaging and support complexity for local models.

### Hybrid rule-based plus optional ML assistance
A hybrid engine could use deterministic rules for baseline findings and optional ML for richer recommendations. This may be useful in a later version, but it is not appropriate for the MVP because it expands the security boundary, dependency footprint, configuration surface, and testing complexity.

Tradeoffs:

- Preserves deterministic baseline while enabling richer optional insights.
- Adds feature flags, consent flows, provider configuration, and privacy documentation.
- Requires clear separation between local-only and provider-assisted analysis.
- Increases scope beyond the MVP acceptance criteria.

## Consequences

Positive consequences:

- Analysis is local, deterministic, explainable, and testable.
- No prompt content needs to leave the user's machine.
- Bulk rescans are feasible with low latency and no provider costs.
- Findings can be mapped to precise rules and recommendations.
- Security-sensitive detections can be handled consistently and marked critical.

Negative consequences:

- The engine may miss subtle semantic quality issues that an LLM could identify.
- Rule tuning is required to balance false positives and false negatives.
- Multilingual and domain-specific prompts may require expanded pattern sets.
- Recommendations may be more template-like than an ML-generated critique.

## Compliance

- New dependency justified: no ML dependency is introduced for MVP; regex/parser dependencies must be justified by detector needs.
- Coupling/cohesion: detector modules are cohesive and exposed through a stable analysis service interface.
- Data flow/security: prompt content is analyzed locally in Rust; no remote model or provider receives user files.
- Error handling: malformed Markdown, invalid frontmatter, large files, and detector failures should produce structured warnings rather than crash the scan.
- Scaling: deterministic detectors support incremental rescans, caching by file hash, and parallel/background processing.
- Security boundaries: secret and PII detection results are minimized and treated as sensitive local data.
- Testing: unit tests for each detector, scoring tests, regression fixtures for false positives/negatives, and integration tests for scanner-parser-analysis-cache flow are required.
