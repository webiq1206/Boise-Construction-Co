import assert from "node:assert/strict";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

async function run() {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const gtagCalls: unknown[][] = [];
  const metaCalls: unknown[][] = [];
  const fetchBodies: Array<{ url: string; body: Record<string, unknown> }> = [];
  let lockTail: Promise<unknown> = Promise.resolve();

  const windowValue = {
    gtag: (...args: unknown[]) => gtagCalls.push(args),
    fbq: (...args: unknown[]) => metaCalls.push(args),
    location: { href: "https://example.test/estimate" },
    localStorage,
    sessionStorage,
  };

  Object.defineProperties(globalThis, {
    localStorage: { configurable: true, value: localStorage },
    sessionStorage: { configurable: true, value: sessionStorage },
    document: { configurable: true, value: { cookie: "" } },
    window: {
      configurable: true,
      value: windowValue,
    },
    navigator: {
      configurable: true,
      value: {
        locks: {
          request: (_name: string, callback: () => Promise<unknown>) => {
            const current = lockTail.then(callback);
            lockTail = current.then(() => undefined, () => undefined);
            return current;
          },
        },
      },
    },
    fetch: {
      configurable: true,
      value: async (url: string, init?: RequestInit) => {
        const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
        fetchBodies.push({ url, body });
        if (url === "/api/inquiry-conversion" && body.acknowledge !== true) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return new Response(JSON.stringify({
            eligible: true,
            conversionId: body.conversionId,
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ acknowledged: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  });

  const tracking = await import("../lib/inquiryTracking");
  const analytics = await import("../lib/analytics");
  const identity = tracking.getOrCreateInquiryTracking();
  const inquiryKey = identity.inquiryKey;
  const claimKey = identity.claimKey;
  const conversionId = "conv_1234567890abcdef";
  tracking.recordInquiryAcceptance({ inquiryKey, conversionId });

  const input = {
    inquiryKey,
    claimKey,
    conversionId,
    ga4Params: { form_name: "estimate_gate", project_type: "addition" },
    metaParams: { content_name: "Estimate Request", project_type: "addition" },
  };

  const concurrent = await Promise.all([
    analytics.trackClaimedLeadConversion(input),
    analytics.trackClaimedLeadConversion(input),
  ]);
  const afterAcknowledgement = await analytics.trackClaimedLeadConversion(input);

  assert.deepEqual(concurrent.sort(), [false, true]);
  assert.equal(afterAcknowledgement, false);

  const ga4Leads = gtagCalls.filter((call) => call[0] === "event" && call[1] === "generate_lead");
  const adsLeads = gtagCalls.filter((call) => call[0] === "event" && call[1] === "conversion");
  assert.equal(ga4Leads.length, 1);
  assert.equal(adsLeads.length, 1);
  assert.equal((adsLeads[0][2] as Record<string, unknown>).transaction_id, conversionId);
  assert.equal(metaCalls.filter((call) => call[0] === "track" && call[1] === "Lead").length, 1);

  const claims = fetchBodies.filter((call) =>
    call.url === "/api/inquiry-conversion" && call.body.acknowledge !== true
  );
  const acknowledgements = fetchBodies.filter((call) =>
    call.url === "/api/inquiry-conversion" && call.body.acknowledge === true
  );
  const metaServerEvents = fetchBodies.filter((call) => call.url === "/api/meta-capi");
  assert.equal(claims.length, 1);
  assert.equal(acknowledgements.length, 1);
  assert.equal(metaServerEvents.length, 1);
  assert.equal(metaServerEvents[0].body.eventId, conversionId);
  assert.equal(metaServerEvents[0].body.userData, undefined);
  assert.equal(JSON.stringify([...gtagCalls, ...metaCalls, ...fetchBodies]).includes("@"), false);

  console.log("verify:lead-analytics OK (concurrent and repeat callbacks emit one lead)");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});