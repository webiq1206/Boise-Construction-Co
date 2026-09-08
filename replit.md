# Replit notes

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
