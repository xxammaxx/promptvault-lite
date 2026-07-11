// =============================================================================
// PromptVault Lite — Direction Profiles Definitions (#215)
// =============================================================================
// Pure data module: 12 predefined Direction Profiles, no runtime logic.
// Each profile defines target direction, tone, depth, audience, and
// constraint compatibility for the template-based variant generator.
//
// The "custom" profile is NOT included here — it is handled as a separate
// code path in variantGenerator.ts (free-text direction from the user).
// =============================================================================

import type {
  DirectionProfile,
  DirectionProfileId,
  ConstraintCategory,
} from "@/types";

// =============================================================================
// All Constraint Categories (for compatibility lists)
// =============================================================================

const ALL_CONSTRAINT_CATEGORIES: ConstraintCategory[] = [
  "offline_only",
  "max_length",
  "no_examples",
  "language",
  "format_lock",
  "tool_restriction",
  "approval_required",
  "scope_boundary",
];

// =============================================================================
// Direction Profiles
// =============================================================================

export const DIRECTION_PROFILES: DirectionProfile[] = [
  // ---------------------------------------------------------------------------
  // 1 — Sachlich / Neutral
  // ---------------------------------------------------------------------------
  {
    profileId: "sachlich",
    label: "Sachlich / Neutral",
    category: "sachlich",
    description:
      "Neutrale, objektive Formulierung. Geeignet für Dokumentation, Berichte, Zusammenfassungen.",
    promptPrefix:
      "Du bist ein Assistent für sachliche, neutrale Darstellungen. Formuliere den folgenden Prompt so um, dass das Ergebnis neutral, objektiv und faktenbasiert ist.",
    compatibleConstraintCategories: [...ALL_CONSTRAINT_CATEGORIES],
    conflictingConstraintCategories: [],
    recommendation:
      "Empfohlen für Dokumentation, Berichte, neutrale Zusammenfassungen und Analyse-Ergebnisse.",
  },

  // ---------------------------------------------------------------------------
  // 2 — Verkaufsstark / Überzeugend
  // ---------------------------------------------------------------------------
  {
    profileId: "verkaeuferisch",
    label: "Verkaufsstark / Überzeugend",
    category: "verkaeuferisch",
    description:
      "Überzeugende, handlungsorientierte Sprache. Geeignet für Produkttexte, Pitches, Marketing.",
    promptPrefix:
      "Du bist ein Experte für überzeugende Kommunikation. Formuliere den folgenden Prompt so um, dass das Ergebnis verkaufsstark, handlungsorientiert und überzeugend wirkt.",
    compatibleConstraintCategories: ALL_CONSTRAINT_CATEGORIES.filter(
      (c) => c !== "no_examples",
    ),
    conflictingConstraintCategories: ["no_examples"],
    recommendation:
      "Empfohlen für Produkttexte, Sales-Pitches, Marketing-Material und Call-to-Action-Inhalte.",
  },

  // ---------------------------------------------------------------------------
  // 3 — Technisch / Präzise
  // ---------------------------------------------------------------------------
  {
    profileId: "technisch",
    label: "Technisch / Präzise",
    category: "technisch",
    description:
      "Technisch präzise Sprache mit Fachbegriffen. Geeignet für Entwickler-Dokumentation, API-Referenzen, Code-Reviews.",
    promptPrefix:
      "Du bist ein technischer Experte. Formuliere den folgenden Prompt so um, dass das Ergebnis technisch präzise ist, Fachbegriffe korrekt verwendet und für ein Entwickler-Publikum geeignet ist.",
    compatibleConstraintCategories: [...ALL_CONSTRAINT_CATEGORIES],
    conflictingConstraintCategories: [],
    recommendation:
      "Empfohlen für Entwickler-Dokumentation, API-Referenzen, Code-Reviews und technische Spezifikationen.",
  },

  // ---------------------------------------------------------------------------
  // 4 — Kurz / Prägnant
  // ---------------------------------------------------------------------------
  {
    profileId: "kurz",
    label: "Kurz / Prägnant",
    category: "sachlich",
    description:
      "Maximal komprimiert. Geeignet für Social Media, Kurznachrichten, Status-Updates.",
    promptPrefix:
      "Formuliere den folgenden Prompt so um, dass das Ergebnis maximal komprimiert und auf das Wesentliche reduziert ist. Keine Ausschweifungen, keine Füllwörter.",
    compatibleConstraintCategories: [...ALL_CONSTRAINT_CATEGORIES],
    conflictingConstraintCategories: ["max_length"],
    recommendation:
      "Empfohlen für Social-Media-Posts, Kurznachrichten, Status-Updates und prägnante Zusammenfassungen.",
  },

  // ---------------------------------------------------------------------------
  // 5 — Ausführlich / Detailliert
  // ---------------------------------------------------------------------------
  {
    profileId: "ausfuehrlich",
    label: "Ausführlich / Detailliert",
    category: "sachlich",
    description:
      "Umfassende Darstellung mit Kontext und Begründungen. Geeignet für Analysen, Research, Dokumentation.",
    promptPrefix:
      "Formuliere den folgenden Prompt so um, dass das Ergebnis umfassend, detailliert und mit vollständigem Kontext dargestellt wird.",
    compatibleConstraintCategories: ALL_CONSTRAINT_CATEGORIES.filter(
      (c) => c !== "max_length",
    ),
    conflictingConstraintCategories: ["max_length"],
    recommendation:
      "Empfohlen für Deep Dives, Analysen, Research-Papers und umfassende Dokumentation.",
  },

  // ---------------------------------------------------------------------------
  // 6 — Kreativ / Inspirierend
  // ---------------------------------------------------------------------------
  {
    profileId: "kreativ",
    label: "Kreativ / Inspirierend",
    category: "kreativ",
    description:
      "Kreative, assoziative Sprache. Geeignet für Brainstorming, Storytelling, Ideenfindung.",
    promptPrefix:
      "Du bist ein kreativer Ideengeber. Formuliere den folgenden Prompt so um, dass das Ergebnis kreativ, inspirierend und assoziativ ist.",
    compatibleConstraintCategories: ALL_CONSTRAINT_CATEGORIES.filter(
      (c) => c !== "no_examples" && c !== "format_lock",
    ),
    conflictingConstraintCategories: ["no_examples", "format_lock"],
    recommendation:
      "Empfohlen für Brainstorming, Storytelling, Marketing-Kreation und Ideenfindung.",
  },

  // ---------------------------------------------------------------------------
  // 7 — Kritisch prüfend
  // ---------------------------------------------------------------------------
  {
    profileId: "kritisch",
    label: "Kritisch prüfend",
    category: "sachlich",
    description:
      "Hinterfragende, risiko-bewusste Perspektive. Geeignet für Reviews, Audits, Risikoanalysen.",
    promptPrefix:
      "Du bist ein kritischer Prüfer. Formuliere den folgenden Prompt so um, dass das Ergebnis Risiken, Schwachstellen und Alternativen aktiv hinterfragt.",
    compatibleConstraintCategories: [...ALL_CONSTRAINT_CATEGORIES],
    conflictingConstraintCategories: [],
    recommendation:
      "Empfohlen für Reviews, Audits, Risikoanalysen und Qualitätssicherung.",
  },

  // ---------------------------------------------------------------------------
  // 8 — Anfängerfreundlich
  // ---------------------------------------------------------------------------
  {
    profileId: "anfaenger",
    label: "Anfängerfreundlich",
    category: "sachlich",
    description:
      "Einfache Sprache, erklärt Begriffe. Geeignet für Einsteiger, Tutorials, Onboarding.",
    promptPrefix:
      "Du erklärst komplexe Themen für Einsteiger. Formuliere den folgenden Prompt so um, dass das Ergebnis in einfacher Sprache gehalten ist und Fachbegriffe erklärt werden.",
    compatibleConstraintCategories: [...ALL_CONSTRAINT_CATEGORIES],
    conflictingConstraintCategories: [],
    recommendation:
      "Empfohlen für Einsteiger-Tutorials, Onboarding-Material und allgemeinverständliche Erklärungen.",
  },

  // ---------------------------------------------------------------------------
  // 9 — Expertenmodus
  // ---------------------------------------------------------------------------
  {
    profileId: "experte",
    label: "Expertenmodus",
    category: "technisch",
    description:
      "Setzt Fachwissen voraus, keine Erklärungen von Grundbegriffen. Geeignet für Fachpublikum.",
    promptPrefix:
      "Du kommunizierst mit Fachexperten. Formuliere den folgenden Prompt so um, dass das Ergebnis Fachwissen voraussetzt und keine Grundbegriffe erklärt.",
    compatibleConstraintCategories: [...ALL_CONSTRAINT_CATEGORIES],
    conflictingConstraintCategories: [],
    recommendation:
      "Empfohlen für Fachpublikum, wissenschaftliche Kommunikation und Experten-Diskurse.",
  },

  // ---------------------------------------------------------------------------
  // 10 — Deep-Research-orientiert
  // ---------------------------------------------------------------------------
  {
    profileId: "deep_research",
    label: "Deep-Research-orientiert",
    category: "technisch",
    description:
      "Tiefgehende Analyse mit Quellenangaben, Methodik und Unsicherheiten. Geeignet für wissenschaftliche Research-Prompts.",
    promptPrefix:
      "Du führst tiefgehende Recherchen durch. Formuliere den folgenden Prompt so um, dass das Ergebnis Quellen referenziert, Methodik beschreibt und Unsicherheiten transparent macht.",
    compatibleConstraintCategories: ALL_CONSTRAINT_CATEGORIES.filter(
      (c) => c !== "offline_only",
    ),
    conflictingConstraintCategories: ["offline_only"],
    recommendation:
      "Empfohlen für wissenschaftliche Recherchen, Methodik-Beschreibungen und evidenzbasierte Analysen.",
  },

  // ---------------------------------------------------------------------------
  // 11 — Agenten-/Implementierungsmodus
  // ---------------------------------------------------------------------------
  {
    profileId: "agentisch",
    label: "Agenten-/Implementierungsmodus",
    category: "technisch",
    description:
      "Ausführbare Anweisungen für autonome Agenten. Geeignet für CI/CD, Automatisierung, Agent-Workflows.",
    promptPrefix:
      "Du erstellst ausführbare Anweisungen für autonome Agenten. Formuliere den folgenden Prompt so um, dass das Ergebnis klare, schrittweise und überprüfbare Anweisungen enthält.",
    compatibleConstraintCategories: ALL_CONSTRAINT_CATEGORIES.filter(
      (c) => c !== "approval_required" && c !== "scope_boundary",
    ),
    conflictingConstraintCategories: ["approval_required", "scope_boundary"],
    recommendation:
      "Empfohlen für CI/CD-Pipelines, Automatisierungs-Workflows und autonome Agenten-Instruktionen.",
  },

  // ---------------------------------------------------------------------------
  // 12 — Compliance-/Sicherheitsmodus
  // ---------------------------------------------------------------------------
  {
    profileId: "compliance",
    label: "Compliance-/Sicherheitsmodus",
    category: "sachlich",
    description:
      "Regulatorisch korrekt, sicherheitsbewusst. Geeignet für DSGVO, Audit, Security-Reviews.",
    promptPrefix:
      "Du prüfst auf regulatorische Korrektheit. Formuliere den folgenden Prompt so um, dass das Ergebnis DSGVO-konform, sicherheitsbewusst und auditierbar ist.",
    compatibleConstraintCategories: [...ALL_CONSTRAINT_CATEGORIES],
    conflictingConstraintCategories: [],
    recommendation:
      "Empfohlen für DSGVO-Compliance, Sicherheits-Audits, regulatorische Dokumentation und Risikobewertungen.",
  },
];

