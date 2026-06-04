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
  startFileWatcher,
  stopFileWatcher,
} from "@/lib/tauri";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";

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
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  filters: PromptFilters;
  expandedFolders: Set<string>;

  // Watcher
  currentFolderPath: string | null;
  watcherNotification: string | null;
  _watcherUnlisten: UnlistenFn | null;

  // Actions
  setPrompts: (prompts: PromptItem[]) => void;
  selectPrompt: (id: string | null) => void;
  setEvaluation: (promptId: string, evaluation: PromptEvaluation) => void;
  setHygiene: (promptId: string, hygiene: PromptHygiene) => void;
  toggleFavorite: (promptId: string) => void;
  setFilters: (filters: Partial<PromptFilters>) => void;
  resetFilters: () => void;
  toggleFolder: (path: string) => void;
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
  isLoading: false,
  isAnalyzing: false,
  error: null,
  filters: { ...defaultFilters },
  expandedFolders: new Set<string>(),

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

  toggleFavorite: (promptId) => {
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.id === promptId ? { ...p, is_favorite: !p.is_favorite } : p,
      ),
    }));
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
    const { prompts, filters } = get();
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
        return (
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.content.toLowerCase().includes(q)
        );
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
      // Normalize backslashes from Windows scanner output
      let normalized = prompt.file_path.replace(/\\/g, "/");

      // Relativize absolute paths against the vault root (S4.3 AC-3)
      const root = get().currentFolderPath;
      if (root && normalized.startsWith("/")) {
        const normalizedRoot = root.replace(/\\/g, "/");
        // Ensure we match at a path boundary: /vault should match /vault/file.md
        // but NOT /vault-evil/file.md
        if (
          normalized === normalizedRoot ||
          normalized.startsWith(normalizedRoot + "/")
        ) {
          normalized = normalized.slice(normalizedRoot.length);
          if (normalized.startsWith("/")) {
            normalized = normalized.slice(1);
          }
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
      const batchSize = 10;
      for (let i = 0; i < prompts.length; i += batchSize) {
        const batch = prompts.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (p) => {
            const [evaluation, hygiene] = await Promise.all([
              evaluatePrompt(p.id, p.content),
              analyzeHygiene(p.id, p.content),
            ]);
            return { id: p.id, evaluation, hygiene };
          }),
        );

        set((state) => {
          const evals = { ...state.evaluations };
          const hyg = { ...state.hygiene };
          for (const r of results) {
            evals[r.id] = r.evaluation;
            hyg[r.id] = r.hygiene;
          }
          return { evaluations: evals, hygiene: hyg };
        });
      }
      set({ isAnalyzing: false });
    } catch (err) {
      set({ error: String(err), isAnalyzing: false });
    }
  },
}));
