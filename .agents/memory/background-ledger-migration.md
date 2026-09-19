---
name: Background ledger migration
description: Preserve a single runnable accounting ledger when reader configuration changes
---
Reuse the original background-job ledger when migrating reader configuration; do not clone it into a new runnable key. Ambiguous matching ledgers must block both request-driven and autonomous execution.

**Why:** Copying attempts and timestamps looks like preservation, but retaining both runnable rows lets the periodic worker spend twice. A request-side check alone misses boot/timer execution.

**How to apply:** Check every execution entry point and test duplicate queued/running rows with zero provider invocations. Mixed-version deployment must quiesce old workers; new-code checks cannot constrain an old worker that ignores them.