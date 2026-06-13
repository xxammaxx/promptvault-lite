import React, { useState, useCallback, useMemo } from "react";
import { optimizePrompt } from "@/lib/promptOptimizer";
import type { OptimizationMode, OptimizationDiff } from "@/types";

// =============================================================================
// Optimization Panel — Modal overlay for prompt optimization
// =============================================================================

interface OptimizationPanelProps {
  promptContent: string;
  onClose: () => void;
}

const MODE_LABELS: Record<
  OptimizationMode,
  { label: string; description: string }
> = {
  conservative: {
    label: "Conservative",
    description: "Leichte Bereinigung: Whitespace, Formatierung, Aufzählungen",
  },
  balanced: {
    label: "Balanced",
    description: "Strukturiert: Sektionen erkennen, ordnen & fehlende ergänzen",
  },
  aggressive: {
    label: "Aggressive",
    description:
      "Vollständiger Agenten-Workflow mit Verification Contract & Gates",
  },
};

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  promptContent,
  onClose,
}) => {
  const [selectedMode, setSelectedMode] = useState<OptimizationMode | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const result: OptimizationDiff | null = useMemo(() => {
    if (!selectedMode || !promptContent) return null;
    return optimizePrompt(promptContent, selectedMode);
  }, [promptContent, selectedMode]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.optimized);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      try {
        const { writeText } =
          await import("@tauri-apps/plugin-clipboard-manager");
        await writeText(result.optimized);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch {
        // ignore
      }
    }
  }, [result]);

  const handleModeSelect = useCallback((mode: OptimizationMode) => {
    setSelectedMode(mode);
    setCopied(false);
  }, []);

  const isEmpty = promptContent.trim().length === 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog optimizer-dialog"
        onClick={(e) => {
          e.stopPropagation();
        }}
        role="dialog"
        aria-label="Prompt-Optimierung"
      >
        {/* Header */}
        <div className="modal-header">
          <h2>✨ Prompt-Optimierung</h2>
          <button
            className="btn btn-icon modal-close"
            onClick={onClose}
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body optimizer-body">
          {isEmpty ? (
            <div className="empty-state">
              <p>Kein Prompt-Inhalt vorhanden.</p>
              <p className="hint">
                Wähle einen Prompt im Explorer aus, um ihn zu optimieren.
              </p>
            </div>
          ) : (
            <>
              {/* Mode Selector */}
              <fieldset className="optimizer-mode-group">
                <legend>Optimierungsmodus</legend>
                <div className="optimizer-mode-options">
                  {(Object.keys(MODE_LABELS) as OptimizationMode[]).map(
                    (mode) => (
                      <label
                        key={mode}
                        className={`optimizer-mode-option ${selectedMode === mode ? "optimizer-mode-active" : ""}`}
                      >
                        <input
                          type="radio"
                          name="optimizationMode"
                          value={mode}
                          checked={selectedMode === mode}
                          onChange={() => {
                            handleModeSelect(mode);
                          }}
                        />
                        <div className="optimizer-mode-info">
                          <span className="optimizer-mode-label">
                            {MODE_LABELS[mode].label}
                          </span>
                          <span className="optimizer-mode-desc">
                            {MODE_LABELS[mode].description}
                          </span>
                        </div>
                      </label>
                    ),
                  )}
                </div>
              </fieldset>

              {/* Results: Before/After Diff */}
              {result && (
                <div className="optimizer-results">
                  {/* Changes Summary */}
                  {result.changes.length > 0 && (
                    <div className="optimizer-changes">
                      <h3>Änderungen ({result.changes.length})</h3>
                      <ul className="optimizer-changes-list">
                        {result.changes.map((change, i) => (
                          <li
                            key={i}
                            className={`change-item change-${change.type}`}
                          >
                            <span className="change-type">{change.type}</span>
                            <span className="change-desc">
                              {change.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings.length > 0 && (
                    <div className="optimizer-warnings">
                      <h3>⚠️ Hinweise ({result.warnings.length})</h3>
                      <ul>
                        {result.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Before/After Diff */}
                  <div className="optimizer-diff">
                    <div className="optimizer-diff-pane">
                      <h3>Vorher</h3>
                      <pre className="optimizer-diff-content">
                        {result.original}
                      </pre>
                    </div>
                    <div className="optimizer-diff-pane">
                      <h3>Optimiert</h3>
                      <pre className="optimizer-diff-content">
                        {result.optimized}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>
            Schließen
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              void handleCopy();
            }}
            disabled={!result || isEmpty}
          >
            {copied ? "✅ Kopiert!" : "📋 Ergebnis kopieren"}
          </button>
        </div>
      </div>
    </div>
  );
};
