---
name: Neon HTTP mutation quirks
description: Affected-row checks and absent optional values in this project's Neon HTTP and Drizzle runtime.
---

Do not use rows from a mutation's `returning` clause to decide whether the mutation succeeded in this runtime. Use the command's affected row count, then issue a separate select when the saved row is needed.

**Why:** Development database verification showed successful inserts and updates returning an empty row array. It also showed absent optional numeric values reaching PostgreSQL as empty strings when passed explicitly as JavaScript null, causing numeric parse failures.

**How to apply:** For atomic inserts and conditional updates, decide ownership from `rowCount`. Omit absent optional numeric and JSON fields from mutation objects instead of supplying null.

Non-returning mutations can also produce `rows: null` and `fields: null` with a positive affected-row count. A zero-row-only normalization does not cover these successful writes.

**Why:** The Neon driver attempts to map the null arrays and throws after the mutation, producing an apparent persistence failure. An isolated driver fixture reproduced this shape; requesting a minimal returning field allowed a synthetic completed session to save and read back in development.

**How to apply:** When a Drizzle mutation crashes decoding an otherwise successful response, check the response shape before assuming schema drift or invalid timestamp parameters. Request a minimal returning field where appropriate, but still verify saved state separately when correctness depends on persistence.