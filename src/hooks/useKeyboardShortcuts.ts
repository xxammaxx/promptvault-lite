import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
  onOpenFolder?: () => void;
  onFocusSearch?: () => void;
  onAnalyzeAll?: () => void;
  onEscape?: () => void;
  onExport?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { onOpenFolder, onFocusSearch, onAnalyzeAll, onEscape, onExport } =
    handlers;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip IME composition events (Japanese, Chinese, Korean)
      if (e.isComposing || e.key === "Dead" || e.key === "Process") return;

      // Skip if user is typing in an input/textarea (except Escape)
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Esc: Close search / clear filters (always allowed, even in inputs)
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      // Skip other shortcuts if in input field
      if (isInput) return;

      // Ctrl+O / Cmd+O: Open folder
      if (modKey && e.key === "o" && onOpenFolder) {
        e.preventDefault();
        onOpenFolder();
        return;
      }

      // Ctrl+F / Cmd+F: Focus search
      if (modKey && e.key === "f" && onFocusSearch) {
        e.preventDefault();
        onFocusSearch();
        return;
      }

      // Ctrl+Shift+A / Cmd+Shift+A: Analyze all
      if (modKey && e.shiftKey && e.key === "A" && onAnalyzeAll) {
        e.preventDefault();
        onAnalyzeAll();
        return;
      }

      // Ctrl+E / Cmd+E: Export dialog
      if (modKey && e.key === "e" && onExport) {
        e.preventDefault();
        onExport();
        return;
      }
    },
    [onOpenFolder, onFocusSearch, onAnalyzeAll, onEscape, onExport],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); };
  }, [handleKeyDown]);
}
