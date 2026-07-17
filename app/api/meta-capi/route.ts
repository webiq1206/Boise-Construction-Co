import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

/**
 * Meta Conversions API (server-side) endpoint.
 *
 * The browser Pixel (components/MetaPixel.tsx) fires each event with an
 * `eventID`; lib/analytics.ts posts the SAME eventID here, and this route sends
 * the event server-to-server to Meta's Graph API. Meta deduplicates the two by
 * (event_name + event_id), so a single conversion is counted once while the
 * server copy recovers the signal that ad blockers / ITP strip from the browser.
 *
 * No-ops silently unless META_CAPI_ACCESS_TOKEN + a dataset id are configured,
 * so the client never sees an error before setup is complete.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GRAPH_VERSION = 'v21.0';

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

/** Meta requires PII normalized (trim/lowercase) then SHA-256 hashed. */
function hashEmail(email?: unknown): string | undefined {
  if (typeof email !== 'string') return undefined;
  const e = email.trim().toLowerCase();
  return e ? sha256(e) : undefined;
}
function hashPhone(phone?: unknown): string | undefined {
  if (typeof phone !== 'string') return undefined;
  const p = phone.replace(/\D/g, '');
  return p ? sha256(p) : undefined;
}

export async function POST(req: Request) {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  const datasetId = process.env.META_DATASET_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!token || !datasetId) {
    return NextResponse.json({ ok: true, skipped: 'capi-not-configured' });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-json' }, { status: 400 });
  }

  const eventName = typeof body.eventName === 'string' ? body.eventName : '';
  if (!eventName) return NextResponse.json({ ok: false, error: 'missing-event' }, { status: 400 });

  const userDataIn = (body.userData ?? {}) as { email?: unknown; phone?: unknown };
  const ipRaw = req.headers.get('x-forwarded-for') || '';
  const clientIp = ipRaw.split(',')[0].trim() || undefined;
  const clientUa = req.headers.get('user-agent') || undefined;

  const user_data: Record<string, unknown> = {};
  const em = hashEmail(userDataIn.email);
  const ph = hashPhone(userDataIn.phone);
  if (em) user_data.em = [em];
  if (ph) user_data.ph = [ph];
  if (clientIp) user_data.client_ip_address = clientIp;
  if (clientUa) user_data.client_user_agent = clientUa;
  if (typeof body.fbp === 'string' && body.fbp) user_data.fbp = body.fbp;
  if (typeof body.fbc === 'string' && body.fbc) user_data.fbc = body.fbc;

  const event: Record<string, unknown> = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: typeof body.actionSource === 'string' ? body.actionSource : 'website',
    user_data,
  };
  if (typeof body.eventId === 'string' && body.eventId) event.event_id = body.eventId;
  if (typeof body.eventSourceUrl === 'string' && body.eventSourceUrl) event.event_source_url = body.eventSourceUrl;
  if (body.customData && typeof body.customData === 'object') event.custom_data = body.customData;

  const payload: Record<string, unknown> = { data: [event] };
  if (process.env.META_CAPI_TEST_EVENT_CODE) payload.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${datasetId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // Log for debugging; never surface Meta's error (or token) to the client.
      console.error('[meta-capi]', res.status, text.slice(0, 400));
      return NextResponse.json({ ok: false }, { status: 200 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[meta-capi] fetch failed', (e as Error).message);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
