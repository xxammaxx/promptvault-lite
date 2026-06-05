import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterPanel } from "../FilterPanel";

vi.mock("@/stores/appStore", () => ({
  useAppStore: vi.fn(),
}));

import { useAppStore } from "@/stores/appStore";

describe("FilterPanel", () => {
  const mockSetFilters = vi.fn();
  const mockResetFilters = vi.fn();
  const mockOnClose = vi.fn();

  const mockAllCategories = vi
    .fn()
    .mockReturnValue(["coding", "writing", "analysis"]);
  const mockAllTags = vi.fn().mockReturnValue(["rust", "python", "testing"]);
  const mockFilteredPrompts = vi.fn().mockReturnValue([]);

  const defaultFilters = {
    search: "",
    category: null,
    minScore: 0,
    maxScore: 100,
    hygieneStatus: null,
    tags: [],
    favoritesOnly: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: unknown) => unknown) => {
        const state = {
          filters: { ...defaultFilters },
          setFilters: mockSetFilters,
          resetFilters: mockResetFilters,
          allCategories: mockAllCategories,
          allTags: mockAllTags,
          filteredPrompts: mockFilteredPrompts,
        };
        return selector(state);
      },
    );
  });

  it("renders filter header with close button", () => {
    render(<FilterPanel onClose={mockOnClose} />);

    expect(screen.getByText("Filter")).toBeInTheDocument();
    expect(screen.getByText("✕")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    render(<FilterPanel onClose={mockOnClose} />);

    fireEvent.click(screen.getByText("✕"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  // --- Category dropdown ---

  it("renders category dropdown with options from allCategories", () => {
    render(<FilterPanel onClose={mockOnClose} />);

    expect(screen.getByText("Kategorie")).toBeInTheDocument();
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    // "Alle" is the default option
    expect(screen.getByText("Alle")).toBeInTheDocument();
    expect(screen.getByText("coding")).toBeInTheDocument();
    expect(screen.getByText("writing")).toBeInTheDocument();
    expect(screen.getByText("analysis")).toBeInTheDocument();
  });

  it("calls setFilters with selected category on dropdown change", () => {
    render(<FilterPanel onClose={mockOnClose} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "coding" },
    });
    expect(mockSetFilters).toHaveBeenCalledWith({ category: "coding" });
  });

  it('calls setFilters with null when "Alle" is selected', () => {
    render(<FilterPanel onClose={mockOnClose} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
    expect(mockSetFilters).toHaveBeenCalledWith({ category: null });
  });

  // --- Score range slider ---

  it("renders score range slider", () => {
    mockFilteredPrompts.mockReturnValue([]);

    render(<FilterPanel onClose={mockOnClose} />);

    expect(screen.getByText(/Score: 0–100/)).toBeInTheDocument();
    const sliders = screen.getAllByRole("slider");
    expect(sliders).toHaveLength(2);
    expect(sliders[0]).toHaveAttribute("min", "0");
    expect(sliders[0]).toHaveAttribute("max", "100");
    expect(sliders[0]).toHaveValue("0");
    expect(sliders[0]).toHaveAttribute("aria-label", "Minimaler Score");
    expect(sliders[1]).toHaveAttribute("aria-label", "Maximaler Score");
    expect(sliders[1]).toHaveValue("100");
  });

  it("calls setFilters with minScore on slider change", () => {
    render(<FilterPanel onClose={mockOnClose} />);

    fireEvent.change(screen.getAllByRole("slider")[0], {
      target: { value: "50" },
    });
    expect(mockSetFilters).toHaveBeenCalledWith({ minScore: 50 });
  });

  it("calls setFilters with maxScore on second slider change", () => {
    render(<FilterPanel onClose={mockOnClose} />);

    fireEvent.change(screen.getAllByRole("slider")[1], {
      target: { value: "80" },
    });
    expect(mockSetFilters).toHaveBeenCalledWith({ maxScore: 80 });
  });

  // --- Hygiene chips ---

  it("renders hygiene status chips", () => {
    mockFilteredPrompts.mockReturnValue([]);

    render(<FilterPanel onClose={mockOnClose} />);

    expect(screen.getByText("Hygiene")).toBeInTheDocument();
    expect(screen.getByText("✅ Sauber")).toBeInTheDocument();
    expect(screen.getByText("⚠️ Warnung")).toBeInTheDocument();
    expect(screen.getByText("🔴 Kritisch")).toBeInTheDocument();
  });

  it("toggles hygiene filter when clicking a clean chip", () => {
    render(<FilterPanel onClose={mockOnClose} />);

    fireEvent.click(screen.getByText("✅ Sauber"));
    expect(mockSetFilters).toHaveBeenCalledWith({ hygieneStatus: "clean" });
  });

  it("deselects hygiene filter when clicking an active chip", () => {
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: unknown) => unknown) => {
        const state = {
          filters: { ...defaultFilters, hygieneStatus: "clean" as const },
          setFilters: mockSetFilters,
          resetFilters: mockResetFilters,
          allCategories: mockAllCategories,
          allTags: mockAllTags,
          filteredPrompts: mockFilteredPrompts,
        };
        return selector(state);
      },
    );

    render(<FilterPanel onClose={mockOnClose} />);

    fireEvent.click(screen.getByText("✅ Sauber"));
    expect(mockSetFilters).toHaveBeenCalledWith({ hygieneStatus: null });
  });

  // --- Tags chips ---

  it("renders tag filter chips", () => {
    render(<FilterPanel onClose={mockOnClose} />);

    expect(screen.getByText("Tags")).toBeInTheDocument();
    expect(screen.getByText("rust")).toBeInTheDocument();
    expect(screen.getByText("python")).toBeInTheDocument();
    expect(screen.getByText("testing")).toBeInTheDocument();
  });

  it("adds tag to filter when clicking an inactive tag chip", () => {
    render(<FilterPanel onClose={mockOnClose} />);

    fireEvent.click(screen.getByText("rust"));
    expect(mockSetFilters).toHaveBeenCalledWith({ tags: ["rust"] });
  });

  it("removes tag from filter when clicking an active tag chip", () => {
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (selector: (s: unknown) => unknown) => {
        const state = {
          filters: { ...defaultFilters, tags: ["rust", "python"] },
          setFilters: mockSetFilters,
          resetFilters: mockResetFilters,
          allCategories: mockAllCategories,
          allTags: mockAllTags,
          filteredPrompts: mockFilteredPrompts,
        };
        return selector(state);
      },
    );

    render(<FilterPanel onClose={mockOnClose} />);

    fireEvent.click(screen.getByText("rust"));
    expect(mockSetFilters).toHaveBeenCalledWith({ tags: ["python"] });
  });

  it("hides tags section when no tags exist", () => {
    mockAllTags.mockReturnValue([]);
    mockFilteredPrompts.mockReturnValue([]);

    render(<FilterPanel onClose={mockOnClose} />);

    expect(screen.queryByText("Tags")).not.toBeInTheDocument();
  });

  // --- Favorites toggle ---

  it("renders favorites toggle checkbox", () => {
    mockFilteredPrompts.mockReturnValue([]);

    render(<FilterPanel onClose={mockOnClose} />);

    expect(screen.getByText("Nur Favoriten")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("calls setFilters when favorites toggle is checked", () => {
    render(<FilterPanel onClose={mockOnClose} />);

    fireEvent.click(screen.getByRole("checkbox"));
    expect(mockSetFilters).toHaveBeenCalledWith({ favoritesOnly: true });
  });

  // --- Reset button ---

  it("renders reset button and calls resetFilters on click", () => {
    mockFilteredPrompts.mockReturnValue([]);

    render(<FilterPanel onClose={mockOnClose} />);

    const resetBtn = screen.getByText("Filter zurücksetzen");
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
    expect(mockResetFilters).toHaveBeenCalledTimes(1);
  });

  // --- Result count ---

  it("shows filtered result count", () => {
    mockFilteredPrompts.mockReturnValue([
      { id: "1" },
      { id: "2" },
      { id: "3" },
    ] as never[]);

    render(<FilterPanel onClose={mockOnClose} />);

    expect(screen.getByText("3 Prompt(s)")).toBeInTheDocument();
  });

  it("shows zero results", () => {
    mockFilteredPrompts.mockReturnValue([]);

    render(<FilterPanel onClose={mockOnClose} />);

    expect(screen.getByText("0 Prompt(s)")).toBeInTheDocument();
  });
});
