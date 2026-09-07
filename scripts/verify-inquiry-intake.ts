import {
  type DeliveryChannel,
  type InquiryRepository,
  type PreparedInquiry,
  type StoredInquiry,
  InquiryIntakeService,
} from "../server/services/inquiryIntake";
import {
  inspectLeadTrap,
  readBoundedJson,
} from "../server/services/leadRequestGuard";

type Row = StoredInquiry & {
  fingerprint: string | null;
  bucket: string | null;
  eligible: boolean;
  claim?: string;
  acknowledged?: Date;
  delivery: Record<DeliveryChannel, { status: string; claim?: string; attemptedAt?: Date; deliveredAt?: Date; error?: string }>;
};

class MemoryRepository implements InquiryRepository {
  rows: Row[] = [];
  failInsert = false;

  async insertOrResolve(input: PreparedInquiry) {
    if (this.failInsert) throw new Error("storage unavailable");
    let row = this.rows.find((x) => x.inquiryKey === input.inquiryKey)
      ?? this.rows.find((x) => x.fingerprint === input.contactFingerprint && x.bucket === input.dedupeBucket && x.fingerprint !== null);
    if (row) {
      if (input.submissionKind === "revision" && input.flow === "estimate" && input.deliveryRevisionKey !== row.deliveryRevisionKey) {
        row.deliveryRevisionKey = input.deliveryRevisionKey;
        for (const channel of Object.keys(row.delivery) as DeliveryChannel[]) row.delivery[channel] = { status: "pending" };
      }
      return { row, inserted: false };
    }
    row = {
      inquiryKey: input.inquiryKey, conversionId: input.conversionId, deliveryRevisionKey: input.deliveryRevisionKey,
      fingerprint: input.contactFingerprint, bucket: input.dedupeBucket, eligible: input.conversionEligible,
      delivery: { crm: { status: "pending" }, adminEmail: { status: "pending" }, customerEmail: { status: "pending" } },
    };
    this.rows.push(row);
    return { row, inserted: true };
  }

  async claimConversion(key: string, claim: string, conversionId: string) {
    const row = this.rows.find((x) => x.inquiryKey === key);
    if (!row || row.conversionId !== conversionId || !row.eligible || row.acknowledged || (row.claim && row.claim !== claim)) return false;
    row.claim = claim;
    return true;
  }
  async acknowledgeConversion(key: string, claim: string, conversionId: string, now: Date) {
    const row = this.rows.find((x) => x.inquiryKey === key);
    if (!row || row.conversionId !== conversionId || row.claim !== claim || row.acknowledged) return false;
    row.acknowledged = now;
    return true;
  }
  async claimDelivery(key: string, revision: string | null, channel: DeliveryChannel, claim: string, now: Date) {
    const row = this.rows.find((x) => x.inquiryKey === key);
    if (!row || row.deliveryRevisionKey !== revision) return false;
    const delivery = row.delivery[channel];
    const stale = delivery.status === "sending" && !!delivery.attemptedAt && now.getTime() - delivery.attemptedAt.getTime() >= 600_000;
    if (!["pending", "failed"].includes(delivery.status) && !stale) return false;
    row.delivery[channel] = { status: "sending", claim, attemptedAt: now };
    return true;
  }
  async finishDelivery(key: string, revision: string | null, channel: DeliveryChannel, claim: string, now: Date) {
    const row = this.rows.find((x) => x.inquiryKey === key);
    const delivery = row?.delivery[channel];
    if (!row || row.deliveryRevisionKey !== revision || !delivery || delivery.status !== "sending" || delivery.claim !== claim) return false;
    row.delivery[channel] = { ...delivery, status: "delivered", deliveredAt: now };
    return true;
  }
  async failDelivery(key: string, revision: string | null, channel: DeliveryChannel, claim: string, error: string) {
    const row = this.rows.find((x) => x.inquiryKey === key);
    const delivery = row?.delivery[channel];
    if (!row || row.deliveryRevisionKey !== revision || !delivery || delivery.status !== "sending" || delivery.claim !== claim) return false;
    row.delivery[channel] = { ...delivery, status: "failed", error };
    return true;
  }
}

