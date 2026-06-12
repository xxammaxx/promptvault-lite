import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "../ThemeToggle";
import type { Theme } from "@/stores/appStore";

// Mock the entire appStore
const mockToggleTheme = vi.fn();
let mockTheme: Theme = "auto";

const { THEME_CYCLE } = vi.hoisted(() => ({
  THEME_CYCLE: {
    light: "dark",
    dark: "auto",
    auto: "light",
  } as Record<Theme, Theme>,
}));

vi.mock("@/stores/appStore", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => {
    const state = {
      theme: mockTheme,
      toggleTheme: mockToggleTheme,
    };
    return selector(state);
  },
  resolveTheme: vi.fn((t: Theme) => (t === "dark" ? "dark" : "light")),
  THEME_CYCLE,
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme = "auto";
    mockToggleTheme.mockImplementation(() => {
      // Simulate the toggle cycle
      mockTheme =
        mockTheme === "light"
          ? "dark"
          : mockTheme === "dark"
            ? "auto"
            : "light";
    });
  });

  // --- Rendering ---

  it("renders a button element", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("shows sun icon for light theme", () => {
    mockTheme = "light";
    render(<ThemeToggle />);
    expect(screen.getByText("☀️")).toBeInTheDocument();
  });

  it("shows moon icon for dark theme", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByText("🌙")).toBeInTheDocument();
  });

  it("shows monitor icon for auto theme", () => {
    mockTheme = "auto";
    render(<ThemeToggle />);
    expect(screen.getByText("🖥️")).toBeInTheDocument();
  });

  // --- ARIA ---

  it("has accessible aria-label", () => {
    mockTheme = "light";
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Theme wechseln"),
    );
  });

  it("aria-label reflects current theme", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Dunkel"),
    );
  });

  it("does not use aria-pressed (tri-state toggle)", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).not.toHaveAttribute("aria-pressed");
  });

  it("title conveys current and next theme", () => {
    mockTheme = "auto";
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "title",
      expect.stringContaining("Thema: Auto"),
    );
    expect(button).toHaveAttribute(
      "title",
      expect.stringContaining("Klicken für Hell"),
    );
  });

  // --- Interaction ---

  it("calls toggleTheme on click", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("cycles through themes on multiple clicks", () => {
    const { rerender } = render(<ThemeToggle />);

    // auto → light
    fireEvent.click(screen.getByRole("button"));
    rerender(<ThemeToggle />);
    expect(screen.getByText("☀️")).toBeInTheDocument();

    // light → dark
    fireEvent.click(screen.getByRole("button"));
    rerender(<ThemeToggle />);
    expect(screen.getByText("🌙")).toBeInTheDocument();

    // dark → auto
    fireEvent.click(screen.getByRole("button"));
    rerender(<ThemeToggle />);
    expect(screen.getByText("🖥️")).toBeInTheDocument();
  });
});
