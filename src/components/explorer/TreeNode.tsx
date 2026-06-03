import React from "react";
import type { FileTreeNode } from "@/types";

interface TreeNodeProps {
  node: FileTreeNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: (path: string) => void;
  onSelect: (promptId: string) => void;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  depth,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
}) => {
  const paddingLeft = 8 + depth * 16;

  if (node.is_directory) {
    return (
      <div>
        <div
          className="tree-node tree-folder"
          style={{ paddingLeft }}
          onClick={() => onToggle(node.path)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onToggle(node.path)}
        >
          <span className="tree-chevron">{isExpanded ? "▼" : "▶"}</span>
          <span className="tree-icon">📁</span>
          <span className="tree-name">{node.name}</span>
        </div>
        {isExpanded &&
          node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              isExpanded={isExpanded}
              isSelected={isSelected}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
      </div>
    );
  }

  const scoreColor =
    node.score !== undefined
      ? node.score >= 70
        ? "score-high"
        : node.score >= 40
          ? "score-medium"
          : "score-low"
      : "";

  return (
    <div
      className={`tree-node tree-file ${isSelected ? "tree-selected" : ""}`}
      style={{ paddingLeft }}
      onClick={() => node.prompt_id && onSelect(node.prompt_id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        e.key === "Enter" && node.prompt_id && onSelect(node.prompt_id)
      }
    >
      <span className="tree-chevron-placeholder" />
      <span className="tree-icon">{node.is_favorite ? "⭐" : "📄"}</span>
      <span className="tree-name">{node.name.replace(".md", "")}</span>
      {node.score !== undefined && (
        <span className={`tree-score ${scoreColor}`}>{node.score}</span>
      )}
    </div>
  );
};
