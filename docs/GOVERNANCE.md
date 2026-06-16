# Governance

PromptVault Lite uses a small human-controlled governance workflow.

## Source of Truth

GitHub issues, pull requests, commits, CI logs, and release notes are the source of truth.

## Pull Requests

Every PR must include scope, verification, evidence, and human approval.

Use the [pull request template](.github/pull_request_template.md) when opening a PR.

## Not Allowed in the Product Repository

- Local agent configuration (e.g., `AGENTS.md`, `CLAUDE.md`, `.opencode/policies/`)
- OpenCode policies or personal assistant prompts
- Generated scratch files
- Secrets or credentials
- Unrelated documentation dumps
- Native binaries or release artifacts in source control

## Merge Rule

No merge without green CI and human approval.
