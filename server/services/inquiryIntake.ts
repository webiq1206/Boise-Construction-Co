import { createHmac, randomUUID } from "crypto";
import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultationRequests } from "@/shared/schema";

export type InquiryFlow = "estimate" | "consultation";
export type SubmissionKind = "initial" | "revision" | "followup";
export type DeliveryChannel = "crm" | "adminEmail" | "customerEmail";
export type DeliveryStatus = "pending" | "sending" | "failed" | "delivered";

type InquiryInsert = typeof consultationRequests.$inferInsert;

export interface InquiryInput {
  inquiryKey?: string;
  flow: InquiryFlow;
  submissionKind: SubmissionKind;
  /** Server-computed estimate fingerprint. It is ignored for followups. */
  deliveryRevisionKey?: string;
  /** Set only after server-side spam checks. */
  isSpam?: boolean;
  data: Pick<InquiryInsert, "name" | "phone" | "email" | "zip" | "projectType">
    & Omit<Partial<InquiryInsert>, "inquiryKey" | "inquiryFlow" | "submissionKind" | "conversionId"
      | "contactFingerprint" | "dedupeBucket" | "conversionEligible" | "conversionClaimKey"
      | "conversionClaimedAt" | "conversionAcknowledgedAt" | "deliveryRevisionKey"
      | "createdAt" | "updatedAt">;
}

export interface IntakeResult {
  inquiryKey: string;
  conversionId: string;
  inserted: boolean;
  conversionEligible: boolean;
}

export interface StoredInquiry {
  inquiryKey: string;
  conversionId: string;
  deliveryRevisionKey: string | null;
}

export interface PreparedInquiry {
  inquiryKey: string;
  conversionId: string;
  contactFingerprint: string | null;
  dedupeBucket: string | null;
  flow: InquiryFlow;
  submissionKind: SubmissionKind;
  deliveryRevisionKey: string | null;
  conversionEligible: boolean;
  data: InquiryInput["data"];
}

export interface InquiryRepository {
  /**
   * The insert must use the database unique constraints as its arbiter. A
   * rejected insert is resolved to the row that owns either unique key.
   */
  insertOrResolve(input: PreparedInquiry): Promise<{ row: StoredInquiry; inserted: boolean }>;
  claimConversion(inquiryKey: string, claimKey: string, conversionId: string, now: Date): Promise<boolean>;
  acknowledgeConversion(inquiryKey: string, claimKey: string, conversionId: string, now: Date): Promise<boolean>;
  claimDelivery(inquiryKey: string, revisionKey: string | null, channel: DeliveryChannel, claimKey: string, now: Date): Promise<boolean>;
  finishDelivery(inquiryKey: string, revisionKey: string | null, channel: DeliveryChannel, claimKey: string, now: Date): Promise<boolean>;
  failDelivery(inquiryKey: string, revisionKey: string | null, channel: DeliveryChannel, claimKey: string, error: string, now: Date): Promise<boolean>;
}

export interface InquiryIntakeOptions {
  repository: InquiryRepository;
  secret?: string;
  now?: () => Date;
}

