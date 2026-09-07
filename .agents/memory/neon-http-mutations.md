---
name: Neon HTTP mutation quirks
description: Affected-row checks and absent optional values in this project's Neon HTTP and Drizzle runtime.
---

Do not use rows from a mutation's `returning` clause to decide whether the mutation succeeded in this runtime. Use the command's affected row count, then issue a separate select when the saved row is needed.

**Why:** Development database verification showed successful inserts and updates returning an empty row array. It also showed absent optional numeric values reaching PostgreSQL as empty strings when passed explicitly as JavaScript null, causing numeric parse failures.

**How to apply:** For atomic inserts and conditional updates, decide ownership from `rowCount`. Omit absent optional numeric and JSON fields from mutation objects instead of supplying null.