import { PLATFORM_EMAIL } from './emailLayout';

/**
 * Outbound email transport backed by the connected Google Workspace (Gmail)
 * account. Messages are sent via the Gmail API using the OAuth token from the
 * Replit "google-mail" connector. The visible From address is a verified
 * "send-as" alias on the connected account (hello@boiseremodeling.co).
 */

async function getGmailAccessToken(): Promise<string> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }
  if (!hostname) {
    throw new Error('REPLIT_CONNECTORS_HOSTNAME not found');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        Accept: 'application/json',
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Gmail connector API error: ${response.status}`);
  }

  const data = await response.json();
  const item = data.items?.[0];
  const token =
    item?.settings?.oauth?.credentials?.access_token ?? item?.settings?.access_token;

  if (!token) {
    throw new Error('Gmail not connected. Please connect the Google Mail integration.');
  }

  return token;
}

function encodeHeaderWord(value: string): string {
  // RFC 2047 encoded-word for any non-ASCII header value (e.g. names, subjects).
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function base64Body(value: string): string {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/(.{76})/g, '$1\r\n');
}

function buildMimeMessage(opts: {
  from: string;
  to: string | string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}): string {
  const boundary = `bnd_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  const toHeader = Array.isArray(opts.to) ? opts.to.join(', ') : opts.to;

  const headers = [
    `From: ${opts.from}`,
    `To: ${toHeader}`,
    opts.replyTo ? `Reply-To: ${opts.replyTo}` : null,
    `Subject: ${encodeHeaderWord(opts.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ]
    .filter(Boolean)
    .join('\r\n');

  const body = [
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(opts.text),
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(opts.html),
    `--${boundary}--`,
    '',
  ].join('\r\n');

  return headers + '\r\n' + body;
}

export async function sendViaGmail(opts: {
  from: string;
  to: string | string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ id: string }> {
  const token = await getGmailAccessToken();
  const raw = Buffer.from(buildMimeMessage(opts), 'utf8').toString('base64url');

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gmail send failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return { id: data.id };
}

type EmailSendResult = { data: { id: string } | null; error: { message: string } | null };

type EmailClient = {
  __noop?: boolean;
  emails: {
    send: (args: {
      from: string;
      to: string | string[];
      replyTo?: string;
      subject: string;
      html: string;
      text?: string;
    }) => Promise<EmailSendResult>;
  };
};

let warnedNoEmailConfig = false;

/**
 * Returns a thin email client whose `emails.send` delivers through Gmail.
 * Mirrors the previous Resend client shape (`{ data, error }`) so existing
 * call-sites keep working. In non-production environments without a Gmail
 * connection, returns a no-op client so local runs don't attempt real sends.
 */
export async function getUncachableEmailClient(): Promise<{
  client: EmailClient;
  fromEmail: string;
}> {
  try {
    await getGmailAccessToken();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      if (!warnedNoEmailConfig) {
        warnedNoEmailConfig = true;
        console.warn(
          '[email] Gmail not configured; outgoing emails will be skipped in this environment.'
        );
      }
      return {
        client: {
          __noop: true,
          emails: {
            send: async () => ({ data: { id: 'noop' }, error: null }),
          },
        },
        fromEmail: PLATFORM_EMAIL,
      };
    }
    throw error;
  }

  return {
    client: {
      emails: {
        send: async (args) => {
          const result = await sendViaGmail({
            from: args.from,
            to: args.to,
            replyTo: args.replyTo,
            subject: args.subject,
            html: args.html,
            text: args.text ?? '',
          });
          return { data: { id: result.id }, error: null };
        },
      },
    },
    fromEmail: PLATFORM_EMAIL,
  };
}
