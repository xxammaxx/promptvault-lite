import { create } from "zustand";
import type {
  PromptItem,
  PromptEvaluation,
  PromptHygiene,
  PromptFilters,
  FileTreeNode,
} from "@/types";
import {
  scanDirectory,
  evaluatePrompt,
  analyzeHygiene,
  analyzeAll as tauriAnalyzeAll,
  startFileWatcher,
  stopFileWatcher,
  toggleFavorite as tauriToggleFavorite,
} from "@/lib/tauri";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";

// ---------------------------------------------------------------------------
// Path Normalization Helpers (fix/windows-path-filetree-root)
// ---------------------------------------------------------------------------

/**
 * Normalize a file path for cross-platform comparison:
 * - Replaces backslashes with forward slashes
 * - Removes Windows long-path prefixes (\\?\C:\ → C:/, //?/C:/ → C:/)
 * - Collapses consecutive slashes (except after drive letters)
 * - Strips trailing slashes
 */
function normalizeFilePath(filePath: string): string {
  let normalized = filePath.replace(/\\/g, "/");

  // Remove Windows long-path prefix: //?/C:/path → C:/path
  normalized = normalized.replace(/^\/\/\?\/([A-Za-z]):(?=\/)/, "$1:");

  // Collapse consecutive slashes
  normalized = normalized.replace(/\/{2,}/g, "/");

  // Remove trailing slash (unless it's a bare root like "C:" or "/")
  normalized = normalized.replace(/(.)\/$/, "$1");

  return normalized;
}

/**
 * Relativize an absolute file path against a root folder.
 * Returns null if filePath is NOT under rootPath (or equal).
 * Returns the relative path (without leading slash) on success.
 *
 * Comparison is case-insensitive on Windows (drive letters).
 */
function relativizePath(filePath: string, rootPath: string): string | null {
  const nf = normalizeFilePath(filePath);
  const nr = normalizeFilePath(rootPath);

  // Exact match: file IS the root
  if (nf.toLowerCase() === nr.toLowerCase()) {
    return "";
  }

  // Check if file is under root (require path boundary: root + "/")
  const nrWithSep = nr + "/";
  if (nf.toLowerCase().startsWith(nrWithSep.toLowerCase())) {
    return nf.slice(nrWithSep.length);
  }

  return null;
}

// --- Theme Types ---

export type Theme = "light" | "dark" | "auto";

const THEME_KEY = "promptvault.theme";
export const THEME_CYCLE: Record<Theme, Theme> = {
  light: "dark",
  dark: "auto",
  auto: "light",
};

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "auto") {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  }
  return theme;
}

function getThemeFromStorage(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark" || stored === "auto") {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return "dark"; // Default: dark mode
}

function saveThemeToStorage(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // silent fail
  }
}

// --- Layout Persistence ---

const EXPLORER_WIDTH_KEY = "promptvault.layout.explorerWidth";
const MIN_EXPLORER_WIDTH = 240;
const MAX_EXPLORER_WIDTH = 600;
const DEFAULT_EXPLORER_WIDTH = 360;

export function getExplorerWidthFromStorage(): number {
  try {
    const stored = localStorage.getItem(EXPLORER_WIDTH_KEY);
    if (stored !== null) {
      const parsed = Number(stored);
      if (
        Number.isFinite(parsed) &&
        parsed >= MIN_EXPLORER_WIDTH &&
        parsed <= MAX_EXPLORER_WIDTH
      ) {
        return parsed;
      }
    }
  } catch {
    // localStorage nicht verfügbar (Private Browsing etc.)
  }
  return DEFAULT_EXPLORER_WIDTH;
}

function saveExplorerWidthToStorage(width: number): void {
  try {
    localStorage.setItem(EXPLORER_WIDTH_KEY, String(width));
  } catch {
    // silent fail
  }
}

