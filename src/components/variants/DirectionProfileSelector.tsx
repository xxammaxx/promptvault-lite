// =============================================================================
// PromptVault Lite — DirectionProfileSelector (#215, T-215-011 / T-215-012)
// =============================================================================
// Chip-grid component for selecting direction profiles for variant generation.
// Multi-select (up to 5). Custom free-text direction. Shows active constraints.
//
// Batch 5 scope: UI only — no persistence, no network dependency.
// =============================================================================

import React, { useCallback, useMemo } from "react";
import { useAppStore } from "@/stores/appStore";
import { getProfilesByCategory } from "@/lib/directionProfiles";
import { extractHardConstraints } from "@/lib/constraintChecker";
import type { DirectionProfileId, DirectionProfile } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface DirectionProfileSelectorProps {
  /** Prompt content to extract constraints from (read-only). */
  promptContent: string;
}

// =============================================================================
// Constants
// =============================================================================

const MAX_SELECTED_PROFILES = 5;

/** Emoji icons for profile categories. */
const CATEGORY_ICONS: Record<DirectionProfile["category"], string> = {
  sachlich: "📄",
  verkaeuferisch: "💰",
  technisch: "⚙️",
  kreativ: "🎨",
  custom: "✏️",
};

/** Profile-specific emojis (override category icons where more specific). */
const PROFILE_ICONS: Record<string, string> = {
  sachlich: "📄",
  verkaeuferisch: "💰",
  technisch: "⚙️",
  kurz: "📏",
  ausfuehrlich: "📚",
  kreativ: "🎨",
  kritisch: "🔍",
  anfaenger: "🌱",
  experte: "🎓",
  deep_research: "🔬",
  agentisch: "🤖",
  compliance: "🛡️",
  custom: "✏️",
};

// =============================================================================
// Helpers
// =============================================================================

// =============================================================================
// DirectionProfileSelector
// =============================================================================

export const DirectionProfileSelector: React.FC<
  DirectionProfileSelectorProps
