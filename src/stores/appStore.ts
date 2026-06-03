import { create } from "zustand";
import type {
  PromptItem,
  PromptEvaluation,
  PromptHygiene,
  PromptFilters,
  FileTreeNode,
} from "@/types";
import { scanDirectory, evaluatePrompt, analyzeHygiene } from "@/lib/tauri";

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

  // Actions
  setPrompts: (prompts) => set({ prompts }),

  selectPrompt: (id) => set({ selectedPromptId: id }),

  setEvaluation: (promptId, evaluation) =>
    set((state) => ({
      evaluations: { ...state.evaluations, [promptId]: evaluation },
    })),

  setHygiene: (promptId, hygiene) =>
    set((state) => ({
      hygiene: { ...state.hygiene, [promptId]: hygiene },
    })),

  toggleFavorite: (promptId) =>
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.id === promptId ? { ...p, is_favorite: !p.is_favorite } : p,
      ),
    })),

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  resetFilters: () => set({ filters: { ...defaultFilters } }),

  toggleFolder: (path) =>
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedFolders: next };
    }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Derived data
  filteredPrompts: () => {
    const { prompts, filters } = get();
    return prompts.filter((p) => {
      if (filters.favoritesOnly && !p.is_favorite) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.hygieneStatus) {
        const h = get().hygiene[p.id];
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
    return evaluations[selectedPromptId] || null;
  },

  selectedHygiene: () => {
    const { selectedPromptId, hygiene } = get();
    if (!selectedPromptId) return null;
    return hygiene[selectedPromptId] || null;
  },

  fileTree: () => {
    const prompts = get().filteredPrompts();

    // Build tree from file paths
    const root: Record<string, FileTreeNode> = {};

    for (const prompt of prompts) {
      const parts = prompt.file_path.split("/").filter(Boolean);
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const fullPath = "/" + parts.slice(0, i + 1).join("/");

        if (!current[part]) {
          current[part] = {
            name: part,
            path: fullPath,
            is_directory: !isLast,
            children: [],
            ...(isLast
              ? {
                  prompt_id: prompt.id,
                  score: get().evaluations[prompt.id]?.overall_score,
                  is_favorite: prompt.is_favorite,
                }
              : {}),
          };
        }
        current = current[part].children.reduce(
          (acc, child) => ({ ...acc, [child.name]: child }),
          {} as Record<string, FileTreeNode>,
        );
      }
    }

    return Object.values(root).sort((a, b) => {
      if (a.is_directory !== b.is_directory) return a.is_directory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
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
    set({ isLoading: true, error: null });
    try {
      const prompts = await scanDirectory(path);
      set({ prompts, isLoading: false });
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
