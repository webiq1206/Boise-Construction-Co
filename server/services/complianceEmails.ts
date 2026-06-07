import type { User } from "@shared/schema";
import {
  escapeHtml,
  wrapEmailHtml,
  SITE_BASE_URL,
} from "./emailLayout";
import { sendEmail } from "./emailNotifications";

function contractorName(user: User): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || "Contractor";
}

export async function sendComplianceReminderEmail(
  user: User,
  message: string
): Promise<void> {
  if (!user.email) return;

  const htmlBody = wrapEmailHtml({
    title: "Compliance Reminder",
    subtitle: "Action required",
    content: `
      <p class="greeting">Hi ${escapeHtml(contractorName(user))},</p>
      <div class="highlight-box">
        <p>${escapeHtml(message)}</p>
      </div>
      <p>You will continue to receive reminders until this issue is resolved.</p>
      <div style="text-align:center; margin: 30px 0;">
        <a href="${SITE_BASE_URL}/subcontractor/compliance" class="cta-button">Update Compliance Documents →</a>
      </div>
    `,
  });

  await sendEmail(
    user.email,
    "Compliance Action Required - Boise Remodeling Co",
    htmlBody
  );
}

export async function sendContractSentEmail(
  user: User,
  contractTitle: string
): Promise<void> {
  if (!user.email) return;

  const prefs = (user.notificationPreferences as Record<string, boolean>) ?? {};
  if (prefs.contractReminders === false) return;

  const htmlBody = wrapEmailHtml({
    title: "Contract Ready for Signature",
    subtitle: escapeHtml(contractTitle),
    content: `
      <p class="greeting">Hi ${escapeHtml(contractorName(user))},</p>
      <p>A new contract is ready for your review and signature: <strong>${escapeHtml(contractTitle)}</strong></p>
      <div style="text-align:center; margin: 30px 0;">
        <a href="${SITE_BASE_URL}/subcontractor/contracts" class="cta-button">Review &amp; Sign Contract →</a>
      </div>
    `,
  });

  await sendEmail(
    user.email,
    `Contract Ready for Signature: ${contractTitle}`,
    htmlBody
  );
}

export async function sendProjectAssignedEmail(
  user: User,
  projectTitle: string
): Promise<void> {
  if (!user.email) return;

  const htmlBody = wrapEmailHtml({
    title: "New Project Assignment",
    subtitle: escapeHtml(projectTitle),
    content: `
      <p class="greeting">Hi ${escapeHtml(contractorName(user))},</p>
      <p>You have been assigned to project: <strong>${escapeHtml(projectTitle)}</strong></p>
      <div style="text-align:center; margin: 30px 0;">
        <a href="${SITE_BASE_URL}/subcontractor/projects" class="cta-button">View Project →</a>
      </div>
    `,
  });

  await sendEmail(
    user.email,
    `New Project Assignment: ${projectTitle}`,
    htmlBody
  );
}
