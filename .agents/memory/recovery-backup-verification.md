---
name: Recovery backup verification
description: Publishing inventory preservation and live-workspace backup checks for temporary platform caches.
---

Keep operational Git backups outside the existing publishing recovery inventory,
with their own verified private durable manifests.

**Why:** A prior application build succeeded but packaging correctly refused
new recovery files that were not covered by the immutable composite receipt.
Adding a diagnostic report to that inventory can cause the same refusal.

**How to apply:** Preserve existing sets, receipts, hashes and remote generations.
Place operational backups and reports in private diagnostics, which the existing
publishing-copy exclusions already cover. Fully read back new remote backup
objects, check SHA-256 and private ACLs, and require anonymous HTTP 403. Extend
the composite receipt only when deliberately extending its recovery inventory.

Separate authoritative file verification from temporary platform-cache drift.

**Why:** Even read-only agent operations can replace Replit's latest environment
cache files and remove older durable agent snapshots. A complete archive can
therefore retain a valid captured copy while a later comparison finds a changed
or removed cache file.

**How to apply:** Strictly compare archived Git state, source, configuration,
uploads and data against their source hashes before recovery. Investigate every
discrepancy. Record specifically verified platform-cache exceptions and retain
their captured archive bytes; never broadly suppress mismatches. Keep environment
cache contents private. Verify the remote archive against its complete local
SHA-256 regardless of cache drift. Canonical Git synchronization policy lives in
the Safe Git synchronization section of replit.md.