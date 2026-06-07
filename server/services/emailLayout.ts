import { SITE_CONFIG } from "@/shared/siteConfig";

/** Site brand tokens - aligned with app/globals.css */
export const EMAIL_BRAND = {
  charcoal: "#3A3E3D",
  charcoalLight: "#5A5F5C",
  sage: "#999F93",
  canvas: "#F5F3EF",
  white: "#ffffff",
  border: "#E0DDD8",
  highlightBg: "#F0EFEB",
  accentDark: "#2D8652",
} as const;

export const SITE_BASE_URL = SITE_CONFIG.siteUrl;

export function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildTextLogo(): string {
  return `
    <div style="margin-bottom: 20px;">
      <div style="font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 22px; font-weight: 300; letter-spacing: -0.02em; color: ${EMAIL_BRAND.charcoal}; line-height: 1.2;">
        Boise Remodeling <span style="color: ${EMAIL_BRAND.sage}; font-style: italic;">Co</span>
      </div>
      <div style="font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: ${EMAIL_BRAND.charcoalLight}; margin-top: 4px;">
        Design &amp; Build
      </div>
    </div>
  `;
}

export const emailStyles = `
  body {
    margin: 0;
    padding: 0;
    font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    background-color: ${EMAIL_BRAND.canvas};
    line-height: 1.6;
  }
  .email-wrapper {
    max-width: 600px;
    margin: 0 auto;
    background-color: ${EMAIL_BRAND.white};
  }
  .header {
    background: linear-gradient(135deg, ${EMAIL_BRAND.highlightBg} 0%, ${EMAIL_BRAND.white} 100%);
    color: ${EMAIL_BRAND.charcoal};
    padding: 40px 30px;
    text-align: center;
    border-bottom: 1px solid ${EMAIL_BRAND.border};
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.5px;
    color: ${EMAIL_BRAND.charcoal};
  }
  .header p {
    margin: 8px 0 0 0;
    font-size: 14px;
    color: ${EMAIL_BRAND.charcoalLight};
  }
  .content {
    padding: 40px 30px;
    background-color: ${EMAIL_BRAND.white};
  }
  .greeting {
    font-size: 18px;
    color: ${EMAIL_BRAND.charcoal};
    margin: 0 0 20px 0;
  }
  .section {
    margin: 30px 0;
  }
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: ${EMAIL_BRAND.charcoal};
    margin: 0 0 15px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
  }
  .info-table td {
    padding: 12px 0;
    border-bottom: 1px solid ${EMAIL_BRAND.border};
  }
  .info-table .label {
    font-weight: 600;
    color: ${EMAIL_BRAND.charcoalLight};
    width: 40%;
  }
  .info-table .value {
    color: ${EMAIL_BRAND.charcoal};
  }
  .highlight-box {
    background: ${EMAIL_BRAND.highlightBg};
    border-left: 4px solid ${EMAIL_BRAND.sage};
    padding: 20px;
    margin: 25px 0;
    border-radius: 4px;
  }
  .highlight-box p {
    margin: 0;
    color: ${EMAIL_BRAND.charcoal};
  }
  .warning-box {
    background: #fffbeb;
    border-left: 4px solid #f59e0b;
    padding: 20px;
    margin: 25px 0;
    border-radius: 4px;
  }
  .warning-box p {
    margin: 0;
    color: #78350f;
  }
  .cta-button {
    display: inline-block;
    background: ${EMAIL_BRAND.charcoal};
    color: #ffffff !important;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    margin: 20px 0;
    text-align: center;
  }
  .footer {
    background-color: ${EMAIL_BRAND.highlightBg};
    padding: 30px;
    text-align: center;
    border-top: 1px solid ${EMAIL_BRAND.border};
  }
  .footer-contact {
    font-size: 13px;
    color: ${EMAIL_BRAND.charcoalLight};
    margin: 5px 0;
  }
  .footer-contact a {
    color: ${EMAIL_BRAND.charcoal};
    text-decoration: none;
  }
  .divider {
    height: 1px;
    background-color: ${EMAIL_BRAND.border};
    margin: 25px 0;
  }
  .badge {
    display: inline-block;
    background-color: ${EMAIL_BRAND.highlightBg};
    color: ${EMAIL_BRAND.charcoal};
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    margin: 5px 0;
  }
`;

export function buildEmailFooter(): string {
  return `
    <div class="footer">
      ${buildTextLogo()}
      <p class="footer-contact">${escapeHtml(`${SITE_CONFIG.address.cityState} · ${SITE_CONFIG.address.serviceArea}`)}</p>
      <p class="footer-contact">Phone: <a href="${SITE_CONFIG.phoneHref}">${escapeHtml(SITE_CONFIG.phone)}</a></p>
      <p class="footer-contact">Email: <a href="mailto:${escapeHtml(SITE_CONFIG.email)}">${escapeHtml(SITE_CONFIG.email)}</a></p>
      <p class="footer-contact">Web: <a href="${SITE_BASE_URL}">${escapeHtml(SITE_BASE_URL.replace(/^https?:\/\//, ""))}</a></p>
    </div>
  `;
}

export function wrapEmailHtml(options: {
  title: string;
  subtitle?: string;
  content: string;
}): string {
  const { title, subtitle, content } = options;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${emailStyles}</style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      ${buildTextLogo()}
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
    </div>
    <div class="content">
      ${content}
    </div>
    ${buildEmailFooter()}
  </div>
</body>
</html>`;
}

/** Canonical address for all outbound mail and internal notifications */
export const PLATFORM_EMAIL = SITE_CONFIG.email;

export async function getAdminRecipientEmails(
  _fallbackEmail?: string
): Promise<string[]> {
  return [PLATFORM_EMAIL];
}

export function formatFromAddress(_fromEmail?: string): string {
  return `${SITE_CONFIG.name} <${PLATFORM_EMAIL}>`;
}

export function getReplyToAddress(): string {
  return PLATFORM_EMAIL;
}
