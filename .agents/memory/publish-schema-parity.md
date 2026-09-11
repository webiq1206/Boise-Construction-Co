---
name: Publish schema parity
description: Runtime-created tables must also exist in development and the managed schema before publishing.
---

Keep estimator tables represented in the managed schema and present in development even when development has no estimator records.

**Why:** Production-only estimator tables caused the actual Publish comparison to propose dropping all four estimator tables, including stored drafts. A successful build and unchanged repository migrations did not reveal this risk.

**How to apply:** Inspect the actual publish diff after database-related syncs. Restore missing structures in development using production metadata only, not customer data. Match constraint names, defaults, and types. An empty schema diff does not verify the separate Publish overwrite-data selection.