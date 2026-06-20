import React, { useCallback, useState } from "react";
import { useAppStore } from "@/stores/appStore";
import ReactMarkdown from "react-markdown";
import { OptimizationPanel } from "@/components/optimization/OptimizationPanel";
import ContentClassBadge from "@/components/common/ContentClassBadge";
import type { BlueprintContamination } from "@/types";

// ---------------------------------------------------------------------------
// PromptContent — renders markdown for the selected prompt
// ---------------------------------------------------------------------------

export const PromptContent: React.FC = () => {
  const prompt = useAppStore((s) => s.selectedPrompt)();

  if (!prompt) return null;

  return (
    <div className="prompt-content">
      <ReactMarkdown>{prompt.content}</ReactMarkdown>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PromptMeta — metadata row with optional ContentClassBadge
// ---------------------------------------------------------------------------

export const PromptMeta: React.FC = () => {
  const prompt = useAppStore((s) => s.selectedPrompt)();
  const detection = useAppStore((s) => s.selectedBlueprintDetection)();

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
          {detection?.content_class != null && (
            <ContentClassBadge
              contentClass={detection.content_class}
              size="sm"
            />
          )}
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

// ---------------------------------------------------------------------------
// ContaminationWarning — shows contamination status bar
// ---------------------------------------------------------------------------

/** Configuration for each contamination level */
const CONTAMINATION_CONFIG: Record<
  Exclude<BlueprintContamination, "CLEAN">,
  { cssModifier: string; icon: string; message: string }
> = {
  POSSIBLE_CONTAMINATION: {
    cssModifier: "contamination-possible",
    icon: "⚠️",
    message:
      "Mögliche Kontamination erkannt — dieser Inhalt enthält möglicherweise veraltete oder fremde Artefakte.",
  },
  CONTAMINATED_NEEDS_REVIEW: {
    cssModifier: "contamination-review",
    icon: "🚫",
    message:
      "Kontaminiert — manuelle Überprüfung auf ungewollte Änderungen empfohlen.",
  },
  BLOCKING_SENSITIVE_CONTENT: {
    cssModifier: "contamination-blocked",
    icon: "🔒",
    message:
      "Vertraulicher Inhalt — die Anzeige wurde aus Sicherheitsgründen blockiert.",
  },
};

/**
 * ContaminationWarning
 *
 * Reads the selected blueprint detection from the store and displays a
 * contamination warning bar when the status is not CLEAN.
 * - POSSIBLE_CONTAMINATION → yellow/orange warning bar
 * - CONTAMINATED_NEEDS_REVIEW → red warning bar
 * - BLOCKING_SENSITIVE_CONTENT → prominent red blocking bar
 * - CLEAN or no detection → renders nothing
 *
 * NEVER renders secret values, token fragments, or original content lines.
 */
export const ContaminationWarning: React.FC = () => {
  const detection = useAppStore((s) => s.selectedBlueprintDetection)();

  if (!detection) return null;

  const status = detection.contamination_status;
  if (status === "CLEAN") return null;

  const config = CONTAMINATION_CONFIG[status];

  return (
    <div
      className={`contamination-bar ${config.cssModifier}`}
      role="alert"
      aria-live="polite"
    >
      <span className="contamination-icon" aria-hidden="true">
        {config.icon}
      </span>
      <span className="contamination-message">{config.message}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// BlockingMessage — shown when content is blocked for security
// ---------------------------------------------------------------------------

/**
 * BlockingMessage
 *
 * Displayed in place of PromptContent when contamination_status is
 * BLOCKING_SENSITIVE_CONTENT. Shows a safe, generic message without any
 * reference to the original secret values.
 */
export const BlockingMessage: React.FC = () => (
  <div className="blocking-message" role="alert" aria-live="assertive">
    <span className="blocking-message-icon" aria-hidden="true">
      🔒
    </span>
    <span className="blocking-message-text">
      Dieser Inhalt kann aus Sicherheitsgründen nicht angezeigt werden.
    </span>
    <span className="blocking-message-hint">
      Der Inhalt enthält vertrauliche Daten. Bitte prüfen Sie die Quelldatei
      direkt.
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// ActionBar — button bar with optional Blueprint-Optimize button
// ---------------------------------------------------------------------------

export const ActionBar: React.FC<{
  onOptimize?: () => void;
  onBlueprintOptimize?: () => void;
}> = ({ onOptimize, onBlueprintOptimize }) => {
  const prompt = useAppStore((s) => s.selectedPrompt)();
  const detection = useAppStore((s) => s.selectedBlueprintDetection)();
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const analyzeSelected = useAppStore((s) => s.analyzeSelected);
  const isAnalyzing = useAppStore((s) => s.isAnalyzing);

  const handleCopy = useCallback(async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.content);
    } catch {
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

  // Determine blueprint button visibility and state
  const contentClass = detection?.content_class ?? null;
  const contaminationStatus = detection?.contamination_status ?? null;
  const showBlueprintBtn =
    contentClass === "BLUEPRINT" || contentClass === "PROMPT_BLUEPRINT_HYBRID";
  const blueprintBlocked = contaminationStatus === "BLOCKING_SENSITIVE_CONTENT";
  // T6 (BlueprintOptimizationPanel) is not implemented yet.
  // Until then the button is disabled with a descriptive tooltip.
  // blueprintBlocked modifies only the tooltip message, not the disabled state
  // since the button is a placeholder until T6 is implemented.

  return (
    <div className="action-bar">
      <button
        className="btn"
        onClick={() => {
          void toggleFavorite(prompt.id);
        }}
        aria-label={
          prompt.is_favorite ? "Favorit entfernen" : "Als Favorit markieren"
        }
        aria-pressed={prompt.is_favorite}
        title={
          prompt.is_favorite ? "Favorit entfernen" : "Als Favorit markieren"
        }
      >
        {prompt.is_favorite ? "⭐" : "☆"}
      </button>
      <button
        className="btn"
        onClick={() => {
          void handleCopy();
        }}
        title="Inhalt kopieren"
      >
        📋 Kopieren
      </button>
      <button
        className="btn"
        onClick={() => {
          void handleOpenFile();
        }}
        title="Datei öffnen"
      >
        📂 Öffnen
      </button>
      <button
        className="btn"
        onClick={onOptimize}
        disabled={!onOptimize}
        title="Prompt optimieren"
      >
        ✨ Optimieren
      </button>
      <button
        className="btn btn-primary"
        onClick={() => {
          void analyzeSelected();
        }}
        disabled={isAnalyzing}
        title="Neu analysieren"
      >
        {isAnalyzing ? "⏳" : "🔄"} Analysieren
      </button>
      {showBlueprintBtn && (
        <button
          className="btn btn-primary"
          onClick={onBlueprintOptimize}
          disabled={true}
          title={
            blueprintBlocked
              ? "Blueprint-Optimierung für blockierte Inhalte nicht verfügbar"
              : "Blueprint optimieren (in Kürze verfügbar)"
          }
          aria-label="Blueprint optimieren"
        >
          🔷 BP optimieren
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// DetailsPanel — orchestrates all detail view components
// ---------------------------------------------------------------------------

export const DetailsPanel: React.FC = () => {
  const prompt = useAppStore((s) => s.selectedPrompt)();
  const detection = useAppStore((s) => s.selectedBlueprintDetection)();
  const [showOptimizer, setShowOptimizer] = useState(false);

  const handleOpenOptimizer = useCallback(() => {
    if (prompt) {
      setShowOptimizer(true);
    }
  }, [prompt]);

  // Blueprint optimize — placeholder callback until T6 is implemented
  const handleBlueprintOptimize = useCallback(() => {
    // T6 will wire this to BlueprintOptimizationPanel modal
    // For now: no-op (button is disabled)
  }, []);

  // Determine if content should be blocked
  const isBlocked =
    detection?.contamination_status === "BLOCKING_SENSITIVE_CONTENT";

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
        <ContaminationWarning />
        <ActionBar
          onOptimize={handleOpenOptimizer}
          onBlueprintOptimize={handleBlueprintOptimize}
        />
        {isBlocked ? <BlockingMessage /> : <PromptContent />}
      </div>
      {showOptimizer && (
        <OptimizationPanel
          promptContent={prompt.content}
          onClose={() => {
            setShowOptimizer(false);
          }}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
