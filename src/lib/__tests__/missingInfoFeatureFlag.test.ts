// =============================================================================
// PromptVault Lite — Missing-Info-Gate Feature Flag Tests
// =============================================================================
// Synthetic tests only. No real environment variables modified.
// =============================================================================

import { describe, it, expect } from "vitest";
import { isMissingInfoGateEnabled } from "../missingInfoFeatureFlag";

// =============================================================================
// Feature Flag: `isMissingInfoGateEnabled`
// =============================================================================

describe("isMissingInfoGateEnabled", () => {
  // --- Default (disabled) ---

  it("returns false when no env record is provided (default)", () => {
    expect(isMissingInfoGateEnabled()).toBe(false);
  });

  it("returns false when env is an empty object", () => {
    expect(isMissingInfoGateEnabled({})).toBe(false);
  });

  it("returns false when PROMPTVAULT_MISSING_INFO_GATE is not set", () => {
    expect(isMissingInfoGateEnabled({ OTHER_VAR: "yes" })).toBe(false);
  });

  it("returns false when PROMPTVAULT_MISSING_INFO_GATE is undefined", () => {
    expect(
      isMissingInfoGateEnabled({
        PROMPTVAULT_MISSING_INFO_GATE: undefined,
      }),
    ).toBe(false);
  });

  // --- Disabled by explicit value ---

  it('returns false for PROMPTVAULT_MISSING_INFO_GATE="0"', () => {
    expect(
      isMissingInfoGateEnabled({ PROMPTVAULT_MISSING_INFO_GATE: "0" }),
    ).toBe(false);
  });

  it('returns false for PROMPTVAULT_MISSING_INFO_GATE="false"', () => {
    expect(
      isMissingInfoGateEnabled({ PROMPTVAULT_MISSING_INFO_GATE: "false" }),
    ).toBe(false);
  });

  it('returns false for PROMPTVAULT_MISSING_INFO_GATE="FALSE" (case-sensitive)', () => {
    expect(
      isMissingInfoGateEnabled({ PROMPTVAULT_MISSING_INFO_GATE: "FALSE" }),
    ).toBe(false);
  });

  it('returns false for PROMPTVAULT_MISSING_INFO_GATE="" (empty string)', () => {
    expect(
      isMissingInfoGateEnabled({ PROMPTVAULT_MISSING_INFO_GATE: "" }),
    ).toBe(false);
  });

  it('returns false for PROMPTVAULT_MISSING_INFO_GATE="TRUE" (case-sensitive)', () => {
    expect(
      isMissingInfoGateEnabled({ PROMPTVAULT_MISSING_INFO_GATE: "TRUE" }),
    ).toBe(false);
  });

  it('returns false for PROMPTVAULT_MISSING_INFO_GATE="yes"', () => {
    expect(
      isMissingInfoGateEnabled({ PROMPTVAULT_MISSING_INFO_GATE: "yes" }),
    ).toBe(false);
  });

  it('returns false for PROMPTVAULT_MISSING_INFO_GATE=" 1 " (whitespace)', () => {
    expect(
      isMissingInfoGateEnabled({ PROMPTVAULT_MISSING_INFO_GATE: " 1 " }),
    ).toBe(false);
  });

  // --- Enabled ---

  it('returns true for PROMPTVAULT_MISSING_INFO_GATE="1"', () => {
    expect(
      isMissingInfoGateEnabled({ PROMPTVAULT_MISSING_INFO_GATE: "1" }),
    ).toBe(true);
  });

  it('returns true for PROMPTVAULT_MISSING_INFO_GATE="true"', () => {
    expect(
      isMissingInfoGateEnabled({ PROMPTVAULT_MISSING_INFO_GATE: "true" }),
    ).toBe(true);
  });

  // --- Side-effect freedom ---

  it("has no side effects — returns consistent results on repeated calls", () => {
    const env = { PROMPTVAULT_MISSING_INFO_GATE: "1" };
    expect(isMissingInfoGateEnabled(env)).toBe(true);
    expect(isMissingInfoGateEnabled(env)).toBe(true);
    expect(isMissingInfoGateEnabled(env)).toBe(true);
  });

  it("is a pure function — no global state dependency", () => {
    expect(
      isMissingInfoGateEnabled({ PROMPTVAULT_MISSING_INFO_GATE: "1" }),
    ).toBe(true);
    expect(
      isMissingInfoGateEnabled({ PROMPTVAULT_MISSING_INFO_GATE: "0" }),
    ).toBe(false);
    expect(
      isMissingInfoGateEnabled({ PROMPTVAULT_MISSING_INFO_GATE: "1" }),
    ).toBe(true);
  });
});
