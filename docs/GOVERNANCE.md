# Governance

PromptVault Lite uses a small human-controlled governance workflow.

## Source of Truth

GitHub issues, pull requests, commits, and local CI gates are the source of truth.
For AI agent runs, `AGENTS.md` is the operative rule file and takes precedence over this document.
This document (`GOVERNANCE.md`) is the human-readable explanation of governance intent.

## Pull Requests

Every PR must include scope, verification, evidence, and human approval.

Use the [pull request template](.github/pull_request_template.md) when opening a PR.

## Agent Rules

`AGENTS.md` is intentionally committed in this repository and is the operative OpenCode agent rule file.
It defines mandatory workflows, delegation rules, and hard constraints for all AI agents working in this repo.
When there is a conflict between this document and `AGENTS.md`, **AGENTS.md wins for agent execution**.

## Not Allowed in the Product Repository

- Ad-hoc local agent configuration, personal prompts, and scratch policy files not related to the project
- Generated scratch files
- Secrets or credentials
- Unrelated documentation dumps
- Native binaries or release artifacts in source control

## Merge Rule

No merge without green local CI and human approval.
