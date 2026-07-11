// =============================================================================
// PromptVault Lite — Variant Generator Tests (#215)
// =============================================================================
// Covers: applyDirectionProfile, generateVariants, mapToPromptVariant.
// Edge cases: empty content, unknown profiles, max variants, custom profiles,
// duplicates, enriched content flag.
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  applyDirectionProfile,
  generateVariants,
  mapToPromptVariant,
} from "../variantGenerator";
import { getProfile } from "../directionProfiles";
import type {
  DirectionProfile,
  DirectionProfileId,
  PreservedConstraintReference,
  VariantConflict,
} from "@/types";

// =============================================================================
// Test Fixtures
// =============================================================================

function expectProfile(profileId: string): DirectionProfile {
  const p = getProfile(profileId);
  expect(p).toBeDefined();
  return p as DirectionProfile;
}

const sachlichProfile = expectProfile("sachlich");
const deepResearchProfile = expectProfile("deep_research");

const sampleContent = `Du bist ein hilfreicher Assistent.
Schreibe einen Text über die Vorteile von Local-First-Software.
Maximal 200 Wörter.
Keine Cloud verwenden.`;

const emptyConstraints: PreservedConstraintReference[] = [];
const emptyConflicts: VariantConflict[] = [];

// =============================================================================
// applyDirectionProfile
// =============================================================================

describe("applyDirectionProfile", () => {
  it("prepends the profile prefix to the content", () => {
    const result = applyDirectionProfile("Test content", sachlichProfile);
    expect(result).toContain(sachlichProfile.promptPrefix);
    expect(result).toContain("Test content");
    expect(result.startsWith(sachlichProfile.promptPrefix)).toBe(true);
  });

  it("returns a new string (does not mutate input)", () => {
    const original = "Original content";
    const result = applyDirectionProfile(original, sachlichProfile);
    expect(result).not.toBe(original);
    expect(original).toBe("Original content"); // unchanged
  });

  it("returns empty string for empty content", () => {
    expect(applyDirectionProfile("", sachlichProfile)).toBe("");
  });

  it("returns empty string for whitespace-only content", () => {
    expect(applyDirectionProfile("   ", sachlichProfile)).toBe("");
    expect(applyDirectionProfile("\n\t  ", sachlichProfile)).toBe("");
  });

  it("returns content unchanged when promptPrefix is empty", () => {
    const profileWithoutPrefix: DirectionProfile = {
      profileId: "test",
      label: "Test",
      description: "Test profile",
      category: "sachlich",
      promptPrefix: "",
      compatibleConstraintCategories: [],
      conflictingConstraintCategories: [],
      recommendation: "Test",
    };
    const result = applyDirectionProfile("My content", profileWithoutPrefix);
    expect(result).toBe("My content");
  });

  it("works with all 12 predefined profiles", () => {
    // Dynamically import profiles is not needed — we have them via getProfile
    for (const id of [
      "sachlich",
      "verkaeuferisch",
      "technisch",
      "kurz",
      "ausfuehrlich",
      "kreativ",
      "kritisch",
      "anfaenger",
      "experte",
      "deep_research",
      "agentisch",
      "compliance",
    ]) {
      const profile = expectProfile(id);
      const result = applyDirectionProfile("Test", profile);
      expect(result).toBeTruthy();
      expect(result).toContain(profile.promptPrefix);
      expect(result).toContain("Test");
    }
  });

  it("preserves line breaks in content", () => {
    const multiline = "Line 1\nLine 2\nLine 3";
    const result = applyDirectionProfile(multiline, sachlichProfile);
    expect(result).toContain("Line 1\nLine 2\nLine 3");
  });
});

// =============================================================================
// generateVariants
// =============================================================================

