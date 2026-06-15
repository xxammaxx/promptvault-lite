import { invoke } from "@tauri-apps/api/core";
import type {
  PromptItem,
  PromptEvaluation,
  PromptHygiene,
  AnalysisReport,
  CreatePromptInput,
  UpdatePromptInput,
} from "@/types";

// =============================================================================
// Typisierte Tauri API-Wrapper für PromptVault Lite
// =============================================================================

// --- Scanner ---

export async function scanDirectory(path: string): Promise<PromptItem[]> {
  return invoke<PromptItem[]>("scan_directory", { path });
}

// --- Analyse ---

export async function evaluatePrompt(
  promptId: string,
  content: string,
): Promise<PromptEvaluation> {
  return invoke<PromptEvaluation>("evaluate_prompt", {
    promptId,
    content,
  });
}

export async function analyzeHygiene(
  promptId: string,
  content: string,
): Promise<PromptHygiene> {
  return invoke<PromptHygiene>("analyze_hygiene", {
    promptId,
    content,
  });
}

export async function analyzeAll(
  prompts: PromptItem[],
): Promise<AnalysisReport> {
  return invoke<AnalysisReport>("analyze_all", { prompts });
}

// --- Favoriten ---

export async function toggleFavorite(promptId: string): Promise<boolean> {
  return invoke<boolean>("toggle_favorite", { promptId });
}

// --- Export ---

export async function exportJson(
  promptIds: string[],
  exportPath: string,
  evaluations: PromptEvaluation[],
  hygiene: PromptHygiene[],
): Promise<string> {
  return invoke<string>("export_json", {
    promptIds,
    exportPath,
    evaluations,
    hygiene,
  });
}

export async function exportMarkdown(
  promptIds: string[],
  exportPath: string,
  evaluations: PromptEvaluation[],
  hygiene: PromptHygiene[],
): Promise<string> {
  return invoke<string>("export_markdown", {
    promptIds,
    exportPath,
    evaluations,
    hygiene,
  });
}

export async function exportZip(
  promptIds: string[],
  exportPath: string,
  evaluations: PromptEvaluation[],
  hygiene: PromptHygiene[],
): Promise<string> {
  return invoke<string>("export_zip", {
    promptIds,
    exportPath,
    evaluations,
    hygiene,
  });
}

// --- File Watcher ---

export async function startFileWatcher(path: string): Promise<void> {
  await invoke("start_file_watcher", { path });
}

export async function stopFileWatcher(): Promise<void> {
  await invoke("stop_file_watcher");
}

// --- Prompt CRUD ---

export async function createPrompt(
  input: CreatePromptInput,
): Promise<PromptItem> {
  return invoke<PromptItem>("create_prompt", { input });
}

export async function updatePrompt(
  input: UpdatePromptInput,
): Promise<PromptItem> {
  return invoke<PromptItem>("update_prompt", { input });
}
