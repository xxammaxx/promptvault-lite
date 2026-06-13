import { useState, useCallback, useEffect, useRef } from "react";
import { useAppStore, resolveTheme } from "./stores/appStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useResizablePanel } from "./hooks/useResizablePanel";
import { ExplorerPanel } from "./components/explorer/ExplorerPanel";
import { DetailsPanel } from "./components/details/DetailsPanel";
import { AnalysisPanel } from "./components/analysis/AnalysisPanel";
import { ExportDialog } from "./components/common/ExportDialog";
import { ThemeToggle } from "./components/common/ThemeToggle";
import "./App.css";

const MIN_EXPLORER_WIDTH = 240;
const MAX_EXPLORER_WIDTH = 600;

function App() {
  const {
    scanFolder,
    analyzeAll,
    isLoading,
    isAnalyzing,
    error,
    prompts,
    watcherNotification,
    cleanupWatcher,
  } = useAppStore();
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isTauri =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const modLabel = isMac ? "Cmd" : "Strg";

  // Cleanup watcher on component unmount
  useEffect(() => {
    return () => {
      void cleanupWatcher();
    };
  }, [cleanupWatcher]);

  // Sync theme to document element
  const theme = useAppStore((s) => s.theme);
  useEffect(() => {
    const resolved = resolveTheme(theme);
    document.documentElement.setAttribute("data-theme", resolved);
  }, [theme]);

  // Re-evaluate auto theme when OS preference changes
  useEffect(() => {
    if (theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      document.documentElement.setAttribute(
        "data-theme",
        e.matches ? "dark" : "light",
      );
    };
    mq.addEventListener("change", handleChange);
    return () => {
      mq.removeEventListener("change", handleChange);
    };
  }, [theme]);

  const handleSelectFolder = useCallback(async () => {
    if (!isTauri) return;

    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Prompt-Ordner auswählen",
      });

      if (selected && typeof selected === "string") {
        setFolderPath(selected);
        await scanFolder(selected);
      }
    } catch (err) {
      console.error("Ordner-Auswahl fehlgeschlagen:", err);
    }
  }, [isTauri, scanFolder]);

  const handleAnalyzeAll = useCallback(async () => {
    await analyzeAll();
  }, [analyzeAll]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onOpenFolder: isLoading || !isTauri ? undefined : handleSelectFolder,
    onFocusSearch: () => {
      searchInputRef.current?.focus();
    },
    onAnalyzeAll:
      isAnalyzing || isLoading || prompts.length === 0
        ? undefined
        : handleAnalyzeAll,
    onEscape: () => {
      useAppStore.getState().resetFilters();
      searchInputRef.current?.blur();
    },
    onExport:
      isLoading || isAnalyzing || prompts.length === 0
        ? undefined
        : () => {
            setShowExportDialog(true);
          },
  });

  const filteredCount = useAppStore((s) => s.filteredPrompts)().length;

  // Resizable explorer panel
  const explorerWidth = useAppStore((s) => s.explorerWidth);
  const setExplorerWidth = useAppStore((s) => s.setExplorerWidth);
  const { handleRef, handleProps } = useResizablePanel({
    width: explorerWidth,
    minWidth: MIN_EXPLORER_WIDTH,
    maxWidth: MAX_EXPLORER_WIDTH,
    onResize: setExplorerWidth,
  });

  return (
    <div className="app-container">
      {/* Toolbar */}
      <header className="app-toolbar">
        <h1 className="app-title">🗄️ PromptVault Lite</h1>
        <div className="toolbar-actions">
          {folderPath && (
            <span className="folder-path" title={folderPath}>
              📁 {folderPath.split(/[/\\]/).pop() || folderPath}
            </span>
          )}
          <ThemeToggle />
          <button
            className="btn"
            aria-disabled="true"
            tabIndex={-1}
            title="Einstellungen sind in Entwicklung"
            aria-label="Einstellungen (in Entwicklung)"
          >
            ⚙️
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              void handleSelectFolder();
            }}
            disabled={isLoading || !isTauri}
            title={`Ordner öffnen (${modLabel}+O)`}
          >
            {isLoading ? "⏳ Scanne..." : "📁 Ordner öffnen"}
          </button>
          {prompts.length > 0 && (
            <>
              <button
                className="btn"
                onClick={() => {
                  void handleAnalyzeAll();
                }}
                disabled={isAnalyzing}
                title={`Alle analysieren (${modLabel}+Shift+A)`}
              >
                {isAnalyzing ? "⏳ Analysiere..." : "🔄 Alle analysieren"}
              </button>
              <button
                className="btn"
                onClick={() => {
                  setShowExportDialog(true);
                }}
                title={`Exportieren (${modLabel}+E)`}
              >
                📦 Exportieren
              </button>
            </>
          )}
          {error && <span className="error-message">{error}</span>}
        </div>
      </header>

      {/* Drei-Spalten-Layout */}
      <main
        className="app-layout"
        style={
          { "--explorer-width": explorerWidth + "px" } as React.CSSProperties
        }
      >
        <ExplorerPanel searchRef={searchInputRef} />
        <div className="resize-handle" ref={handleRef} {...handleProps} />
        <DetailsPanel />
        <AnalysisPanel />
      </main>

      {/* Statusleiste */}
      <footer className="app-statusbar">
        <span>
          {prompts.length > 0
            ? `${filteredCount} von ${prompts.length} Prompt(s)`
            : "Bereit"}
          {isLoading && " — Scanne..."}
          {isAnalyzing && " — Analysiere..."}
          {watcherNotification && (
            <span
              style={{
                marginLeft: "1em",
                color: "var(--color-accent, #4fc3f7)",
              }}
            >
              {watcherNotification}
            </span>
          )}
        </span>
        <span>PromptVault Lite v{__APP_VERSION__}</span>
      </footer>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          onClose={() => {
            setShowExportDialog(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
