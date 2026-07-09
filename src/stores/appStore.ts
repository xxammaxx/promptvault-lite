import { create } from "zustand";
import type {
  PromptItem,
  PromptEvaluation,
  PromptHygiene,
  PromptFilters,
  FileTreeNode,
  PromptContextEvaluation,
  BlueprintDetectOutput,
  BlueprintEvaluation,
  MissingInfoSession,
  MissingInfoAnswer,
  EnrichedPromptContext,
  GateOutcome,
} from "@/types";
import {
  scanDirectory,
  evaluatePrompt,
  analyzeHygiene,
  analyzeAll as tauriAnalyzeAll,
  startFileWatcher,
  stopFileWatcher,
  toggleFavorite as tauriToggleFavorite,
  createPrompt as tauriCreatePrompt,
  updatePrompt as tauriUpdatePrompt,
} from "@/lib/tauri";
import { evaluatePromptContext } from "@/lib/promptContextEvaluation";
import { classifyContent } from "@/lib/blueprintDetection";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import type { HandlerContext } from "@/actions/handlers";
import type { CreatePromptInput, UpdatePromptInput } from "@/types";
import { detectGaps } from "@/lib/missingInfoDetector";
import {
  classify,
  type ClassificationContext,
} from "@/lib/missingInfoClassifier";
import { mergeAnswers } from "@/lib/gateContentMerger";
import { isMissingInfoGateEnabled } from "@/lib/missingInfoFeatureFlag";

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

// --- Export Format Types (Issue #63) ---

export type ExportFormat = "json" | "markdown" | "csv";

const EXPORT_FORMAT_KEY = "promptvault.settings.exportFormat";
const VALID_EXPORT_FORMATS: Set<string> = new Set(["json", "markdown", "csv"]);

function getExportFormatFromStorage(): ExportFormat {
  try {
    const stored = localStorage.getItem(EXPORT_FORMAT_KEY);
    if (stored && VALID_EXPORT_FORMATS.has(stored)) {
      return stored as ExportFormat;
    }
  } catch {
    // localStorage not available
  }
  return "json";
}

function saveExportFormatToStorage(format: ExportFormat): void {
  try {
    localStorage.setItem(EXPORT_FORMAT_KEY, format);
  } catch {
    // silent fail
  }
}

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

