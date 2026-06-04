import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/stores/appStore";
import type { PromptItem } from "@/types";

/**
 * Helper: create a minimal PromptItem for tree-building tests.
 * The fileTree() function only uses: file_path, id, is_favorite,
 * and reads evaluations from store state.
 */
function makePrompt(
  id: string,
  filePath: string,
  isFavorite = false,
): PromptItem {
  return {
    id,
    file_path: filePath,
    file_name: filePath.split(/[/\\]/).pop() || "unknown.md",
    title: filePath.replace(/\.md$/, "").split(/[/\\]/).pop() || "untitled",
    description: "",
    category: "test",
    version: "1.0",
    tags: [],
    content: "# Test",
    raw_frontmatter: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    is_favorite: isFavorite,
  };
}

/** Helper: extract all node paths from a FileTreeNode tree (depth-first). */
function collectPaths(nodes: import("@/types").FileTreeNode[]): string[] {
  const paths: string[] = [];
  for (const n of nodes) {
    paths.push(n.path);
    if (n.children.length > 0) {
      paths.push(...collectPaths(n.children));
    }
  }
  return paths;
}

describe("FileTree — Path Normalisierung & Plattform-Pfade", () => {
  beforeEach(() => {
    // Reset store to clean state
    useAppStore.setState({
      prompts: [],
      evaluations: {},
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
  });

  // ===========================================================================
  // AC-1: Windows-Backslash-Pfade werden normalisiert
  // ===========================================================================

  it("normalisiert Windows-Backslash-Pfade zu korrektem File-Tree", () => {
    useAppStore.setState({
      prompts: [
        makePrompt("p1", "prompts\\coding\\rust\\advanced.md"),
        makePrompt("p2", "prompts\\coding\\rust\\beginner.md"),
        makePrompt("p3", "prompts\\writing\\blog.md"),
      ],
    });

    const tree = useAppStore.getState().fileTree();

    // Root should have two folders: "prompts" (only one, not duplicated)
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe("prompts");
    expect(tree[0].is_directory).toBe(true);

    // prompts should have "coding" and "writing"
    const promptsChildren = tree[0].children;
    expect(promptsChildren).toHaveLength(2);
    const names = promptsChildren.map((c) => c.name).sort();
    expect(names).toEqual(["coding", "writing"]);

    // coding should have "rust"
    const codingChildren = promptsChildren.find((c) => c.name === "coding")!;
    expect(codingChildren.children).toHaveLength(1);
    expect(codingChildren.children[0].name).toBe("rust");

    // rust should have two files
    const rustChildren = codingChildren.children[0].children;
    expect(rustChildren).toHaveLength(2);
    const rustNames = rustChildren.map((c) => c.name).sort();
    expect(rustNames).toEqual(["advanced.md", "beginner.md"]);
  });

  // ===========================================================================
  // AC-2: Gemischte Pfadtrenner (\/ und /)
  // ===========================================================================

  it("behandelt gemischte Pfadtrenner konsistent", () => {
    useAppStore.setState({
      prompts: [makePrompt("p1", "folder\\sub/thing.md")],
    });

    const tree = useAppStore.getState().fileTree();

    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe("folder");
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].name).toBe("sub");
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].name).toBe("thing.md");
    expect(tree[0].children[0].children[0].prompt_id).toBe("p1");
  });

  // ===========================================================================
  // AC-3: Pfad-Traversal-Segmente (../) werden als Tree-Knoten dargestellt
  // ===========================================================================

  it("stellt ../ Segmente als Tree-Knoten dar (kein Filesystem-Traversal)", () => {
    useAppStore.setState({
      prompts: [makePrompt("p1", "vault/../../../etc/passwd.md")],
    });

    const tree = useAppStore.getState().fileTree();

    // The fileTree builds nodes for each segment, including ".." segments.
    // This is safe because fileTree() does no filesystem access — it only
    // builds an in-memory UI tree. However, ".." as a visible folder name
    // is confusing; future hardening should either reject or label such paths.
    const paths = collectPaths(tree);

    // Verify the tree structure contains the expected segments
    expect(tree[0].name).toBe("vault");
    // All path segments, including "..", become directory nodes — current behavior
    expect(tree.length).toBeGreaterThan(0);
    // Traversal creates nested ".." directories
    expect(paths.some((p) => p.includes(".."))).toBe(true);
  });

  // ===========================================================================
  // AC-4: UNC-ähnliche Pfade (\\\\server\\share)
  // ===========================================================================

  it("behandelt UNC-ähnliche Pfade als Tree-Knoten", () => {
    // On Windows, UNC paths like \\server\share\folder\file.md
    // would be scanned. After normalization, they appear in the tree.
    useAppStore.setState({
      prompts: [makePrompt("p1", "\\\\server\\share\\vault\\prompt.md")],
    });

    const tree = useAppStore.getState().fileTree();

    // After backslash-to-slash normalization:
    // \\server\share\vault\prompt.md -> //server/share/vault/prompt.md
    // parts after filter(Boolean): ["server", "share", "vault", "prompt.md"]
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe("server");
    expect(tree[0].is_directory).toBe(true);

    const share = tree[0].children;
    expect(share).toHaveLength(1);
    expect(share[0].name).toBe("share");
    expect(share[0].children[0].name).toBe("vault");
    expect(share[0].children[0].children[0].name).toBe("prompt.md");
    expect(share[0].children[0].children[0].prompt_id).toBe("p1");
  });

  // ===========================================================================
  // AC-5: Drive-Letter-Pfade (C:\Users\...)
  // ===========================================================================

  it("behandelt Windows Drive-Letter-Pfade", () => {
    useAppStore.setState({
      prompts: [makePrompt("p1", "C:\\Users\\test\\vault\\prompt.md")],
    });

    const tree = useAppStore.getState().fileTree();

    // C:\Users\test\vault\prompt.md -> C:/Users/test/vault/prompt.md
    // parts: ["C:", "Users", "test", "vault", "prompt.md"]
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe("C:");
    expect(tree[0].is_directory).toBe(true);

    const users = tree[0].children;
    expect(users[0].name).toBe("Users");
    expect(users[0].children[0].name).toBe("test");
    expect(users[0].children[0].children[0].name).toBe("vault");
    expect(users[0].children[0].children[0].children[0].name).toBe("prompt.md");
    expect(users[0].children[0].children[0].children[0].prompt_id).toBe("p1");
  });

  // ===========================================================================
  // AC-6: Sortierreihenfolge: Ordner vor Dateien, alphabetisch
  // ===========================================================================

  it("sortiert Verzeichnisse vor Dateien und dann alphabetisch", () => {
    useAppStore.setState({
      prompts: [
        makePrompt("p1", "vault/zebra.md"),
        makePrompt("p2", "vault/apple.md"),
        makePrompt("p3", "vault/sub/delta.md"),
        makePrompt("p4", "vault/sub/alpha.md"),
        makePrompt("p5", "vault/sub/beta.md"),
      ],
    });

    const tree = useAppStore.getState().fileTree();

    // vault children: "sub" (dir) first, then files alphabetically
    const vaultChildren = tree[0].children;
    expect(vaultChildren[0].name).toBe("sub");
    expect(vaultChildren[0].is_directory).toBe(true);

    // Files should be alphabetically sorted
    const fileNames = vaultChildren
      .filter((c) => !c.is_directory)
      .map((c) => c.name);
    expect(fileNames).toEqual(["apple.md", "zebra.md"]);

    // sub children should be alphabetically sorted
    const subChildren = vaultChildren[0].children;
    const subNames = subChildren.map((c) => c.name);
    expect(subNames).toEqual(["alpha.md", "beta.md", "delta.md"]);
  });

  // ===========================================================================
  // AC-7: Leerer Vault → leerer Tree
  // ===========================================================================

  it("gibt leeren Tree zurück wenn keine Prompts vorhanden sind", () => {
    const tree = useAppStore.getState().fileTree();
    expect(tree).toHaveLength(0);
  });
});
