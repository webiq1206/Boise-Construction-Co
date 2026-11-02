import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SITE_CONFIG } from "../shared/siteConfig.ts";
import {
  P5_CONSULTATION_FORM,
  P5_CONSTRUCTION_BRAND,
  P5_INTAKE_URL,
  P5_PROJECT_TYPE_BY_VISITOR_LABEL,
  UNMAPPED_P5_PROJECT_TYPES,
  buildP5IntakeBody,
  forwardConsultationToP5Intake,
  p5ProjectType,
} from "../server/services/p5IntakeBridge.ts";

/**
 * Values p5 hubspotProjectType keeps at tip 8a33b28c: a HUBSPOT_PROJECT_TYPES
 * member, or a PROJECT_TYPE_ALIASES key. Alias keys are listed because the
 * intake stores the visitor string and HubSpot mapping happens inside p5.
 */
const ACCEPTED_BY_P5 = new Set([
  "Custom home",
  "New custom home",
  "Semi-custom home",
  "Build on land I own",
  "Home plans or lot evaluation",
  "kitchen",
  "Kitchen remodel",
  "bathroom",
  "Bathroom remodel",
  "whole-home",
  "Whole-home remodel",
  "addition",
  "Home addition",
  "adu",
  "Accessory dwelling unit (ADU)",
  "Basement finishing",
]);

const FORM_VALUES: Record<string, string> = {
  "custom-home": "Custom home",
  "Custom Home": "Custom home",
  "semi-custom-home": "Semi-custom home",
  "Semi-Custom Home": "Semi-custom home",
  "build-on-your-lot": "Build on land I own",
  "build-on-my-lot": "Build on land I own",
  "Build on My Lot": "Build on land I own",
  "shop-home": "New custom home",
  "Shop Home": "New custom home",
  "Shop Home / Barndominium": "New custom home",
  "plans-only": "Home plans or lot evaluation",
  "lot-evaluation": "Home plans or lot evaluation",
  kitchen: "kitchen",
  "Kitchen Remodel": "kitchen",
  bathroom: "bathroom",
  "Bathroom Remodel": "bathroom",
  "whole-home": "whole-home",
  "Whole-Home": "whole-home",
  addition: "addition",
  "Room Addition": "Home addition",
  "Home Addition": "Home addition",
  adu: "adu",
  "ADU / Guest House": "Accessory dwelling unit (ADU)",
  basement: "Basement finishing",
  "Basement Finishing": "Basement finishing",
  other: "other",
  "looking-for-land": "looking-for-land",
};

test("brand string is the p5 BRANDS value and the live site name", () => {
  assert.equal(P5_CONSTRUCTION_BRAND, "Boise Construction Co");
  assert.equal(SITE_CONFIG.name, P5_CONSTRUCTION_BRAND);
  assert.equal(P5_CONSULTATION_FORM, "Construction consultation");
});

test("known consultation choices map onto p5 project types, and unknown ones pass through", () => {
  for (const [slug, expected] of Object.entries(FORM_VALUES)) {
    assert.equal(p5ProjectType(slug), expected, slug);
  }
  for (const label of UNMAPPED_P5_PROJECT_TYPES) {
    assert.equal(p5ProjectType(label), label);
    assert.equal(P5_PROJECT_TYPE_BY_VISITOR_LABEL[label], undefined);
  }
  for (const [from, to] of Object.entries(P5_PROJECT_TYPE_BY_VISITOR_LABEL)) {
    assert.ok(ACCEPTED_BY_P5.has(to), `${from} -> ${to} is not a p5 alias or HubSpot option`);
  }
  assert.equal(p5ProjectType("  kitchen  "), "kitchen");
  assert.equal(p5ProjectType("New custom home"), "New custom home");
  assert.equal(p5ProjectType("Mystery wing"), "Mystery wing");
  assert.equal(p5ProjectType(""), null);
});

test("intake body uses the fields the p5 route already reads", () => {
  const body = buildP5IntakeBody({
    name: "  Ada Example  ",
    email: "ada@example.com",
    phone: "(208) 555-0100",
    address: "123 Main St",
    city: "Boise",
    zip: "83702",
    projectType: "Room Addition",
    message: "Add a bedroom over the garage.",
    inquiryId: "11111111-1111-4111-8111-111111111111",
  });
  assert.deepEqual(body, {
    brand: "Boise Construction Co",
    name: "Ada Example",
    form: P5_CONSULTATION_FORM,
    source: "Organic Website",
    sourceDetail: "boiseconstruction.co consultation",
    projectType: "Home addition",
    email: "ada@example.com",
    phone: "(208) 555-0100",
    address: "123 Main St, 83702",
    city: "Boise",
    summary: "Visitor project: Room Addition\n\nAdd a bedroom over the garage.",
    externalLeadId: "boiseconstruction-consultation:11111111-1111-4111-8111-111111111111",
  });
});

test("a junk optional phone is left off when the email can still be stored", () => {
  const body = buildP5IntakeBody({
    name: "Ada Example",
    email: "ada@example.com",
    phone: "555",
    projectType: "other",
    message: "Not sure yet.",
  });
  assert.equal(body.email, "ada@example.com");
  assert.equal(body.phone, undefined);
  assert.equal(body.projectType, "other");
  assert.equal(body.summary, "Not sure yet.");
});

