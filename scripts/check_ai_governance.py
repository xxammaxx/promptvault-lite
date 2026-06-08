#!/usr/bin/env python3
"""
AI Governance Check Script for PromptVault Lite.

Validates that all required governance files exist and contain mandatory markers.
Run locally: python scripts/check_ai_governance.py

Idempotent — safe to run multiple times.
"""
# <!-- BEGIN GITHUB_AI_GOVERNANCE -->

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

# ---------- required files ----------
REQUIRED_FILES = [
    "AGENTS.md",
    ".github/copilot-instructions.md",
    ".github/pull_request_template.md",
    ".github/CODEOWNERS",
    ".github/workflows/ai-governance-check.yml",
    ".github/ISSUE_TEMPLATE/ai-task.yml",
    ".github/ISSUE_TEMPLATE/bug.yml",
    ".github/ISSUE_TEMPLATE/feature.yml",
    ".github/ISSUE_TEMPLATE/context-engineering-task.yml",
    "docs/AI_HANDBUCH.md",
    "docs/AI_WORKFLOW.md",
    "docs/CONTEXT_ENGINEERING_STANDARD.md",
    "docs/EVIDENCE_STANDARD.md",
    "docs/SECURITY_GATES.md",
    "docs/adr/ADR-001-ai-governance.md",
    "docs/GITHUB_REPOSITORY_SETTINGS_CHECKLIST.md",
]

# ---------- required markers ----------
GOVERNANCE_MARKER_HTML_START = "<!-- BEGIN GITHUB_AI_GOVERNANCE -->"
GOVERNANCE_MARKER_HTML_END = "<!-- END GITHUB_AI_GOVERNANCE -->"
GOVERNANCE_MARKER_HASH_START = "# BEGIN GITHUB_AI_GOVERNANCE"
GOVERNANCE_MARKER_HASH_END = "# END GITHUB_AI_GOVERNANCE"
# Marker keywords also used in md link refs (e.g., <!-- END GITHUB_AI_GOVERNANCE_README -->)
GOVERNANCE_MARKER_KEYWORD = "GITHUB_AI_GOVERNANCE"

FILES_REQUIRING_MARKERS = [
    "AGENTS.md",
    ".github/copilot-instructions.md",
    ".github/pull_request_template.md",
    ".github/CODEOWNERS",
    ".github/workflows/ai-governance-check.yml",
    ".github/ISSUE_TEMPLATE/ai-task.yml",
    "docs/AI_HANDBUCH.md",
    "docs/AI_WORKFLOW.md",
    "docs/CONTEXT_ENGINEERING_STANDARD.md",
    "docs/EVIDENCE_STANDARD.md",
    "docs/SECURITY_GATES.md",
    "docs/adr/ADR-001-ai-governance.md",
    "docs/GITHUB_REPOSITORY_SETTINGS_CHECKLIST.md",
]

# ---------- required workflow phases ----------
REQUIRED_PHASES = [
    "Issue",
    "Spec",
    "Verification Contract",
    "Red Tests",
    "Agent-Code",
    "CI/Security Gates",
    "Sandbox Preview",
    "Reviewer-Agent",
    "Human Approval",
    "Evidence-Kommentar",
    "Merge",
]


def check_file_exists(filepath: str) -> bool:
    full = PROJECT_ROOT / filepath
    return full.is_file()


def check_marker_in_file(filepath: str) -> bool:
    full = PROJECT_ROOT / filepath
    if not full.is_file():
        return False
    content = full.read_text(encoding="utf-8", errors="replace")
    has_html = (
        GOVERNANCE_MARKER_HTML_START in content
        and GOVERNANCE_MARKER_HTML_END in content
    )
    has_hash = (
        GOVERNANCE_MARKER_HASH_START in content
        and GOVERNANCE_MARKER_HASH_END in content
    )
    return has_html or has_hash


