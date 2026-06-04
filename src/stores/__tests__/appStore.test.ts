import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/stores/appStore";
import type { PromptItem, PromptEvaluation, PromptHygiene } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePrompt(
  id: string,
  filePath: string,
  overrides: Partial<PromptItem> = {},
): PromptItem {
  return {
    id,
    file_path: filePath,
    file_name: filePath.split(/[/\\]/).pop() || "unknown.md",
    title:
      overrides.title ??
      filePath.replace(/\.md$/, "").split(/[/\\]/).pop() ??
      "untitled",
    description: "",
    category: overrides.category ?? "test",
    version: "1.0",
    tags: overrides.tags ?? [],
    content: overrides.content ?? "# Content",
    raw_frontmatter: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    is_favorite: overrides.is_favorite ?? false,
  };
}

function makeEvaluation(
  promptId: string,
  overallScore: number,
): PromptEvaluation {
  return {
    id: `eval-${promptId}`,
    prompt_id: promptId,
    overall_score: overallScore,
    criteria: [],
    missing_sections: [],
    recommendations: [],
    evaluated_at: "2026-01-01T00:00:00Z",
  };
}

function makeHygiene(
  promptId: string,
  status: "clean" | "warning" | "critical",
  hygieneScore = 80,
): PromptHygiene {
  return {
    id: `hyg-${promptId}`,
    prompt_id: promptId,
    hygiene_score: hygieneScore,
    status,
    artifacts: [],
    analyzed_at: "2026-01-01T00:00:00Z",
  };
}

function resetStore() {
  useAppStore.setState({
    prompts: [],
    evaluations: {},
    hygiene: {},
    filters: {
      search: "",
      category: null,
      minScore: 0,
      maxScore: 100,
      hygieneStatus: null,
      tags: [],
      favoritesOnly: false,
    },
    currentFolderPath: null,
  });
}

// ---------------------------------------------------------------------------
// T4.7 — fileTree() Tests
// ---------------------------------------------------------------------------

describe("fileTree()", () => {
  beforeEach(resetStore);

  it("gibt leeren Tree bei keinen Prompts", () => {
    const tree = useAppStore.getState().fileTree();
    expect(tree).toHaveLength(0);
  });

  it("erzeugt flachen Tree mit einem Prompt", () => {
    useAppStore.setState({
      prompts: [makePrompt("p1", "prompts/test.md")],
    });

    const tree = useAppStore.getState().fileTree();
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe("prompts");
    expect(tree[0].is_directory).toBe(true);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].name).toBe("test.md");
    expect(tree[0].children[0].prompt_id).toBe("p1");
  });

  it("erzeugt flachen Tree bei mehreren Prompts im selben Ordner", () => {
    useAppStore.setState({
      prompts: [
        makePrompt("p1", "folder/a.md"),
        makePrompt("p2", "folder/b.md"),
      ],
    });

    const tree = useAppStore.getState().fileTree();
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe("folder");
    expect(tree[0].children).toHaveLength(2);
    // Alphabetically sorted
    expect(tree[0].children[0].name).toBe("a.md");
    expect(tree[0].children[1].name).toBe("b.md");
    expect(tree[0].children[0].prompt_id).toBe("p1");
    expect(tree[0].children[1].prompt_id).toBe("p2");
  });

  it("bildet verschachtelte Pfade korrekt ab", () => {
    useAppStore.setState({
      prompts: [makePrompt("p1", "folder/sub/deep/prompt.md")],
    });

    const tree = useAppStore.getState().fileTree();
    expect(tree[0].name).toBe("folder");
    expect(tree[0].is_directory).toBe(true);
    expect(tree[0].children[0].name).toBe("sub");
    expect(tree[0].children[0].children[0].name).toBe("deep");
    expect(tree[0].children[0].children[0].children[0].name).toBe("prompt.md");
    expect(tree[0].children[0].children[0].children[0].prompt_id).toBe("p1");
  });

  it("ordnet Scores aus evaluations zu", () => {
    useAppStore.setState({
      prompts: [makePrompt("p1", "prompts/test.md")],
      evaluations: { p1: makeEvaluation("p1", 85) },
    });

    const tree = useAppStore.getState().fileTree();
    expect(tree[0].children[0].score).toBe(85);
  });

  it("ordnet is_favorite aus Prompt-Daten zu", () => {
    useAppStore.setState({
      prompts: [makePrompt("p1", "prompts/test.md", { is_favorite: true })],
    });

    const tree = useAppStore.getState().fileTree();
    expect(tree[0].children[0].is_favorite).toBe(true);
  });

  it("filtert ..-Segmente aus dem Tree", () => {
    useAppStore.setState({
      prompts: [makePrompt("p1", "vault/../../../etc/passwd.md")],
    });

    const tree = useAppStore.getState().fileTree();
    const collectAll = (nodes: typeof tree): string[] =>
      nodes.flatMap((n) => [n.name, ...collectAll(n.children)]);

    const names = collectAll(tree);
    expect(names).not.toContain("..");
    // Valid segments still present
    expect(names).toContain("vault");
  });

  it("filtert .-Segmente aus dem Tree", () => {
    useAppStore.setState({
      prompts: [makePrompt("p1", "vault/./sub/./prompt.md")],
    });

    const tree = useAppStore.getState().fileTree();
    expect(tree[0].name).toBe("vault");
    expect(tree[0].children[0].name).toBe("sub");
    expect(tree[0].children[0].children[0].name).toBe("prompt.md");
  });

  it("ignoriert Pfade die nach Sanitization leer sind", () => {
    useAppStore.setState({
      prompts: [makePrompt("p1", "../.."), makePrompt("p2", "vault/valid.md")],
    });

    const tree = useAppStore.getState().fileTree();
    expect(tree).toHaveLength(1);
    expect(tree[0].children[0].name).toBe("valid.md");
  });

  it("sortiert Ordner vor Dateien, alphabetisch", () => {
    useAppStore.setState({
      prompts: [
        makePrompt("p1", "root/zebra.md"),
        makePrompt("p2", "root/apple.md"),
        makePrompt("p3", "root/sub/delta.md"),
      ],
    });

    const tree = useAppStore.getState().fileTree();
    const rootChildren = tree[0].children;

    // Directory (sub) before files
    expect(rootChildren[0].name).toBe("sub");
    expect(rootChildren[0].is_directory).toBe(true);

    // Files alphabetically
    expect(rootChildren[1].name).toBe("apple.md");
    expect(rootChildren[2].name).toBe("zebra.md");
  });
});

