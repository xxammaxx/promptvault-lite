// =============================================================================
// PromptVault Lite — Direction Profiles Feature Flag Tests
// =============================================================================
// Synthetic tests only. No real environment variables modified.
// Pattern: identical to missingInfoFeatureFlag.test.ts (12 cases).
// =============================================================================

import { describe, it, expect } from "vitest";
import { isDirectionProfilesEnabled } from "../directionFeatureFlag";

// =============================================================================
// Feature Flag: `isDirectionProfilesEnabled`
// =============================================================================

describe("isDirectionProfilesEnabled", () => {
  // --- Default (disabled) ---

  it("returns false when no env record is provided (default)", () => {
    expect(isDirectionProfilesEnabled()).toBe(false);
  });

  it("returns false when env is an empty object", () => {
    expect(isDirectionProfilesEnabled({})).toBe(false);
  });

  it("returns false when PROMPTVAULT_DIRECTION_PROFILES is not set", () => {
    expect(isDirectionProfilesEnabled({ OTHER_VAR: "yes" })).toBe(false);
  });

  it("returns false when PROMPTVAULT_DIRECTION_PROFILES is undefined", () => {
    expect(
      isDirectionProfilesEnabled({
        PROMPTVAULT_DIRECTION_PROFILES: undefined,
      }),
    ).toBe(false);
  });

  // --- Disabled by explicit value ---

  it('returns false for PROMPTVAULT_DIRECTION_PROFILES="0"', () => {
    expect(
      isDirectionProfilesEnabled({ PROMPTVAULT_DIRECTION_PROFILES: "0" }),
    ).toBe(false);
  });

  it('returns false for PROMPTVAULT_DIRECTION_PROFILES="false"', () => {
    expect(
      isDirectionProfilesEnabled({ PROMPTVAULT_DIRECTION_PROFILES: "false" }),
    ).toBe(false);
  });

  it('returns false for PROMPTVAULT_DIRECTION_PROFILES="FALSE" (case-sensitive)', () => {
    expect(
      isDirectionProfilesEnabled({ PROMPTVAULT_DIRECTION_PROFILES: "FALSE" }),
    ).toBe(false);
  });

  it('returns false for PROMPTVAULT_DIRECTION_PROFILES="" (empty string)', () => {
    expect(
      isDirectionProfilesEnabled({ PROMPTVAULT_DIRECTION_PROFILES: "" }),
    ).toBe(false);
  });

  it('returns false for PROMPTVAULT_DIRECTION_PROFILES="TRUE" (case-sensitive)', () => {
    expect(
      isDirectionProfilesEnabled({ PROMPTVAULT_DIRECTION_PROFILES: "TRUE" }),
    ).toBe(false);
  });

  it('returns false for PROMPTVAULT_DIRECTION_PROFILES="yes"', () => {
    expect(
      isDirectionProfilesEnabled({ PROMPTVAULT_DIRECTION_PROFILES: "yes" }),
    ).toBe(false);
  });

  it('returns false for PROMPTVAULT_DIRECTION_PROFILES=" 1 " (whitespace)', () => {
    expect(
      isDirectionProfilesEnabled({ PROMPTVAULT_DIRECTION_PROFILES: " 1 " }),
    ).toBe(false);
  });

  // --- Enabled ---

  it('returns true for PROMPTVAULT_DIRECTION_PROFILES="1"', () => {
    expect(
      isDirectionProfilesEnabled({ PROMPTVAULT_DIRECTION_PROFILES: "1" }),
    ).toBe(true);
  });

  it('returns true for PROMPTVAULT_DIRECTION_PROFILES="true"', () => {
    expect(
      isDirectionProfilesEnabled({ PROMPTVAULT_DIRECTION_PROFILES: "true" }),
    ).toBe(true);
  });

  // --- Side-effect freedom ---

  it("has no side effects — returns consistent results on repeated calls", () => {
    const env = { PROMPTVAULT_DIRECTION_PROFILES: "1" };
    expect(isDirectionProfilesEnabled(env)).toBe(true);
    expect(isDirectionProfilesEnabled(env)).toBe(true);
    expect(isDirectionProfilesEnabled(env)).toBe(true);
  });

  it("is a pure function — no global state dependency", () => {
    expect(
      isDirectionProfilesEnabled({ PROMPTVAULT_DIRECTION_PROFILES: "1" }),
    ).toBe(true);
    expect(
      isDirectionProfilesEnabled({ PROMPTVAULT_DIRECTION_PROFILES: "0" }),
    ).toBe(false);
    expect(
      isDirectionProfilesEnabled({ PROMPTVAULT_DIRECTION_PROFILES: "1" }),
    ).toBe(true);
  });

  // --- Independence from other feature flags ---

  it("is independent — PROMPTVAULT_MISSING_INFO_GATE does NOT enable this flag", () => {
    expect(
      isDirectionProfilesEnabled({ PROMPTVAULT_MISSING_INFO_GATE: "1" }),
    ).toBe(false);
  });

  it("is independent — returns false when only other env vars are set", () => {
    expect(
      isDirectionProfilesEnabled({
        PROMPTVAULT_MISSING_INFO_GATE: "true",
        NODE_ENV: "development",
      }),
    ).toBe(false);
  });
});