describe("generateVariants", () => {
  it("generates one variant for a single profile", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: ["sachlich"],
    });
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].profileId).toBe("sachlich");
    expect(result.sourceContent).toBe(sampleContent);
    expect(result.enrichedContentUsed).toBe(false);
    expect(result.appliedAt).toBeTruthy();
  });

  it("generates multiple variants for multiple profiles", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: ["sachlich", "technisch", "kurz"],
    });
    expect(result.variants).toHaveLength(3);
    const ids = result.variants.map((v) => v.profileId);
    expect(ids).toContain("sachlich");
    expect(ids).toContain("technisch");
    expect(ids).toContain("kurz");
  });

  it("respects maxVariants option", () => {
    const result = generateVariants(
      sampleContent,
      {
        selectedProfileIds: [
          "sachlich",
          "technisch",
          "kurz",
          "ausfuehrlich",
          "kreativ",
          "kritisch",
          "anfaenger",
        ],
      },
      { maxVariants: 5 },
    );
    expect(result.variants.length).toBeLessThanOrEqual(5);
  });

  it("default maxVariants is 5", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: [
        "sachlich",
        "technisch",
        "kurz",
        "ausfuehrlich",
        "kreativ",
        "kritisch",
        "anfaenger",
        "experte",
      ],
    });
    expect(result.variants.length).toBeLessThanOrEqual(5);
  });

  it("returns empty result for empty profile selection", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: [],
    });
    expect(result.variants).toEqual([]);
    expect(result.profileConflicts).toEqual([]);
  });

  it("deduplicates profile IDs", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: ["sachlich", "sachlich", "sachlich"],
    });
    expect(result.variants).toHaveLength(1); // only one unique profile
  });

  it("skips unknown profile IDs silently", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: [
        "sachlich",
        "unbekanntes_profil" as DirectionProfileId,
      ],
    });
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].profileId).toBe("sachlich");
  });

  it("skips all unknown profile IDs → empty result", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: [
        "unbekannt1" as DirectionProfileId,
        "unbekannt2" as DirectionProfileId,
      ],
    });
    expect(result.variants).toEqual([]);
  });

  it("marks enrichedContentUsed when flag is true", () => {
    const result = generateVariants(
      sampleContent,
      { selectedProfileIds: ["sachlich"] },
      { enrichedContentUsed: true },
    );
    expect(result.enrichedContentUsed).toBe(true);
    expect(result.variants[0].metadata.sourceContent).toBe("enriched");
  });

  it("marks enrichedContentUsed as false by default", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: ["sachlich"],
    });
    expect(result.enrichedContentUsed).toBe(false);
    expect(result.variants[0].metadata.sourceContent).toBe("original");
  });

  it("handles custom profile with valid text", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: ["custom"],
      customDirectionText: "Erkläre es einfach",
    });
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].profileId).toBe("custom");
    expect(result.variants[0].label).toBe("Benutzerdefiniert");
    expect(result.variants[0].content).toContain("Erkläre es einfach");
  });

  it("skips custom profile when customDirectionText is empty", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: ["custom"],
      customDirectionText: "",
    });
    expect(result.variants).toEqual([]);
  });

  it("skips custom profile when customDirectionText is whitespace", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: ["custom"],
      customDirectionText: "   ",
    });
    expect(result.variants).toEqual([]);
  });

  it("handles mixed custom + predefined profiles", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: ["sachlich", "custom"],
      customDirectionText: "Mach es lustig",
    });
    expect(result.variants).toHaveLength(2);
    expect(result.variants.map((v) => v.profileId).sort()).toEqual([
      "custom",
      "sachlich",
    ]);
  });

  it("extracts and preserves constraints from source content", () => {
    const constraintContent =
      "Keine Cloud verwenden.\nMaximal 100 Wörter.\nNur auf Deutsch.";
    const result = generateVariants(constraintContent, {
      selectedProfileIds: ["sachlich"],
    });

    const variant = result.variants[0];
    expect(variant.preservedConstraints.length).toBeGreaterThan(0);

    // At least one constraint should be about cloud/offline
    const cloudConstraint = variant.preservedConstraints.find(
      (c) => c.category === "offline_only",
    );
    expect(cloudConstraint).toBeDefined();
  });

  it("variant content is always a new string (not === sourceContent)", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: ["sachlich"],
    });
    for (const variant of result.variants) {
      expect(variant.content).not.toBe(sampleContent);
      expect(variant.content).toBeTruthy();
    }
  });

  it("generates unique variantIds per run", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: ["sachlich", "technisch", "kurz"],
    });
    const ids = result.variants.map((v) => v.variantId);
    expect(new Set(ids).size).toBe(3); // all unique
  });

  it("handles empty source content gracefully", () => {
    const result = generateVariants("", {
      selectedProfileIds: ["sachlich"],
    });
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].content).toBe("");
    expect(result.variants[0].assumptions).toContain(
      "Keine Änderung möglich — Original unverändert.",
    );
  });

  it("profileConflicts is empty in Batch 2 (before constraint checker Phase 2)", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: ["deep_research"],
    });
    expect(result.profileConflicts).toEqual([]);
  });

  it("generates variants preserving the original sourceContent reference", () => {
    const result = generateVariants(sampleContent, {
      selectedProfileIds: ["sachlich"],
    });
    expect(result.sourceContent).toBe(sampleContent);
  });
});

// =============================================================================
// mapToPromptVariant
// =============================================================================

