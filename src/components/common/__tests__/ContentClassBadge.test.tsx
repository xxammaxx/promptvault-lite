import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ContentClassBadge from "../ContentClassBadge";

describe("ContentClassBadge", () => {
  // --- Rendering tests for each ContentClass ---

  it("renders 'Blueprint' label for BLUEPRINT", () => {
    render(<ContentClassBadge contentClass="BLUEPRINT" />);
    expect(screen.getByText("Blueprint")).toBeInTheDocument();
  });

  it("renders blue color class for BLUEPRINT", () => {
    render(<ContentClassBadge contentClass="BLUEPRINT" />);
    const badge = screen.getByText("Blueprint");
    expect(badge.className).toContain("badge-blueprint");
    expect(badge.className).toContain("content-class-badge");
  });

  it("renders 'Prompt' label for PROMPT", () => {
    render(<ContentClassBadge contentClass="PROMPT" />);
    expect(screen.getByText("Prompt")).toBeInTheDocument();
  });

  it("renders gray color class for PROMPT", () => {
    render(<ContentClassBadge contentClass="PROMPT" />);
    const badge = screen.getByText("Prompt");
    expect(badge.className).toContain("badge-prompt");
  });

  it("renders 'Hybrid' label for PROMPT_BLUEPRINT_HYBRID", () => {
    render(<ContentClassBadge contentClass="PROMPT_BLUEPRINT_HYBRID" />);
    expect(screen.getByText("Hybrid")).toBeInTheDocument();
  });

  it("renders violet color class for HYBRID", () => {
    render(<ContentClassBadge contentClass="PROMPT_BLUEPRINT_HYBRID" />);
    const badge = screen.getByText("Hybrid");
    expect(badge.className).toContain("badge-hybrid");
  });

  it("renders 'Review' label for UNKNOWN_NEEDS_REVIEW", () => {
    render(<ContentClassBadge contentClass="UNKNOWN_NEEDS_REVIEW" />);
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("renders orange color class for UNKNOWN", () => {
    render(<ContentClassBadge contentClass="UNKNOWN_NEEDS_REVIEW" />);
    const badge = screen.getByText("Review");
    expect(badge.className).toContain("badge-review");
  });

  it("renders 'Notiz' label for NOTE", () => {
    render(<ContentClassBadge contentClass="NOTE" />);
    expect(screen.getByText("Notiz")).toBeInTheDocument();
    const badge = screen.getByText("Notiz");
    expect(badge.className).toContain("badge-note");
  });

  it("renders 'Dokumentation' label for DOC", () => {
    render(<ContentClassBadge contentClass="DOC" />);
    expect(screen.getByText("Dokumentation")).toBeInTheDocument();
    const badge = screen.getByText("Dokumentation");
    expect(badge.className).toContain("badge-doc");
  });

  it("renders 'Code' label for CODE_FRAGMENT", () => {
    render(<ContentClassBadge contentClass="CODE_FRAGMENT" />);
    expect(screen.getByText("Code")).toBeInTheDocument();
    const badge = screen.getByText("Code");
    expect(badge.className).toContain("badge-code");
  });

  it("renders 'Guideline' label for GUIDELINE", () => {
    render(<ContentClassBadge contentClass="GUIDELINE" />);
    expect(screen.getByText("Guideline")).toBeInTheDocument();
  });

  it("renders guideline color class for GUIDELINE", () => {
    render(<ContentClassBadge contentClass="GUIDELINE" />);
    const badge = screen.getByText("Guideline");
    expect(badge.className).toContain("badge-guideline");
    expect(badge.className).toContain("content-class-badge");
  });

  // --- Null safety ---

  it("renders nothing when contentClass is null", () => {
    const { container } = render(<ContentClassBadge contentClass={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when contentClass is undefined", () => {
    const { container } = render(
      <ContentClassBadge contentClass={undefined} />,
    );
    expect(container.firstChild).toBeNull();
  });

  // --- Accessibility ---

  it("has aria-label with content type", () => {
    render(<ContentClassBadge contentClass="BLUEPRINT" />);
    const badge = screen.getByRole("status", { name: "Inhaltstyp: Blueprint" });
    expect(badge).toBeInTheDocument();
  });

  it("has aria-label for HYBRID", () => {
    render(<ContentClassBadge contentClass="PROMPT_BLUEPRINT_HYBRID" />);
    const badge = screen.getByRole("status", { name: "Inhaltstyp: Hybrid" });
    expect(badge).toBeInTheDocument();
  });

  // --- Size variant ---

  it("renders sm size class when size prop is 'sm'", () => {
    render(<ContentClassBadge contentClass="PROMPT" size="sm" />);
    const badge = screen.getByText("Prompt");
    expect(badge.className).toContain("content-class-badge-sm");
  });

  it("does not render sm size class when size is 'md' (default)", () => {
    render(<ContentClassBadge contentClass="PROMPT" size="md" />);
    const badge = screen.getByText("Prompt");
    expect(badge.className).not.toContain("content-class-badge-sm");
  });

  // --- Security: never renders content values ---

  it("never renders raw content or secrets in DOM", () => {
    // The badge only renders static labels. It never receives content strings.
    render(<ContentClassBadge contentClass="BLUEPRINT" />);
    // Only the label "Blueprint" should be in the DOM
    const badgeText = screen.getByText("Blueprint").textContent;
    expect(badgeText).toBe("Blueprint");
    // No secret-like values anywhere in rendered HTML
    expect(document.body.innerHTML).not.toContain("API_KEY");
    expect(document.body.innerHTML).not.toContain("password");
  });
});
