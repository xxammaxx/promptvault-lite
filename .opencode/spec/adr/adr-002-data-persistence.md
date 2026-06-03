# ADR-002: Data Persistence

## Status
Accepted

## Context
PromptVault Lite must scan and analyze potentially 10,000+ Markdown prompt files, support search and filters by title, category, tags, content, scores, hygiene status, risks, and favorites, and keep the UI responsive through caching and lazy loading.

The project specification permits either SQLite or a local JSON cache. This ADR defines when SQLite is the primary persistence strategy, when JSON is an acceptable fallback, and why other embedded storage options are not selected for the MVP.

Architectural drivers:

- Fast local search and filtering for large prompt collections.
- Durable local state for scan metadata, evaluations, detected artifacts, and favorites.
- Maintainable schema evolution as prompt metadata and analysis results change.
- Cross-platform local storage without requiring a server.
- Minimal operational complexity and no external service dependency.
- Safe handling of local paths, metadata, and potentially sensitive hygiene findings.

## Decision
Use SQLite as the primary persistence layer for the MVP. Provide a JSON cache fallback only when SQLite initialization or access is unavailable, corrupted, or explicitly disabled for diagnostic/portable operation.

Persistence responsibilities:

- SQLite stores indexed prompt metadata, file identity, scan timestamps, content hashes, quality evaluations, hygiene findings, detected artifacts, favorite flags, and export-related metadata.
- JSON cache stores a simplified snapshot of prompt metadata and analysis results when SQLite cannot be used.
- The original Markdown files remain the source of truth for prompt content. Persistence caches derived metadata and user-local state.

Schema strategy:

- Use a mostly normalized schema for durable entities:
  - `prompts` for file identity, path, title, category, description, version, dates, content hash, and timestamps.
  - `tags` and `prompt_tags` for searchable tags.
  - `evaluations` for quality and hygiene scores and status.
  - `detected_artifacts` for artifact type, severity, location, excerpt, and replacement recommendation.
  - `favorites` or a favorite flag on `prompts` for user state.
- Allow controlled denormalized columns for common list views, such as aggregate score, hygiene status, artifact count, and last analyzed timestamp, to avoid expensive joins during UI browsing.
- Do not duplicate full prompt content as the primary source of truth unless needed for search indexing; if cached, it must be invalidated by file hash and modification time.

Migration strategy:

- Maintain an explicit schema version table.
- Apply ordered migrations at application startup before scan results are written.
- Migrations must be deterministic, idempotent where practical, and covered by tests.
- If migration fails, the application should preserve the existing database, report a clear error, and optionally rebuild the cache from source Markdown files after user confirmation.
- JSON fallback snapshots should include a cache format version and should be rebuildable from the file system.

## Alternatives Considered

### JSON cache only
A JSON-only cache is simple, portable, and easy to inspect. It is acceptable as a fallback for small collections or recovery scenarios. However, it becomes less suitable as the primary store for 10,000+ prompts because search, filtering, partial updates, concurrent reads, and schema evolution become harder to maintain. A large JSON file also risks expensive read/write cycles and corruption during interrupted writes unless carefully managed.

Tradeoffs:

- Lowest implementation complexity for small data sets.
- Poorer query performance and indexing for large collections.
- Harder migrations and partial updates.
- More application code required for filtering and search.

### SQLite
SQLite is a mature embedded relational database with strong cross-platform support, transactions, indexes, and migration patterns. It fits local-first desktop storage without a server. It supports efficient filtering and future search indexing while preserving a simple deployment model.

Tradeoffs:

- Requires schema and migration discipline.
- Adds database access code and error handling.
- Cache corruption and locking must be handled carefully.
- Slightly more setup than a JSON file.

### sled
sled is an embedded Rust-native key-value store. It can be attractive for Rust applications, but PromptVault Lite needs structured queries, filters, relations between prompts/tags/artifacts, and migrations. A key-value model would push query planning, secondary indexes, and migrations into application code.

Tradeoffs:

- Rust-native embedded storage.
- Less direct support for relational queries and ad hoc filtering.
- More custom indexing logic.
- Less transparent for inspection and debugging than SQLite.

### RocksDB
RocksDB is powerful for high-throughput key-value workloads, but it is operationally heavier than needed for a local desktop prompt manager. It increases dependency weight and complexity while still requiring custom indexing and schema abstractions for relational search/filter use cases.

Tradeoffs:

- Excellent performance for some storage workloads.
- Unnecessary complexity for MVP requirements.
- Heavier dependency and packaging considerations.
- Key-value model is less natural for the data model.

## Consequences

Positive consequences:

- Efficient indexed search and filtering for large prompt collections.
- Clear persistence model for prompts, tags, evaluations, hygiene findings, and favorites.
- Better resilience through transactions and ordered migrations.
- JSON fallback keeps the application recoverable and portable when SQLite is unavailable.
- Derived data can be rebuilt from Markdown source files when necessary.

Negative consequences:

- Requires schema design, migration tests, and database error handling.
- Developers must avoid over-normalization that slows the UI and over-denormalization that causes stale data.
- JSON fallback must be kept compatible enough to avoid divergent behavior.
- Sensitive findings, such as detected secrets or personal data excerpts, require careful storage minimization.

## Compliance

- New dependency justified: SQLite is justified by indexing, transactions, migration support, and local-first operation; JSON alone is insufficient for scale.
- Coupling/cohesion: persistence is isolated behind Rust repository/cache services; UI consumes command DTOs, not database structures.
- Data flow/security: file-system source data is scanned by Rust, derived metadata is stored locally, and sensitive findings should store minimal excerpts.
- Error handling: database initialization, migration, lock, and corruption errors must be structured and user-visible without leaking secrets.
- Scaling: indexes and denormalized summary fields support 10,000+ prompts, lazy loading, search, and filters.
- Security boundaries: no remote persistence; all data remains local; path access is validated by backend commands.
- Testing: migration tests, repository tests, JSON fallback tests, scanner-cache invalidation tests, and search/filter tests are required.
