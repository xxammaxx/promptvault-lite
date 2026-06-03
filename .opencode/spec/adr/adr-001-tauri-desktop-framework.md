# ADR-001: Tauri Desktop Framework

## Status
Accepted

## Context
PromptVault Lite is a local, cross-platform desktop application for recursively scanning, parsing, analyzing, searching, filtering, and exporting Markdown prompt files on Linux, Windows, and macOS. The application needs a responsive three-column UI, secure local file-system access, native desktop affordances such as opening files and showing files in the system explorer, and efficient operation for 10,000+ prompts without freezing the UI.

The project specification already selects React, TypeScript, Vite, Rust, and Tauri, with a command-based API between the Rust backend and React frontend. This ADR records why that stack is preferred over heavier or less suitable desktop frameworks.

Architectural drivers:

- Low coupling between UI rendering and privileged file-system operations.
- High cohesion in Rust backend modules for scanning, parsing, analysis, caching, export, and native OS integration.
- Small bundle size and good runtime performance for local desktop distribution.
- Security boundaries around file-system access and command invocation.
- Maintainable developer experience with React/Vite for UI and Rust for safe native code.

## Decision
Use Tauri as the desktop shell with a React/TypeScript/Vite frontend and a Rust backend exposed through explicit Tauri commands.

The application architecture will follow this boundary:

```txt
React UI → typed command invocations → Tauri command handlers → Rust services → file system / cache / OS integration
```

The frontend is responsible for presentation, user interactions, filtering UI state, and rendering prompt details and analysis results. The Rust backend is responsible for trusted operations: directory scanning, Markdown parsing, quality and hygiene analysis, persistence, export, opening files, and platform-specific desktop integration.

## Alternatives Considered

### Electron
Electron provides mature desktop APIs, a large ecosystem, and excellent JavaScript developer familiarity. However, it bundles Chromium and Node.js, typically resulting in larger application size and higher memory usage. Its security model requires careful hardening around Node integration, preload scripts, IPC, sandboxing, and context isolation. For PromptVault Lite, which is primarily a local file scanner and analyzer, Electron adds unnecessary runtime weight and a broader attack surface than needed.

Tradeoffs:

- Strong DX and ecosystem.
- Larger bundles and higher memory consumption.
- More JavaScript-centric backend code, reducing the benefit of Rust safety for scanner and analyzer logic.
- More security hardening required around privileged APIs.

### Neutralino.js
Neutralino.js is lightweight and can produce small desktop applications. It is attractive for simple local utilities, but its ecosystem, native API depth, and Rust integration are less aligned with the project requirements. PromptVault Lite needs a robust native backend for recursive scanning, parsing, caching, analysis, and export behavior. Neutralino.js would either push more logic into JavaScript or require additional native integration complexity.

Tradeoffs:

- Small footprint.
- Less mature ecosystem for complex Rust-backed desktop architecture.
- Less natural fit for a strongly typed Rust service layer.
- Potentially higher integration effort for native functionality and long-term maintainability.

### Wails
Wails offers a productive desktop stack with a web frontend and a Go backend. It is a credible alternative, especially for teams preferring Go. For this project, Rust is already selected for backend logic because of memory safety, performance, strong typing, and suitability for file-system-intensive processing. Choosing Wails would replace the selected Rust backend with Go or require awkward multi-language integration.

Tradeoffs:

- Good desktop DX and smaller footprint than Electron.
- Requires Go instead of the selected Rust backend.
- Less aligned with Rust-native scanner, parser, and analysis modules.
- Similar command-boundary model, but not the chosen project stack.

## Consequences

Positive consequences:

- Smaller and more efficient desktop application than an Electron equivalent.
- Clear security boundary: privileged operations remain in Rust command handlers instead of the React UI.
- Rust backend supports safe, high-performance recursive scanning and analysis for large prompt collections.
- React/TypeScript/Vite enables a maintainable, productive UI implementation.
- Explicit commands reduce accidental coupling between UI and backend internals.

Negative consequences:

- Developers need familiarity with both Rust and React/TypeScript.
- Tauri requires platform-specific build setup and validation on Linux, Windows, and macOS.
- Frontend/backend type contracts must be maintained explicitly.
- Tauri plugin and WebView behavior may differ by platform and require testing.

## Compliance

- New dependency justified: Tauri is justified by native desktop requirements, Rust integration, smaller footprint, and reduced attack surface compared with Electron.
- Coupling/cohesion: UI and native operations are separated by typed commands; backend services remain cohesive by capability.
- Data flow/security: file-system access flows through Rust command handlers, not arbitrary frontend access.
- Error handling: commands should return structured errors suitable for UI display without exposing secrets or full sensitive paths unnecessarily.
- Scaling: Rust scanner and analyzer support background processing, caching, and lazy UI loading for 10,000+ prompts.
- Security boundaries: frontend is unprivileged; Rust commands validate paths, command inputs, and export destinations.
- Testing: unit tests for Rust services, command integration tests where practical, and UI tests for command-driven user flows.
