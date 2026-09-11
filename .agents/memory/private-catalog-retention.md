---
name: Private catalog retention versus activation
description: Distinguish privately archived source records from active pricing policies in each database.
---

Catalog source parts and the assembled catalog are retained under `private/pricing/` in the site's assigned object-storage bucket. Retention is separate from development and production policy activation.

**Why:** An empty policy table does not prove the source catalog is missing. The raw source archive preserves the supplied descriptions, amounts, basis distinctions and references independently of any environment's active pricing configuration.

**How to apply:** Inspect private staging and each database separately when reporting catalog status. Report counts and verification results, not private rates or source details. Validate complete-part counts and uniqueness before import; preserve the source archive and prior-policy recovery snapshots.