// ---------------------------------------------------------------------------
// T4.8 — filteredPrompts() Tests
// ---------------------------------------------------------------------------

describe("filteredPrompts()", () => {
  const p1 = makePrompt("p1", "prompts/test.md", {
    title: "React Guide",
    category: "coding",
    tags: ["react", "frontend"],
    content: "Learn React hooks",
    is_favorite: true,
  });
  const p2 = makePrompt("p2", "prompts/notes.md", {
    title: "Writing Tips",
    category: "writing",
    tags: ["writing", "blog"],
    content: "How to write better",
    is_favorite: false,
  });
  const p3 = makePrompt("p3", "prompts/advanced.md", {
    title: "Advanced TypeScript",
    category: "coding",
    tags: ["typescript", "advanced"],
    content: "TS generics deep dive",
    is_favorite: false,
  });

  beforeEach(resetStore);

  it("gibt leere Liste bei keinen Prompts", () => {
    const result = useAppStore.getState().filteredPrompts();
    expect(result).toHaveLength(0);
  });

  it("gibt alle Prompts zurück wenn alle Filter deaktiviert", () => {
    useAppStore.setState({ prompts: [p1, p2, p3] });

    const result = useAppStore.getState().filteredPrompts();
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
  });

  it("filtert nach search (Titel, case-insensitive)", () => {
    useAppStore.setState({
      prompts: [p1, p2, p3],
      filters: {
        search: "",
        category: null,
        minScore: 0,
        maxScore: 100,
        hygieneStatus: null,
        tags: [],
        favoritesOnly: false,
      },
    });
    useAppStore.getState().setFilters({ search: "react" });

    const result = useAppStore.getState().filteredPrompts();
    expect(result.map((p) => p.id)).toEqual(["p1"]);
  });

  it("filtert nach search (Kategorie)", () => {
    useAppStore.setState({
      prompts: [p1, p2, p3],
      filters: {
        search: "",
        category: null,
        minScore: 0,
        maxScore: 100,
        hygieneStatus: null,
        tags: [],
        favoritesOnly: false,
      },
    });
    useAppStore.getState().setFilters({ search: "writing" });

    const result = useAppStore.getState().filteredPrompts();
    expect(result.map((p) => p.id)).toEqual(["p2"]);
  });

  it("filtert nach search (Tags)", () => {
    useAppStore.setState({
      prompts: [p1, p2, p3],
      filters: {
        search: "",
        category: null,
        minScore: 0,
        maxScore: 100,
        hygieneStatus: null,
        tags: [],
        favoritesOnly: false,
      },
    });
    useAppStore.getState().setFilters({ search: "typescript" });

    const result = useAppStore.getState().filteredPrompts();
    expect(result.map((p) => p.id)).toEqual(["p3"]);
  });

  it("filtert nach search (Content)", () => {
    useAppStore.setState({
      prompts: [p1, p2, p3],
      filters: {
        search: "",
        category: null,
        minScore: 0,
        maxScore: 100,
        hygieneStatus: null,
        tags: [],
        favoritesOnly: false,
      },
    });
    useAppStore.getState().setFilters({ search: "hooks" });

    const result = useAppStore.getState().filteredPrompts();
    expect(result.map((p) => p.id)).toEqual(["p1"]);
  });

  it("filtert nach favoritesOnly", () => {
    useAppStore.setState({
      prompts: [p1, p2, p3],
      filters: {
        search: "",
        category: null,
        minScore: 0,
        maxScore: 100,
        hygieneStatus: null,
        tags: [],
        favoritesOnly: false,
      },
    });
    useAppStore.getState().setFilters({ favoritesOnly: true });

    const result = useAppStore.getState().filteredPrompts();
    expect(result.map((p) => p.id)).toEqual(["p1"]);
  });

  it("filtert nach category", () => {
    useAppStore.setState({
      prompts: [p1, p2, p3],
      filters: {
        search: "",
        category: null,
        minScore: 0,
        maxScore: 100,
        hygieneStatus: null,
        tags: [],
        favoritesOnly: false,
      },
    });
    useAppStore.getState().setFilters({ category: "coding" });

    const result = useAppStore.getState().filteredPrompts();
    expect(result.map((p) => p.id)).toEqual(["p1", "p3"]);
  });

  it("filtert nach tags (multi-select — mindestens ein Tag muss matchen)", () => {
    useAppStore.setState({
      prompts: [p1, p2, p3],
      filters: {
        search: "",
        category: null,
        minScore: 0,
        maxScore: 100,
        hygieneStatus: null,
        tags: [],
        favoritesOnly: false,
      },
    });
    useAppStore.getState().setFilters({ tags: ["react", "typescript"] });

    const result = useAppStore.getState().filteredPrompts();
    expect(result.map((p) => p.id)).toEqual(["p1", "p3"]);
  });

  it("filtert nach hygieneStatus", () => {
    useAppStore.setState({
      prompts: [p1, p2],
      hygiene: {
        p1: makeHygiene("p1", "clean"),
        p2: makeHygiene("p2", "warning"),
      },
      filters: {
        search: "",
        category: null,
        minScore: 0,
        maxScore: 100,
        hygieneStatus: null,
        tags: [],
        favoritesOnly: false,
      },
    });
    useAppStore.getState().setFilters({ hygieneStatus: "warning" });

    const result = useAppStore.getState().filteredPrompts();
    expect(result.map((p) => p.id)).toEqual(["p2"]);
  });

  it("kombiniert mehrere Filter (UND-Verknüpfung)", () => {
    useAppStore.setState({
      prompts: [p1, p2, p3],
      filters: {
        search: "",
        category: null,
        minScore: 0,
        maxScore: 100,
        hygieneStatus: null,
        tags: [],
        favoritesOnly: false,
      },
    });
    useAppStore.getState().setFilters({
      category: "coding",
      favoritesOnly: false,
      search: "type",
    });

    const result = useAppStore.getState().filteredPrompts();
    // p1: "React Guide" — no "type" in title/tags/category/content → NO
    // p3: "Advanced TypeScript" — "type" in tags → YES
    expect(result.map((p) => p.id)).toEqual(["p3"]);
  });

  it("score-filter (minScore/maxScore) werden aktuell nicht in filteredPrompts geprüft", () => {
    // Note: filteredPrompts() does not access evaluations for score filtering.
    // This test documents current behavior — all prompts pass regardless of scores.
    useAppStore.setState({
      prompts: [p1, p2, p3],
      evaluations: {
        p1: makeEvaluation("p1", 50),
        p2: makeEvaluation("p2", 90),
        p3: makeEvaluation("p3", 30),
      },
      filters: {
        search: "",
        category: null,
        minScore: 0,
        maxScore: 100,
        hygieneStatus: null,
        tags: [],
        favoritesOnly: false,
      },
    });

    const result = useAppStore.getState().filteredPrompts();
    // All prompts are returned because score filtering is not implemented
    expect(result).toHaveLength(3);
  });
});
