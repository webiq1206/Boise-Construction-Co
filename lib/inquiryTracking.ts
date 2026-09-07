/**
 * Browser-held identity for one lead inquiry.
 *
 * The key is opaque and contains no contact information. Keeping it in durable
 * storage lets a retry, reload, estimate revision, or consultation follow-up
 * resolve to the same server row instead of becoming another inquiry.
 */
export interface InquiryTrackingIdentity {
  inquiryKey: string;
  claimKey: string;
  conversionId?: string;
  acceptedAt?: number;
  conversionFiredAt?: number;
  createdAt: number;
}

const STORAGE_KEY = "brc_inquiry_tracking";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function opaqueKey(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    try {
      return window.sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
}

function write(identity: InquiryTrackingIdentity): void {
  if (typeof window === "undefined") return;
  const value = JSON.stringify(identity);
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
    return;
  } catch {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* Storage is an optimization. Server contact dedupe remains the fallback. */
    }
  }
}

export function clearInquiryTracking(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function readInquiryTracking(): InquiryTrackingIdentity | null {
  try {
    const raw = readRaw();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<InquiryTrackingIdentity>;
    if (
      typeof parsed.inquiryKey !== "string" ||
      typeof parsed.claimKey !== "string" ||
      typeof parsed.createdAt !== "number"
    ) {
      clearInquiryTracking();
      return null;
    }
    if (Date.now() - parsed.createdAt > MAX_AGE_MS) {
      clearInquiryTracking();
      return null;
    }
    return parsed as InquiryTrackingIdentity;
  } catch {
    clearInquiryTracking();
    return null;
  }
}

export function getOrCreateInquiryTracking(): InquiryTrackingIdentity {
  const existing = readInquiryTracking();
  if (existing) return existing;
  const created: InquiryTrackingIdentity = {
    inquiryKey: opaqueKey("inq"),
    claimKey: opaqueKey("claim"),
    createdAt: Date.now(),
  };
  write(created);
  return created;
}

export function recordInquiryAcceptance(input: {
  inquiryKey: string;
  conversionId: string;
}): InquiryTrackingIdentity {
  const current = readInquiryTracking();
  const next: InquiryTrackingIdentity = {
    inquiryKey: input.inquiryKey,
    claimKey:
      current?.inquiryKey === input.inquiryKey
        ? current.claimKey
        : opaqueKey("claim"),
    conversionId: input.conversionId,
    acceptedAt: current?.acceptedAt ?? Date.now(),
    conversionFiredAt:
      current?.conversionId === input.conversionId
        ? current.conversionFiredAt
        : undefined,
    createdAt:
      current?.inquiryKey === input.inquiryKey
        ? current.createdAt
        : Date.now(),
  };
  write(next);
  return next;
}

export function markInquiryConversionFired(conversionId: string): void {
  const current = readInquiryTracking();
  if (!current || current.conversionId !== conversionId) return;
  write({ ...current, conversionFiredAt: Date.now() });
}