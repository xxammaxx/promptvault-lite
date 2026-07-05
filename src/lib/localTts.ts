// =============================================================================
// PromptVault Lite — Lokale TTS-Erkennung und Sprachausgabe (Issue #200)
// =============================================================================
//
// Locale-only text-to-speech for Linux desktop environments.
// No cloud TTS. No HTTP calls. No external audio APIs.
// Uses Web Speech API as the primary in-browser TTS layer.
//
// For native Linux TTS (piper, spd-say, espeak-ng), this module provides
// a detection layer. Native execution would require a Tauri command;
// that is marked as a follow-up (issue #200-native-tts).
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LocalTtsProvider =
  | "piper"
  | "speech_dispatcher"
  | "espeak_ng"
  | "web_speech"
  | "none";

export interface LocalTtsStatus {
  available: boolean;
  provider: LocalTtsProvider;
  message?: string;
}

export interface SpeakOptions {
  language?: string;
  voice?: string;
  rate?: number;
}

// Maximum text length for TTS to prevent resource exhaustion
const MAX_TTS_TEXT_LENGTH = 600;

// ---------------------------------------------------------------------------
// Provider Detection
// ---------------------------------------------------------------------------

/**
 * Check if a Linux command is available on the system.
 * Only works in Tauri context with shell access.
 * Returns false if running in browser-only context.
 */
async function isCommandAvailable(command: string): Promise<boolean> {
  // In browser-only context (e.g., dev mode without Tauri), we cannot
  // check for native commands. We return false gracefully.
  if (typeof window === "undefined") return false;

  // Check for Tauri shell plugin availability
  const isTauri = "__TAURI_INTERNALS__" in window || "__TAURI__" in window;

  if (!isTauri) return false;

  try {
    const { Command } = await import("@tauri-apps/plugin-shell");
    const result = await Command.create("which", [command]).execute();
    return result.code === 0;
  } catch {
    // Command plugin not available or command not found
    return false;
  }
}

/**
 * Check if the Web Speech API is available and has at least one
 * German voice installed.
 */
function isWebSpeechAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const synth = window.speechSynthesis;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!synth) return false;

  try {
    const voices = synth.getVoices();
    return voices.some(
      (v) => v.lang.startsWith("de") || v.lang.startsWith("en"),
    );
  } catch {
    return false;
  }
}

/**
 * Detect available local TTS providers.
 *
 * Priority order:
 * 1. Web Speech API (browser-based, always available if voices installed)
 * 2. piper (native Linux TTS)
 * 3. spd-say (speech-dispatcher)
 * 4. espeak-ng (fallback)
 */
export async function detectLocalTts(): Promise<LocalTtsStatus> {
  // --- Check Web Speech API (primary for browser context) ---
  if (isWebSpeechAvailable()) {
    return {
      available: true,
      provider: "web_speech",
      message: "Web Speech API verfügbar.",
    };
  }

  // --- Check native providers (Tauri context only) ---
  const [piperAvailable, spdSayAvailable, espeakNgAvailable] =
    await Promise.all([
      isCommandAvailable("piper"),
      isCommandAvailable("spd-say"),
      isCommandAvailable("espeak-ng"),
    ]);

  if (piperAvailable) {
    return {
      available: true,
      provider: "piper",
      message: "Piper TTS verfügbar (native).",
    };
  }

  if (spdSayAvailable) {
    return {
      available: true,
      provider: "speech_dispatcher",
      message: "Speech Dispatcher (spd-say) verfügbar.",
    };
  }

  if (espeakNgAvailable) {
    return {
      available: true,
      provider: "espeak_ng",
      message: "eSpeak NG verfügbar (Fallback).",
    };
  }

  // --- No provider found ---
  return {
    available: false,
    provider: "none",
    message:
      "Kein TTS-Provider verfügbar. Installieren Sie spd-say (sudo apt install speech-dispatcher) für lokale Sprachausgabe.",
  };
}

/**
 * Synchronous check for Web Speech API availability.
 * Used for quick rendering checks without async overhead.
 */
export function isSpeechSupported(): boolean {
  return isWebSpeechAvailable();
}

// ---------------------------------------------------------------------------
// Speech Control
// ---------------------------------------------------------------------------

let isCurrentlySpeaking = false;

/**
 * Speak text using the Web Speech API.
 * Stops any currently playing speech before starting.
 *
 * @param text - The text to speak (already sanitized)
 * @param options - Optional speech options
 * @returns Promise that resolves when speech is complete or rejects on error
 */
export async function speakLocalText(
  text: string,
  options?: SpeakOptions,
): Promise<void> {
  // Stop any current speech first
  await stopLocalSpeech();

  // Safety: truncate long text
  const safeText =
    text.length > MAX_TTS_TEXT_LENGTH
      ? text.slice(0, MAX_TTS_TEXT_LENGTH - 3) + "..."
      : text;

  if (safeText.trim().length === 0) {
    return;
  }

  // Check Web Speech API availability
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.warn("Web Speech API nicht verfügbar.");
    return;
  }

  return new Promise<void>((resolve, reject) => {
    try {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(safeText);
      utterance.lang = options?.language ?? "de-DE";
      utterance.rate = options?.rate ?? 0.9;

      // Try to find a German voice
      const voices = synth.getVoices();
      const germanVoice = voices.find((v) => v.lang.startsWith("de"));
      if (germanVoice) {
        utterance.voice = germanVoice;
      } else {
        // Fallback: any English voice is better than the default
        const englishVoice = voices.find((v) => v.lang.startsWith("en"));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      utterance.onstart = () => {
        isCurrentlySpeaking = true;
      };

      utterance.onend = () => {
        isCurrentlySpeaking = false;
        resolve();
      };

      utterance.onerror = (event) => {
        isCurrentlySpeaking = false;
        // "canceled" is not a real error — it's from stop()
        if (event.error === "canceled" || event.error === "interrupted") {
          resolve();
        } else {
          console.error("TTS-Fehler:", event.error);
          reject(new Error(event.error));
        }
      };

      synth.speak(utterance);
    } catch (err) {
      isCurrentlySpeaking = false;
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Stop any currently playing speech immediately.
 * Safe to call even if nothing is playing.
 */
export async function stopLocalSpeech(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

  const synth = window.speechSynthesis;

  if (synth.speaking || synth.pending) {
    synth.cancel();
  }

  isCurrentlySpeaking = false;

  // Wait briefly for the cancel to take effect
  // speechSynthesis.cancel() is synchronous but the browser
  // needs a tick to process the cancel event
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 50);
  });
}

/**
 * Check if speech is currently playing.
 */
export function isSpeaking(): boolean {
  return isCurrentlySpeaking;
}

/**
 * Returns the current speaking state for React components.
 * Use this in event handlers for state updates.
 */
export function getIsSpeaking(): boolean {
  return isCurrentlySpeaking;
}
