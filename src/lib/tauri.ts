import { invoke } from "@tauri-apps/api/core";
import type {
  PromptItem,
  PromptEvaluation,
  PromptHygiene,
  AnalysisReport,
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

export async function getFavorites(): Promise<string[]> {
  return invoke<string[]>("get_favorites");
}

// --- Export ---

export async function exportJson(
  promptIds: string[],
  exportPath: string,
): Promise<void> {
  return invoke<void>("export_json", { promptIds, exportPath });
}

export async function exportMarkdown(
  promptIds: string[],
  exportPath: string,
): Promise<void> {
  return invoke<void>("export_markdown", { promptIds, exportPath });
}

export async function exportZip(
  promptIds: string[],
  exportPath: string,
): Promise<void> {
  return invoke<void>("export_zip", { promptIds, exportPath });
}

// --- Persistenz ---

export async function loadCache(): Promise<PromptItem[]> {
  return invoke<PromptItem[]>("load_cache");
}

export async function saveCache(prompts: PromptItem[]): Promise<void> {
  return invoke<void>("save_cache", { prompts });
}
