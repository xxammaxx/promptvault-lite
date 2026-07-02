// =============================================================================
// SettingsModal Component Tests — Issue #63
// =============================================================================
// Red tests first: these should FAIL before implementation.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsPanel } from "../SettingsPanel";
import type { Theme } from "@/stores/appStore";

const mockSetTheme = vi.fn();
const mockToggleDevMode = vi.fn();
const mockSetExportFormat = vi.fn();
const mockResetSettings = vi.fn();
let mockTheme: Theme = "dark";
let mockDevMode = false;
let mockExportFormat = "json";
let mockExplorerWidth = 360;

vi.mock("@/stores/appStore", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => {
    const state = {
      theme: mockTheme,
      devMode: mockDevMode,
      exportFormat: mockExportFormat,
      explorerWidth: mockExplorerWidth,
      setTheme: mockSetTheme,
      setExportFormat: mockSetExportFormat,
      toggleDevMode: mockToggleDevMode,
      resetSettings: mockResetSettings,
    };
    return selector(state);
  },
}));

describe("SettingsModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme = "dark";
    mockDevMode = false;
    mockExportFormat = "json";
    mockExplorerWidth = 360;
  });

  // ---- Rendering ----

  it("renders the modal with title", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    expect(screen.getByText("Einstellungen")).toBeInTheDocument();
  });

  it("renders theme section", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    expect(screen.getByText(/Theme/i)).toBeInTheDocument();
  });

  it("renders export settings section", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    expect(
      screen.getByRole("heading", { name: /Export/i }),
    ).toBeInTheDocument();
  });

  it("renders keyboard shortcuts section", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    expect(screen.getByText(/Tastenkürzel/i)).toBeInTheDocument();
  });

  it("renders developer mode section", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    expect(screen.getByText(/Entwickler/i)).toBeInTheDocument();
  });

  // ---- Theme Selection ----

  it("calls setTheme when a theme radio is selected", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    const lightRadio = screen.getByLabelText(/Hell/i);
    fireEvent.click(lightRadio);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("dark theme radio is checked when theme is dark", () => {
    mockTheme = "dark";
    render(<SettingsPanel onClose={mockOnClose} />);
    const darkRadio = screen.getByLabelText(/Dunkel/i);
    expect(darkRadio).toBeChecked();
  });

  it("light theme radio is checked when theme is light", () => {
    mockTheme = "light";
    render(<SettingsPanel onClose={mockOnClose} />);
    const lightRadio = screen.getByLabelText(/Hell/i);
    expect(lightRadio).toBeChecked();
  });

  it("auto theme radio is checked when theme is auto", () => {
    mockTheme = "auto";
    render(<SettingsPanel onClose={mockOnClose} />);
    const autoRadio = screen.getByLabelText(/Auto/i);
    expect(autoRadio).toBeChecked();
  });

  // ---- Export Format ----

  it("calls setExportFormat when export format radio is selected", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    const markdownRadio = screen.getByLabelText(/Markdown/i);
    fireEvent.click(markdownRadio);
    expect(mockSetExportFormat).toHaveBeenCalledWith("markdown");
  });

  it("JSON radio is checked when exportFormat is json", () => {
    mockExportFormat = "json";
    render(<SettingsPanel onClose={mockOnClose} />);
    const jsonRadio = screen.getByLabelText(/JSON/i);
    expect(jsonRadio).toBeChecked();
  });

  it("CSV radio is checked when exportFormat is csv", () => {
    mockExportFormat = "csv";
    render(<SettingsPanel onClose={mockOnClose} />);
    const csvRadio = screen.getByLabelText(/CSV/i);
    expect(csvRadio).toBeChecked();
  });

  // ---- Close Behavior ----

  it("calls onClose when close button is clicked", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    // Two close buttons exist (header X and footer Schließen) — both call onClose
    const closeButtons = screen.getAllByLabelText("Einstellungen schließen");
    fireEvent.click(closeButtons[0]);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when overlay is clicked", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    const overlay = document.querySelector(".modal-overlay");
    if (!overlay) throw new Error("Overlay not found");
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when clicking inside the dialog", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    const dialog = document.querySelector(".modal-dialog");
    if (!dialog) throw new Error("Dialog not found");
    fireEvent.click(dialog);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  // ---- Keyboard Shortcuts (readonly) ----

  it("renders keyboard shortcuts as readonly text", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    // kbd elements break up text, so check for individual key labels
    const modKeys = screen.getAllByText(/Strg|Cmd/i);
    expect(modKeys.length).toBeGreaterThan(0);
    // Check for specific shortcut descriptions
    expect(screen.getByText(/Ordner öffnen/i)).toBeInTheDocument();
    expect(screen.getByText(/Exportieren/i)).toBeInTheDocument();
  });

  // ---- Language Placeholder ----

  it("renders language selector as disabled", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    const langSelect = screen.getByLabelText(/Sprache/i);
    expect(langSelect).toBeDisabled();
  });

  // ---- Accessibility ----

  it("modal has correct ARIA attributes", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Einstellungen");
  });

  // ---- Reset ----

  it("calls resetSettings when reset button is clicked", () => {
    render(<SettingsPanel onClose={mockOnClose} />);
    // Use role query to avoid matching "Filter zurücksetzen" in shortcuts section
    const resetButton = screen.getByRole("button", { name: /Zurücksetzen/i });
    fireEvent.click(resetButton);
    expect(mockResetSettings).toHaveBeenCalledTimes(1);
  });
});
