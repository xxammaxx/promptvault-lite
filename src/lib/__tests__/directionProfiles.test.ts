// =============================================================================
// PromptVault Lite — Direction Profiles Tests (#215)
// =============================================================================
// Covers: profile lookup, defaults, categories, validation.
// 12 predefined profiles, no "custom" in the array.
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  DIRECTION_PROFILES,
  getProfile,
  getAllProfiles,
  getDefaultSelection,
  getProfilesByCategory,
  isCustomDirectionProfile,
  validateDirectionProfileSelection,
} from "../directionProfiles";
import type { ConstraintCategory, DirectionProfile } from "@/types";

// =============================================================================
// Profile Array
// =============================================================================

describe("DIRECTION_PROFILES", () => {
  it("contains exactly 12 predefined profiles (no custom)", () => {
    expect(DIRECTION_PROFILES).toHaveLength(12);
  });

  it("does NOT contain a profile with profileId 'custom'", () => {
    const customProfile = DIRECTION_PROFILES.find(
      (p) => p.profileId === "custom",
    );
    expect(customProfile).toBeUndefined();
  });

  it("every profile has a non-empty promptPrefix", () => {
    for (const profile of DIRECTION_PROFILES) {
      expect(profile.promptPrefix).toBeTruthy();
      expect(profile.promptPrefix.trim().length).toBeGreaterThan(0);
    }
  });

  it("every profile has all required fields", () => {
    for (const profile of DIRECTION_PROFILES) {
      expect(profile.profileId).toBeTruthy();
      expect(profile.label).toBeTruthy();
      expect(profile.description).toBeTruthy();
      expect(profile.category).toBeTruthy();
      expect(profile.promptPrefix).toBeTruthy();
      expect(Array.isArray(profile.compatibleConstraintCategories)).toBe(true);
      expect(Array.isArray(profile.conflictingConstraintCategories)).toBe(true);
      expect(profile.recommendation).toBeTruthy();
    }
  });

  it("all profile IDs are unique", () => {
    const ids = DIRECTION_PROFILES.map((p) => p.profileId);
    expect(new Set(ids).size).toBe(12);
  });

  it("includes all expected profile IDs", () => {
    const expectedIds = [
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
    ];
    const actualIds = DIRECTION_PROFILES.map((p) => p.profileId).sort();
    expect(actualIds.sort()).toEqual(expectedIds.sort());
  });

  // --- Constraint matrix (Spec Table 5.2) ---

  const ALL_CATEGORIES: ConstraintCategory[] = [
    "offline_only",
    "max_length",
    "no_examples",
    "language",
    "format_lock",
    "tool_restriction",
    "approval_required",
    "scope_boundary",
  ];

  function expectProfile(profileId: string): DirectionProfile {
    const p = getProfile(profileId);
    expect(p).toBeDefined();
    return p as DirectionProfile;
  }

  it("sachlich is universally compatible (no conflicting categories)", () => {
    const p = expectProfile("sachlich");
    expect(p.conflictingConstraintCategories).toEqual([]);
    expect(p.compatibleConstraintCategories.sort()).toEqual(
      ALL_CATEGORIES.sort(),
    );
  });

  it("verkaeuferisch conflicts with no_examples", () => {
    const p = expectProfile("verkaeuferisch");
    expect(p.conflictingConstraintCategories).toEqual(["no_examples"]);
    expect(p.compatibleConstraintCategories).not.toContain("no_examples");
  });

  it("technisch is universally compatible", () => {
    const p = expectProfile("technisch");
    expect(p.conflictingConstraintCategories).toEqual([]);
  });

  it("kurz conflicts with max_length", () => {
    const p = expectProfile("kurz");
    expect(p.conflictingConstraintCategories).toEqual(["max_length"]);
  });

  it("ausfuehrlich conflicts with max_length", () => {
    const p = expectProfile("ausfuehrlich");
    expect(p.conflictingConstraintCategories).toEqual(["max_length"]);
    expect(p.compatibleConstraintCategories).not.toContain("max_length");
  });

  it("kreativ conflicts with no_examples and format_lock", () => {
    const p = expectProfile("kreativ");
    expect(p.conflictingConstraintCategories.sort()).toEqual(
      ["no_examples", "format_lock"].sort(),
    );
  });

  it("kritisch is universally compatible", () => {
    const p = expectProfile("kritisch");
    expect(p.conflictingConstraintCategories).toEqual([]);
  });

  it("anfaenger is universally compatible", () => {
    const p = expectProfile("anfaenger");
    expect(p.conflictingConstraintCategories).toEqual([]);
  });

  it("experte is universally compatible", () => {
    const p = expectProfile("experte");
    expect(p.conflictingConstraintCategories).toEqual([]);
  });

  it("deep_research conflicts with offline_only", () => {
    const p = expectProfile("deep_research");
    expect(p.conflictingConstraintCategories).toEqual(["offline_only"]);
    expect(p.compatibleConstraintCategories).not.toContain("offline_only");
  });

  it("agentisch conflicts with approval_required and scope_boundary", () => {
    const p = expectProfile("agentisch");
    expect(p.conflictingConstraintCategories.sort()).toEqual(
      ["approval_required", "scope_boundary"].sort(),
    );
    expect(p.compatibleConstraintCategories).not.toContain("approval_required");
    expect(p.compatibleConstraintCategories).not.toContain("scope_boundary");
  });

  it("compliance is universally compatible", () => {
    const p = expectProfile("compliance");
    expect(p.conflictingConstraintCategories).toEqual([]);
  });
});

