/**
 * Asking the customer one question at a time, best question first.
 *
 * WHY ONE AT A TIME. A takeoff off real drawings routinely raises six or eight
 * genuine unknowns. Presented together they read as a form, and a form gets
 * abandoned - so the estimator ends up with none of the answers and prices on
 * assumptions anyway. Presented one at a time, each with the reason it matters
 * and a set of choices, they read as a conversation with an estimator, and
 * people finish those. The engineering point is the same either way: the price
 * gets tighter with every answer, so the ordering decides how much accuracy is
 * bought per unit of the customer's patience.
 *
 * WHY IMPACT ORDER AND NOT DOCUMENT ORDER. Construction grade can move casework
 * by a factor of two. Whether the toe kick is finished or painted cannot. If the
 * customer answers exactly one question before losing interest, it has to be the
 * first kind.
 */
import type { MillworkQuestion } from "./extraction";

export interface QuestionAnswer {
  questionId: string;
  /** What the customer said, verbatim. Fed back into the re-read. */
  answer: string;
  answeredAt: string;
}

const IMPACT_ORDER = { high: 0, medium: 1, low: 2 } as const;

/**
 * Stop asking eventually, even if questions remain.
 *
 * There is a point past which more questions buy less accuracy than they cost
 * in goodwill, and an estimator who will not stop asking is one nobody finishes
 * with. What is still open at that point is handed to the team as context for
 * the first call, which is where an open-ended conversation belongs anyway.
 */
export const MAX_QUESTIONS_ASKED = 6;

export function answeredIds(answers: QuestionAnswer[]): Set<string> {
  return new Set(answers.map((a) => a.questionId));
}

/**
 * The next question worth asking, or null when we should stop.
 *
 * Ties break on document order, which keeps the sequence stable: a customer who
 * reloads mid-conversation must not be asked a different question than the one
 * they were looking at.
 */
export function selectNextQuestion(
  questions: MillworkQuestion[],
  answers: QuestionAnswer[],
): MillworkQuestion | null {
  if (answers.length >= MAX_QUESTIONS_ASKED) return null;
  const done = answeredIds(answers);
  const open = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => !done.has(q.id));
  if (open.length === 0) return null;

  open.sort((a, b) => {
    const byImpact = IMPACT_ORDER[a.q.impact] - IMPACT_ORDER[b.q.impact];
    return byImpact !== 0 ? byImpact : a.i - b.i;
  });
  return open[0].q;
}

/** Questions never put to the customer, so the team knows what is still open. */
export function unansweredQuestions(
  questions: MillworkQuestion[],
  answers: QuestionAnswer[],
): MillworkQuestion[] {
  const done = answeredIds(answers);
  return questions.filter((q) => !done.has(q.id));
}

/** "3 of 6" style progress, so the conversation has a visible end. */
export function questionProgress(
  questions: MillworkQuestion[],
  answers: QuestionAnswer[],
): { asked: number; total: number } {
  const total = Math.min(questions.length, MAX_QUESTIONS_ASKED);
  return { asked: Math.min(answers.length, total), total };
}