// =============================================================================
// Public API
// =============================================================================

/**
 * Get a single direction profile by its ID.
 *
 * @param id  Profile ID (e.g. "sachlich", "technisch").
 * @returns The matching DirectionProfile, or `undefined` if not found.
 */
export function getProfile(id: string): DirectionProfile | undefined {
  return DIRECTION_PROFILES.find((p) => p.profileId === id);
}

/**
 * Get all predefined direction profiles (12 total — "custom" is excluded
 * because it is handled as a separate free-text code path).
 *
 * @returns Array of all predefined DirectionProfiles.
 */
export function getAllProfiles(): DirectionProfile[] {
  return [...DIRECTION_PROFILES];
}

/**
 * Get the default selection: the 5 profiles that are pre-selected
 * when the VariantPanel opens.
 *
 * Owner decision (Q3): sachlich, technisch, kurz, ausführlich, agentisch.
 *
 * @returns Array of 5 default DirectionProfileId values.
 */
export function getDefaultSelection(): DirectionProfileId[] {
  return ["sachlich", "technisch", "kurz", "ausfuehrlich", "agentisch"];
}

/**
 * Get all profiles belonging to a specific category.
 *
 * @param category  Profile category (e.g. "technisch", "sachlich", "kreativ").
 * @returns Array of matching DirectionProfiles. Empty if none match.
 */
