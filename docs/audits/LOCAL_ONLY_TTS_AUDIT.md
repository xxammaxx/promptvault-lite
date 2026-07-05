# Local-Only TTS Audit

## Scope

Issue [#200](https://github.com/xxammaxx/promptvault-lite/issues/200) — Audio-Kurzbeschreibung

## Audit Date

2026-07-05

---

## Dependencies

### Web Speech API

- **Source:** Browser built-in (Chromium/WebKit)
- **License:** Browser-dependent (Chromium: BSD-style)
- **Network:** None (fully offline)
- **Data collection:** None (local-only)
- **External services:** None

### No External Dependencies

The implementation uses **zero external npm packages** for TTS. No additional dependencies were added to `package.json`.

---

## Network Activity

| Check                    | Result |
| ------------------------ | ------ |
| HTTP requests during TTS | None   |
| WebSocket connections    | None   |
| Cloud API calls          | None   |
| Model downloads          | None   |

---

## Privacy

| Check                         | Result                           |
| ----------------------------- | -------------------------------- |
| Speech data leaves device     | No                               |
| Telemetry                     | No                               |
| Prompt content exposed to TTS | Partial (sanitized summary only) |
| Full prompt content in audio  | Never                            |
| Sensitive data in audio       | Blocked/masked by sanitizer      |

---

## Security

### Sanitizing Layer

The `sanitizeForAudio` function applies 12 regex patterns before any text reaches the audio system:

1. Private keys (PGP/SSH)
2. Code fenced blocks
3. API keys (sk- prefix)
4. URLs with token parameters
5. Email addresses
6. Absolute local paths (Unix + Windows)
7. JSON dumps with sensitive fields
8. Long hex hashes (40+ chars)
9. Stacktrace lines
10. Log/error lines
11. Very long lines (200+ chars)
12. Generic long tokens (32+ chars)

### Blocking Gate

Content is completely blocked from audio when:

- Hygiene status is `critical`
- Contamination status is `BLOCKING_SENSITIVE_CONTENT`

### Shell Injection

No shell commands are executed for TTS. The Web Speech API runs entirely in the browser sandbox. Native TTS provider detection uses `@tauri-apps/plugin-shell` only for `which` command checks — no user input is passed.

---

## Provider Detection

| Provider       | Detection Method                         | Risk                               |
| -------------- | ---------------------------------------- | ---------------------------------- |
| Web Speech API | `window.speechSynthesis.getVoices()`     | None (browser built-in)            |
| piper          | `which piper` via Tauri shell plugin     | Low (command existence check only) |
| spd-say        | `which spd-say` via Tauri shell plugin   | Low (command existence check only) |
| espeak-ng      | `which espeak-ng` via Tauri shell plugin | Low (command existence check only) |

---

## Conclusion

The implementation is **local-only** and introduces **no external network dependencies, no cloud TTS APIs, no telemetry, and no automatic model downloads**. Sensitive content is **sanitized or blocked** before reaching the audio system. The Web Speech API provides a secure, browser-sandboxed TTS layer without any new vulnerabilities.
