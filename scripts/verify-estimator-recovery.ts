/**
 * Exercises partial-completion tracking end to end against an in-process
 * Postgres (pglite) and a capturing mailer, so the claim, retry, completion and
 * callback semantics are proven without Neon or Resend:
 *
 *   1. an un-engaged session never emails
 *   2. an engaged idle session does not send a partial drop-off email
 *   3. a second sweep sends nothing
 *   4. completion marks the session completed; a historical notified row becomes recovered
 *   5. a completion before the sweep cancels it
 *   6. a callback request emails once, and a retried request does not send again
 *   7. the abandonment sweep never calls the mailer
 *   8. sensitive selection keys are dropped, query strings are stripped
 *
 * Run: npm run verify:estimator-recovery
 */
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import * as schema from "../shared/schema";
import {
  INACTIVITY_MS,
  abandonmentStaffEmailsEnabled,
  installEstimatorSessionsTestAdapter,
  recordCallbackRequest,
  recordProgress,
  sweepAbandonedSessions,
} from "../server/services/estimatorSessions";

async function main() {
  const pg = new PGlite();
  const mutationQueries: string[] = [];
  const db = drizzle(pg, {
    schema,
    logger: {
      logQuery(query) {
        if (/insert into "estimator_sessions"/i.test(query)) mutationQueries.push(query);
      },
    },
  });
  const sent: Array<{ subject: string; html: string }> = [];
  let failNext = 0;
  installEstimatorSessionsTestAdapter({
    // The service is typed against the neon-http client; both expose the same
    // query builder surface, which is all the service uses.
    db: db as unknown as never,
    mailer: async (email) => {
      if (failNext > 0) { failNext -= 1; throw new Error("simulated mailer outage"); }
      sent.push(email);
    },
  });

  // Neon HTTP cannot process a non-returning mutation when the deployment SQL
  // proxy returns its valid rowCount=1, rows=null, fields=null response.
  const previousFetch = neonConfig.fetchFunction;
  neonConfig.fetchFunction = async () => new Response(JSON.stringify({ rowCount: 1, rows: null, fields: null }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
  try {
    const neonClient = neon("postgresql://regression:regression@example.com/regression");
    await assert.rejects(
      neonClient`INSERT INTO "estimator_sessions" ("id") VALUES ('synthetic-regression')`,
      /Cannot read properties of null \(reading 'map'\)/,
      "Neon HTTP null mutation rows reproduce the 503-triggering driver error",
    );
  } finally {
    neonConfig.fetchFunction = previousFetch;
  }

  assert.equal(abandonmentStaffEmailsEnabled(), false, "partial drop-off staff emails stay off");

  const t0 = new Date("2026-09-08T10:00:00Z");
  const later = (ms: number) => new Date(t0.getTime() + ms);
  const idle = INACTIVITY_MS + 5 * 60_000;
  const { estimatorSessions } = schema;

  // 1. Not engaged: first step, a few seconds in.
  await recordProgress({ sessionId: "aaaaaaaa-0000-4000-8000-000000000001", flow: "estimate", currentStep: "project", currentStepIndex: 0, totalSteps: 9, startedAt: t0.getTime() }, t0);
  assert.ok(mutationQueries.length > 0);
  assert.match(mutationQueries[0], /RETURNING "id"/i, "progress upsert must return rows for Neon HTTP");
  let r = await sweepAbandonedSessions({ now: later(idle) });
  assert.equal(r.sent, 0, "un-engaged session must not email");

  // 2. Engaged, idle past the old threshold: no partial email, and no notify claim.
  await recordProgress({
    sessionId: "aaaaaaaa-0000-4000-8000-000000000002", flow: "estimate", currentStep: "size", currentStepIndex: 3, totalSteps: 9,
    lastCompletedStep: "layout", startedAt: t0.getTime(), pagePath: "/estimate?gclid=secret&utm_source=x",
    selections: { project: "kitchen", sqft: 180, email: "leak@example.com", contact_phone: "2085551234", finish: "mid-range" },
    validationErrors: ["address_required"],
  }, later(120_000));
  r = await sweepAbandonedSessions({ now: later(idle) });
  assert.equal(r.sent, 0, "engaged idle session does not send a partial drop-off email");
  assert.equal(r.failed, 0);
  assert.equal(sent.length, 0);
  let row = (await db.select().from(estimatorSessions).where(eq(estimatorSessions.id, "aaaaaaaa-0000-4000-8000-000000000002")))[0];
  assert.equal(row.status, "active");
  assert.equal(row.notifyAttemptCount, 0);
  assert.equal(row.notifiedAt, null);
  assert.equal(row.pagePath, "/estimate");
  assert.equal("email" in (row.selections as object), false);
  assert.equal("contact_phone" in (row.selections as object), false);
  assert.equal((row.selections as { project?: string }).project, "kitchen");

  // 3. Second sweep: still nothing.
  r = await sweepAbandonedSessions({ now: later(idle + 600_000) });
  assert.equal(r.sent, 0, "partial drop-off emails stay off");
  assert.equal(sent.length, 0);

  // 4. Completion closes the session. A row notified before the kill-switch still becomes recovered.
  await recordProgress({ sessionId: "aaaaaaaa-0000-4000-8000-000000000002", flow: "estimate", currentStep: "result", currentStepIndex: 9, totalSteps: 9, status: "completed" }, later(idle + 700_000));
  row = (await db.select().from(estimatorSessions).where(eq(estimatorSessions.id, "aaaaaaaa-0000-4000-8000-000000000002")))[0];
  assert.equal(row.status, "completed");
  assert.equal(sent.length, 0, "completing a session does not send a partial email");
  await db.update(estimatorSessions).set({ status: "notified" }).where(eq(estimatorSessions.id, "aaaaaaaa-0000-4000-8000-000000000002"));
  await recordProgress({ sessionId: "aaaaaaaa-0000-4000-8000-000000000002", flow: "estimate", currentStep: "result", currentStepIndex: 9, totalSteps: 9, status: "completed" }, later(idle + 800_000));
  row = (await db.select().from(estimatorSessions).where(eq(estimatorSessions.id, "aaaaaaaa-0000-4000-8000-000000000002")))[0];
  assert.equal(row.status, "recovered");

  // 5. Completion before the summary: never emailed.
  await recordProgress({ sessionId: "aaaaaaaa-0000-4000-8000-000000000003", flow: "re10", currentStep: "contact", currentStepIndex: 2, totalSteps: 5, startedAt: t0.getTime() }, later(60_000));
  await recordProgress({ sessionId: "aaaaaaaa-0000-4000-8000-000000000003", flow: "re10", currentStep: "result", currentStepIndex: 4, totalSteps: 5, status: "completed" }, later(120_000));
  r = await sweepAbandonedSessions({ now: later(idle + 900_000) });
  assert.equal(r.sent, 0, "completed sessions are never emailed");
  // A late beacon cannot downgrade a completed session.
  await recordProgress({ sessionId: "aaaaaaaa-0000-4000-8000-000000000003", flow: "re10", currentStep: "contact", currentStepIndex: 2, totalSteps: 5 }, later(130_000));
  row = (await db.select().from(estimatorSessions).where(eq(estimatorSessions.id, "aaaaaaaa-0000-4000-8000-000000000003")))[0];
  assert.equal(row.status, "completed");

  // 6. Callback: one email, retry does not duplicate, sweep skips it.
  await recordProgress({ sessionId: "aaaaaaaa-0000-4000-8000-000000000004", flow: "plans", currentStep: "measure", currentStepIndex: 1, totalSteps: 4, startedAt: t0.getTime() }, later(30_000));
  let cb = await recordCallbackRequest({ sessionId: "aaaaaaaa-0000-4000-8000-000000000004", flow: "plans", phone: "(208) 555-0100", name: "Test Caller" }, later(40_000));
  assert.equal(cb.notified, true);
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /^Callback requested: Test Caller, \(208\) 555-0100/);
  assert.doesNotMatch(sent[0].subject, /\[Partial\]/);
  cb = await recordCallbackRequest({ sessionId: "aaaaaaaa-0000-4000-8000-000000000004", flow: "plans", phone: "2085550100" }, later(41_000));
  assert.equal(cb.notified, false, "a retried callback request does not send twice");
  assert.equal(sent.length, 1);
  assert.ok(mutationQueries.slice(-1)[0]?.match(/RETURNING "id"/i), "callback upsert must return rows for Neon HTTP");
  r = await sweepAbandonedSessions({ now: later(idle + 2_000_000) });
  assert.equal(r.sent, 0, "a callback session is excluded from the abandonment sweep");

  // 7. Abandonment sweep does not call the mailer, even when sending would fail.
  await recordProgress({ sessionId: "aaaaaaaa-0000-4000-8000-000000000005", flow: "consultation", currentStep: "filling", currentStepIndex: 1, totalSteps: 2, startedAt: t0.getTime() }, later(50_000));
  failNext = 3;
  r = await sweepAbandonedSessions({ now: later(idle + 3_000_000) });
  assert.equal(r.sent, 0, "partial drop-off emails stay off during a mailer outage");
  assert.equal(r.failed, 0, "the sweep does not attempt an abandonment send");
  assert.equal(failNext, 3, "the abandonment sweep never calls the mailer");
  row = (await db.select().from(estimatorSessions).where(eq(estimatorSessions.id, "aaaaaaaa-0000-4000-8000-000000000005")))[0];
  assert.equal(row.status, "active");
  assert.equal(row.notifyAttemptCount, 0);
  assert.equal(row.notifyLastError, null);
  await recordProgress({ sessionId: "aaaaaaaa-0000-4000-8000-000000000006", flow: "estimate", currentStep: "size", currentStepIndex: 3, totalSteps: 9, startedAt: t0.getTime() }, later(60_000));
  r = await sweepAbandonedSessions({ now: later(idle + 4_000_000) });
  assert.equal(r.sent, 0);
  row = (await db.select().from(estimatorSessions).where(eq(estimatorSessions.id, "aaaaaaaa-0000-4000-8000-000000000006")))[0];
  assert.equal(row.notifyAttemptCount, 0, "idle sessions are not claimed for a partial email");
  failNext = 0;

  // Explicit estimator-exit callbacks freeze their first phone and share the existing claim.
  failNext = 0;
  const beforeExit = sent.length;
  const exitRequest = {sessionId: "aaaaaaaa-0000-4000-8000-000000000007", flow: "p5-exit", phone: "2085550100", note: "Explicit callback consent; no marketing."};
  await Promise.all([recordCallbackRequest(exitRequest), recordCallbackRequest(exitRequest)]);
  assert.equal(sent.length, beforeExit + 1, "concurrent callback retries send once");
  const conflict = await recordCallbackRequest({...exitRequest, phone: "2085550101"});
  assert.equal(conflict.error, "callback_conflict");
  assert.equal(conflict.stored, false);
  row = (await db.select().from(estimatorSessions).where(eq(estimatorSessions.id, exitRequest.sessionId)))[0];
  assert.equal(row.contactPhone, "2085550100", "retry cannot change an already-requested number");
  failNext = 1;
  const retryRequest = {...exitRequest, sessionId: "aaaaaaaa-0000-4000-8000-000000000008"};
  const failedCallback = await recordCallbackRequest(retryRequest);
  assert.equal(failedCallback.stored, true);
  assert.equal(failedCallback.notified, false);
  assert.equal((await recordCallbackRequest(retryRequest)).notified, true);
  assert.equal(sent.length, beforeExit + 2);

  assert.equal(sent.every((email) => !email.subject.startsWith("[Partial]")), true, "no partial drop-off subject was sent");
  console.log(`verify-estimator-recovery: all checks passed (${sent.length} emails captured)`);
  await pg.close();
}

main().catch((error) => {
  console.error("verify-estimator-recovery FAILED:", error);
  process.exit(1);
});