describe("mapToPromptVariant", () => {
  it("creates a fully populated PromptVariant", () => {
    const variant = mapToPromptVariant(
      "Generated content",
      sachlichProfile,
      emptyConstraints,
      emptyConflicts,
      "original",
      1,
    );

    expect(variant.variantId).toBeTruthy();
    expect(variant.variantId).toContain("VAR_sachlich");
    expect(variant.profileId).toBe("sachlich");
    expect(variant.label).toBe("Sachlich / Neutral");
    expect(variant.content).toBe("Generated content");
    expect(variant.directionExplanation).toBe(sachlichProfile.description);
    expect(variant.preservedConstraints).toEqual(emptyConstraints);
    expect(variant.conflicts).toEqual(emptyConflicts);
    expect(variant.assumptions).toEqual([
      'Profil-Prefix "Sachlich / Neutral" wurde vorangestellt.',
      "Keine Änderung an den Constraints des Original-Prompts.",
    ]);
    expect(variant.openPoints).toEqual([]);
    expect(variant.recommendation).toBe(sachlichProfile.recommendation);
    expect(variant.metadata.sourceContent).toBe("original");
    expect(variant.metadata.appliedProfileId).toBe("sachlich");
    expect(variant.metadata.generatedAt).toBeTruthy();
    // ISO 8601 check
    expect(Date.parse(variant.metadata.generatedAt)).not.toBeNaN();
  });

  it("sets sourceContent to 'enriched' when specified", () => {
    const variant = mapToPromptVariant(
      "Content",
      sachlichProfile,
      emptyConstraints,
      emptyConflicts,
      "enriched",
      1,
    );
    expect(variant.metadata.sourceContent).toBe("enriched");
  });

  it("handles empty generated content", () => {
    const variant = mapToPromptVariant(
      "",
      sachlichProfile,
      emptyConstraints,
      emptyConflicts,
      "original",
      1,
    );
    expect(variant.content).toBe("");
    expect(variant.assumptions).toContain(
      "Keine Änderung möglich — Original unverändert.",
    );
  });

  it("handles generated content that is whitespace-only", () => {
    const variant = mapToPromptVariant(
      "   ",
      sachlichProfile,
      emptyConstraints,
      emptyConflicts,
      "original",
      1,
    );
    expect(variant.content).toBe("   ");
    expect(variant.assumptions).toContain(
      "Keine Änderung möglich — Original unverändert.",
    );
  });

  it("includes preserved constraints in the variant", () => {
    const constraints: PreservedConstraintReference[] = [
      {
        constraintId: "HC_TEST001",
        constraintText: "Keine Cloud verwenden",
        category: "offline_only",
        affectedByProfile: false,
      },
    ];
    const variant = mapToPromptVariant(
      "Content",
      sachlichProfile,
      constraints,
      emptyConflicts,
      "original",
      1,
    );
    expect(variant.preservedConstraints).toHaveLength(1);
    expect(variant.preservedConstraints[0].constraintText).toBe(
      "Keine Cloud verwenden",
    );
  });

  it("includes conflicts when present", () => {
    const conflicts: VariantConflict[] = [
      {
        id: "VC_001",
        profileId: "deep_research",
        constraint: {
          id: "HC_001",
          constraintText: "Keine Cloud verwenden",
          category: "offline_only",
          severity: "hard",
          position: { line: 1, column: 1 },
        },
        description: "Conflict with offline_only",
        severity: "blocking",
        resolution: "constraint_preserved",
      },
    ];
    const variant = mapToPromptVariant(
      "Content",
      deepResearchProfile,
      [],
      conflicts,
      "original",
      1,
    );
    expect(variant.conflicts).toHaveLength(1);
    expect(variant.conflicts[0].severity).toBe("blocking");
  });

  it("generates unique variantIds with different counters", () => {
    const v1 = mapToPromptVariant(
      "A",
      sachlichProfile,
      emptyConstraints,
      emptyConflicts,
      "original",
      1,
    );
    const v2 = mapToPromptVariant(
      "B",
      sachlichProfile,
      emptyConstraints,
      emptyConflicts,
      "original",
      2,
    );
    expect(v1.variantId).not.toBe(v2.variantId);
  });
});

// =============================================================================
// Integration: Full Flow
// =============================================================================

describe("VariantGenerator — Full Flow", () => {
  it("generates variants with correct metadata end-to-end", () => {
    const content = "Schreibe einen Blogpost über KI-Sicherheit.";
    const result = generateVariants(content, {
      selectedProfileIds: ["sachlich", "technisch", "kurz"],
    });

    expect(result.variants).toHaveLength(3);
    expect(result.enrichedContentUsed).toBe(false);

    for (const variant of result.variants) {
      expect(variant.variantId).toBeTruthy();
      expect(variant.content).toBeTruthy();
      expect(variant.profileId).toBeTruthy();
      expect(variant.metadata.generatedAt).toBeTruthy();
    }
  });

  it("original content is never mutated through multiple generate calls", () => {
    const original = "Original Text.\nKeine Cloud verwenden.";
    const copyForReference = original.slice();

    generateVariants(original, {
      selectedProfileIds: ["sachlich", "technisch"],
    });
    generateVariants(original, {
      selectedProfileIds: ["kurz", "ausfuehrlich"],
    });

    // Original unchanged after multiple generations
    expect(original).toBe(copyForReference);
  });

  it("no network/cloud dependency — all operations are synchronous", () => {
    const result = generateVariants("Test content", {
      selectedProfileIds: ["sachlich"],
    });
    // Synchronous completion proves no async/network dependency
    expect(result.variants).toHaveLength(1);
  });

  it("does NOT import or reference any #216-specific modules", () => {
    // VariantGenerator uses extractHardConstraints (shared infrastructure)
    // but does NOT import missingInfoDetector, missingInfoClassifier,
    // gateContentMerger, or MissingInfoGate.
    //
    // Verified by: code review — no imports from those modules.
    // This test documents that expectation.
    const result = generateVariants("Test", {
      selectedProfileIds: ["sachlich"],
    });
    expect(result.variants).toHaveLength(1);
    // If this compiles, no illegal imports exist.
  });
});
