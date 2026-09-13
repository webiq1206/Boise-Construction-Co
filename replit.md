# Replit notes

## Safe Git synchronization

Keep repository-local `pull.ff=only` and `pull.rebase=false`. A divergent Pull
must stop rather than start an automatic rebase. Preserve recovered local
history and private recovery files; do not force-push that history to GitHub.
Review source-only synchronization separately from the retained local history.

Synchronization is complete only when local `main`, cached `origin/main`, and
the actual GitHub `main` are the same commit, with zero ahead and zero behind.
Keep original local-only history on a named recovery branch and in a verified
private durable backup, not as extra ancestry merged back into canonical `main`.
An application-equivalent tree with local-only commits still ahead is insufficient
for the owner's Pull workflow.

Before recovering a rebase, preserve the index, conflicted working files, rebase
metadata, reflogs, ignored/untracked data, and original Git objects. Review the
pre-rebase tip against actual upstream and inspect differences from `AUTO_MERGE`
for manual edits. Abort redundant replay only after backup verification. Never
drop unique work, force-push, or publish private recovery material to GitHub.
Apply reviewed changes as fast-forward commits based on actual upstream, then
align canonical `main` without reintroducing the recovery branch's ancestry.

## Estimator acceptance requirements

The final Get Estimate action must remain visible on mobile during long scope
review, with safe-area and keyboard clearance. This supersedes the earlier
no-sticky preference. Keep one project text box and one project upload control;
the persistent action must use the same confirmation/contact validation and
duplicate-submission protection as the normal submit path.

Historic prices in uploaded documents are not current approved rates. Preserve
owner-approved rate and financial policy unless the owner explicitly changes it.

## Publish checklist (database diff)

Replit's Republish compares the development database with the production
database and proposes a migration for the difference. Production tables that
this app creates for itself at runtime (for example `estimator_sessions`)
exist in production but not in a development database that has never run the
app, so Replit proposes `DROP TABLE` for them. Never approve a DROP.

After every `git pull`, before Republish, sync the development database to the
schema in shared/schema.ts (drizzle):

    npm run db:push

Then Republish. The migration step should report no changes, or only the
additive changes you expect.
