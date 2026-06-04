import { getUncachableEmailClient } from './emailTransport';
import { formatQuoteForDisplay, calculateQuoteRange } from '../../shared/utils';
import { storage } from '../storage';
import {
  SITE_BASE_URL,
  EMAIL_BRAND,
  emailStyles,
  escapeHtml,
  htmlToPlainText,
  buildTextLogo,
  buildEmailFooter,
  wrapEmailHtml,
  getAdminRecipientEmails,
  formatFromAddress,
  getReplyToAddress,
} from './emailLayout';
import { SITE_CONFIG } from '@/shared/siteConfig';

const NOTIF_RECURRING_ELIGIBLE = new Set<string>();

function formatFreqLabel(freq: string): string {
  const map: Record<string, string> = {
    'one-time': 'One-time',
    'weekly': 'Weekly',
    'bi-weekly': 'Every 2 weeks',
    'monthly': 'Monthly',
  };
  return map[freq] || freq;
}

function buildLeadFrequencyRow(
  selectedServices?: string[],
  frequency?: string,
  serviceData?: any,
): string {
  if (!frequency) return '';
  const services = selectedServices && selectedServices.length > 0 ? selectedServices : [];
  if (services.length === 0) {
    return `<tr><td class="label">Frequency:</td><td class="value">${formatFreqLabel(frequency)}</td></tr>`;
  }

  const svcData = serviceData && typeof serviceData === 'string' ? JSON.parse(serviceData) : (serviceData || {});
  const perService = services.map(sid => {
    let svcFreq = svcData[sid]?.frequency || frequency || "one-time";
    if (svcFreq !== "one-time" && !NOTIF_RECURRING_ELIGIBLE.has(sid)) {
      svcFreq = "one-time";
    }
    return {
      name: sid.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      freq: svcFreq,
    };
  });

  const uniqueFreqs = new Set(perService.map(s => s.freq));
  if (uniqueFreqs.size === 1) {
    return `<tr><td class="label">Frequency:</td><td class="value">${formatFreqLabel(perService[0].freq)}</td></tr>`;
  }

  const lines = perService.map(s =>
    `<li style="padding: 2px 0;">${s.name}: <strong>${formatFreqLabel(s.freq)}</strong></li>`
  ).join('');
  return `<tr><td class="label" style="vertical-align: top;">Frequency:</td><td class="value"><ul style="margin: 0; padding-left: 18px; list-style: disc;">${lines}</ul></td></tr>`;
}

function emailServiceName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
}

function getEmailLeadDisplayTitle(leadData: {
  serviceType: string;
  selectedServices?: string[];
  lineItems?: any;
}): string {
  const services = leadData.selectedServices;
  if (!services || services.length <= 1) {
    return emailServiceName(leadData.serviceType);
  }

  let topIndex = 0;
  const items = parseMaybeJson<any[]>(leadData.lineItems);
  if (items && Array.isArray(items) && items.length > 0) {
    let maxPrice = -1;
    for (const item of items) {
      const price = typeof item?.adjustedPrice === 'number' ? item.adjustedPrice
        : typeof item?.price === 'number' ? item.price
        : typeof item?.adjustedPrice === 'string' ? parseFloat(item.adjustedPrice)
        : typeof item?.price === 'string' ? parseFloat(item.price)
        : 0;
      const slug = item?.serviceId || item?.service || "";
      const idx = slug ? services.indexOf(slug) : -1;
      if (price > maxPrice && idx >= 0) {
        maxPrice = price;
        topIndex = idx;
      }
    }
  }

  const topSlug = services[topIndex];
  const topName = emailServiceName(topSlug);
  if (services.length === 2) {
    const otherSlug = services[topIndex === 0 ? 1 : 0];
    return `${topName} & ${emailServiceName(otherSlug)}`;
  }
  return `${topName} + ${services.length - 1} more`;
}

function adminLeadUrl(tab: 'pending' | 'accepted' | 'available' | 'all', leadId: string): string {
  return `${SITE_BASE_URL}/admin/dashboard?tab=${encodeURIComponent(tab)}&leadId=${encodeURIComponent(leadId)}`;
}

function subcontractorLeadUrl(leadId: string): string {
  return `${SITE_BASE_URL}/subcontractor/leads?leadId=${encodeURIComponent(leadId)}`;
}

function parseMaybeJson<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