function clampExplorerWidth(width: number): number {
  return Math.max(
    MIN_EXPLORER_WIDTH,
    Math.min(MAX_EXPLORER_WIDTH, Math.round(width)),
  );
}
// --- Watcher Event Types ---

interface ChangedPayload {
  added: string[];
  modified: string[];
  removed: string[];
}

// --- Store Interface ---

interface AppState {
  // Data
  prompts: PromptItem[];
  selectedPromptId: string | null;
  evaluations: Record<string, PromptEvaluation>;
  hygiene: Record<string, PromptHygiene>;

  // UI
  explorerWidth: number;
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  filters: PromptFilters;
  expandedFolders: Set<string>;
  theme: Theme;

  // Watcher
  currentFolderPath: string | null;
  watcherNotification: string | null;
  _watcherUnlisten: UnlistenFn | null;

  // Actions
  setPrompts: (prompts: PromptItem[]) => void;
  selectPrompt: (id: string | null) => void;
  setEvaluation: (promptId: string, evaluation: PromptEvaluation) => void;
  setHygiene: (promptId: string, hygiene: PromptHygiene) => void;
  toggleFavorite: (promptId: string) => Promise<void>;
  setFilters: (filters: Partial<PromptFilters>) => void;
  resetFilters: () => void;
  toggleFolder: (path: string) => void;
  toggleTheme: () => void;
  setExplorerWidth: (width: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearWatcherNotification: () => void;
  cleanupWatcher: () => Promise<void>;

  // Derived
  filteredPrompts: () => PromptItem[];
  selectedPrompt: () => PromptItem | null;
  selectedEvaluation: () => PromptEvaluation | null;
  selectedHygiene: () => PromptHygiene | null;
  fileTree: () => FileTreeNode[];
  allCategories: () => string[];
  allTags: () => string[];

  // Async actions
  scanFolder: (path: string) => Promise<void>;
  analyzeSelected: () => Promise<void>;
  analyzeAll: () => Promise<void>;
}

const defaultFilters: PromptFilters = {
  search: "",
  category: null,
  minScore: 0,
  maxScore: 100,
  hygieneStatus: null,
  tags: [],
  favoritesOnly: false,
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  prompts: [],
  selectedPromptId: null,
  evaluations: {},
  hygiene: {},
  explorerWidth: getExplorerWidthFromStorage(),
  isLoading: false,
  isAnalyzing: false,
  error: null,
  filters: { ...defaultFilters },
  expandedFolders: new Set<string>(),
  theme: getThemeFromStorage(),

  // Watcher state
  currentFolderPath: null,
  watcherNotification: null,
  _watcherUnlisten: null,

  // Actions
  setPrompts: (prompts) => {
    set({ prompts });
  },

  selectPrompt: (id) => {
    set({ selectedPromptId: id });
  },

  setEvaluation: (promptId, evaluation) => {
    set((state) => ({
      evaluations: { ...state.evaluations, [promptId]: evaluation },
    }));
  },

  setHygiene: (promptId, hygiene) => {
    set((state) => ({
      hygiene: { ...state.hygiene, [promptId]: hygiene },
    }));
  },

  toggleFavorite: async (promptId) => {
    // Optimistisches UI-Update
    const prevPrompts = get().prompts;
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.id === promptId ? { ...p, is_favorite: !p.is_favorite } : p,
      ),
    }));

    try {
      const newState = await tauriToggleFavorite(promptId);
      // Backend bestätigt — State korrigieren falls nötig
      set((state) => ({
        prompts: state.prompts.map((p) =>
          p.id === promptId ? { ...p, is_favorite: newState } : p,
        ),
      }));
    } catch (err) {
      // Revert bei Fehler
      set({ prompts: prevPrompts, error: String(err) });
    }
  },

  setFilters: (partial) => {
    set((state) => ({
      filters: { ...state.filters, ...partial },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
  },

  toggleFolder: (path) => {
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedFolders: next };
    });
  },

  toggleTheme: () => {
    set((state) => {
      const next = THEME_CYCLE[state.theme];
      saveThemeToStorage(next);
      return { theme: next };
    });
  },

  setExplorerWidth: (width) => {
    const clamped = clampExplorerWidth(width);
    saveExplorerWidthToStorage(clamped);
    set({ explorerWidth: clamped });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  setError: (error) => {
    set({ error });
  },

  clearWatcherNotification: () => {
    set({ watcherNotification: null });
  },

  cleanupWatcher: async () => {
    const state = get();
    // Remove old event listener
    if (state._watcherUnlisten) {
      state._watcherUnlisten();
    }
    // Stop backend watcher
    try {
      await stopFileWatcher();
    } catch (err) {
      console.error("Fehler beim Stoppen des Watchers:", err);
    }
    set({
      _watcherUnlisten: null,
      currentFolderPath: null,
      watcherNotification: null,
    });
  },

  // Derived data
  filteredPrompts: () => {
    const { prompts, filters, evaluations } = get();
    return prompts.filter((p) => {
      if (filters.favoritesOnly && !p.is_favorite) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.hygieneStatus) {
        const h = get().hygiene[p.id];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!h || h.status !== filters.hygieneStatus) return false;
      }
      if (filters.tags.length > 0) {
        if (!filters.tags.some((t) => p.tags.includes(t))) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !p.title.toLowerCase().includes(q) &&
          !p.category.toLowerCase().includes(q) &&
          !p.tags.some((t) => t.toLowerCase().includes(q)) &&
          !p.content.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      // Score-Filter (ADR-007): nur aktiv wenn nicht Default (minScore=0, maxScore=100)
      if (filters.minScore > 0 || filters.maxScore < 100) {
        const score: number =
          p.id in evaluations ? evaluations[p.id].overall_score : 0;
        if (score < filters.minScore || score > filters.maxScore) return false;
      }
      return true;
    });
  },

  selectedPrompt: () => {
    const { prompts, selectedPromptId } = get();
    if (!selectedPromptId) return null;
    return prompts.find((p) => p.id === selectedPromptId) || null;
  },

  selectedEvaluation: () => {
    const { selectedPromptId, evaluations } = get();
    if (!selectedPromptId) return null;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return evaluations[selectedPromptId] || null;
  },

  selectedHygiene: () => {
    const { selectedPromptId, hygiene } = get();
    if (!selectedPromptId) return null;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return hygiene[selectedPromptId] || null;
  },

  fileTree: () => {
    const prompts = get().filteredPrompts();

    // Build tree from file paths using Maps for O(1) child-node lookup.
    // Each directory level uses a Map<childName, FileTreeNode> instead of
    // Array.find() (was O(n) per segment, now O(1)).
    const rootMap = new Map<string, FileTreeNode>();

    for (const prompt of prompts) {
      // Normalize path (cross-platform: backslashes → /, strip long-path prefix)
      let normalized = normalizeFilePath(prompt.file_path);

      // Relativize absolute paths against the vault root
      const root = get().currentFolderPath;
      if (root) {
        const relative = relativizePath(normalized, root);
        if (relative !== null) {
          normalized = relative;
        }
      }

      // Sanitize: remove ".." and "." segments (S4.3 AC-1, AC-2)
      const parts = normalized
        .split("/")
        .filter((p) => p !== ".." && p !== ".")
        .filter(Boolean);

      // Skip prompts whose paths become empty after sanitization
      if (parts.length === 0) {
        console.warn(`Pfad nach Sanitization leer: ${prompt.file_path}`);
        continue;
      }
      let siblingsMap: Map<string, FileTreeNode> = rootMap;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const fullPath = "/" + parts.slice(0, i + 1).join("/");

        let existing = siblingsMap.get(part);

        if (!existing) {
          existing = {
            name: part,
            path: fullPath,
            is_directory: !isLast,
            children: [],
          };
          siblingsMap.set(part, existing);
        }

        if (isLast) {
          existing.prompt_id = prompt.id;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          existing.score = get().evaluations[prompt.id]?.overall_score;
          existing.is_favorite = prompt.is_favorite;
        }

        // Build a children-map on demand for the next depth level
        if (!existing._childrenMap) {
          existing._childrenMap = new Map();
        }
        siblingsMap = existing._childrenMap;
      }
    }

    // Convert maps to sorted arrays: directories before files, then alphabetically
    const mapToSortedArray = (
      map: Map<string, FileTreeNode>,
    ): FileTreeNode[] => {
      const nodes: FileTreeNode[] = [];
      for (const node of map.values()) {
        if (node._childrenMap) {
          node.children = mapToSortedArray(node._childrenMap);
          delete node._childrenMap; // clean up transient map
        }
        nodes.push(node);
      }
      nodes.sort((a, b) => {
        if (a.is_directory !== b.is_directory) return a.is_directory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      return nodes;
    };

    return mapToSortedArray(rootMap);
  },

  allCategories: () => {
    const cats = new Set(get().prompts.map((p) => p.category));
    return Array.from(cats).sort();
  },

  allTags: () => {
    const tags = new Set(get().prompts.flatMap((p) => p.tags));
    return Array.from(tags).sort();
  },

  // Async actions
  scanFolder: async (path: string) => {
    // Clean up old watcher before starting a new one
    const oldUnlisten = get()._watcherUnlisten;
    if (oldUnlisten) {
      oldUnlisten();
    }

    set({ isLoading: true, error: null });
    try {
      const prompts = await scanDirectory(path);

      // Start the file watcher
      await startFileWatcher(path);

      // Set up event listener for watcher:changed
      const unlisten = await listen<ChangedPayload>(
        "watcher:changed",
        (event) => {
          const { added, modified, removed } = event.payload;
          const count = added.length + modified.length + removed.length;
          if (count > 0) {
            set({
              watcherNotification: `Dateisystem-Änderung erkannt (${count} Datei(en)) – aktualisiere...`,
            });

            // Auto-clear notification after 3 seconds
            setTimeout(() => {
              set({ watcherNotification: null });
            }, 3000);

            // Re-scan the current folder
            const folderPath = get().currentFolderPath;
            if (folderPath) {
              scanDirectory(folderPath)
                .then((updatedPrompts) => {
                  set({ prompts: updatedPrompts });
                })
                .catch((err) => {
                  console.error("Re-scan fehlgeschlagen:", err);
                });
            }
          }
        },
      );

      set({
        prompts,
        isLoading: false,
        currentFolderPath: path,
        _watcherUnlisten: unlisten,
      });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  analyzeSelected: async () => {
    const prompt = get().selectedPrompt();
    if (!prompt) return;

    set({ isAnalyzing: true });
    try {
      const [evaluation, hygiene] = await Promise.all([
        evaluatePrompt(prompt.id, prompt.content),
        analyzeHygiene(prompt.id, prompt.content),
      ]);
      set((state) => ({
        evaluations: { ...state.evaluations, [prompt.id]: evaluation },
        hygiene: { ...state.hygiene, [prompt.id]: hygiene },
        isAnalyzing: false,
      }));
    } catch (err) {
      set({ error: String(err), isAnalyzing: false });
    }
  },

  analyzeAll: async () => {
    const { prompts } = get();
    if (prompts.length === 0) return;

    set({ isAnalyzing: true });
    try {
      const report = await tauriAnalyzeAll(prompts);

      set((state) => {
        const evals = { ...state.evaluations };
        const hyg = { ...state.hygiene };
        for (let i = 0; i < prompts.length; i++) {
          evals[prompts[i].id] = report.evaluations[i];
          hyg[prompts[i].id] = report.hygiene[i];
        }
        return { evaluations: evals, hygiene: hyg, isAnalyzing: false };
      });
    } catch (err) {
      set({ error: String(err), isAnalyzing: false });
    }
  },
}));
