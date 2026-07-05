# Audio Summary — Run Report

## Issue

[#200 — Linux-lokale Audio-Kurzbeschreibung für ausgewählte Prompts](https://github.com/xxammaxx/promptvault-lite/issues/200)

## Status: `AUDIO_SUMMARY_IMPLEMENTED`

## Date

2026-07-05

---

## Linux / TTS Preflight

| Check            | Result                                                            |
| ---------------- | ----------------------------------------------------------------- |
| **OS**           | Linux Mint 22.1 (Xia), kernel 6.8.0-124-generic                   |
| **Shell**        | /bin/bash                                                         |
| **Node**         | v22.22.0                                                          |
| **pnpm**         | 11.1.0                                                            |
| **piper**        | NOT_FOUND                                                         |
| **spd-say**      | `/usr/bin/spd-say` — available                                    |
| **espeak-ng**    | NOT_FOUND                                                         |
| **Audio system** | PulseAudio on PipeWire 1.0.5 — multiple playback devices detected |

## TTS Provider Fallback Chain

1. ~~Piper~~ — not installed on this system
2. **Web Speech API** — primary provider (browser-based, always available if voices installed)
3. ~~spd-say~~ (Speech Dispatcher) — available on the host but used as fallback only
4. ~~espeak-ng~~ — not installed on this system
5. **none** — summary visible, audio disabled

**Decision:** Web Speech API is the primary TTS layer for the browser-based UI. Native Linux TTS providers (piper, spd-say, espeak-ng) are detected but require a Tauri command for shell execution (marked as follow-up).

---

## Implementation Summary

### Files Created

| File                                                           | Purpose                                                     |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| `src/lib/promptAudioSummary.ts`                                | Safe German prompt summary generation with sanitizing       |
| `src/lib/localTts.ts`                                          | Local TTS provider detection and Web Speech API integration |
| `src/components/details/PromptAudioSummary.tsx`                | UI component: summary display + speak/stop button           |
| `src/lib/__tests__/promptAudioSummary.test.ts`                 | 20 tests: summary generation + sanitizing                   |
| `src/lib/__tests__/localTts.test.ts`                           | 16 tests: provider detection + speech control               |
| `src/components/details/__tests__/PromptAudioSummary.test.tsx` | 9 tests: component rendering + interactions                 |

### Files Modified

| File                                      | Change                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `src/components/details/DetailsPanel.tsx` | Integrated `PromptAudioSummary` between `ContaminationWarning` and `ActionBar` |

### Safety Guarantees

- No cloud TTS — Web Speech API only
- No OpenAI Audio API
- No Hugging Face Inference API
- No HTTP calls for TTS
- No automatic model downloads
- No new dependencies added
- No secrets, tokens, or API keys introduced
- Sanitizing masks: API keys, tokens, emails, paths, URLs, code blocks, hashes, long lines, stacktraces, JSON dumps
- Blocked content (critical hygiene / BLOCKING_SENSITIVE_CONTENT) prevents audio output
- Full prompt content is NEVER spoken — only a short German summary

---

## Local Gates

| Gate                                                    | Result                         |
| ------------------------------------------------------- | ------------------------------ |
| `pnpm test`                                             | ✅ 710 tests passed (29 files) |
| `pnpm lint`                                             | ✅ 0 errors                    |
| `pnpm exec tsc --noEmit`                                | ✅ 0 errors                    |
| `pnpm build`                                            | ✅ succeeded                   |
| `git diff --check`                                      | ✅ clean                       |
| `cargo fmt --check --all`                               | ✅ clean                       |
| `cargo clippy --workspace --all-targets -- -D warnings` | ✅ clean                       |
| `cargo test --workspace`                                | ✅ passed                      |

---

## Known Limitations

1. **Web Speech API only:** Native Linux TTS (piper/spd-say/espeak-ng) is detected but not used for audio output. A Tauri command would be needed for shell-based TTS execution.
2. **Voice quality:** Web Speech API voice quality depends on the browser/WebView. German voices may not be available on all systems.
3. **No full prompt reading:** The summary is intentionally limited to ~500 characters. Full prompt reading is out of scope.
