# Support

## Getting Help

PromptVault Lite is a community project. Here is how to get help:

### Documentation

- **[README](README.md)** — Overview, quickstart, features, and architecture
- **[INSTALL.md](docs/INSTALL.md)** — Platform-specific installation guide
- **[USER_GUIDE.md](docs/USER_GUIDE.md)** — Usage instructions
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Technical architecture details

### Questions & Issues

- **[GitHub Issues](https://github.com/xxammaxx/promptvault-lite/issues)** — Bug reports and feature requests
- **[GitHub Discussions](https://github.com/xxammaxx/promptvault-lite/discussions)** — Questions and community discussion

### Security Vulnerabilities

See **[SECURITY.md](SECURITY.md)** for responsible disclosure.

## Troubleshooting

| Problem                     | Solution                                                                    |
| --------------------------- | --------------------------------------------------------------------------- |
| `pnpm` or `cargo` not found | Verify tools are in PATH                                                    |
| App does not start          | Run `pnpm install` again                                                    |
| Scan finds no files         | Scanner only processes `.md` files                                          |
| Export/favorites seem stuck | First call on large collections may take several seconds                    |
| Build issues                | Check platform-specific Tauri dependencies in [INSTALL.md](docs/INSTALL.md) |

## Current Status

**v1.5.0-rc.1** is published as a pre-release. The stable release `v1.5.0` is pending manual desktop QA. No native binaries are distributed yet — install from source via `pnpm install && pnpm start`.