> = ({ promptContent }) => {
  // ---------------------------------------------------------------------------
  // Store
  // ---------------------------------------------------------------------------
  const selectedProfileIds = useAppStore((s) => s.selectedProfileIds);
  const customDirectionInput = useAppStore((s) => s.customDirectionInput);
  const toggleProfileSelection = useAppStore((s) => s.toggleProfileSelection);
  const setCustomDirectionInput = useAppStore((s) => s.setCustomDirectionInput);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const constraints = useMemo(
    () => extractHardConstraints(promptContent),
    [promptContent],
  );

  const profilesByCategory = useMemo(() => {
    const categories: DirectionProfile["category"][] = [
      "sachlich",
      "verkaeuferisch",
      "technisch",
      "kreativ",
    ];
    return categories
      .map((cat) => {
        const profiles = getProfilesByCategory(cat);
        return profiles.length > 0 ? { category: cat, profiles } : null;
      })
      .filter(Boolean) as {
      category: DirectionProfile["category"];
      profiles: DirectionProfile[];
    }[];
  }, []);

  const isCustomSelected = selectedProfileIds.includes("custom");

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleToggleProfile = useCallback(
    (profileId: DirectionProfileId) => {
      const current = useAppStore.getState().selectedProfileIds;
      const alreadySelected = current.includes(profileId);

      if (alreadySelected) {
        // Deselect is always allowed
        toggleProfileSelection(profileId);
        return;
      }

      // Prevent selecting more than MAX
      const nonCustomCount = current.filter((id) => id !== "custom").length;
      const willHaveCustom =
        profileId === "custom" || current.includes("custom");
      const newNonCustomCount =
        profileId === "custom" ? nonCustomCount : nonCustomCount + 1;

      const totalCount = newNonCustomCount + (willHaveCustom ? 1 : 0);

      if (totalCount > MAX_SELECTED_PROFILES) {
        return; // Block selection beyond max
      }

      toggleProfileSelection(profileId);
    },
    [toggleProfileSelection],
  );

  const handleCustomTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const rawValue = e.target.value;
      // Sanitize: no script or HTML execution risk in textarea value,
      // but we trim and guard against excessive length
      const sanitized = rawValue.slice(0, 2000); // Reasonable max
      setCustomDirectionInput("", sanitized);
    },
    [setCustomDirectionInput],
  );

  // ---------------------------------------------------------------------------
  // Render: single profile chip
  // ---------------------------------------------------------------------------

  const renderChip = (profile: DirectionProfile) => {
    const profileId = profile.profileId as DirectionProfileId;
    const isSelected = selectedProfileIds.includes(profileId);
    const icon =
      PROFILE_ICONS[profile.profileId] ||
      CATEGORY_ICONS[profile.category] ||
      "📄";

    return (
      <button
        key={profile.profileId}
        type="button"
        className={`variant-profile-chip${isSelected ? " variant-profile-chip--selected" : ""}`}
        onClick={() => {
          handleToggleProfile(profileId);
        }}
        title={profile.description}
        aria-pressed={isSelected}
        aria-label={`${profile.label}: ${profile.description}`}
        data-testid={`profile-chip-${profile.profileId}`}
      >
        <span className="variant-profile-chip-icon">{icon}</span>
        <span className="variant-profile-chip-label">{profile.label}</span>
      </button>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: custom chip
  // ---------------------------------------------------------------------------

  const renderCustomChip = () => {
    const isSelected = isCustomSelected;
    const hasText = customDirectionInput.trim().length > 0;

    return (
      <div
        className="variant-custom-section"
        data-testid="variant-custom-section"
      >
        <button
          type="button"
          className={`variant-profile-chip variant-profile-chip--custom${isSelected ? " variant-profile-chip--selected" : ""}`}
          onClick={() => {
            handleToggleProfile("custom");
          }}
          title="Eigene Richtung definieren"
          aria-pressed={isSelected}
          aria-label="Eigene Richtung: Benutzerdefinierte Richtung als Freitext"
          data-testid="profile-chip-custom"
        >
          <span className="variant-profile-chip-icon">✏️</span>
          <span className="variant-profile-chip-label">
            {hasText ? "Eigene Richtung ✓" : "Eigene Richtung"}
          </span>
        </button>

        {isSelected && (
          <textarea
            className="variant-custom-textarea"
            rows={3}
            placeholder="z.B. Erkläre es wie für einen 10-Jährigen"
            value={customDirectionInput}
            onChange={handleCustomTextChange}
            maxLength={2000}
            data-testid="variant-custom-textarea"
            aria-label="Benutzerdefinierte Richtung als Freitext"
          />
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: constraints banner
  // ---------------------------------------------------------------------------

  const renderConstraints = () => {
    if (constraints.length === 0) {
      return (
        <div
          className="variant-constraints-info"
          data-testid="variant-constraints-info"
        >
          ℹ️ Keine spezifischen Constraints im Prompt erkannt.
        </div>
      );
    }

    return (
      <div
        className="variant-constraints-banner"
        data-testid="variant-constraints-banner"
      >
        <strong>⚠️ Aktive Constraints:</strong>
        <ul className="variant-constraints-list">
          {constraints.map((c) => (
            <li key={c.id} className="variant-constraint-item">
              <span className="variant-constraint-category">
                [{c.category}]
              </span>{" "}
              {c.constraintText}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render: selection count warning
  // ---------------------------------------------------------------------------

  const renderSelectionWarning = () => {
    const nonCustomCount = selectedProfileIds.filter(
      (id) => id !== "custom",
    ).length;
    const totalCount =
      nonCustomCount +
      (isCustomSelected && customDirectionInput.trim().length > 0 ? 1 : 0);

    if (totalCount > MAX_SELECTED_PROFILES) {
      return (
        <div
          className="variant-selection-warning"
          data-testid="variant-selection-warning"
        >
          ⚠️ Maximal {MAX_SELECTED_PROFILES} Varianten pro Lauf. Es werden nur
          die ersten {MAX_SELECTED_PROFILES} ausgewählten Profile verwendet.
        </div>
      );
    }
    return null;
  };

  // ---------------------------------------------------------------------------
  // Render: custom profile constraint warning
  // ---------------------------------------------------------------------------

  const renderCustomWarning = () => {
    if (!isCustomSelected) return null;

    return (
      <div
        className="variant-custom-warning"
        data-testid="variant-custom-warning"
      >
        ⚠️ Für benutzerdefinierte Richtungen kann keine automatische
        Constraint-Prüfung durchgeführt werden. Bitte prüfen Sie das Ergebnis
        manuell auf Konflikte mit bestehenden Regeln.
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className="direction-profile-selector"
      data-testid="direction-profile-selector"
    >
      {/* Category sections */}
      {profilesByCategory.map(({ category, profiles }) => (
        <div
          key={category}
          className="variant-category-section"
          data-testid={`variant-category-${category}`}
        >
          <h3 className="variant-category-label">
            {CATEGORY_ICONS[category]}{" "}
            {category === "sachlich"
              ? "Sachlich / Neutral"
              : category === "verkaeuferisch"
                ? "Verkaufsorientiert"
                : category === "technisch"
                  ? "Technisch / Spezialisiert"
                  : "Kreativ"}
          </h3>
          <div className="variant-profile-grid">{profiles.map(renderChip)}</div>
        </div>
      ))}

      {/* Custom direction */}
      <div className="variant-category-section">
        <h3 className="variant-category-label">✏️ Benutzerdefiniert</h3>
        <div className="variant-profile-grid">{renderCustomChip()}</div>
      </div>

      {/* Selection warning (max 5) */}
      {renderSelectionWarning()}

      {/* Custom profile constraint warning */}
      {renderCustomWarning()}

      {/* Active constraints */}
      {renderConstraints()}
    </div>
  );
};