// =============================================================================
// getProfile
// =============================================================================

describe("getProfile", () => {
  it("returns the correct profile for 'sachlich'", () => {
    const p = getProfile("sachlich");
    expect(p).toBeDefined();
    expect(p?.profileId).toBe("sachlich");
    expect(p?.label).toBe("Sachlich / Neutral");
  });

  it("returns the correct profile for 'technisch'", () => {
    const p = getProfile("technisch");
    expect(p).toBeDefined();
    expect(p?.profileId).toBe("technisch");
    expect(p?.category).toBe("technisch");
  });

  it("returns undefined for unknown profile ID", () => {
    expect(getProfile("unbekannt")).toBeUndefined();
  });

  it("returns undefined for 'custom' (not in predefined array)", () => {
    expect(getProfile("custom")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(getProfile("")).toBeUndefined();
  });
});

// =============================================================================
// getAllProfiles
// =============================================================================

describe("getAllProfiles", () => {
  it("returns 12 profiles", () => {
    expect(getAllProfiles()).toHaveLength(12);
  });

  it("returns a new array (not the same reference)", () => {
    const a = getAllProfiles();
    const b = getAllProfiles();
    expect(a).not.toBe(b); // different array instances
    expect(a).toEqual(b); // same content
  });

  it("does not include 'custom'", () => {
    const all = getAllProfiles();
    expect(all.find((p) => p.profileId === "custom")).toBeUndefined();
  });
});

// =============================================================================
// getDefaultSelection
// =============================================================================

describe("getDefaultSelection", () => {
  it("returns exactly 5 IDs", () => {
    expect(getDefaultSelection()).toHaveLength(5);
  });

  it("returns the owner-defined defaults", () => {
    expect(getDefaultSelection()).toEqual([
      "sachlich",
      "technisch",
      "kurz",
      "ausfuehrlich",
      "agentisch",
    ]);
  });

  it("all default IDs resolve via getProfile", () => {
    for (const id of getDefaultSelection()) {
      expect(getProfile(id)).toBeDefined();
    }
  });

  it("returns a new array on each call (no mutation risk)", () => {
    const a = getDefaultSelection();
    a.push("kreativ" as never);
    expect(getDefaultSelection()).toHaveLength(5);
  });
});

// =============================================================================
// getProfilesByCategory
// =============================================================================

describe("getProfilesByCategory", () => {
  it("returns all 4 technisch profiles", () => {
    const tech = getProfilesByCategory("technisch");
    expect(tech).toHaveLength(4);
    for (const p of tech) {
      expect(p.category).toBe("technisch");
    }
    const ids = tech.map((p) => p.profileId).sort();
    expect(ids).toEqual(
      ["technisch", "experte", "deep_research", "agentisch"].sort(),
    );
  });

  it("returns all 6 sachlich profiles", () => {
    const sach = getProfilesByCategory("sachlich");
    expect(sach).toHaveLength(6);
    for (const p of sach) {
      expect(p.category).toBe("sachlich");
    }
    const ids = sach.map((p) => p.profileId).sort();
    expect(ids).toEqual(
      [
        "sachlich",
        "kurz",
        "ausfuehrlich",
        "kritisch",
        "anfaenger",
        "compliance",
      ].sort(),
    );
  });

  it("returns exactly the 1 verkaeuferisch profile", () => {
    const verk = getProfilesByCategory("verkaeuferisch");
    expect(verk).toHaveLength(1);
    expect(verk[0].profileId).toBe("verkaeuferisch");
  });

  it("returns exactly the kreativ profile", () => {
    const kreativ = getProfilesByCategory("kreativ");
    expect(kreativ).toHaveLength(1);
    expect(kreativ[0].profileId).toBe("kreativ");
  });

  it("returns empty array for unknown category", () => {
    // At runtime, filter returns [] for categories with no matches.
    // The type system restricts the argument, but we test the runtime
    // behavior via the broader filter signature.
    const result = getProfilesByCategory(
      "unknown" as Parameters<typeof getProfilesByCategory>[0],
    );
    expect(result).toEqual([]);
  });
});

// =============================================================================
// isCustomDirectionProfile
// =============================================================================

describe("isCustomDirectionProfile", () => {
  it("returns true for 'custom'", () => {
    expect(isCustomDirectionProfile("custom")).toBe(true);
  });

  it("returns false for predefined profile IDs", () => {
    expect(isCustomDirectionProfile("sachlich")).toBe(false);
    expect(isCustomDirectionProfile("technisch")).toBe(false);
    expect(isCustomDirectionProfile("compliance")).toBe(false);
  });

  it("returns false for unknown IDs", () => {
    expect(isCustomDirectionProfile("unbekannt")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isCustomDirectionProfile("")).toBe(false);
  });
});

// =============================================================================
// validateDirectionProfileSelection
// =============================================================================

describe("validateDirectionProfileSelection", () => {
  it("accepts a valid single predefined profile", () => {
    const result = validateDirectionProfileSelection({
      selectedProfileIds: ["sachlich"],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("accepts multiple valid profiles", () => {
    const result = validateDirectionProfileSelection({
      selectedProfileIds: ["sachlich", "technisch", "kurz"],
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("rejects empty selection with no custom text", () => {
    const result = validateDirectionProfileSelection({
      selectedProfileIds: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Mindestens ein Profil");
  });

  it("accepts custom profile with non-empty text (even empty profile list)", () => {
    const result = validateDirectionProfileSelection({
      selectedProfileIds: ["custom"],
      customDirectionText: "Erkläre es wie für einen 10-Jährigen",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects custom profile with empty text and no other profiles", () => {
    const result = validateDirectionProfileSelection({
      selectedProfileIds: ["custom"],
      customDirectionText: "",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects custom profile with whitespace-only text", () => {
    const result = validateDirectionProfileSelection({
      selectedProfileIds: ["custom"],
      customDirectionText: "   ",
    });
    expect(result.valid).toBe(false);
  });

  it("warns about unknown profile IDs", () => {
    const result = validateDirectionProfileSelection({
      selectedProfileIds: ["sachlich", "unbekanntes_profil"],
    });
    expect(result.valid).toBe(true); // still valid because sachlich is known
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("unbekanntes_profil");
  });

  it("deduplicates profile IDs without error", () => {
    const result = validateDirectionProfileSelection({
      selectedProfileIds: ["sachlich", "sachlich", "sachlich"],
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([]);
  });
});
