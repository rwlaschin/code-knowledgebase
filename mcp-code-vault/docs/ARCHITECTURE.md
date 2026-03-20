# Architecture: Project Collection (target design)

This document describes the **target** design for the Project Collection and file-processing state. It does not repeat how existing indexing or query behavior works; for that, see the code (scanner, processors, current storage).

---

## 1. Purpose of this doc

This document specifies the **target** design for the Project Collection (atoms) and the per-project FileProcessor collection. It does not repeat how existing indexing or query behavior works; for that, see the code (scanner, processors, current storage).

---

## 2. Collections per project

**Only two** per-project collections (names derived from the project key, e.g. `mcp-development_*`):

1. **`<Project>_knowledge_base`** — knowledge-base entries (atoms, context, etc.).
2. **`<Project>_FileProcessor`** — which files were processed, when, and checksums for change detection.

Project config (key, root_path, etc.) is stored elsewhere (e.g. `registry`); it is not in these collections. Collection and index setup is done in `ensureProjectCollections()` in `src/db/projectDb.ts`. When creating each collection, indexes (including MongoDB full-text search where required) are created in the same setup step.

---

## 3. Atoms: why and what

### Why atoms

- Code changes: functions move, are renamed or deleted; branches diverge.
- One document per file (one big blob) makes it hard to keep context accurate when things move or when comparing branches.
- Atoms allow fine-grained, stable units that can be updated or invalidated independently and searched efficiently.

### One file → many atoms

- A single file yields multiple atoms. The architecture does not prescribe a formal type/kind enum. Examples of atom categories include: variable/exports, function prototypes/methods, imports, dependencies, doc, diagram. These are **examples only** — no prescribed `type` field or allowed values in this document; that is to be specified later.

### Atom schema (minimum)


| Field    | Type                      | Required | Notes                                                                                                                                         |
| -------- | ------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| file     | string                    | yes      | Path relative to project root (or absolute, by convention).                                                                                   |
| branch   | string                    | no       | Git branch (or equivalent); optional if same in all branches or not branch-aware.                                                             |
| meta     | string                    | yes      | **Full-text searchable.** Content/summary of the atom. **Format:** TBD (e.g. plain text or markdown; convention for signature + description). |
| keywords | array of string or string | yes      | **Full-text searchable.** Terms for retrieval (e.g. names, tags).                                                                             |


- **Indexes (created when collection is created):** Use **MongoDB full-text search indexes** on `meta` and `keywords` (and any other FTS fields). Creating the collection and creating these indexes must happen together.

---

## 4. `<Project>_FileProcessor` collection

- **Purpose:** Track which files have been processed and when; store a checksum (e.g. MD5) so we can quickly see if a file has changed without re-reading it.
- **Collection name:** `{projectKey}_FileProcessor` (e.g. `my-project_FileProcessor`).
- **Schema:**


| Field           | Type   | Required | Notes                                                                                                                                                                                                                                                                                               |
| --------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| path            | string | yes      | **Full-text searchable.** File path (relative to project root or absolute by convention).                                                                                                                                                                                                           |
| checksum        | string | yes      | e.g. MD5 hash of file content; used to detect changes.                                                                                                                                                                                                                                              |
| processedAt     | date   | yes      | When the file was last processed.                                                                                                                                                                                                                                                                   |
| processingUntil | date   | no       | **Processing lock.** If set, this file is considered "being processed" until this time (e.g. now + 5 min). When processing finishes (success or failure), clear to undefined. If the process aborts, the date passes and the lock expires — so we avoid a stuck boolean. Use a date, not a boolean. |
| createdAt       | date   | yes      | Set by system when document is created.                                                                                                                                                                                                                                                             |
| modifiedAt      | date   | yes      | Set by system when document is updated.                                                                                                                                                                                                                                                             |


- **Indexes (created when collection is created):** MongoDB full-text search index on `path` (if FTS on path is required); index on `path` (unique) for lookups; index on `checksum` and/or `processedAt` as needed for change detection and listing.

---

## 5. Full-text search

- Use **MongoDB full-text search indexes** for the fields marked FTS (atoms: `meta`, `keywords`; FileProcessor: `path`). When the query path is implemented, context will be pulled from the Project Collection via FTS on atoms; this document does not re-describe the full query flow — see code for existing behavior.

---

## What this doc does not do

- Re-describe the existing initialize/indexing flow (scanner → LLM → current storage). Reference the code instead.
- Re-describe any already-implemented query flow. Only the **new** aspect (context from atoms via FTS) is specified above.

