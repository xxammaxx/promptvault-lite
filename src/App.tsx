import { useState, useCallback } from "react";
import { useAppStore } from "./stores/appStore";
import { ExplorerPanel } from "./components/explorer/ExplorerPanel";
import { DetailsPanel } from "./components/details/DetailsPanel";
import { AnalysisPanel } from "./components/analysis/AnalysisPanel";
import "./App.css";

function App() {
  const { scanFolder, analyzeAll, isLoading, isAnalyzing, error, prompts } =
    useAppStore();
  const [folderPath, setFolderPath] = useState<string | null>(null);

  const isTauri =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

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

  const filteredCount = useAppStore((s) => s.filteredPrompts)().length;

  return (
    <div className="app-container">
      {/* Toolbar */}
      <header className="app-toolbar">
        <h1 className="app-title">🗄️ PromptVault Lite</h1>
        <div className="toolbar-actions">
          {folderPath && (
            <span className="folder-path" title={folderPath}>
              📁 {folderPath.split("/").pop() || folderPath}
            </span>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSelectFolder}
            disabled={isLoading || !isTauri}
          >
            {isLoading ? "⏳ Scanne..." : "📂 Ordner öffnen"}
          </button>
          {prompts.length > 0 && (
            <button
              className="btn"
              onClick={handleAnalyzeAll}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? "⏳ Analysiere..." : "🔄 Alle analysieren"}
            </button>
          )}
          {error && <span className="error-message">{error}</span>}
        </div>
      </header>

      {/* Drei-Spalten-Layout */}
      <main className="app-layout">
        <ExplorerPanel />
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
        </span>
        <span>PromptVault Lite v1.0.0</span>
      </footer>
    </div>
  );
}

export default App;