function maskEmailBodyText(text: string): string {
  // Conservative masking for user-provided notes that may contain PII.
  // Avoid masking purely numeric values (measurements) aggressively; only mask obvious patterns.
  const emailMasked = text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "***");
  // Mask common US phone formats: (208) 555-1212, 208-555-1212, 2085551212, +1 208 555 1212
  const phoneMasked = emailMasked.replace(
    /(\+?1[\s.-]?)?(?:\(\s*\d{3}\s*\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/g,
    "***"
  );
  return phoneMasked;
}

function renderLineItemsTable(lineItemsRaw: unknown): string {
  const items = parseMaybeJson<any[]>(lineItemsRaw);
  if (!items || !Array.isArray(items) || items.length === 0) return "";

  const rows = items
    .map((item) => {
      const service = item?.serviceName || item?.service || item?.serviceId || "Service";
      const priceVal =
        typeof item?.adjustedPrice === "number"
          ? item.adjustedPrice
          : typeof item?.price === "number"
            ? item.price
            : typeof item?.adjustedPrice === "string"
              ? parseFloat(item.adjustedPrice)
              : typeof item?.price === "string"
                ? parseFloat(item.price)
                : NaN;
      const price = Number.isFinite(priceVal) ? `$${Math.round(priceVal).toLocaleString()}` : "-";
      const desc = item?.description ? String(item.description) : "";

      return `
        <tr>
          <td class="label">${service}</td>
          <td class="value" style="text-align:right; font-weight:600;">${price}</td>
        </tr>
        ${desc ? `
        <tr>
          <td colspan="2" class="value" style="color:#6b7280; font-size:12px; padding-top:0;">${desc}</td>
        </tr>
        ` : ""}
      `;
    })
    .join("");

  return `
    <div class="section">
      <h2 class="section-title">Pricing Details</h2>
      <table class="info-table">
        ${rows}
      </table>
    </div>
  `;
}

function renderServiceDataTable(serviceDataRaw: unknown): string {
  const serviceData = parseMaybeJson<Record<string, Record<string, any>>>(serviceDataRaw);
  if (!serviceData || typeof serviceData !== "object") return "";

  const entries: Array<{ label: string; value: string }> = [];
  for (const [serviceId, measurements] of Object.entries(serviceData)) {
    if (!measurements || typeof measurements !== "object") continue;
    for (const [field, val] of Object.entries(measurements)) {
      if (val === null || val === undefined || val === "") continue;
      const prettyField = field.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
      const label = `${serviceId.replace(/-/g, " ")}: ${prettyField}`;
      const value = typeof val === "number" ? val.toLocaleString() : String(val);
      entries.push({ label, value });
    }
  }

  if (entries.length === 0) return "";

  return `
    <div class="section">
      <h2 class="section-title">Measurements & Scope</h2>
      <table class="info-table">
        ${entries
          .map(
            (e) => `
            <tr>
              <td class="label">${e.label}:</td>
              <td class="value">${e.value}</td>
            </tr>
          `
          )
          .join("")}
      </table>
    </div>
  `;
}

function formatLeadValueRange(value: string): { subject: string; display: string } {
  const { min, max } = calculateQuoteRange(value, 0.15);
  if (min === 0 && max === 0) {
    return { subject: "Quote Pending", display: "Pending" };
  }
  const display = `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  return { subject: display, display };
}

const BLOCKED_EMAIL_DOMAINS = ['timberandlove.com'];

function isBlockedEmailDomain(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1];
  return BLOCKED_EMAIL_DOMAINS.some(d => domain === d);
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<void> {
  if (!to || to.trim().length === 0) {
    throw new Error('Recipient email address is required');
  }

  if (isBlockedEmailDomain(to)) {
    console.log(`[email] Blocked email to ${to} (domain on blocklist)`);
    return;
  }
  
  try {
    const { client: resend, fromEmail } = await getUncachableEmailClient();
    if ((resend as any)?.__noop) {
      console.log(`[email] Skipped (noop) → ${to}: ${subject}`);
      return;
    }

    const result = await resend.emails.send({
      from: formatFromAddress(fromEmail),
      replyTo: getReplyToAddress(),
      to,
      subject,
      html: htmlBody,
      text: textBody ?? htmlToPlainText(htmlBody),
    });

    if ((result as any)?.error) {
      console.error(`Failed to send email to ${to}: ${subject}`, JSON.stringify((result as any).error));
      throw new Error(`Email send failed: ${(result as any).error?.message ?? 'unknown error'}`);
    }

    console.log(`Email sent successfully to ${to}: ${subject}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

async function sendEmailToAdmins(
  subject: string,
  htmlBody: string,
  fromEmail: string
): Promise<void> {
  const recipients = await getAdminRecipientEmails(fromEmail);
  for (const to of recipients) {
    await sendEmail(to, subject, htmlBody);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

export async function sendLeadPurchasedNotification(leadData: {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  serviceType: string;
  finalQuote: string;
  address?: string;
  purchasePrice?: string;
}, purchaserData: {
  name: string;
  email: string;
}): Promise<void> {
  const { fromEmail } = await getUncachableEmailClient();
  const dashboardUrl = adminLeadUrl('all', leadData.id);
  
  const purchasePrice = leadData.purchasePrice ? `$${parseFloat(leadData.purchasePrice).toFixed(2)}` : 'N/A';
  const subject = `Lead Sold for ${purchasePrice} - ${leadData.name} (${leadData.city})`;
  const leadValue = formatLeadValueRange(leadData.finalQuote);
  
  const htmlBody = `
    <!DOCTYPE html>
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
          <h1>Lead Purchased</h1>
          <p>Transaction Notification</p>
        </div>
        
        <div class="content">
          <p class="greeting">A lead has been successfully purchased from your marketplace.</p>

          <div class="section">
            <h2 class="section-title">Subcontractor Details</h2>
            <table class="info-table">
              <tr>
                <td class="label">Name:</td>
                <td class="value">${purchaserData.name}</td>
              </tr>
              <tr>
                <td class="label">Email:</td>
                <td class="value"><a href="mailto:${purchaserData.email}" style="color: ${EMAIL_BRAND.charcoal}; text-decoration: none;">${purchaserData.email}</a></td>
              </tr>
            </table>
          </div>

          <div class="divider"></div>

          <div class="section">
            <h2 class="section-title">Lead Information</h2>
            <p><span class="badge">Lead ID: ${leadData.id}</span></p>
            <table class="info-table">
              <tr>
                <td class="label">Customer Name:</td>
                <td class="value">${leadData.name}</td>
              </tr>
              <tr>
                <td class="label">Email:</td>
                <td class="value">${leadData.email}</td>
              </tr>
              <tr>
                <td class="label">Phone:</td>
                <td class="value">${leadData.phone}</td>
              </tr>
              <tr>
                <td class="label">Service Area:</td>
                <td class="value">${leadData.city}</td>
              </tr>
              ${leadData.address ? `
              <tr>
                <td class="label">Property Address:</td>
                <td class="value">${leadData.address}</td>
              </tr>
              ` : ''}
              <tr>
                <td class="label">Service Type:</td>
                <td class="value">${leadData.serviceType}</td>
              </tr>
              <tr>
                <td class="label">Quote Value:</td>
                <td class="value" style="font-size: 20px; font-weight: 600; color: ${EMAIL_BRAND.charcoal};">${leadValue.display}</td>
              </tr>
            </table>
          </div>

          <div class="highlight-box" >
            <p><strong>Lead Purchase Price: ${purchasePrice}</strong></p>
            <p style="margin: 10px 0 0 0;">The subcontractor paid <strong>${purchasePrice}</strong> for this lead. The lead has been transferred and they now have full access to customer contact information.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" class="cta-button">View Lead Details →</a>
          </div>
        </div>

        ${buildEmailFooter('Lead Marketplace')}
      </div>
    </body>
    </html>
  `;

  await sendEmailToAdmins(subject, htmlBody, fromEmail);
}

export async function sendLeadPurchaseConfirmation(purchaserEmail: string, leadData: {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  serviceType: string;
  finalQuote: string;
  address?: string;
}): Promise<void> {
  const subject = `Lead Purchase Confirmed - ${leadData.name}`;
  const leadValue = formatLeadValueRange(leadData.finalQuote);
  const portalUrl = subcontractorLeadUrl(leadData.id);
  
  const htmlBody = `
    <!DOCTYPE html>
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
          <h1>Purchase Confirmed</h1>
          <p>Your lead is ready to contact</p>
        </div>
        
        <div class="content">
          <p class="greeting">Congratulations! Your lead purchase was successful.</p>
          
          <p style="color: #4b5563; margin: 0 0 20px 0;">You now have complete access to this customer's contact information. We recommend reaching out within the next 2-4 hours for the best conversion rates.</p>

          <div class="section">
            <h2 class="section-title">Customer Contact Information</h2>
            <p><span class="badge">Lead ID: ${leadData.id}</span></p>
            <table class="info-table">
              <tr>
                <td class="label">Customer Name:</td>
                <td class="value" style="font-weight: 600;">${leadData.name}</td>
              </tr>
              <tr>
                <td class="label">Email:</td>
                <td class="value"><a href="mailto:${leadData.email}" style="color: ${EMAIL_BRAND.charcoal}; text-decoration: none; font-weight: 600;">${leadData.email}</a></td>
              </tr>
              <tr>
                <td class="label">Phone:</td>
                <td class="value"><a href="tel:${leadData.phone}" style="color: ${EMAIL_BRAND.charcoal}; text-decoration: none; font-weight: 600;">${leadData.phone}</a></td>
              </tr>
              <tr>
                <td class="label">Service Area:</td>
                <td class="value">${leadData.city}</td>
              </tr>
              ${leadData.address ? `
              <tr>
                <td class="label">Property Address:</td>
                <td class="value">${leadData.address}</td>
              </tr>
              ` : ''}
              <tr>
                <td class="label">Service Requested:</td>
                <td class="value">${leadData.serviceType}</td>
              </tr>
              <tr>
                <td class="label">Quote Range:</td>
                <td class="value" style="font-size: 20px; font-weight: 600; color: ${EMAIL_BRAND.charcoal};">${leadValue.display}</td>
              </tr>
            </table>
          </div>

          <div class="highlight-box">
            <p><strong>💡 Tips for Success:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #4b5563;">
              <li>Contact the customer within 2-4 hours while they're actively searching</li>
              <li>Reference their specific service request to show you've reviewed their needs</li>
              <li>Offer to schedule a free property assessment at their convenience</li>
              <li>Be professional, friendly, and responsive to build trust quickly</li>
            </ul>
          </div>

          <div class="warning-box">
            <p><strong>⚠️ Important Purchase Terms:</strong></p>
            <p style="margin: 10px 0 0 0;">This lead purchase is non-refundable. Once purchased, you own exclusive access to this customer's contact information. Please reach out promptly to maximize your conversion opportunity.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${portalUrl}" class="cta-button">Open Contractor Portal →</a>
          </div>
        </div>

        ${buildEmailFooter('Lead Marketplace')}
      </div>
    </body>
    </html>
  `;

  await sendEmail(purchaserEmail, subject, htmlBody);
}

export async function sendAdminAutoDeclineNotification(leadData: {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  serviceType: string;
  finalQuote: string;
  address?: string;
  hoursPending: number;
}): Promise<void> {
  const { fromEmail } = await getUncachableEmailClient();
  const dashboardUrl = adminLeadUrl('available', leadData.id);
  
  const leadValue = formatLeadValueRange(leadData.finalQuote);
  const hoursText = leadData.hoursPending >= 24 ? `${Math.floor(leadData.hoursPending)} hours` : '24+ hours';
  
  const subject = `Lead Auto-Declined - ${leadData.name} (${leadData.city}) - ${leadValue.subject}`;
  
  const htmlBody = `
    <!DOCTYPE html>
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
          <h1>Lead Auto-Declined</h1>
          <p>Automated System Notification</p>
        </div>
        
        <div class="content">
          <p class="greeting">A lead has been automatically declined and made available to subcontractors.</p>
          
          <div class="warning-box">
            <p><strong>⚠️ Automatic Decline</strong></p>
            <p style="margin: 10px 0 0 0;">This lead was pending for ${hoursText} without admin review. It has been automatically declined and is now available in the subcontractor portal.</p>
          </div>

          <div class="section">
            <h2 class="section-title">Lead Information</h2>
            <p><span class="badge">Lead ID: ${leadData.id}</span></p>
            <table class="info-table">
              <tr>
                <td class="label">Customer Name:</td>
                <td class="value">${leadData.name}</td>
              </tr>
              <tr>
                <td class="label">Email:</td>
                <td class="value"><a href="mailto:${leadData.email}" style="color: ${EMAIL_BRAND.charcoal}; text-decoration: none;">${leadData.email}</a></td>
              </tr>
              <tr>
                <td class="label">Phone:</td>
                <td class="value"><a href="tel:${leadData.phone}" style="color: ${EMAIL_BRAND.charcoal}; text-decoration: none;">${leadData.phone}</a></td>
              </tr>
              <tr>
                <td class="label">Service Area:</td>
                <td class="value">${leadData.city}</td>
              </tr>
              ${leadData.address ? `
              <tr>
                <td class="label">Property Address:</td>
                <td class="value">${leadData.address}</td>
              </tr>
              ` : ''}
              <tr>
                <td class="label">Service Type:</td>
                <td class="value">${leadData.serviceType}</td>
              </tr>
              <tr>
                <td class="label">Estimated Value:</td>
                <td class="value" style="font-size: 20px; font-weight: 600; color: ${EMAIL_BRAND.charcoal};">${leadValue.display}</td>
              </tr>
              <tr>
                <td class="label">Time Pending:</td>
                <td class="value">${hoursText}</td>
              </tr>
            </table>
          </div>

          <div class="highlight-box">
            <p><strong>Next Steps</strong></p>
            <p style="margin: 10px 0 0 0;">This lead is now available in the subcontractor portal. Subcontractors have been notified and can purchase this lead.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" class="cta-button">View Lead in Dashboard →</a>
          </div>
        </div>

        ${buildEmailFooter('Lead Marketplace')}
      </div>
    </body>
    </html>
  `;

  await sendEmailToAdmins(subject, htmlBody, fromEmail);
}

export async function sendCustomerStatusUpdate(
  customerEmail: string,
  quoteId: string,
  update: { status: 'received' | 'under_review' | 'contact_soon' | 'quote_ready'; message: string }
): Promise<void> {
  const subjectMap: Record<string, string> = {
    received: "We received your quote request",
    under_review: "Your quote is under review",
    contact_soon: "We’ll be contacting you soon",
    quote_ready: "Your quote is ready",
  };

  const subject = subjectMap[update.status] || "Quote status update";
  const statusUrl = `${SITE_BASE_URL}/quote-status/${quoteId}`;

  const htmlBody = `
    <!DOCTYPE html>
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
          <h1>Quote Status Update</h1>
          <p>${subject}</p>
        </div>
        <div class="content">
          <p class="greeting">Here’s the latest update on your quote request:</p>
          <div class="highlight-box">
            <p style="margin: 0;"><strong>Status:</strong> ${escapeHtml(update.status.replace(/_/g, ' '))}</p>
            <p style="margin: 10px 0 0 0;">${escapeHtml(update.message)}</p>
          </div>
          <div style="text-align:center; margin: 30px 0;">
            <a href="${statusUrl}" class="cta-button">View Quote Status →</a>
          </div>
          <p style="font-size: 14px; color: ${EMAIL_BRAND.charcoalLight};">Questions? Call us at <a href="${SITE_CONFIG.phoneHref}">${escapeHtml(SITE_CONFIG.phone)}</a>.</p>
        </div>
        ${buildEmailFooter('Customer Updates')}
      </div>
    </body>
    </html>
  `;

  await sendEmail(customerEmail, subject, htmlBody);
}

export async function sendContractorNewLeadAvailable(
  contractorEmail: string,
  leadData: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    serviceType: string;
    finalQuote: string;
    address?: string;
    currentLeadPrice: string;
    propertyType?: string;
    frequency?: string;
    selectedServices?: string[];
    lineItems?: any;
    serviceData?: any;
    message?: string;
  }
): Promise<void> {
  const displayTitle = getEmailLeadDisplayTitle(leadData);
  const serviceCount = leadData.selectedServices?.length || 1;
  const subject = `${displayTitle} in ${leadData.city} -- $${formatQuoteForDisplay(leadData.currentLeadPrice, true)} lead, first come first served`;
  const leadValue = formatLeadValueRange(leadData.finalQuote);
  const portalUrl = subcontractorLeadUrl(leadData.id);
  const lineItemsHtml = renderLineItemsTable(leadData.lineItems);
  const serviceDataHtml = renderServiceDataTable(leadData.serviceData);
  const safeMessage = leadData.message ? maskEmailBodyText(String(leadData.message)) : "";

  const servicesSummary = serviceCount > 1
    ? `<tr><td class="label">Services:</td><td class="value">${displayTitle} (${serviceCount} services total)</td></tr>`
    : `<tr><td class="label">Service:</td><td class="value">${displayTitle}</td></tr>`;

  const htmlBody = `
    <!DOCTYPE html>
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
          <h1>${displayTitle}</h1>
          <p>${leadData.city} -- ${leadValue.display} project</p>
        </div>
        <div class="content">
          <p class="greeting">A customer in <strong>${leadData.city}</strong> just requested service and is ready to get started.</p>

          <div class="highlight-box" style="background: linear-gradient(to right, #fffbeb 0%, #fef9c3 100%); border-left-color: #f59e0b;">
            <p style="margin: 0; font-weight: 600; color: #92400e;">This is a first-come, first-served lead.</p>
            <p style="margin: 6px 0 0 0; color: #78350f; font-size: 14px;">The first contractor to purchase gets exclusive access to the customer's full contact info. The lead price goes up over time, so today is the best deal.</p>
          </div>

          <div class="section">
            <h2 class="section-title">Lead Overview</h2>
            <table class="info-table">
              ${servicesSummary}
              <tr><td class="label">City:</td><td class="value">${leadData.city}</td></tr>
              ${buildLeadFrequencyRow(leadData.selectedServices, leadData.frequency, leadData.serviceData)}
              ${leadData.propertyType ? `<tr><td class="label">Property Type:</td><td class="value">${leadData.propertyType}</td></tr>` : ""}
              <tr><td class="label">Est. Project Value:</td><td class="value" style="font-size: 18px; font-weight: 600; color: #1e40af;">${leadValue.display}</td></tr>
              <tr><td class="label">Your Cost:</td><td class="value" style="font-size: 20px; font-weight: 600; color: ${EMAIL_BRAND.charcoal};">$${formatQuoteForDisplay(leadData.currentLeadPrice, true)}</td></tr>
            </table>
          </div>

          <div style="text-align:center; margin: 25px 0;">
            <a href="${portalUrl}" class="cta-button">Claim This Lead</a>
          </div>

          <div class="section">
            <h2 class="section-title">Contact Info (Revealed After Purchase)</h2>
            <table class="info-table">
              <tr><td class="label">Customer Name:</td><td class="value">***</td></tr>
              <tr><td class="label">Email:</td><td class="value">***</td></tr>
              <tr><td class="label">Phone:</td><td class="value">***</td></tr>
              <tr><td class="label">Exact Address:</td><td class="value">***</td></tr>
            </table>
            <p style="font-size: 13px; color: #6b7280; margin: 8px 0 0 0;">Full name, phone, email, and address are revealed immediately after purchase.</p>
          </div>

          ${serviceDataHtml}
          ${lineItemsHtml}

          ${safeMessage ? `
          <div class="section">
            <h2 class="section-title">Customer Notes</h2>
            <div class="highlight-box">
              <p style="margin:0;">${safeMessage}</p>
            </div>
          </div>
          ` : ""}

          <div style="text-align:center; margin: 30px 0;">
            <a href="${portalUrl}" class="cta-button">View Lead Details</a>
          </div>
        </div>
        ${buildEmailFooter('Lead Marketplace')}
      </div>
    </body>
    </html>
  `;

  await sendEmail(contractorEmail, subject, htmlBody);
}

export async function sendLeadMergeRefundNotification(
  contractorEmail: string,
  data: {
    contractorName?: string | null;
    refundAmount: string;
    creditsRefunded?: string;
    stripeRefunded?: string;
    sourceLeadId: string;
    targetLeadId: string;
    targetLead: {
      id: string;
      city?: string | null;
      serviceType?: string | null;
      selectedServices?: string[] | null;
      lineItems?: any;
    };
  }
): Promise<void> {
  const { fromEmail } = await getUncachableEmailClient();
  const refundAmountNum = parseFloat(data.refundAmount || "0") || 0;
  const refundDisplay = `$${refundAmountNum.toFixed(2)}`;
  const creditsNum = parseFloat(data.creditsRefunded || "0") || 0;
  const stripeNum = parseFloat(data.stripeRefunded || "0") || 0;
  const targetTitle = getEmailLeadDisplayTitle({
    serviceType: data.targetLead.serviceType || "Service",
    selectedServices: data.targetLead.selectedServices || undefined,
    lineItems: data.targetLead.lineItems,
  });
  const cityPart = data.targetLead.city ? ` in ${data.targetLead.city}` : "";
  const targetUrl = subcontractorLeadUrl(data.targetLead.id);
  const greetingName = data.contractorName && data.contractorName.trim().length > 0 ? data.contractorName.trim() : "there";

  const subject = `Refund issued (${refundDisplay}) - duplicate lead merged`;

  const breakdownRows: string[] = [];
  if (stripeNum > 0) {
    breakdownRows.push(
      `<tr><td class="label">Refunded to card:</td><td class="value">$${stripeNum.toFixed(2)}</td></tr>`
    );
  }
  if (creditsNum > 0) {
    breakdownRows.push(
      `<tr><td class="label">Credits restored:</td><td class="value">$${creditsNum.toFixed(2)}</td></tr>`
    );
  }
  const breakdownHtml = breakdownRows.length > 0
    ? `<table class="info-table" style="margin-top: 8px;">${breakdownRows.join("")}</table>`
    : "";

  const htmlBody = `
    <!DOCTYPE html>
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
          <h1>Lead Refunded</h1>
          <p>A duplicate lead you purchased was merged</p>
        </div>
        <div class="content">
          <p class="greeting">Hi ${greetingName},</p>
          <p>We identified a lead you previously purchased as a duplicate of another lead in our system. Our admin team merged the two so that the customer is only being worked once, and we have refunded your purchase in full.</p>

          <div class="highlight-box">
            <p><strong>Refund total: ${refundDisplay}</strong></p>
            ${breakdownHtml}
          </div>

          <div class="section">
            <h2 class="section-title">What this means</h2>
            <p style="margin: 0 0 10px 0;">The original lead you bought (ID <code>${data.sourceLeadId}</code>) has been archived. All of its details, including services, measurements, and notes, have been combined into the surviving lead below. If you were already in contact with this customer, you can keep working with them on the merged lead.</p>
          </div>

          <div class="section">
            <h2 class="section-title">Merged Lead</h2>
            <table class="info-table">
              <tr><td class="label">Service:</td><td class="value">${targetTitle}${cityPart}</td></tr>
              <tr><td class="label">Lead ID:</td><td class="value">${data.targetLeadId}</td></tr>
            </table>
          </div>

          <div style="text-align:center; margin: 30px 0;">
            <a href="${targetUrl}" class="cta-button">View Merged Lead →</a>
          </div>

          <p style="font-size: 13px; color: #6b7280;">If anything looks off about this refund, just reply to this email and we'll take a look.</p>
        </div>
        ${buildEmailFooter('Lead Marketplace')}
      </div>
    </body>
    </html>
  `;

  await sendEmail(contractorEmail, subject, htmlBody);
}

export async function sendAdminDailyDigest(
  adminEmail: string,
  data: {
    totalPending: number;
    leads24h: number;
    leads48h: number;
    pendingLeads: any[];
    leads24hList: any[];
    leads48hList: any[];
  }
): Promise<void> {
  const subject = `Admin Digest - ${data.totalPending} pending leads`;
  const dashboardUrl = `${SITE_BASE_URL}/admin/dashboard?tab=pending`;
  const htmlBody = `
    <!DOCTYPE html>
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
          <h1>Admin Daily Digest</h1>
          <p>Pending leads summary</p>
        </div>
        <div class="content">
          <div class="highlight-box">
            <p><strong>Total pending:</strong> ${data.totalPending}</p>
            <p style="margin-top:10px;"><strong>24–48 hours:</strong> ${data.leads24h}</p>
            <p><strong>48+ hours:</strong> ${data.leads48h}</p>
          </div>
          ${formatDigestLeadList("Pending review", data.pendingLeads)}
          ${formatDigestLeadList("24–48 hours pending", data.leads24hList)}
          ${formatDigestLeadList("48+ hours pending", data.leads48hList)}
          <div style="text-align:center; margin: 30px 0;">
            <a href="${dashboardUrl}" class="cta-button">Open Dashboard →</a>
          </div>
        </div>
        ${buildEmailFooter('Lead Marketplace')}
      </div>
    </body>
    </html>
  `;
  await sendEmail(adminEmail, subject, htmlBody);
}

export async function sendAdminReminder(
  adminEmail: string,
  leadData: {
    id: string;
    name: string;
    city: string;
    serviceType: string;
    hoursPending: number;
    finalQuote: string;
    address?: string;
    email?: string;
    phone?: string;
  }
): Promise<void> {
  const subject = `Reminder - Lead pending ${Math.floor(leadData.hoursPending)} hours - ${leadData.city}`;
  const dashboardUrl = adminLeadUrl('pending', leadData.id);
  const htmlBody = `
    <!DOCTYPE html>
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
          <h1>Lead Reminder</h1>
          <p>Pending admin review</p>
        </div>
        <div class="content">
          <p class="greeting">A lead is still pending review.</p>
          <table class="info-table">
            <tr><td class="label">Lead ID:</td><td class="value">${leadData.id}</td></tr>
            <tr><td class="label">City:</td><td class="value">${leadData.city}</td></tr>
            <tr><td class="label">Service:</td><td class="value">${leadData.serviceType}</td></tr>
            <tr><td class="label">Pending:</td><td class="value">${Math.floor(leadData.hoursPending)} hours</td></tr>
          </table>
          <div style="text-align:center; margin: 30px 0;">
            <a href="${dashboardUrl}" class="cta-button">Review Now →</a>
          </div>
        </div>
        ${buildEmailFooter('Lead Marketplace')}
      </div>
    </body>
    </html>
  `;
  await sendEmail(adminEmail, subject, htmlBody);
}

export async function sendAdminUrgentReminder(
  adminEmail: string,
  leadData: {
    id: string;
    name: string;
    city: string;
    serviceType: string;
    hoursPending: number;
    finalQuote: string;
    address?: string;
    email?: string;
    phone?: string;
  }
): Promise<void> {
  await sendAdminReminder(adminEmail, leadData);
}

function formatDigestLeadList(title: string, leads: any[]): string {
  if (!leads || leads.length === 0) return "";
  const rows = leads
    .slice(0, 10)
    .map(
      (lead) =>
        `<tr><td class="value">${escapeHtml(lead.name || "Unknown")}</td><td class="value">${escapeHtml(lead.city || "")}</td><td class="value">${escapeHtml(lead.serviceType || "")}</td></tr>`
    )
    .join("");
  return `
    <div class="section">
      <h2 class="section-title">${escapeHtml(title)}</h2>
      <table class="info-table">
        <tr><td class="label">Customer</td><td class="label">City</td><td class="label">Service</td></tr>
        ${rows}
      </table>
      ${leads.length > 10 ? `<p style="font-size:13px;color:${EMAIL_BRAND.charcoalLight};">+ ${leads.length - 10} more in dashboard</p>` : ""}
    </div>
  `;
}

export async function sendWatchedLeadUpdatedEmail(
  contractorEmail: string,
  data: { city: string; estimatedTotal: number; leadId: string }
): Promise<void> {
  const url = subcontractorLeadUrl(data.leadId);
  const subject = `Watched lead updated in ${data.city}`;
  const htmlBody = wrapEmailHtml({
    title: "Watched Lead Updated",
    subtitle: data.city,
    tagline: "Lead Marketplace",
    content: `
      <p class="greeting">A lead you're watching has been updated by the customer.</p>
      <div class="highlight-box">
        <p><strong>City:</strong> ${escapeHtml(data.city)}</p>
        <p style="margin-top:10px;"><strong>New estimated value:</strong> $${data.estimatedTotal.toLocaleString()}</p>
      </div>
      <div style="text-align:center; margin: 30px 0;">
        <a href="${url}" class="cta-button">View Lead →</a>
      </div>
    `,
  });
  await sendEmail(contractorEmail, subject, htmlBody);
}

export async function sendLeadPriceDropEmail(
  contractorEmail: string,
  data: {
    leadId: string;
    city: string;
    serviceType: string;
    oldPrice: string;
    newPrice: string;
  }
): Promise<void> {
  const url = subcontractorLeadUrl(data.leadId);
  const subject = `Price drop: ${data.serviceType} in ${data.city} — now $${formatQuoteForDisplay(data.newPrice, true)}`;
  const htmlBody = wrapEmailHtml({
    title: "Lead Price Drop",
    subtitle: `${data.city} — ${data.serviceType}`,
    tagline: "Lead Marketplace",
    content: `
      <p class="greeting">A lead you're watching just dropped in price.</p>
      <div class="highlight-box">
        <p><strong>Previous price:</strong> $${formatQuoteForDisplay(data.oldPrice, true)}</p>
        <p style="margin-top:10px;"><strong>New price:</strong> $${formatQuoteForDisplay(data.newPrice, true)}</p>
      </div>
      <div style="text-align:center; margin: 30px 0;">
        <a href="${url}" class="cta-button">View Lead →</a>
      </div>
    `,
  });
  await sendEmail(contractorEmail, subject, htmlBody);
}

export async function sendContractSignedNotification(
  adminEmails: string[],
  data: {
    signerName: string;
    contractTitle: string;
    projectId?: string | null;
  }
): Promise<void> {
  const subject = `Contract signed: ${data.contractTitle}`;
  const htmlBody = wrapEmailHtml({
    title: "Contract Signed",
    subtitle: data.contractTitle,
    tagline: "Admin Notifications",
    content: `
      <p class="greeting">${escapeHtml(data.signerName)} signed <strong>${escapeHtml(data.contractTitle)}</strong>.</p>
      <div style="text-align:center; margin: 30px 0;">
        <a href="${SITE_BASE_URL}/admin/dashboard" class="cta-button">Open Admin Dashboard →</a>
      </div>
    `,
  });
  for (const email of adminEmails) {
    await sendEmail(email, subject, htmlBody);
  }
}

export async function sendContractSignedConfirmation(
  subcontractorEmail: string,
  data: { contractTitle: string }
): Promise<void> {
  const subject = `Contract signed: ${data.contractTitle}`;
  const htmlBody = wrapEmailHtml({
    title: "Contract Signed",
    subtitle: "Thank you for signing",
    tagline: "Contractor Portal",
    content: `
      <p class="greeting">We've received your signature for <strong>${escapeHtml(data.contractTitle)}</strong>.</p>
      <p>Our team has been notified and will follow up if anything else is needed.</p>
      <div style="text-align:center; margin: 30px 0;">
        <a href="${SITE_BASE_URL}/subcontractor/contracts" class="cta-button">View Contracts →</a>
      </div>
    `,
  });
  await sendEmail(subcontractorEmail, subject, htmlBody);
}
