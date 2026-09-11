---
name: Publish schema parity
description: Runtime-created tables must also exist in development and the managed schema before publishing.
---

Keep estimator tables represented in the managed schema and present in development even when development has no estimator records.

**Why:** Production-only estimator tables caused the actual Publish comparison to propose dropping all four estimator tables, including stored drafts. A successful build and unchanged repository migrations did not reveal this risk.

**How to apply:** Inspect the actual publish diff after database-related syncs. Restore missing structures in development using production metadata only, not customer data. Match constraint names, defaults, and types. An empty schema diff does not verify the separate Publish overwrite-data selection.

Inspect every proposed SQL statement even when removal lists are empty and the structural-data-loss flag is false.

**Why:** A comparison returned production `DROP TABLE ... CASCADE` statements while its table-removal lists were empty and its structural-data-loss flag was false.

**How to apply:** Treat destructive SQL itself as a publication blocker; do not summarize safety from the structured flags alone.