/**
 * Brand-facing re-export. The button and the approved sentences live in
 * lib/p5/leadSchedule.ts so the isolated estimator harness, which copies only
 * that folder, can render them.
 */
export {
  BRAND_ACCENT,
  BUTTON_CHARCOAL,
  BUTTON_PAPER,
  BUTTON_WHITE,
  ESTIMATE_DISCLAIMER,
  SCHEDULE_URL,
  SHARED_DISCLAIMER,
  bulletproofButton,
  contactLine,
  durationChoice,
  embeddedSchedule,
  estimateLeadCard,
  estimatorConfirmation,
  greetingName,
  paperScheduleCard,
  requestConfirmation,
  scheduleIntentFor,
} from "../../lib/p5/leadSchedule.ts";

export type { ScheduleIntent } from "../../lib/p5/leadSchedule.ts";
