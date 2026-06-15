// =============================================================================
// SettingsPanel — Developer Mode Toggle and basic settings
// =============================================================================
// Minimal settings modal as specified in Issue #92.
// Does NOT build a full settings modal (Issue #63 would need that).
// Only exposes the Developer Mode toggle with clear UX.

import { useAppStore } from "@/stores/appStore";

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const devMode = useAppStore((s) => s.devMode);
  const toggleDevMode = useAppStore((s) => s.toggleDevMode);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="modal-header">
          <h2>Einstellungen</h2>
          <button
            className="btn btn-icon modal-close"
            onClick={onClose}
            aria-label="Einstellungen schließen"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Developer Mode */}
          <section className="settings-section">
            <h3 className="settings-section-title">Entwickler-Werkzeuge</h3>

            <div className="settings-row">
              <div className="settings-row-label">
                <span className="settings-label-text">Developer Mode</span>
                <span className="settings-label-hint">
                  Aktiviert den PromptVault Action Layer (10 lokale Aktionen).
                  Write-Actions erfordern zusätzliche Bestätigung.
                </span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={devMode}
                  onChange={() => {
                    toggleDevMode();
                  }}
                  aria-label="Developer Mode umschalten"
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {devMode && (
              <div className="settings-note settings-note--active">
                <strong>Developer Mode ist AKTIV</strong> — Lesende Aktionen
                sind verfügbar. Schreibende Aktionen (Erstellen, Bearbeiten)
                zeigen vor Ausführung einen Bestätigungsdialog.
              </div>
            )}

            {!devMode && (
              <div className="settings-note settings-note--inactive">
                Developer Mode ist deaktiviert. Keine Aktionen verfügbar.
              </div>
            )}
          </section>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-primary"
            onClick={onClose}
            aria-label="Einstellungen schließen"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
