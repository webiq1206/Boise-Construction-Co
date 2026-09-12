# Replit notes

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
