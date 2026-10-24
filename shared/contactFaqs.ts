import { TREASURE_VALLEY_CITIES } from "./contentData";
import { insertPreferToTextAfterBusinessDay } from "./textReply";

export const CONTACT_FAQS = [
  {
    question: 'How quickly will you respond to my inquiry?',
    answer: insertPreferToTextAfterBusinessDay(
      'We respond within one business day. Call us during business hours for an immediate conversation, or submit the form and we will reach out to schedule your free planning consultation.',
    ),
  },
  {
    question: 'Is the planning consultation really free?',
    answer:
      'Yes. The 60 to 90 minute consultation is free with no obligation. We meet at our office, or on your lot if you already own one, and you leave with a budget band, a realistic schedule, and a read on what your site will require - never a high-pressure sales pitch.',
  },
  {
    question: 'Do I need to own land before I contact you?',
    answer:
      'No. Roughly half the people who call us are still looking. We will walk a lot with you before you buy and tell you what it will cost to build on, which is the single most useful thing you can know before making an offer.',
  },
  {
    question: 'What areas do you serve?',
    answer: `We build in ${TREASURE_VALLEY_CITIES}, and surrounding Treasure Valley communities across Ada and Canyon County.`,
  },
  {
    question: 'Do you handle permits?',
    answer:
      'Yes. Building permits, plan review, engineering, and utility applications are part of our design-build scope and handled in-house for both Ada and Canyon County jurisdictions.',
  },
  {
    question: 'How do I get a cost estimate for my home?',
    answer:
      'Use our online build cost estimator for a preliminary range, then book a free consultation for a written, line-item budget tailored to your plan and your lot.',
  },
];
