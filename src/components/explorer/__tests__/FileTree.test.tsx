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
    const codingChildren = promptsChildren.find((c) => c.name === "coding");
    if (!codingChildren) throw new Error("Expected coding directory");
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
  // AC-3: Pfad-Traversal-Segmente (../) werden AUS dem Tree gefiltert
  // ===========================================================================

  it("filtert ../ Segmente aus dem File-Tree", () => {
    useAppStore.setState({
      prompts: [makePrompt("p1", "vault/../../../etc/passwd.md")],
    });

    const tree = useAppStore.getState().fileTree();

    const paths = collectPaths(tree);
    // ".." segments must NOT appear in the tree after sanitization
    expect(paths.some((p) => p.includes(".."))).toBe(false);
    // The remaining valid segments should still be present
    expect(tree[0].name).toBe("vault");
    expect(tree.length).toBeGreaterThan(0);
  });

  // ===========================================================================
  // AC-3b: "."-Segmente werden aus dem Tree gefiltert
  // ===========================================================================

  it("filtert . Segmente aus dem File-Tree", () => {
    useAppStore.setState({
      prompts: [makePrompt("p1", "vault/./sub/./prompt.md")],
    });

    const tree = useAppStore.getState().fileTree();

    // "." segments must not appear as tree nodes
    expect(tree[0].name).toBe("vault");
    expect(tree[0].children[0].name).toBe("sub");
    expect(tree[0].children[0].children[0].name).toBe("prompt.md");
    expect(tree[0].children[0].children[0].prompt_id).toBe("p1");
  });

  // ===========================================================================
  // AC-3c: Leere Pfade nach Sanitization werden ignoriert
  // ===========================================================================

  it("ignoriert Pfade die nach Sanitization leer sind", () => {
    useAppStore.setState({
      prompts: [makePrompt("p1", "../.."), makePrompt("p2", "vault/valid.md")],
    });

    const tree = useAppStore.getState().fileTree();

    // Only the valid path should appear in the tree
    expect(tree[0].name).toBe("vault");
    expect(tree[0].children[0].name).toBe("valid.md");
    // Tree should NOT crash or contain empty entries
    expect(tree).toHaveLength(1);
  });

  // ===========================================================================
  // AC-3d: Absolute Pfade werden relativ zum Vault-Root dargestellt
  // ===========================================================================

  it("stellt absolute Pfade relativ zum Vault-Root dar", () => {
    useAppStore.setState({
      currentFolderPath: "/home/user/vault",
      prompts: [makePrompt("p1", "/home/user/vault/prompts/test.md")],
    });

    const tree = useAppStore.getState().fileTree();

    // Path should appear relative to vault root
    expect(tree[0].name).toBe("prompts");
    expect(tree[0].children[0].name).toBe("test.md");
    expect(tree[0].children[0].prompt_id).toBe("p1");
  });

  it("lässt Pfade unverändert wenn kein Vault-Root gesetzt ist", () => {
    useAppStore.setState({
      currentFolderPath: null,
      prompts: [makePrompt("p1", "/absolute/path/prompt.md")],
    });

    const tree = useAppStore.getState().fileTree();

    // With no root, path is shown as-is
    expect(tree[0].name).toBe("absolute");
    expect(tree[0].children[0].name).toBe("path");
    expect(tree[0].children[0].children[0].name).toBe("prompt.md");
  });

  it("relativisiert nur Pfade die am Pfad-Prefix-Grenze matchen", () => {
    // /home/user/vault should NOT match /home/user/vault-evil/prompt.md
    useAppStore.setState({
      currentFolderPath: "/home/user/vault",
      prompts: [makePrompt("p1", "/home/user/vault-evil/prompts/evil.md")],
    });

    const tree = useAppStore.getState().fileTree();

    // Path should NOT be relativized — vault ≠ vault-evil
    expect(tree[0].name).toBe("home");
    expect(tree[0].children[0].name).toBe("user");
    expect(tree[0].children[0].children[0].name).toBe("vault-evil");
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

  // ===========================================================================
  // T5.10 — Favoriten-Indikator ★
  // ===========================================================================

  it("zeigt ★-Indikator (tree-icon + favorite-indicator) für favorisierte Prompts", () => {
    useAppStore.setState({
      prompts: [
        makePrompt("p1", "vault/favorite.md", true),
        makePrompt("p2", "vault/normal.md", false),
      ],
    });

    const tree = useAppStore.getState().fileTree();
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe("vault");

    const children = tree[0].children;
    expect(children).toHaveLength(2);

    // The favorite file should have is_favorite = true
    const favFile = children.find((c) => c.prompt_id === "p1");
    expect(favFile).toBeDefined();
    if (favFile) expect(favFile.is_favorite).toBe(true);

    // The normal file should have is_favorite = false
    const normalFile = children.find((c) => c.prompt_id === "p2");
    expect(normalFile).toBeDefined();
    if (normalFile) expect(normalFile.is_favorite).toBe(false);
  });
});
