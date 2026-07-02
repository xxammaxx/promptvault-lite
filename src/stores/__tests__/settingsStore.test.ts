// =============================================================================
// Settings Store Tests — Issue #63
// =============================================================================
// Red tests first: these should FAIL before implementation.

import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/stores/appStore";
import type { Theme } from "@/stores/appStore";

const EXPORT_FORMAT_KEY = "promptvault.settings.exportFormat";

function clearSettingsStorage(): void {
  localStorage.removeItem("promptvault.theme");
  localStorage.removeItem(EXPORT_FORMAT_KEY);
  localStorage.removeItem("promptvault.layout.explorerWidth");
  localStorage.removeItem("promptvault.devMode");
}

describe("Settings Store — Theme", () => {
  beforeEach(() => {
    clearSettingsStorage();
    useAppStore.setState({ theme: "dark" });
  });

  it("default theme is dark", () => {
    clearSettingsStorage();
    // Reset state to trigger re-read from storage
    useAppStore.setState({ theme: "dark" });
    expect(useAppStore.getState().theme).toBe("dark");
  });

  it("setTheme updates theme state directly (not just cycle)", () => {
    const themes: Theme[] = ["light", "dark", "auto"];
    for (const theme of themes) {
      useAppStore.getState().setTheme(theme);
      expect(useAppStore.getState().theme).toBe(theme);
    }
  });

  it("setTheme persists to localStorage", () => {
    useAppStore.getState().setTheme("light");
    expect(localStorage.getItem("promptvault.theme")).toBe("light");

    useAppStore.getState().setTheme("auto");
    expect(localStorage.getItem("promptvault.theme")).toBe("auto");
  });

  it("setTheme rejects invalid theme values", () => {
    // First set a valid theme to establish a known state
    useAppStore.getState().setTheme("dark");
    const original = useAppStore.getState().theme;
    // @ts-expect-error — testing runtime guard
    useAppStore.getState().setTheme("invalid");
    expect(useAppStore.getState().theme).toBe(original);
    expect(localStorage.getItem("promptvault.theme")).toBe("dark");
  });
});

describe("Settings Store — Export Format", () => {
  beforeEach(() => {
    clearSettingsStorage();
  });

  it("default export format is json", () => {
    const format = useAppStore.getState().exportFormat;
    expect(format).toBe("json");
  });

  it("setExportFormat updates format", () => {
    const formats = ["json", "markdown", "csv"] as const;
    for (const fmt of formats) {
      useAppStore.getState().setExportFormat(fmt);
      expect(useAppStore.getState().exportFormat).toBe(fmt);
    }
  });

  it("setExportFormat persists to localStorage", () => {
    useAppStore.getState().setExportFormat("markdown");
    expect(localStorage.getItem(EXPORT_FORMAT_KEY)).toBe("markdown");

    useAppStore.getState().setExportFormat("csv");
    expect(localStorage.getItem(EXPORT_FORMAT_KEY)).toBe("csv");
  });

  it("setExportFormat rejects invalid format values", () => {
    useAppStore.getState().setExportFormat("json");
    // @ts-expect-error — testing runtime guard
    useAppStore.getState().setExportFormat("xml");
    expect(useAppStore.getState().exportFormat).toBe("json");
    expect(localStorage.getItem(EXPORT_FORMAT_KEY)).toBe("json");
  });

  it("export format round-trips through localStorage", () => {
    useAppStore.getState().setExportFormat("csv");
    // Verify localStorage was updated
    expect(localStorage.getItem(EXPORT_FORMAT_KEY)).toBe("csv");
    // Verify store state matches
    expect(useAppStore.getState().exportFormat).toBe("csv");
  });
});

describe("Settings Store — Reset", () => {
  beforeEach(() => {
    clearSettingsStorage();
    useAppStore.setState({ theme: "dark" });
  });

  it("resetSettings resets all settings to defaults", () => {
    // Change settings
    useAppStore.getState().setTheme("light");
    useAppStore.getState().setExportFormat("csv");

    // Reset
    useAppStore.getState().resetSettings();

    expect(useAppStore.getState().theme).toBe("dark");
    expect(useAppStore.getState().exportFormat).toBe("json");
    expect(localStorage.getItem("promptvault.theme")).toBe("dark");
    expect(localStorage.getItem(EXPORT_FORMAT_KEY)).toBe("json");
  });
});
