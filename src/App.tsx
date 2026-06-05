import { useState, useCallback, useEffect, useRef } from "react";
import { useAppStore } from "./stores/appStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { ExplorerPanel } from "./components/explorer/ExplorerPanel";
import { DetailsPanel } from "./components/details/DetailsPanel";
import { AnalysisPanel } from "./components/analysis/AnalysisPanel";
import { ExportDialog } from "./components/common/ExportDialog";
import "./App.css";

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
          <button
            className="btn btn-primary"
            onClick={() => {
              void handleSelectFolder();
            }}
            disabled={isLoading || !isTauri}
            title={`Ordner öffnen (${modLabel}+O)`}
          >
            {isLoading ? "⏳ Scanne..." : "📂 Ordner öffnen"}
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
      <main className="app-layout">
        <ExplorerPanel searchRef={searchInputRef} />
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