let checks = 0;
let failures = 0;
function check(name: string, pass: boolean) {
  checks++;
  if (!pass) { failures++; console.error(`  x ${name}`); }
}
let now = new Date("2025-01-15T12:00:00.000Z");
const repository = new MemoryRepository();
const service = new InquiryIntakeService({ repository, secret: "verify-secret", now: () => now });
const input = (key: string, kind: "initial" | "revision" | "followup" = "initial", flow: "estimate" | "consultation" = "estimate", revision = "r1") => ({
  inquiryKey: key, submissionKind: kind, flow, deliveryRevisionKey: revision,
  data: { name: "Ada", email: "ada@example.com", phone: "208 555 0100", zip: "83702", projectType: "kitchen" },
});

async function run() {
  const first = await service.intake(input("inq_abcdefghijklmnop"));
  check("new initial is stored and eligible", first.inserted && first.conversionEligible);
  const retry = await service.intake(input("inq_abcdefghijklmnop"));
  check("duplicate retry reuses row", !retry.inserted && retry.inquiryKey === first.inquiryKey);
  const contactDuplicate = await service.intake(input("inq_ponmlkjihgfedcba"));
  check("contact day duplicate resolves existing row", !contactDuplicate.inserted && contactDuplicate.inquiryKey === first.inquiryKey);
  const followup = await service.intake(input("inq_abcdefghijklmnop", "followup", "consultation"));
  check("consultation followup is not conversion eligible", !followup.inserted && !followup.conversionEligible && repository.rows.length === 1);
  const revision = await service.intake(input("inq_abcdefghijklmnop", "revision", "estimate", "r2"));
  check("estimate revision reuses inquiry and changes revision", !revision.inserted && repository.rows[0].deliveryRevisionKey === "r2");
  repository.failInsert = true;
  try { await service.intake(input("inq_1234567890abcdef", "revision")); check("storage failure throws", false); }
  catch { check("storage failure throws", true); }
  repository.failInsert = false;

  const claimA = "claim_abcdefghijklmnop";
  const claimB = "claim_ponmlkjihgfedcba";
  check("first conversion claim succeeds", await service.claimConversion(first.inquiryKey, claimA, first.conversionId));
  check("same conversion claim repeats before acknowledgement", await service.claimConversion(first.inquiryKey, claimA, first.conversionId));
  check("different conversion claim fails", !(await service.claimConversion(first.inquiryKey, claimB, first.conversionId)));
  check("wrong conversion ID fails", !(await service.claimConversion(first.inquiryKey, claimA, "conv_ponmlkjihgfedcba")));
  check("conversion acknowledgement succeeds", await service.acknowledgeConversion(first.inquiryKey, claimA, first.conversionId));
  check("acknowledged conversion cannot claim", !(await service.claimConversion(first.inquiryKey, claimA, first.conversionId)));

  const one = await service.claimDelivery(first.inquiryKey, "r2", "crm");
  check("delivery claim succeeds", !!one);
  check("duplicate delivery claim is blocked", (await service.claimDelivery(first.inquiryKey, "r2", "crm")) === null);
  check("delivery failure records", !!one && await service.failDelivery(first.inquiryKey, "r2", "crm", one, "temporary failure"));
  const two = await service.claimDelivery(first.inquiryKey, "r2", "crm");
  check("failed delivery retries", !!two && two !== one);
  check("delivery completion succeeds", !!two && await service.completeDelivery(first.inquiryKey, "r2", "crm", two));
  check("delivered channel is not reclaimed", (await service.claimDelivery(first.inquiryKey, "r2", "crm")) === null);

  check(
    "honeypot is rejected before intake",
    inspectLeadTrap({ website: "https://spam.example", formStartedAt: now.getTime() - 5_000 }, now.getTime()) === "honeypot",
  );
  check(
    "too-fast form is rejected before intake",
    inspectLeadTrap({ website: "", formStartedAt: now.getTime() - 500 }, now.getTime()) === "too-fast",
  );
  check(
    "normal dwell time passes",
    inspectLeadTrap({ website: "", formStartedAt: now.getTime() - 5_000 }, now.getTime()) === "ok",
  );

  const bounded = await readBoundedJson(
    new Request("https://example.test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true }),
    }),
    64,
  ) as { ok?: boolean };
  check("bounded JSON accepts a small body", bounded.ok === true);

  try {
    await readBoundedJson(
      new Request("https://example.test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: "x".repeat(200) }),
      }),
      64,
    );
    check("bounded JSON rejects an oversized body", false);
  } catch {
    check("bounded JSON rejects an oversized body", true);
  }
}

run().then(() => {
  if (failures) { console.error(`verify:inquiry-intake FAILED (${failures} of ${checks})`); process.exit(1); }
  console.log(`verify:inquiry-intake OK (${checks} checks)`);
});