export function normalizeContact(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

export function contactFingerprint(email: string | null | undefined, phone: string | null | undefined, secret: string): string | null {
  const normalized = `${normalizeContact(email)}|${normalizeContact(phone).replace(/\D/g, "")}`;
  if (normalized === "|") return null;
  return createHmac("sha256", secret).update(normalized).digest("hex");
}

export function utcDedupeBucket(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function newOpaqueKey(prefix: "inq" | "conv" | "delivery"): string {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

export function validateInquiryKey(key: string): boolean {
  return /^inq_[A-Za-z0-9_-]{16,120}$/.test(key);
}

export function validateClaimKey(key: string): boolean {
  return /^claim_[A-Za-z0-9_-]{16,120}$/.test(key);
}

export function validateConversionId(key: string): boolean {
  return /^conv_[A-Za-z0-9_-]{16,120}$/.test(key);
}

export class InquiryIntakeService {
  private readonly now: () => Date;
  private readonly secret: string;

  constructor(private readonly options: InquiryIntakeOptions) {
    this.now = options.now ?? (() => new Date());
    this.secret = options.secret ?? process.env.SESSION_SECRET ?? "";
    if (!this.secret) throw new Error("Inquiry intake requires SESSION_SECRET");
  }

  async intake(input: InquiryInput): Promise<IntakeResult> {
    if (input.inquiryKey && !validateInquiryKey(input.inquiryKey)) {
      throw new Error("Invalid inquiry key");
    }
    const now = this.now();
    const inquiryKey = input.inquiryKey ?? newOpaqueKey("inq");
    const prepared: PreparedInquiry = {
      inquiryKey,
      conversionId: newOpaqueKey("conv"),
      contactFingerprint: contactFingerprint(input.data.email, input.data.phone, this.secret),
      dedupeBucket: utcDedupeBucket(now),
      flow: input.flow,
      submissionKind: input.submissionKind,
      deliveryRevisionKey: input.submissionKind === "followup" ? null : input.deliveryRevisionKey ?? null,
      conversionEligible: input.submissionKind === "initial" && !input.isSpam,
      data: input.data,
    };
    const result = await this.options.repository.insertOrResolve(prepared);
    return {
      inquiryKey: result.row.inquiryKey,
      conversionId: result.row.conversionId,
      inserted: result.inserted,
      conversionEligible: result.inserted && prepared.conversionEligible,
    };
  }

  claimConversion(inquiryKey: string, claimKey: string, conversionId: string): Promise<boolean> {
    if (
      !validateInquiryKey(inquiryKey) ||
      !validateClaimKey(claimKey) ||
      !validateConversionId(conversionId)
    ) {
      return Promise.resolve(false);
    }
    return this.options.repository.claimConversion(
      inquiryKey,
      claimKey,
      conversionId,
      this.now(),
    );
  }

  acknowledgeConversion(inquiryKey: string, claimKey: string, conversionId: string): Promise<boolean> {
    if (
      !validateInquiryKey(inquiryKey) ||
      !validateClaimKey(claimKey) ||
      !validateConversionId(conversionId)
    ) {
      return Promise.resolve(false);
    }
    return this.options.repository.acknowledgeConversion(
      inquiryKey,
      claimKey,
      conversionId,
      this.now(),
    );
  }

  async claimDelivery(inquiryKey: string, revisionKey: string | null, channel: DeliveryChannel): Promise<string | null> {
    const claimKey = newOpaqueKey("delivery");
    return (await this.options.repository.claimDelivery(inquiryKey, revisionKey, channel, claimKey, this.now())) ? claimKey : null;
  }

  completeDelivery(inquiryKey: string, revisionKey: string | null, channel: DeliveryChannel, claimKey: string): Promise<boolean> {
    return this.options.repository.finishDelivery(inquiryKey, revisionKey, channel, claimKey, this.now());
  }

  failDelivery(inquiryKey: string, revisionKey: string | null, channel: DeliveryChannel, claimKey: string, error: string): Promise<boolean> {
    return this.options.repository.failDelivery(inquiryKey, revisionKey, channel, claimKey, error.slice(0, 2000), this.now());
  }
}

const deliveryColumns = {
  crm: {
    statusKey: "crmDeliveryStatus",
    errorKey: "crmDeliveryError",
    attemptsKey: "crmDeliveryAttemptCount",
    attemptedAtKey: "crmDeliveryAttemptedAt",
    deliveredAtKey: "crmDeliveredAt",
    claimKeyKey: "crmDeliveryClaimKey",
    status: consultationRequests.crmDeliveryStatus,
    error: consultationRequests.crmDeliveryError,
    attempts: consultationRequests.crmDeliveryAttemptCount,
    attemptedAt: consultationRequests.crmDeliveryAttemptedAt,
    claimKey: consultationRequests.crmDeliveryClaimKey,
  },
  adminEmail: {
    statusKey: "adminEmailDeliveryStatus",
    errorKey: "adminEmailDeliveryError",
    attemptsKey: "adminEmailDeliveryAttemptCount",
    attemptedAtKey: "adminEmailDeliveryAttemptedAt",
    deliveredAtKey: "adminEmailDeliveredAt",
    claimKeyKey: "adminEmailDeliveryClaimKey",
    status: consultationRequests.adminEmailDeliveryStatus,
    error: consultationRequests.adminEmailDeliveryError,
    attempts: consultationRequests.adminEmailDeliveryAttemptCount,
    attemptedAt: consultationRequests.adminEmailDeliveryAttemptedAt,
    claimKey: consultationRequests.adminEmailDeliveryClaimKey,
  },
  customerEmail: {
    statusKey: "customerEmailDeliveryStatus",
    errorKey: "customerEmailDeliveryError",
    attemptsKey: "customerEmailDeliveryAttemptCount",
    attemptedAtKey: "customerEmailDeliveryAttemptedAt",
    deliveredAtKey: "customerEmailDeliveredAt",
    claimKeyKey: "customerEmailDeliveryClaimKey",
    status: consultationRequests.customerEmailDeliveryStatus,
    error: consultationRequests.customerEmailDeliveryError,
    attempts: consultationRequests.customerEmailDeliveryAttemptCount,
    attemptedAt: consultationRequests.customerEmailDeliveryAttemptedAt,
    claimKey: consultationRequests.customerEmailDeliveryClaimKey,
  },
} as const;

function affectedRowCount(result: unknown): number {
  if (
    result &&
    typeof result === "object" &&
    "rowCount" in result &&
    typeof (result as { rowCount?: unknown }).rowCount === "number"
  ) {
    return (result as { rowCount: number }).rowCount;
  }
  return 0;
}

/** Drizzle implementation used by routes. It intentionally has no fallback: persistence failure is an intake failure. */
export class DrizzleInquiryRepository implements InquiryRepository {
  constructor(private readonly database: NonNullable<typeof db>) {}

  private async find(input: PreparedInquiry): Promise<StoredInquiry | undefined> {
    const contactMatch = input.contactFingerprint && input.dedupeBucket
      ? and(eq(consultationRequests.contactFingerprint, input.contactFingerprint), eq(consultationRequests.dedupeBucket, input.dedupeBucket))
      : undefined;
    const rows = await this.database.select({
      inquiryKey: consultationRequests.inquiryKey,
      conversionId: consultationRequests.conversionId,
      deliveryRevisionKey: consultationRequests.deliveryRevisionKey,
    }).from(consultationRequests).where(contactMatch
      ? or(eq(consultationRequests.inquiryKey, input.inquiryKey), contactMatch)
      : eq(consultationRequests.inquiryKey, input.inquiryKey)).limit(1);
    const row = rows[0];
    if (!row?.inquiryKey) return undefined;
    return { inquiryKey: row.inquiryKey, conversionId: row.conversionId, deliveryRevisionKey: row.deliveryRevisionKey };
  }

  async insertOrResolve(input: PreparedInquiry): Promise<{ row: StoredInquiry; inserted: boolean }> {
    const values: InquiryInsert = {
      ...input.data,
      inquiryKey: input.inquiryKey,
      inquiryFlow: input.flow,
      submissionKind: input.submissionKind,
      conversionId: input.conversionId,
      contactFingerprint: input.contactFingerprint,
      dedupeBucket: input.dedupeBucket,
      conversionEligible: input.conversionEligible,
      deliveryRevisionKey: input.deliveryRevisionKey,
    };
    const result = await this.database
      .insert(consultationRequests)
      .values(values)
      .onConflictDoNothing();
    if (affectedRowCount(result) === 1) {
      const inserted = await this.find(input);
      if (!inserted) throw new Error("Inserted inquiry could not be loaded");
      return { row: inserted, inserted: true };
    }

    const existing = await this.find(input);
    if (!existing) throw new Error("Inquiry conflict could not be resolved");
    if (input.submissionKind !== "initial") {
      const reset = input.submissionKind === "revision" && input.flow === "estimate"
        && input.deliveryRevisionKey !== existing.deliveryRevisionKey;
      const updateData: Record<string, unknown> = { ...input.data };
      if (!input.data.email) delete updateData.email;
      if (!input.data.phone) delete updateData.phone;
      if (!input.data.address) delete updateData.address;
      if (!input.data.propertyProfile) delete updateData.propertyProfile;
      const update: Record<string, unknown> = {
        ...updateData,
        inquiryFlow: input.flow,
        submissionKind: input.submissionKind,
        updatedAt: new Date(),
      };
      if (reset) Object.assign(update, {
        deliveryRevisionKey: input.deliveryRevisionKey, crmDeliveryStatus: "pending", crmDeliveryError: null, crmDeliveryAttemptCount: 0, crmDeliveryAttemptedAt: null, crmDeliveredAt: null, crmDeliveryClaimKey: null,
        adminEmailDeliveryStatus: "pending", adminEmailDeliveryError: null, adminEmailDeliveryAttemptCount: 0, adminEmailDeliveryAttemptedAt: null, adminEmailDeliveredAt: null, adminEmailDeliveryClaimKey: null,
        customerEmailDeliveryStatus: "pending", customerEmailDeliveryError: null, customerEmailDeliveryAttemptCount: 0, customerEmailDeliveryAttemptedAt: null, customerEmailDeliveredAt: null, customerEmailDeliveryClaimKey: null,
      });
      await this.database.update(consultationRequests).set(update as never).where(eq(consultationRequests.inquiryKey, existing.inquiryKey));
    }
    return { row: existing, inserted: false };
  }

  async claimConversion(inquiryKey: string, claimKey: string, conversionId: string, now: Date): Promise<boolean> {
    const result = await this.database.update(consultationRequests).set({ conversionClaimKey: claimKey, conversionClaimedAt: now, updatedAt: now })
      .where(and(eq(consultationRequests.inquiryKey, inquiryKey), eq(consultationRequests.conversionId, conversionId), eq(consultationRequests.conversionEligible, true), isNull(consultationRequests.conversionAcknowledgedAt), or(isNull(consultationRequests.conversionClaimKey), eq(consultationRequests.conversionClaimKey, claimKey))));
    return affectedRowCount(result) === 1;
  }

  async acknowledgeConversion(inquiryKey: string, claimKey: string, conversionId: string, now: Date): Promise<boolean> {
    const result = await this.database.update(consultationRequests).set({ conversionAcknowledgedAt: now, updatedAt: now })
      .where(and(eq(consultationRequests.inquiryKey, inquiryKey), eq(consultationRequests.conversionId, conversionId), eq(consultationRequests.conversionClaimKey, claimKey), isNull(consultationRequests.conversionAcknowledgedAt)));
    return affectedRowCount(result) === 1;
  }

  async claimDelivery(inquiryKey: string, revisionKey: string | null, channel: DeliveryChannel, claimKey: string, now: Date): Promise<boolean> {
    const c = deliveryColumns[channel];
    const stale = new Date(now.getTime() - 10 * 60 * 1000);
    // Resend idempotency keys make stale email-claim recovery safe. The CRM
    // endpoint has no confirmed durable idempotency contract, so a sending CRM
    // claim is never stolen: this prevents an overlapping second provider call.
    const availableStatus = channel === "crm"
      ? or(eq(c.status, "pending"), eq(c.status, "failed"))
      : or(
          eq(c.status, "pending"),
          eq(c.status, "failed"),
          and(eq(c.status, "sending"), lte(c.attemptedAt, stale)),
        );
    const result = await this.database.update(consultationRequests).set({
      [c.statusKey]: "sending",
      [c.claimKeyKey]: claimKey,
      [c.errorKey]: null,
      [c.attemptsKey]: sql`${c.attempts} + 1`,
      [c.attemptedAtKey]: now,
      updatedAt: now,
    } as never)
      .where(and(eq(consultationRequests.inquiryKey, inquiryKey), revisionKey === null ? isNull(consultationRequests.deliveryRevisionKey) : eq(consultationRequests.deliveryRevisionKey, revisionKey), availableStatus));
    return affectedRowCount(result) === 1;
  }

  async finishDelivery(inquiryKey: string, revisionKey: string | null, channel: DeliveryChannel, claimKey: string, now: Date): Promise<boolean> {
    const c = deliveryColumns[channel];
    const result = await this.database.update(consultationRequests).set({
      [c.statusKey]: "delivered",
      [c.deliveredAtKey]: now,
      updatedAt: now,
    } as never)
      .where(and(eq(consultationRequests.inquiryKey, inquiryKey), revisionKey === null ? isNull(consultationRequests.deliveryRevisionKey) : eq(consultationRequests.deliveryRevisionKey, revisionKey), eq(c.status, "sending"), eq(c.claimKey, claimKey)));
    return affectedRowCount(result) === 1;
  }

  async failDelivery(inquiryKey: string, revisionKey: string | null, channel: DeliveryChannel, claimKey: string, error: string, now: Date): Promise<boolean> {
    const c = deliveryColumns[channel];
    const result = await this.database.update(consultationRequests).set({
      [c.statusKey]: "failed",
      [c.errorKey]: error,
      updatedAt: now,
    } as never)
      .where(and(eq(consultationRequests.inquiryKey, inquiryKey), revisionKey === null ? isNull(consultationRequests.deliveryRevisionKey) : eq(consultationRequests.deliveryRevisionKey, revisionKey), eq(c.status, "sending"), eq(c.claimKey, claimKey)));
    return affectedRowCount(result) === 1;
  }
}

export function createDrizzleInquiryIntake(secret?: string): InquiryIntakeService {
  if (!db) throw new Error("Inquiry database is unavailable");
  return new InquiryIntakeService({ repository: new DrizzleInquiryRepository(db), secret });
}