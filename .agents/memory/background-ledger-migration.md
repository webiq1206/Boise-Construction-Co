---
name: Background ledger migration
description: Preserve a single runnable accounting ledger when reader configuration changes
---
Reuse the original background-job ledger when migrating reader configuration; do not clone it into a new runnable key. Ambiguous matching ledgers must block both request-driven and autonomous execution.

**Why:** Copying attempts and timestamps looks like preservation, but retaining both runnable rows lets the periodic worker spend twice. A request-side check alone misses boot/timer execution.

**How to apply:** Check every execution entry point and test duplicate queued/running rows with zero provider invocations. When a reader-configuration migration can make old and new code use different runnable identities, quiesce affected old workers; new-code checks cannot constrain a worker that ignores them. Do not apply this as a blanket gate to a release whose local-mode keys, checkpoints and lease/accounting behavior remain compatible. The 2026-09-19 standalone release was reviewed under unchanged local mode and published normally.