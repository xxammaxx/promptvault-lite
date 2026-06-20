import React from "react";
import type { ContentClass } from "@/types";

// ---------------------------------------------------------------------------
// ContentClass → Label + CSS-Modifier Mapping
// ---------------------------------------------------------------------------

const CONTENT_CLASS_CONFIG: Record<
  ContentClass,
  { label: string; cssModifier: string }
> = {
  PROMPT: { label: "Prompt", cssModifier: "badge-prompt" },
  BLUEPRINT: { label: "Blueprint", cssModifier: "badge-blueprint" },
  PROMPT_BLUEPRINT_HYBRID: {
    label: "Hybrid",
    cssModifier: "badge-hybrid",
  },
  NOTE: { label: "Notiz", cssModifier: "badge-note" },
  DOC: { label: "Dokumentation", cssModifier: "badge-doc" },
  CODE_FRAGMENT: { label: "Code", cssModifier: "badge-code" },
  UNKNOWN_NEEDS_REVIEW: {
    label: "Review",
    cssModifier: "badge-review",
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ContentClassBadgeProps {
  /** The classified content class. null/undefined → renders nothing. */
  contentClass: ContentClass | null | undefined;
  /** Optional size variant. Default: "md". */
  size?: "sm" | "md";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ContentClassBadge
 *
 * Renders a color-coded badge for content classification.
 * - Returns null when contentClass is null/undefined.
 * - Uses safe CSS classes — never renders original content or secrets.
 * - Accessible via aria-label.
 */
const ContentClassBadge: React.FC<ContentClassBadgeProps> = ({
  contentClass,
  size = "md",
}) => {
  if (contentClass == null) return null;

  const config = CONTENT_CLASS_CONFIG[contentClass];
  const sizeClass = size === "sm" ? "content-class-badge-sm" : "";

  return (
    <span
      className={`content-class-badge ${config.cssModifier} ${sizeClass}`}
      aria-label={`Inhaltstyp: ${config.label}`}
      role="status"
    >
      {config.label}
    </span>
  );
};

export default ContentClassBadge;
