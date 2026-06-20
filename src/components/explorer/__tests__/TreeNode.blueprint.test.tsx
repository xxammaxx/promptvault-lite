import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TreeNode } from "../TreeNode";
import { useAppStore } from "@/stores/appStore";
import type { FileTreeNode, BlueprintDetectOutput } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDetection(
  contentClass: BlueprintDetectOutput["content_class"],
): BlueprintDetectOutput {
  return {
    content_class: contentClass,
    blueprint_type: null,
    contamination_status: "CLEAN",
    confidence: 0.95,
    prompt_signals: [],
    blueprint_signals: [],
    contamination_signals: [],
  };
}

function resetStore() {
  useAppStore.setState({
    prompts: [],
    evaluations: {},
    hygiene: {},
    contextEvaluations: {},
    blueprintDetections: {},
    blueprintEvaluations: {},
    selectedPromptId: null,
    expandedFolders: new Set<string>(),
    filters: {
      search: "",
      category: null,
      minScore: 0,
      maxScore: 100,
      hygieneStatus: null,
      tags: [],
      favoritesOnly: false,
    },
    currentFolderPath: null,
  });
}

// ---------------------------------------------------------------------------
// T3 — ContentClass Badge in TreeNode
// ---------------------------------------------------------------------------

describe("TreeNode — ContentClass Badge", () => {
  const mockOnToggle = vi.fn();
  const mockOnSelect = vi.fn();

  const defaultProps = {
    depth: 0,
    isExpanded: false,
    isSelected: false,
    onToggle: mockOnToggle,
    onSelect: mockOnSelect,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("shows Blueprint badge when detection is BLUEPRINT", () => {
    const node: FileTreeNode = {
      name: "test-blueprint.md",
      path: "/test-blueprint.md",
      is_directory: false,
      prompt_id: "bp-1",
      children: [],
    };

    useAppStore
      .getState()
      .setBlueprintDetection("bp-1", makeDetection("BLUEPRINT"));

    render(<TreeNode node={node} {...defaultProps} />);

    expect(screen.getByText("Blueprint")).toBeInTheDocument();
  });

  it("does NOT show Blueprint badge when detection is PROMPT", () => {
    const node: FileTreeNode = {
      name: "test-prompt.md",
      path: "/test-prompt.md",
      is_directory: false,
      prompt_id: "p-1",
      children: [],
    };

    // PROMPT detection in store
    useAppStore
      .getState()
      .setBlueprintDetection("p-1", makeDetection("PROMPT"));

    render(<TreeNode node={node} {...defaultProps} />);

    // PROMPT shows "Prompt" badge, NOT "Blueprint" badge
    expect(screen.getByText("Prompt")).toBeInTheDocument();
    expect(screen.queryByText("Blueprint")).not.toBeInTheDocument();
  });

  it("shows Hybrid badge when detection is PROMPT_BLUEPRINT_HYBRID", () => {
    const node: FileTreeNode = {
      name: "hybrid.md",
      path: "/hybrid.md",
      is_directory: false,
      prompt_id: "hy-1",
      children: [],
    };

    useAppStore
      .getState()
      .setBlueprintDetection("hy-1", makeDetection("PROMPT_BLUEPRINT_HYBRID"));

    render(<TreeNode node={node} {...defaultProps} />);

    expect(screen.getByText("Hybrid")).toBeInTheDocument();
  });

  it("shows Review badge when detection is UNKNOWN_NEEDS_REVIEW", () => {
    const node: FileTreeNode = {
      name: "unknown.md",
      path: "/unknown.md",
      is_directory: false,
      prompt_id: "un-1",
      children: [],
    };

    useAppStore
      .getState()
      .setBlueprintDetection("un-1", makeDetection("UNKNOWN_NEEDS_REVIEW"));

    render(<TreeNode node={node} {...defaultProps} />);

    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("shows no badge when detection is not in store", () => {
    const node: FileTreeNode = {
      name: "no-detection.md",
      path: "/no-detection.md",
      is_directory: false,
      prompt_id: "nd-1",
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    // No ContentClassBadge rendered — no label text present
    expect(screen.queryByText("Blueprint")).not.toBeInTheDocument();
    expect(screen.queryByText("Prompt")).not.toBeInTheDocument();
    expect(screen.queryByText("Hybrid")).not.toBeInTheDocument();
    expect(screen.queryByText("Review")).not.toBeInTheDocument();
  });

  it("score badge still renders when ContentClass badge is present", () => {
    const node: FileTreeNode = {
      name: "scored-blueprint.md",
      path: "/scored-blueprint.md",
      is_directory: false,
      prompt_id: "sb-1",
      score: 85,
      children: [],
    };

    useAppStore
      .getState()
      .setBlueprintDetection("sb-1", makeDetection("BLUEPRINT"));

    render(<TreeNode node={node} {...defaultProps} />);

    // Both badges present
    expect(screen.getByText("Blueprint")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("shows no badge for directory nodes", () => {
    const node: FileTreeNode = {
      name: "test-folder",
      path: "/test-folder",
      is_directory: true,
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    // Directory nodes don't show content class badges
    expect(screen.queryByText("Blueprint")).not.toBeInTheDocument();
    expect(screen.queryByText("Prompt")).not.toBeInTheDocument();
  });
});
