# P5 estimator queue drain readiness

The estimator queue stores inputs, checkpoints, retry accounting, and results in SQL. Process timers and request polling only wake that durable work.

## Quiescence contract

`stopEstimatorWorker()` synchronously closes this process to new request, timer-sweep, and queued-retry admissions. It clears only the local wake timer. It does not edit jobs, reset attempts or lifetime budgets, release another pass's lease, or remove any ledger.

A provider pass that was already running is allowed to finish its bounded pass, persist its ordinary checkpoint, and release its lease. It will not begin another pass in the quiescing process. `drainEstimatorWorker(timeoutMs)` performs that stop and waits for the process's known in-flight runners. Its returned `drained`, `timedOut`, and in-flight counts must be used as reported; a timeout is not evidence that the pass stopped.

`resumeEstimatorWorker()` explicitly reopens an aborted drain and resumes from durable checkpoints. A request received while quiescing gets a temporary 503 before a new queue row or retry reset is admitted.

No SIGTERM listener is installed here. Adding a Node signal listener changes the default termination behavior and can conflict with Next.js or the hosting supervisor. A platform lifecycle hook may call the exported drain API only if the platform guarantees enough pre-stop time and coordinates traffic removal.

## Cutover limits

Source changes cannot quiesce old code that is already running before this source is published. An empty snapshot from one replica is not proof that other replicas, requests, timer sweeps, leases, or provider calls are idle. A publish-ready, zero-overlap cutover must not be claimed without a platform guarantee that old replicas stop admission and finish their in-flight passes before replacement processing starts.

Queue snapshots are observational only. They must never be used to clear leases, alter retry or attempt accounting, restart lifetime budgets, delete checkpoints, or consolidate ambiguous ledgers. Multiple matching ledgers remain a fail-closed reconciliation condition.

Replit's autoscale documentation allows old and new revisions to overlap. The reviewed platform documentation does not provide a verified grace-period duration, an old-instance drain guarantee, or a supported Next.js shutdown callback that would invoke this module before termination. Consequently, the exported APIs are source-only drain preparation: production has no lifecycle caller for them. Installing a speculative `SIGTERM` listener is not an acceptable substitute because a Node signal listener suppresses the default signal exit and could conflict with Next.js or the Replit supervisor.

This missing platform guarantee is the publishing blocker for any claimed zero-overlap cutover. Publishing the source alone does not close admission in the already deployed revision and does not prove that its processes have quiesced.

## Read-only production observation on 2026-09-19

The read-only replica observation reported:

- estimator work: 48 complete, 3 failed, 0 queued or running, and 0 active leases;
- ambiguous matching queue-ledger groups: 0;
- delivery outbox: 1 pending, 2 needs-review, and 5 sent;
- active outbox locks: 0.

This is a point-in-time observation from a replica, not an idle-cutover certificate. In particular, zero queued/running rows and zero leases do not prove that every autoscale instance has stopped admitting requests or making a provider call. Replica lag can also hide a concurrent primary change. The failed work and every accounting ledger remain preserved.

The outbox is outside the estimator worker drain. The pending item and the needs-review items must remain retained exactly as they are during this operation. Do not send, retry, reconcile, lock, delete, or otherwise process the outbox as part of queue cutover.

## Operator cutover sequence

Do not begin this sequence until Replit supplies a supported mechanism that can establish all of the required boundaries below. If it cannot, stop and report the platform lifecycle guarantee as unresolved rather than describing the release as zero-overlap.

1. Establish an external admission boundary that prevents estimator requests from reaching every old and new replica. Application source in the new revision cannot establish this boundary for old code.
2. Through a verified platform pre-stop hook, invoke `drainEstimatorWorker(timeoutMs)` on every serving old process. The hook must provide a documented grace period longer than the selected timeout and must not start replacement worker admission concurrently.
3. Require `drained: true` from every invoked process. Any timeout, missing process acknowledgement, process replacement, or unknown result blocks cutover. Do not clear a lease or reset a job to make the result appear drained.
4. Obtain platform confirmation that all old-revision instances have terminated and can no longer receive traffic. A database or single-replica snapshot cannot replace this confirmation.
5. Publish and start the new revision while the external estimator admission boundary remains closed. Verify durable queue and ledger state read-only; leave all outbox rows untouched.
6. Reopen estimator admission only after the platform confirms there is no old-revision execution overlap and the new revision is healthy. Saved failed or checkpointed jobs may then resume only through their ordinary explicit paths.

The drain test is offline and uses an isolated in-memory PostgreSQL fixture with simulated analysis work. It demonstrates module behavior only; it does not test Replit autoscale lifecycle behavior or establish a production shutdown guarantee.