export function getProfilesByCategory(
  category: DirectionProfile["category"],
): DirectionProfile[] {
  return DIRECTION_PROFILES.filter((p) => p.category === category);
}

/**
 * Check whether a given profile ID refers to the built-in "custom"
 * free-text direction (not in the predefined array).
 *
 * @param id  Profile ID to check.
 * @returns `true` if the ID is "custom".
 */
export function isCustomDirectionProfile(id: string): boolean {
  return id === "custom";
}

/**
 * Validate a DirectionProfileSelection for basic sanity.
 * — At least one profile must be selected (custom text counts if non-empty).
 * — Unknown profile IDs are reported as warnings.
 *
 * @param selection  The user's profile selection.
 * @returns `{ valid: boolean, errors: string[], warnings: string[] }`.
 */
export function validateDirectionProfileSelection(selection: {
  selectedProfileIds: string[];
  customDirectionText?: string;
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // De-duplicate
  const unique = [...new Set(selection.selectedProfileIds)];

  // Count non-custom profiles and check custom with text
  const predefinedCount = unique.filter((id) => id !== "custom").length;
  const customWithText =
    unique.includes("custom") &&
    selection.customDirectionText !== undefined &&
    selection.customDirectionText.trim().length > 0;

  if (predefinedCount === 0 && !customWithText) {
    errors.push(
      "Mindestens ein Profil muss ausgewählt werden oder ein benutzerdefinierter Text angegeben werden.",
    );
  }

  // Check for unknown profile IDs (not predefined, not "custom")
  const predefinedIds = new Set(DIRECTION_PROFILES.map((p) => p.profileId));
  for (const id of unique) {
    if (id !== "custom" && !predefinedIds.has(id)) {
      warnings.push(`Unbekannte Profil-ID: "${id}" — wird ignoriert.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
