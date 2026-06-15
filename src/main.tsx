import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { useAppStore } from "./stores/appStore";
import { setHandlerContext } from "./actions/handlers";

// Initialize action handler context from app store
// This is a lazy bridge: handlers pull latest store state on each call
const store = useAppStore;
setHandlerContext({
  getPrompts: () => store.getState().prompts,
  getEvaluation: (promptId: string) =>
    store.getState().evaluations[promptId] ?? null,
  getHygiene: (promptId: string) => store.getState().hygiene[promptId] ?? null,
  getContextEvaluation: (promptId: string) =>
    store.getState().contextEvaluations[promptId] ?? null,
  evaluatePrompt: async (promptId: string, content: string) => {
    const { evaluatePrompt: tauriEval } = await import("./lib/tauri");
    return tauriEval(promptId, content);
  },
  analyzeHygiene: async (promptId: string, content: string) => {
    const { analyzeHygiene: tauriHygiene } = await import("./lib/tauri");
    return tauriHygiene(promptId, content);
  },
  createPrompt: async (input) => {
    const { createPrompt: tauriCreate } = await import("./lib/tauri");
    return tauriCreate(input);
  },
  updatePrompt: async (input) => {
    const { updatePrompt: tauriUpdate } = await import("./lib/tauri");
    return tauriUpdate(input);
  },
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