def check_pr_template_has_evidence() -> bool:
    full = PROJECT_ROOT / ".github" / "pull_request_template.md"
    if not full.is_file():
        return False
    content = full.read_text(encoding="utf-8", errors="replace")
    return "Evidence" in content


def check_agents_md_has_workflow() -> bool:
    full = PROJECT_ROOT / "AGENTS.md"
    if not full.is_file():
        return False
    content = full.read_text(encoding="utf-8", errors="replace")
    # AGENTS.md should contain either the governance marker or the workflow pipeline
    return "Issue → Spec" in content or GOVERNANCE_MARKER_KEYWORD in content


def check_ai_workflow_phases() -> tuple[bool, list[str]]:
    full = PROJECT_ROOT / "docs" / "AI_WORKFLOW.md"
    if not full.is_file():
        return False, []
    content = full.read_text(encoding="utf-8", errors="replace")
    missing = [p for p in REQUIRED_PHASES if p not in content]
    return len(missing) == 0, missing


def main() -> int:
    errors = 0
    warnings = 0

    print("=" * 60)
    print("AI Governance Check — PromptVault Lite")
    print(f"Project root: {PROJECT_ROOT}")
    print("=" * 60)
    print()

    # 1. Required files
    print("[1] Checking required files...")
    for f in REQUIRED_FILES:
        if check_file_exists(f):
            print(f"    PASS: {f}")
        else:
            print(f"    FAIL: {f} is MISSING")
            errors += 1
    print()

    # 2. Governance markers
    print("[2] Checking governance markers...")
    for f in FILES_REQUIRING_MARKERS:
        if check_marker_in_file(f):
            print(f"    PASS: {f}")
        elif check_file_exists(f):
            print(f"    WARN: {f} exists but missing governance marker")
            warnings += 1
        else:
            print(f"    SKIP: {f} does not exist")
    print()

    # 3. PR template Evidence
    print("[3] Checking PR template for Evidence section...")
    if check_pr_template_has_evidence():
        print("    PASS: PR template contains Evidence section")
    else:
        print("    FAIL: PR template missing Evidence section")
        errors += 1
    print()

    # 4. AGENTS.md workflow
    print("[4] Checking AGENTS.md for workflow reference...")
    if check_agents_md_has_workflow():
        print("    PASS: AGENTS.md references workflow")
    else:
        print("    FAIL: AGENTS.md missing workflow reference")
        errors += 1
    print()

    # 5. AI_WORKFLOW.md phases
    print("[5] Checking AI_WORKFLOW.md for all workflow phases...")
    ok, missing = check_ai_workflow_phases()
    if ok:
        print("    PASS: All workflow phases present")
    else:
        print(f"    FAIL: Missing phases: {', '.join(missing)}")
        errors += 1
    print()

    # 6. Existing tests check
    print("[6] Checking existing test directories...")
    frontend_tests = any(
        (PROJECT_ROOT / "src" / "components").glob("**/__tests__/*.test.*")
    )
    rust_tests = (
        list((PROJECT_ROOT / "src-tauri" / "tests").glob("*.rs"))
        if (PROJECT_ROOT / "src-tauri" / "tests").is_dir()
        else []
    )
    if frontend_tests:
        print("    PASS: Frontend test directory exists")
    else:
        print("    WARN: No frontend test directory found")
        warnings += 1
    if rust_tests:
        print(f"    PASS: Rust test files found ({len(rust_tests)})")
    else:
        print("    WARN: No Rust test files found")
        warnings += 1
    print()

    # Summary
    print("=" * 60)
    if errors == 0 and warnings == 0:
        print("RESULT: PASS — All governance checks passed.")
        return 0
    elif errors == 0:
        print(f"RESULT: PASS with {warnings} warning(s) — Review warnings above.")
        return 0
    else:
        print(f"RESULT: FAIL — {errors} error(s), {warnings} warning(s)")
        return 1


if __name__ == "__main__":
    sys.exit(main())

# <!-- END GITHUB_AI_GOVERNANCE -->
