import React, { useState } from "react";
import { SearchBar } from "./SearchBar";
import { FileTree } from "./FileTree";
import { FilterPanel } from "./FilterPanel";
import { useAppStore } from "@/stores/appStore";

export const ExplorerPanel: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const isLoading = useAppStore((s) => s.isLoading);
  const prompts = useAppStore((s) => s.prompts);

  return (
    <div className="panel panel-explorer">
      <div className="panel-header">
        <span>Explorer</span>
        <button
          className="btn btn-icon"
          onClick={() => setShowFilters(!showFilters)}
          title="Filter"
        >
          {showFilters ? "✕" : "⚙"}
        </button>
      </div>

      <SearchBar />

      {showFilters && <FilterPanel onClose={() => setShowFilters(false)} />}

      <div className="panel-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Scanne Ordner...</p>
          </div>
        ) : prompts.length === 0 ? (
          <div className="empty-state">
            <p>📂 Keine Prompts geladen.</p>
            <p className="hint">
              Nutze den Button oben, um einen Ordner zu öffnen.
            </p>
          </div>
        ) : (
          <FileTree />
        )}
      </div>
    </div>
  );
};
