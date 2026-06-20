import React, { useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import type { FileTreeNode } from "@/types";
import ContentClassBadge from "@/components/common/ContentClassBadge";

interface TreeNodeProps {
  node: FileTreeNode;
  depth: number;
  /** Root nodes receive isExpanded from parent; children derive from store. */
  isExpanded?: boolean;
  /** Root nodes receive isSelected from parent; children derive from store. */
  isSelected?: boolean;
  onToggle: (path: string) => void;
  onSelect: (promptId: string) => void;
}

const TreeNodeComponent: React.FC<TreeNodeProps> = ({
  node,
  depth,
  isExpanded: propExpanded,
  isSelected: propSelected,
  onToggle,
  onSelect,
}) => {
  // Children derive state from the zustand store (prevents prop-drilling).
  const storeExpanded = useAppStore((s) => s.expandedFolders.has(node.path));
  const storeSelected = useAppStore((s) =>
    node.prompt_id !== undefined
      ? s.selectedPromptId === node.prompt_id
      : false,
  );
  const blueprintDetection = useAppStore((s) =>
    node.prompt_id !== undefined
      ? s.blueprintDetections[node.prompt_id]
      : undefined,
  );

  const isExpanded = propExpanded ?? storeExpanded;
  const isSelected = propSelected ?? storeSelected;

  const paddingLeft = 8 + depth * 16;

  const handleToggle = useCallback(() => {
    onToggle(node.path);
  }, [onToggle, node.path]);
  const handleSelect = useCallback(() => {
    if (node.prompt_id) onSelect(node.prompt_id);
  }, [onSelect, node.prompt_id]);

  if (node.is_directory) {
    return (
      <div>
        <div
          className="tree-node tree-folder"
          style={{ paddingLeft }}
          onClick={handleToggle}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={`Ordner ${node.name}${isExpanded ? " (geöffnet)" : " (geschlossen)"}`}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleToggle();
          }}
        >
          <span className="tree-chevron">{isExpanded ? "▼" : "▶"}</span>
          <span className="tree-icon">📁</span>
          <span className="tree-name" title={node.name}>
            {node.name}
          </span>
        </div>
        {isExpanded &&
          node.children.map((child) => (
            <MemoizedTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
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
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSelect();
      }}
    >
      <span className="tree-chevron-placeholder" />
      <span
        className={`tree-icon ${node.is_favorite ? "favorite-indicator" : ""}`}
        {...(node.is_favorite ? { "aria-label": "Favorit", role: "img" } : {})}
      >
        {node.is_favorite ? "⭐" : "📄"}
      </span>
      <ContentClassBadge
        contentClass={blueprintDetection?.content_class ?? null}
        size="sm"
      />
      <span className="tree-name" title={node.name}>
        {node.name.replace(".md", "")}
      </span>
      {node.score !== undefined && (
        <span className={`tree-score ${scoreColor}`}>{node.score}</span>
      )}
    </div>
  );
};

// Custom comparator: only re-render when meaningful props change.
// isExpanded/isSelected omitted — they are derived from the store inside
// the component, so zustand handles their updates independently.
const arePropsEqual = (prev: TreeNodeProps, next: TreeNodeProps): boolean =>
  prev.node === next.node &&
  prev.depth === next.depth &&
  prev.isExpanded === next.isExpanded &&
  prev.isSelected === next.isSelected &&
  prev.onToggle === next.onToggle &&
  prev.onSelect === next.onSelect;

const MemoizedTreeNode = React.memo(TreeNodeComponent, arePropsEqual);

export { MemoizedTreeNode as TreeNode };
