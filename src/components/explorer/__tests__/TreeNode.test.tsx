import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TreeNode } from "../TreeNode";
import type { FileTreeNode } from "@/types";

describe("TreeNode", () => {
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
  });

  // --- AC-1: Directory node rendering ---

  it("renders a directory node with expand/collapse chevron and folder icon", () => {
    const node: FileTreeNode = {
      name: "test-folder",
      path: "/test-folder",
      is_directory: true,
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    expect(screen.getByText("test-folder")).toBeInTheDocument();
    expect(screen.getByText("📁")).toBeInTheDocument();
    // Collapsed state shows ▶
    expect(screen.getByText("▶")).toBeInTheDocument();
  });

  it("renders expanded chevron when isExpanded is true", () => {
    const node: FileTreeNode = {
      name: "test-folder",
      path: "/test-folder",
      is_directory: true,
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} isExpanded={true} />);

    expect(screen.getByText("▼")).toBeInTheDocument();
  });

  // --- AC-2: File node rendering ---

  it("renders a file node (prompt) without expand chevron", () => {
    const node: FileTreeNode = {
      name: "test-prompt.md",
      path: "/test-prompt.md",
      is_directory: false,
      prompt_id: "test-id",
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    // Name is rendered without .md extension
    expect(screen.getByText("test-prompt")).toBeInTheDocument();
    // File icon
    expect(screen.getByText("📄")).toBeInTheDocument();
    // Should NOT have chevron
    expect(screen.queryByText("▶")).not.toBeInTheDocument();
    expect(screen.queryByText("▼")).not.toBeInTheDocument();
  });

  // --- AC-3: Click on directory calls onToggle ---

  it("calls onToggle with node.path when clicking a directory node", () => {
    const node: FileTreeNode = {
      name: "test-folder",
      path: "/test-folder",
      is_directory: true,
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    fireEvent.click(screen.getByText("test-folder"));
    expect(mockOnToggle).toHaveBeenCalledWith("/test-folder");
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onToggle on Enter key for directory node", () => {
    const node: FileTreeNode = {
      name: "test-folder",
      path: "/test-folder",
      is_directory: true,
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    fireEvent.keyDown(screen.getByText("test-folder"), { key: "Enter" });
    expect(mockOnToggle).toHaveBeenCalledWith("/test-folder");
  });

  // --- AC-4: Click on file node calls onSelect ---

  it("calls onSelect with prompt_id when clicking a file node", () => {
    const node: FileTreeNode = {
      name: "test-prompt.md",
      path: "/test-prompt.md",
      is_directory: false,
      prompt_id: "test-id",
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    fireEvent.click(screen.getByText("test-prompt"));
    expect(mockOnSelect).toHaveBeenCalledWith("test-id");
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it("does not call onSelect for file node without prompt_id", () => {
    const node: FileTreeNode = {
      name: "no-id.md",
      path: "/no-id.md",
      is_directory: false,
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    fireEvent.click(screen.getByText("no-id"));
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  // --- AC-5: Favorite star icon ---

  it("shows star icon for favorite prompts", () => {
    const node: FileTreeNode = {
      name: "favorite-prompt.md",
      path: "/favorite-prompt.md",
      is_directory: false,
      prompt_id: "fav-id",
      is_favorite: true,
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    expect(screen.getByText("⭐")).toBeInTheDocument();
    expect(screen.queryByText("📄")).not.toBeInTheDocument();
  });

  it("shows file icon for non-favorite prompts", () => {
    const node: FileTreeNode = {
      name: "normal.md",
      path: "/normal.md",
      is_directory: false,
      prompt_id: "normal-id",
      is_favorite: false,
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    expect(screen.getByText("📄")).toBeInTheDocument();
    expect(screen.queryByText("⭐")).not.toBeInTheDocument();
  });

  // --- AC-6: Score badge with correct color class ---

  it("shows score badge with score-high class for scores >= 70", () => {
    const node: FileTreeNode = {
      name: "high-score.md",
      path: "/high-score.md",
      is_directory: false,
      prompt_id: "hs-id",
      score: 85,
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    const scoreBadge = screen.getByText("85");
    expect(scoreBadge).toBeInTheDocument();
    expect(scoreBadge.className).toContain("score-high");
    expect(scoreBadge.className).toContain("tree-score");
  });

  it("shows score badge with score-medium class for scores between 40 and 69", () => {
    const node: FileTreeNode = {
      name: "med-score.md",
      path: "/med-score.md",
      is_directory: false,
      prompt_id: "ms-id",
      score: 50,
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    const scoreBadge = screen.getByText("50");
    expect(scoreBadge).toBeInTheDocument();
    expect(scoreBadge.className).toContain("score-medium");
  });

  it("shows score badge with score-low class for scores below 40", () => {
    const node: FileTreeNode = {
      name: "low-score.md",
      path: "/low-score.md",
      is_directory: false,
      prompt_id: "ls-id",
      score: 25,
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    const scoreBadge = screen.getByText("25");
    expect(scoreBadge).toBeInTheDocument();
    expect(scoreBadge.className).toContain("score-low");
  });

  it("does not show score badge when score is undefined", () => {
    const node: FileTreeNode = {
      name: "no-score.md",
      path: "/no-score.md",
      is_directory: false,
      prompt_id: "ns-id",
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    expect(screen.queryByText("tree-score")).not.toBeInTheDocument();
  });

  // --- Edge case: selected state ---

  it("adds tree-selected class when isSelected is true", () => {
    const node: FileTreeNode = {
      name: "selected.md",
      path: "/selected.md",
      is_directory: false,
      prompt_id: "sel-id",
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} isSelected={true} />);

    const treeNode = screen.getByRole("button", { name: /selected/ });
    expect(treeNode.className).toContain("tree-selected");
  });

  // --- Edge case: deep nesting via paddingLeft ---

  it("applies correct left padding based on depth", () => {
    const node: FileTreeNode = {
      name: "deep.md",
      path: "/a/b/c/deep.md",
      is_directory: false,
      prompt_id: "deep-id",
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} depth={5} />);

    const treeNode = screen.getByRole("button", { name: /deep/ });
    // paddingLeft = 8 + depth * 16 = 8 + 80 = 88px
    expect(treeNode.style.paddingLeft).toBe("88px");
  });

  // --- Issue #65: Tooltip / title attribute on tree-name ---

  it("file node tree-name has title attribute with full name", () => {
    const node: FileTreeNode = {
      name: "very-long-prompt-name.md",
      path: "/very-long-prompt-name.md",
      is_directory: false,
      prompt_id: "long-id",
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    const nameSpan = screen.getByText("very-long-prompt-name");
    expect(nameSpan).toHaveAttribute("title", "very-long-prompt-name.md");
  });

  it("directory node tree-name has title attribute", () => {
    const node: FileTreeNode = {
      name: "very-long-folder-name",
      path: "/very-long-folder-name",
      is_directory: true,
      children: [],
    };

    render(<TreeNode node={node} {...defaultProps} />);

    const nameSpan = screen.getByText("very-long-folder-name");
    expect(nameSpan).toHaveAttribute("title", "very-long-folder-name");
  });
});
