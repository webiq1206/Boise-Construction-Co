const DEFAULT_MAX_BYTES = 96 * 1024;
export const MIN_LEAD_FORM_DWELL_MS = 2_500;

export class LeadRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Reads and parses a JSON body without allowing an unbounded public payload. */
export async function readBoundedJson(
  request: Request,
  maxBytes = DEFAULT_MAX_BYTES,
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number(contentLength);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      throw new LeadRequestError("Request is too large", 413);
    }
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new LeadRequestError("Request is too large", 413);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new LeadRequestError("Invalid JSON", 400);
  }
}

export type LeadTrapResult = "ok" | "honeypot" | "too-fast";

export function inspectLeadTrap(
  input: { website?: string; formStartedAt?: number },
  now = Date.now(),
): LeadTrapResult {
  if ((input.website ?? "").trim()) return "honeypot";
  if (
    typeof input.formStartedAt !== "number" ||
    !Number.isFinite(input.formStartedAt) ||
    input.formStartedAt > now ||
    now - input.formStartedAt < MIN_LEAD_FORM_DWELL_MS
  ) {
    return "too-fast";
  }
  return "ok";
}