import React from "react";
import { useAppStore } from "@/stores/appStore";
import { TreeNode } from "./TreeNode";

export const FileTree: React.FC = () => {
  const fileTree = useAppStore((s) => s.fileTree);
  const expandedFolders = useAppStore((s) => s.expandedFolders);
  const selectedPromptId = useAppStore((s) => s.selectedPromptId);
  const toggleFolder = useAppStore((s) => s.toggleFolder);
  const selectPrompt = useAppStore((s) => s.selectPrompt);

  if (fileTree().length === 0) {
    return (
      <div className="empty-state">
        <p>Keine Prompts gefunden.</p>
        <p className="hint">Öffne einen Ordner mit Markdown-Dateien.</p>
      </div>
    );
  }

  return (
    <div className="file-tree">
      {fileTree().map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          isExpanded={expandedFolders.has(node.path)}
          isSelected={
            node.prompt_id !== undefined && node.prompt_id === selectedPromptId
          }
          onToggle={toggleFolder}
          onSelect={selectPrompt}
        />
      ))}
    </div>
  );
};
