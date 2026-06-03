import React, { useCallback } from "react";
import { useAppStore } from "@/stores/appStore";
import ReactMarkdown from "react-markdown";

export const PromptContent: React.FC = () => {
  const prompt = useAppStore((s) => s.selectedPrompt)();

  if (!prompt) return null;

  return (
    <div className="prompt-content">
      <ReactMarkdown>{prompt.content}</ReactMarkdown>
    </div>
  );
};

export const PromptMeta: React.FC = () => {
  const prompt = useAppStore((s) => s.selectedPrompt)();

  if (!prompt) return null;

  return (
    <div className="prompt-meta">
      <div className="meta-row">
        <span className="meta-label">Version</span>
        <span className="meta-value">{prompt.version}</span>
      </div>
      <div className="meta-row">
        <span className="meta-label">Kategorie</span>
        <span className="meta-value">
          <span className="badge">{prompt.category}</span>
        </span>
      </div>
      {prompt.tags.length > 0 && (
        <div className="meta-row">
          <span className="meta-label">Tags</span>
          <span className="meta-value">
            {prompt.tags.map((tag) => (
              <span key={tag} className="badge badge-tag">
                {tag}
              </span>
            ))}
          </span>
        </div>
      )}
      <div className="meta-row">
        <span className="meta-label">Pfad</span>
        <span className="meta-value meta-path">{prompt.file_path}</span>
      </div>
      <div className="meta-row">
        <span className="meta-label">Erstellt</span>
        <span className="meta-value">{formatDate(prompt.created_at)}</span>
      </div>
      <div className="meta-row">
        <span className="meta-label">Geändert</span>
        <span className="meta-value">{formatDate(prompt.updated_at)}</span>
      </div>
    </div>
  );
};

export const ActionBar: React.FC = () => {
  const prompt = useAppStore((s) => s.selectedPrompt)();
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const analyzeSelected = useAppStore((s) => s.analyzeSelected);
  const isAnalyzing = useAppStore((s) => s.isAnalyzing);

  const handleCopy = useCallback(async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.content);
    } catch {
      // Fallback: Tauri clipboard
      try {
        const { writeText } =
          await import("@tauri-apps/plugin-clipboard-manager");
        await writeText(prompt.content);
      } catch {
        // ignore
      }
    }
  }, [prompt]);

  const handleOpenFile = useCallback(async () => {
    if (!prompt) return;
    try {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(prompt.file_path);
    } catch {
      // ignore
    }
  }, [prompt]);

  if (!prompt) return null;

  return (
    <div className="action-bar">
      <button
        className="btn"
        onClick={() => toggleFavorite(prompt.id)}
        title={prompt.is_favorite ? "Favorit entfernen" : "Favorit"}
      >
        {prompt.is_favorite ? "⭐" : "☆"}
      </button>
      <button className="btn" onClick={handleCopy} title="Inhalt kopieren">
        📋 Kopieren
      </button>
      <button className="btn" onClick={handleOpenFile} title="Datei öffnen">
        📂 Öffnen
      </button>
      <button
        className="btn btn-primary"
        onClick={() => analyzeSelected()}
        disabled={isAnalyzing}
        title="Neu analysieren"
      >
        {isAnalyzing ? "⏳" : "🔄"} Analysieren
      </button>
    </div>
  );
};

export const DetailsPanel: React.FC = () => {
  const prompt = useAppStore((s) => s.selectedPrompt)();

  if (!prompt) {
    return (
      <div className="panel panel-details">
        <div className="panel-header">Prompt Details</div>
        <div className="panel-content">
          <div className="empty-state">
            <p>Kein Prompt ausgewählt.</p>
            <p className="hint">Wähle einen Prompt im Explorer aus.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel panel-details">
      <div className="panel-header">
        <span>{prompt.title}</span>
        {prompt.description && (
          <span className="header-description">{prompt.description}</span>
        )}
      </div>
      <div className="panel-content">
        <PromptMeta />
        <ActionBar />
        <PromptContent />
      </div>
    </div>
  );
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}