export function clampExplorerWidth(width: number): number {
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
  contextEvaluations: Record<string, PromptContextEvaluation>;
  blueprintDetections: Record<string, BlueprintDetectOutput>;
  blueprintEvaluations: Record<string, BlueprintEvaluation>;

  // Missing-Info-Gate (#216, Batch 3 — Session-Only, No Persistence)
  missingInfoSessions: Record<string, MissingInfoSession>;
  enrichedContexts: Record<string, EnrichedPromptContext>;
  isGateOpen: boolean;
  activeGatePromptId: string | null;
  /** Skipped gate item IDs per promptId (not in MissingInfoSession type). */
  gateSkippedItems: Record<string, string[]>;

  // UI
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  filters: PromptFilters;
  expandedFolders: Set<string>;

  // Layout
  explorerWidth: number;

  // Theme
  theme: Theme;

  // Export settings (Issue #63)
  exportFormat: ExportFormat;

  // Dev Mode
  devMode: boolean;

  // Watcher
  currentFolderPath: string | null;
  watcherNotification: string | null;
  _watcherUnlisten: UnlistenFn | null;

  // Actions
  setPrompts: (prompts: PromptItem[]) => void;
  selectPrompt: (id: string | null) => void;
  setEvaluation: (promptId: string, evaluation: PromptEvaluation) => void;
  setHygiene: (promptId: string, hygiene: PromptHygiene) => void;
  setContextEvaluation: (
    promptId: string,
    evaluation: PromptContextEvaluation,
  ) => void;
  setBlueprintDetection: (
    promptId: string,
    detection: BlueprintDetectOutput,
  ) => void;
  setBlueprintEvaluation: (
    promptId: string,
    evaluation: BlueprintEvaluation,
  ) => void;
  toggleFavorite: (promptId: string) => Promise<void>;
  setFilters: (filters: Partial<PromptFilters>) => void;
  resetFilters: () => void;
  toggleFolder: (path: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearWatcherNotification: () => void;
  cleanupWatcher: () => Promise<void>;

  // Layout actions
  setExplorerWidth: (width: number) => void;

  // Theme actions
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;

  // Export actions (Issue #63)
  setExportFormat: (format: ExportFormat) => void;

  // Dev Mode actions
  toggleDevMode: () => void;

  // Reset all settings to defaults (Issue #63)
  resetSettings: () => void;

  // Handler context provider
  getHandlerContext: () => HandlerContext;

  // Derived
  filteredPrompts: () => PromptItem[];
  selectedPrompt: () => PromptItem | null;
  selectedEvaluation: () => PromptEvaluation | null;
  selectedHygiene: () => PromptHygiene | null;
  selectedContextEvaluation: () => PromptContextEvaluation | null;
  selectedBlueprintDetection: () => BlueprintDetectOutput | null;
  selectedBlueprintEvaluation: () => BlueprintEvaluation | null;
  fileTree: () => FileTreeNode[];
  allCategories: () => string[];
  allTags: () => string[];

  // Missing-Info-Gate Actions (#216, Batch 3)
  openMissingInfoGate: (promptId: string) => void;
  answerGateItem: (promptId: string, answer: MissingInfoAnswer) => void;
  skipGateItem: (promptId: string, itemId: string) => void;
  completeGate: (promptId: string, outcome: GateOutcome) => void;
  closeGate: () => void;
  resetGateSession: (promptId: string) => void;
  getSessionForPrompt: (promptId: string) => MissingInfoSession | undefined;

  // Async actions
  scanFolder: (path: string) => Promise<void>;
  analyzeSelected: () => Promise<void>;
  analyzeAll: () => Promise<void>;
  batchClassifyBlueprints: () => Promise<void>;
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
  contextEvaluations: {},
  blueprintDetections: {},
  blueprintEvaluations: {},

  // Missing-Info-Gate initial state (Batch 3 — Session-Only)
  missingInfoSessions: {},
  enrichedContexts: {},
  isGateOpen: false,
  activeGatePromptId: null,
  gateSkippedItems: {},

  isLoading: false,
  isAnalyzing: false,
  error: null,
  filters: { ...defaultFilters },
  expandedFolders: new Set<string>(),

  // Layout state
  explorerWidth: getExplorerWidthFromStorage(),

  // Theme state
  theme: getThemeFromStorage(),

  // Export format (Issue #63)
  exportFormat: getExportFormatFromStorage(),

  // Dev Mode state
  devMode: (() => {
    try {
      return localStorage.getItem("promptvault.devMode") === "true";
    } catch {
      return false;
    }
  })(),

  // Watcher state
  currentFolderPath: null,
  watcherNotification: null,
  _watcherUnlisten: null,

  // Actions
  setPrompts: (prompts) => {
    set({ prompts });
  },

  selectPrompt: (id) => {
    const current = get();
    // Close gate when switching to a different prompt (architecture review R2)
    if (current.isGateOpen && current.activeGatePromptId !== id) {
      set({ isGateOpen: false, activeGatePromptId: null });
    }
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

  setContextEvaluation: (promptId, evaluation) => {
    set((state) => ({
      contextEvaluations: {
        ...state.contextEvaluations,
        [promptId]: evaluation,
      },
    }));
  },

  setBlueprintDetection: (promptId, detection) => {
    set((state) => ({
      blueprintDetections: {
        ...state.blueprintDetections,
        [promptId]: detection,
      },
    }));
  },

  setBlueprintEvaluation: (promptId, evaluation) => {
    set((state) => ({
      blueprintEvaluations: {
        ...state.blueprintEvaluations,
        [promptId]: evaluation,
      },
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
    // Stop backend watcher (only in Tauri context)
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      try {
        await stopFileWatcher();
      } catch (err) {
        console.error("Fehler beim Stoppen des Watchers:", err);
      }
    }
    set({
      _watcherUnlisten: null,
      currentFolderPath: null,
      watcherNotification: null,
    });
  },

  // Layout actions
  setExplorerWidth: (width) => {
    // Guard against NaN, Infinity, and other non-finite values
    if (!Number.isFinite(width)) return;

    const clamped = Math.min(
      MAX_EXPLORER_WIDTH,
      Math.max(MIN_EXPLORER_WIDTH, Math.round(width)),
    );
    saveExplorerWidthToStorage(clamped);
    set({ explorerWidth: clamped });
  },

  // Theme actions
  toggleTheme: () => {
    set((state) => {
      const next = THEME_CYCLE[state.theme];
      saveThemeToStorage(next);
      return { theme: next };
    });
  },

  setTheme: (theme: Theme) => {
    // Guard against invalid theme values at runtime
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard
    if (theme !== "light" && theme !== "dark" && theme !== "auto") return;
    saveThemeToStorage(theme);
    set({ theme });
  },

  // Export actions (Issue #63)
  setExportFormat: (format: ExportFormat) => {
    if (!VALID_EXPORT_FORMATS.has(format)) return;
    saveExportFormatToStorage(format);
    set({ exportFormat: format });
  },

  // Reset all settings to defaults (Issue #63)
  resetSettings: () => {
    saveThemeToStorage("dark");
    saveExportFormatToStorage("json");
    try {
      localStorage.removeItem("promptvault.devMode");
    } catch {
      // silent fail
    }
    set({
      theme: "dark",
      exportFormat: "json",
      devMode: false,
    });
  },

  // Dev Mode actions
  toggleDevMode: () => {
    set((state) => {
      const next = !state.devMode;
      try {
        if (next) {
          localStorage.setItem("promptvault.devMode", "true");
        } else {
          localStorage.removeItem("promptvault.devMode");
        }
      } catch {
        // silent fail
      }
      return { devMode: next };
    });
  },

  // Handler context builder
  getHandlerContext: (): HandlerContext => {
    const state = get();
    return {
      getPrompts: () => state.prompts,
      getEvaluation: (promptId: string) => state.evaluations[promptId] ?? null,
      getHygiene: (promptId: string) => state.hygiene[promptId] ?? null,
      getContextEvaluation: (promptId: string) =>
        state.contextEvaluations[promptId] ?? null,
      evaluatePrompt: (promptId: string, content: string) =>
        evaluatePrompt(promptId, content),
      analyzeHygiene: (promptId: string, content: string) =>
        analyzeHygiene(promptId, content),
      createPrompt: async (input: CreatePromptInput) => {
        return tauriCreatePrompt(input);
      },
      updatePrompt: async (input: UpdatePromptInput) => {
        return tauriUpdatePrompt(input);
      },
    };
  },

  // ==========================================================================
  // Missing-Info-Gate Actions (Batch 3 — #233-#236)
  // ==========================================================================

  /**
   * Opens the Missing-Info-Gate for a given promptId.
   * Detects gaps from existing analysis data, classifies them,
   * and creates a new session (or reopens an existing one).
   *
   * Gate is feature-flag gated: no-op if PROMPTVAULT_MISSING_INFO_GATE is disabled.
   * BLOCKING_SENSITIVE_CONTENT: gate never opens.
   * Existing session: just sets isGateOpen=true (edit mode, answers pre-filled).
   */
  openMissingInfoGate: (promptId: string) => {
    // Feature-flag gate
    if (
      !isMissingInfoGateEnabled(
        (typeof process !== "undefined" ? process.env : undefined) as
          | Record<string, string | undefined>
          | undefined,
      )
    ) {
      return;
    }

    const state = get();
    const existingSession = state.missingInfoSessions[promptId];

    // Reopen existing session (edit mode — answers are pre-filled)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard: Record<T> is always truthy per TS but may be undefined at runtime
    if (existingSession) {
      set({
        isGateOpen: true,
        activeGatePromptId: promptId,
        // Reset status to ACTIVE if it was CANCELLED or completed
        missingInfoSessions: {
          ...state.missingInfoSessions,
          [promptId]: {
            ...existingSession,
            status: "ACTIVE" as const,
          },
        },
      });
      return;
    }

    // Need analysis data to detect gaps
    const contextEval = state.contextEvaluations[promptId];
    const hygiene = state.hygiene[promptId];
    const blueprintEval = state.blueprintEvaluations[promptId];
    const prompt = state.prompts.find((p) => p.id === promptId);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard: Record<T> may not have key
    if (!contextEval) {
      set({
        error: "Keine Analyse-Daten vorhanden. Bitte zuerst analysieren.",
      });
      return;
    }

    // BLOCKING_SENSITIVE_CONTENT gate (security boundary)
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    if (
      state.blueprintDetections[promptId]?.contamination_status ===
        "BLOCKING_SENSITIVE_CONTENT" ||
      blueprintEval?.contamination_status === "BLOCKING_SENSITIVE_CONTENT"
    ) {
      /* eslint-enable @typescript-eslint/no-unnecessary-condition */
      return; // Gate never opens
    }

    try {
      // 1. Detect gaps from analysis data
      const rawItems = detectGaps({
        contextEval,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard
        hygiene: hygiene ?? {
          id: `hyg-${promptId}`,
          prompt_id: promptId,
          hygiene_score: 100,
          status: "clean",
          artifacts: [],
          analyzed_at: new Date().toISOString(),
        },
        blueprintEval,
        promptContentLength: prompt?.content.length,
        contaminationStatusOverride:
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          blueprintEval?.contamination_status,
      });

      if (rawItems.length === 0) {
        // No gaps detected — still create a session for potential manual trigger
        set({
          missingInfoSessions: {
            ...state.missingInfoSessions,
            [promptId]: {
              sessionId: `MIG-${promptId}-${Date.now()}`,
              promptId,
              startedAt: new Date().toISOString(),
              items: [],
              answers: {},
              status: "ACTIVE",
              outcome: null,
              enrichedContent: null,
            },
          },
          isGateOpen: true,
          activeGatePromptId: promptId,
        });
        return;
      }

      // 2. Build classification context map from raw evaluation data
      const isSimplePrompt =
        contextEval.detected_prompt_type === "simple_prompt";
      const isAgenticPrompt =
        contextEval.detected_prompt_type === "agentic_prompt";
      const isMinimalContext =
        contextEval.detected_context_profile === "minimal";

      const contextMap: Record<string, ClassificationContext> = {};

      for (const item of rawItems) {
        const ctx: ClassificationContext = { source: item.source };

        if (item.source === "risk_flag") {
          const flag = contextEval.risk_flags.find(
            (f) => f.flag === item.label,
          );
          if (flag) {
            ctx.riskSeverity = flag.severity;
          }
        } else if (
          item.source === "prompt_engineering" ||
          item.source === "context_engineering" ||
          item.source === "agent_readiness"
        ) {
          const criterion = contextEval.criteria.find(
            (c) => c.name === item.label,
          );
          if (criterion) {
            ctx.criterionScore = criterion.score;
            ctx.criterionDimension = criterion.dimension;
          }
          // Check for suggested improvements
          const improvement = contextEval.suggested_improvements.find(
            (si) => si.criterion === item.label,
          );
          if (improvement) {
            ctx.improvementPriority = improvement.priority;
          }
        } else if (item.source === "hygiene") {
          ctx.hygieneScore = hygiene.hygiene_score;
        }

        ctx.isSimplePrompt = isSimplePrompt;
        ctx.isAgenticPrompt = isAgenticPrompt;
        ctx.isMinimalContext = isMinimalContext;

        contextMap[item.id] = ctx;
      }

      // 3. Classify
      const classificationResult = classify(rawItems, contextMap);

      // 4. Create session
      const session: MissingInfoSession = {
        sessionId: `MIG-${promptId}-${Date.now()}`,
        promptId,
        startedAt: new Date().toISOString(),
        items: classificationResult.items,
        answers: {},
        status: "ACTIVE",
        outcome: null,
        enrichedContent: null,
      };

      set({
        missingInfoSessions: {
          ...state.missingInfoSessions,
          [promptId]: session,
        },
        isGateOpen: true,
        activeGatePromptId: promptId,
        // Reset skipped items for new session
        gateSkippedItems: {
          ...state.gateSkippedItems,
          [promptId]: [],
        },
      });
    } catch (err) {
      set({ error: `Gate-Öffnung fehlgeschlagen: ${String(err)}` });
    }
  },

  /** Stores an answer for a gate item. Answers are editable (no overwrite guard). */
  answerGateItem: (promptId: string, answer: MissingInfoAnswer) => {
    set((state) => {
      const session = state.missingInfoSessions[promptId];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard: Record key may not exist
      if (!session || session.status !== "ACTIVE") return {};
      return {
        missingInfoSessions: {
          ...state.missingInfoSessions,
          [promptId]: {
            ...session,
            answers: {
              ...session.answers,
              [answer.itemId]: answer,
            },
          },
        },
      };
    });
  },

  /** Marks a gate item as skipped. Only RECOMMENDED/OPTIONAL items can be skipped. */
  skipGateItem: (promptId: string, itemId: string) => {
    set((state) => {
      const session = state.missingInfoSessions[promptId];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard
      if (!session || session.status !== "ACTIVE") return {};

      const item = session.items.find((i) => i.id === itemId);
      // REQUIRED items cannot be skipped
      if (!item || item.tier === "REQUIRED") return {};

      const existingSkipped = state.gateSkippedItems[promptId] ?? [];
      if (existingSkipped.includes(itemId)) return {};

      return {
        gateSkippedItems: {
          ...state.gateSkippedItems,
          [promptId]: [...existingSkipped, itemId],
        },
        missingInfoSessions: {
          ...state.missingInfoSessions,
          [promptId]: {
            ...session,
            // Remove answer if previously answered
            answers: Object.fromEntries(
              Object.entries(session.answers).filter(([key]) => key !== itemId),
            ),
          },
        },
      };
    });
  },

  /**
   * Completes the gate session for a promptId.
   * Merges answers via gateContentMerger and creates an EnrichedPromptContext.
   * Only possible if all REQUIRED items are answered OR outcome is SKIPPED/ASSUMPTIONS.
   */
  completeGate: (promptId: string, outcome: GateOutcome) => {
    set((state) => {
      const session = state.missingInfoSessions[promptId];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard
      if (!session) return {};

      const prompt = state.prompts.find((p) => p.id === promptId);
      if (!prompt) return {};

      // Validate: all REQUIRED items must be answered (unless SKIPPED/ASSUMPTIONS)
      if (outcome === "COMPLETED") {
        const requiredItems = session.items.filter(
          (i) => i.tier === "REQUIRED",
        );
        const requiredUnanswered = requiredItems.some(
          (item) =>
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard
            !session.answers[item.id]?.value?.trim() &&
            !(state.gateSkippedItems[promptId] ?? []).includes(item.id),
        );
        if (requiredUnanswered) {
          // Can't complete — missing required answers
          return {};
        }
      }

      // Collect answers as array for mergeAnswers
      const answersArray = Object.values(session.answers);
      const skippedItemIds = new Set(state.gateSkippedItems[promptId] ?? []);

      // Merge answers into original content
      const mergeResult = mergeAnswers(
        prompt.content,
        answersArray,
        session.items,
        outcome,
        { skippedItemIds },
      );

      // Determine enriched content: null for SKIPPED, merged for COMPLETED/ASSUMPTIONS
      const enrichedContent =
        outcome === "SKIPPED" ? null : mergeResult.enrichedContent;

      const enrichedContext: EnrichedPromptContext = {
        originalContent: prompt.content,
        enrichedContent: enrichedContent ?? prompt.content,
        answers: answersArray,
        gateOutcome: outcome,
        sessionId: session.sessionId,
        enrichedAt: new Date().toISOString(),
      };

      return {
        missingInfoSessions: {
          ...state.missingInfoSessions,
          [promptId]: {
            ...session,
            status: outcome,
            outcome,
            enrichedContent,
          },
        },
        enrichedContexts: {
          ...state.enrichedContexts,
          [promptId]: enrichedContext,
        },
        isGateOpen: false,
        activeGatePromptId: null,
      };
    });
  },

  /** Closes the gate modal without discarding the session (CANCELLED status). */
  closeGate: () => {
    set((state) => {
      const promptId = state.activeGatePromptId;
      if (!promptId) {
        return { isGateOpen: false, activeGatePromptId: null };
      }
      const session = state.missingInfoSessions[promptId];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime guard
      if (!session) {
        return { isGateOpen: false, activeGatePromptId: null };
      }
      return {
        isGateOpen: false,
        activeGatePromptId: null,
        missingInfoSessions: {
          ...state.missingInfoSessions,
          [promptId]: {
            ...session,
            status: "CANCELLED",
          },
        },
      };
    });
  },

  /**
   * Discards the gate session and enriched context for a promptId.
   * Used for invalidation (e.g., after analyzeSelected).
   */
  resetGateSession: (promptId: string) => {
    set((state) => {
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        [promptId]: _removedSession,
        ...remainingSessions
      } = state.missingInfoSessions;
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        [promptId]: _removedContext,
        ...remainingContexts
      } = state.enrichedContexts;
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        [promptId]: _removedSkipped,
        ...remainingSkipped
      } = state.gateSkippedItems;

      return {
        missingInfoSessions: remainingSessions,
        enrichedContexts: remainingContexts,
        gateSkippedItems: remainingSkipped,
        // If this was the active gate, close it
        ...(state.activeGatePromptId === promptId
          ? { isGateOpen: false, activeGatePromptId: null }
          : {}),
      };
    });
  },

  /** Selector: get the session for a given promptId. */
  getSessionForPrompt: (promptId: string): MissingInfoSession | undefined => {
    return get().missingInfoSessions[promptId];
  },

  // Derived data
  filteredPrompts: () => {
    const { prompts, filters, evaluations } = get();
    return prompts.filter((p) => {
      if (filters.favoritesOnly && !p.is_favorite) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.hygieneStatus) {
        const h = get().hygiene[p.id];
        // Record<string,T> indexing returns T (not T|undefined) without
        // noUncheckedIndexedAccess, but runtime safety requires this guard.
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
    // Record<string,T> indexing returns T (not T|undefined) without
    // noUncheckedIndexedAccess, but runtime safety requires || null fallback.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return evaluations[selectedPromptId] || null;
  },

  selectedHygiene: () => {
    const { selectedPromptId, hygiene } = get();
    if (!selectedPromptId) return null;
    return hygiene[selectedPromptId] ?? null;
  },

  selectedContextEvaluation: () => {
    const { selectedPromptId, contextEvaluations } = get();
    if (!selectedPromptId) return null;
    return contextEvaluations[selectedPromptId] ?? null;
  },

  selectedBlueprintDetection: () => {
    const { selectedPromptId, blueprintDetections } = get();
    if (!selectedPromptId) return null;
    return blueprintDetections[selectedPromptId] ?? null;
  },

  selectedBlueprintEvaluation: () => {
    const { selectedPromptId, blueprintEvaluations } = get();
    if (!selectedPromptId) return null;
    return blueprintEvaluations[selectedPromptId] ?? null;
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
          // Record<string,T> indexing returns T (not T|undefined) without
          // noUncheckedIndexedAccess, but a prompt may not have an evaluation yet.
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
      // Capture the folder path at registration time (defense-in-depth:
      // avoid race where currentFolderPath changes before the event fires)
      const watchedPath = path;
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

            // Re-scan the folder (use captured path for safety)
            if (watchedPath) {
              scanDirectory(watchedPath)
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
      // Context evaluation runs synchronously (pure TypeScript, no network)
      const contextEval = evaluatePromptContext(prompt.content);
      set((state) => ({
        evaluations: { ...state.evaluations, [prompt.id]: evaluation },
        hygiene: { ...state.hygiene, [prompt.id]: hygiene },
        contextEvaluations: {
          ...state.contextEvaluations,
          [prompt.id]: contextEval,
        },
        isAnalyzing: false,
      }));

      // Invalidate stale gate session (new analysis = new gaps)
      get().resetGateSession(prompt.id);
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
        const ctxEvals = { ...state.contextEvaluations };
        for (let i = 0; i < prompts.length; i++) {
          evals[prompts[i].id] = report.evaluations[i];
          hyg[prompts[i].id] = report.hygiene[i];
          ctxEvals[prompts[i].id] = evaluatePromptContext(prompts[i].content);
        }
        return {
          evaluations: evals,
          hygiene: hyg,
          contextEvaluations: ctxEvals,
          isAnalyzing: false,
        };
      });
    } catch (err) {
      set({ error: String(err), isAnalyzing: false });
    }
  },

  // ---------------------------------------------------------------------------
  // batchClassifyBlueprints — Issue #150
  // Batch classifies content after scan/import so Explorer badges appear
  // immediately. Uses chunked/yielded processing to keep UI responsive.
  // Only classifies; evaluation remains lazy-on-select (T8).
  // ---------------------------------------------------------------------------
  batchClassifyBlueprints: async () => {
    const CHUNK_SIZE = 25;
    const prompts = get().prompts;

    for (let i = 0; i < prompts.length; i += CHUNK_SIZE) {
      const chunk = prompts.slice(i, i + CHUNK_SIZE);
      const newDetections: Record<string, BlueprintDetectOutput> = {};

      for (const item of chunk) {
        // Skip items without content or whitespace-only content
        if (!item.content || item.content.trim().length === 0) continue;

        try {
          newDetections[item.id] = classifyContent(item.content);
        } catch (_err) {
          // Error-safe: don't crash the batch, don't log content or secrets
          console.error("Batch classification failed for item");
        }
      }

      // Update all detections for this chunk in a single set call to
      // minimize React re-renders and Zustand subscriber notifications.
      if (Object.keys(newDetections).length > 0) {
        set((state) => ({
          blueprintDetections: {
            ...state.blueprintDetections,
            ...newDetections,
          },
        }));
      }

      // Yield to the event loop between chunks to keep UI responsive.
      // setTimeout(0) places the callback on the macrotask queue, allowing
      // the WebView to process pending renders and user interactions.
      if (i + CHUNK_SIZE < prompts.length) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  },
}));