test("construction-only types map to accepted p5 values and a phone-only lead omits a blank email", () => {
  assert.equal(p5ProjectType("custom-home"), "Custom home");
  assert.equal(p5ProjectType("semi-custom-home"), "Semi-custom home");
  assert.equal(p5ProjectType("build-on-your-lot"), "Build on land I own");
  assert.equal(p5ProjectType("shop-home"), "New custom home");

  const body = buildP5IntakeBody({
    name: "Ada Example",
    email: "",
    phone: "2085550100",
    projectType: "shop-home",
    message: "A house and a shop under one roof.",
    inquiryKey: "inq_abcdefghijklmnopqrstuvwxyz",
    inquiryId: "ignored-when-inquiry-key-is-set",
  });
  assert.equal(body.email, undefined);
  assert.equal(body.phone, "2085550100");
  assert.equal(body.address, undefined);
  assert.equal(body.projectType, "New custom home");
  assert.equal(body.form, "Construction consultation");
  assert.equal(body.sourceDetail, "boiseconstruction.co consultation");
  assert.equal(body.externalLeadId, "boiseconstruction-consultation:inq_abcdefghijklmnopqrstuvwxyz");
  assert.match(body.summary, /Visitor project: shop-home/);
  assert.match(body.summary, /A house and a shop under one roof\./);
});

test("bridge posts once and swallows transport and HTTP failures", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const ok = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ ok: true, accepted: true }), { status: 201 });
  };
  await forwardConsultationToP5Intake(
    { name: "Ada Example", email: "ada@example.com", projectType: "basement" },
    ok,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, P5_INTAKE_URL);
  assert.equal(calls[0].init.method, "POST");
  const sent = JSON.parse(String(calls[0].init.body));
  assert.equal(sent.brand, "Boise Construction Co");
  assert.equal(sent.projectType, "Basement finishing");
  assert.equal(sent.form, "Construction consultation");
  assert.equal(sent.source, "Organic Website");
  assert.equal(sent.sourceDetail, "boiseconstruction.co consultation");

  await assert.doesNotReject(() =>
    forwardConsultationToP5Intake(
      { name: "Ada Example", email: "ada@example.com", projectType: "other" },
      async () => {
        throw new Error("network down");
      },
    ),
  );
  await assert.doesNotReject(() =>
    forwardConsultationToP5Intake(
      { name: "Ada Example", email: "ada@example.com", projectType: "other" },
      async () => new Response("no", { status: 500 }),
    ),
  );
});

test("consultation success path schedules the bridge without awaiting it", () => {
  const source = readFileSync(new URL("../app/api/consultation/route.ts", import.meta.url), "utf8");
  const intake = source.indexOf("intakeResult = await intake.intake(");
  const honeypot = source.indexOf('if (trap === "honeypot")');
  const tooFast = source.indexOf('if (trap === "too-fast")');
  const intakeFailed = source.indexOf("Inquiry service is temporarily unavailable");
  const followup = source.indexOf('if (data.submissionKind === "followup" && !intakeResult.inserted)');
  const insertedGate = source.indexOf("if (intakeResult.inserted)");
  const bridge = source.indexOf("forwardConsultationToP5Intake(");
  const keptAlive = source.indexOf("after(() => bridge)");
  const delivery = source.indexOf("const delivery: InquiryDeliveryResult[]");
  const resend = source.indexOf("await getUncachableEmailClient");
  const dashboard = source.indexOf("forwardToLeadDashboard(");
  assert.ok(honeypot >= 0 && honeypot < intake, "honeypot returns before durable intake");
  assert.ok(tooFast > honeypot && tooFast < intake, "too-fast trap returns before durable intake");
  assert.equal(source.slice(honeypot, intake).includes("forwardConsultationToP5Intake"), false);
  assert.ok(intakeFailed > intake && intakeFailed < followup, "intake failure returns before the bridge");
  assert.ok(followup > intake && insertedGate > followup && bridge > insertedGate, "bridge runs only after a newly inserted consultation");
  assert.match(source.slice(followup, insertedGate), /return NextResponse\.json/);
  assert.equal(source.slice(followup, insertedGate).includes("forwardConsultationToP5Intake"), false);
  assert.equal(source.slice(followup, insertedGate).includes("after("), false);
  assert.ok(keptAlive > bridge && keptAlive < delivery, "bridge is kept alive with after(), not awaited");
  assert.ok(delivery > keptAlive, "Resend and the lead dashboard still run after the bridge is scheduled");
  assert.ok(dashboard > delivery, "BRC dashboard forward still runs and is not the bridge");
  assert.ok(resend > delivery, "Resend still runs and is not gated on the bridge");
  assert.equal(source.slice(bridge, delivery).includes("deliverInquiryChannel"), false);
  assert.doesNotMatch(source, /await\s+forwardConsultationToP5Intake/);
  assert.doesNotMatch(source, /HUBSPOT_TOKEN|@hubspot/);
});
