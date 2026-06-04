import React, { useMemo, useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import { TreeNode } from "./TreeNode";

export const FileTree: React.FC = () => {
  const fileTreeFn = useAppStore((s) => s.fileTree);
  // Subscribe to state slices that invalidate the file tree.
  // filteredPrompts() inside fileTree() depends on prompts, evaluations,
  // hygiene (for hygieneStatus filter), and filters.
  const prompts = useAppStore((s) => s.prompts);
  const evaluations = useAppStore((s) => s.evaluations);
  const hygiene = useAppStore((s) => s.hygiene);
  const filters = useAppStore((s) => s.filters);
  const expandedFolders = useAppStore((s) => s.expandedFolders);
  const selectedPromptId = useAppStore((s) => s.selectedPromptId);
  const toggleFolder = useAppStore((s) => s.toggleFolder);
  const selectPrompt = useAppStore((s) => s.selectPrompt);

  // Stabilize callbacks for React.memo in child TreeNodes
  const handleToggle = useCallback(
    (path: string) => { toggleFolder(path); },
    [toggleFolder],
  );
  const handleSelect = useCallback(
    (promptId: string) => { selectPrompt(promptId); },
    [selectPrompt],
  );

  // Single computation per render — fileTree() is called exactly once.
  const tree = useMemo(
    () => fileTreeFn(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prompts, evaluations, hygiene, filters],
  );

  if (tree.length === 0) {
    return (
      <div className="empty-state">
        <p>Keine Prompts gefunden.</p>
        <p className="hint">Öffne einen Ordner mit Markdown-Dateien.</p>
      </div>
    );
  }

  return (
    <div className="file-tree">
      {tree.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          isExpanded={expandedFolders.has(node.path)}
          isSelected={
            node.prompt_id !== undefined && node.prompt_id === selectedPromptId
          }
          onToggle={handleToggle}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
};
