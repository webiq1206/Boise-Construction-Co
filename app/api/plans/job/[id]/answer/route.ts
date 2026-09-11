import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/server/services/plans/jobStore";
import { refineMillworkTakeoff } from "@/server/services/plans/millwork";
import { priceMillworkTakeoff } from "@/shared/plans/millwork/pricing";
import {
  MAX_QUESTIONS_ASKED,
  questionProgress,
  selectNextQuestion,
  unansweredQuestions,
  type QuestionAnswer,
} from "@/shared/plans/millwork/dialogue";
import type { MillworkTakeoff } from "@/shared/plans/millwork/extraction";

export const runtime = "nodejs";

/**
 * Answer one clarifying question, and get back a tighter price.
 *
 * THIS IS THE WHOLE POINT OF THE FEATURE. A millwork takeoff read off drawings
 * always has holes - a schedule that says "P-LAM" without a grade, a bar die
 * with no elevation, a casework run that might be by the fixture supplier. The
 * old behaviour was to price around them silently, which produces one confident
 * number built partly on assumptions nobody stated. Instead the estimator asks
 * about the biggest hole, re-prices with the answer, and asks about the next
 * one.
 *
 * ONE AT A TIME, HIGHEST IMPACT FIRST. Presented as a form, six questions get
 * abandoned and the estimator learns nothing. Presented as a conversation, each
 * one visibly moves the number, which is its own argument for answering the
 * next. Construction grade is asked before toe-kick finish because if the
 * customer answers exactly one question before losing interest, it has to be
 * the one worth a factor of two.
 */
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const job = await getJob(params.id).catch(() => null);
  if (!job) {
    return NextResponse.json({ error: "failed", message: "That review has expired." }, { status: 404 });
  }
  if (job.scope !== "millwork") {
    return NextResponse.json(
      { error: "failed", message: "This review does not have questions to answer." },
      { status: 400 },
    );
  }
  if (job.status !== "complete") {
    return NextResponse.json(
      { error: "failed", message: "The drawings are still being read." },
      { status: 409 },
    );
  }

  let body: { questionId?: string; answer?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "failed", message: "Bad request." }, { status: 400 });
  }

  const questionId = String(body.questionId ?? "").slice(0, 200);
  const answer = String(body.answer ?? "").trim().slice(0, 1000);
  if (!questionId || !answer) {
    return NextResponse.json({ error: "failed", message: "Send a question id and an answer." }, { status: 400 });
  }

  const stored = job.result as { takeoff: MillworkTakeoff; raw?: unknown } | null;
  if (!stored?.takeoff) {
    return NextResponse.json({ error: "failed", message: "That review has no takeoff." }, { status: 409 });
  }

  const answers = (job.answers as QuestionAnswer[] | null) ?? [];

  /* Answering the same question twice is a double-tap or a back button, not a
     new fact. Replacing rather than appending keeps the count honest, since the
     count is what stops the conversation. */
  const next: QuestionAnswer[] = [
    ...answers.filter((a) => a.questionId !== questionId),
    { questionId, answer, answeredAt: new Date().toISOString() },
  ];

  const refined = await refineMillworkTakeoff(stored.takeoff, next, job.instructions);
  if (!refined.ok) {
    /* The answer is still worth keeping even if the re-read failed: it is the
       customer's, the team should see it, and the next attempt can use it. */
    await updateJob(job.id, { answers: next });
    return NextResponse.json(
      { error: refined.reason, message: "We saved your answer but could not re-price just now." },
      { status: refined.reason === "busy" ? 503 : 422 },
    );
  }

  const takeoff = refined.result.takeoff;
  const pricing = priceMillworkTakeoff(takeoff);
  const nextQuestion = selectNextQuestion(takeoff.questions, next);

  await updateJob(job.id, {
    answers: next,
    result: { takeoff, pricing, raw: stored.raw },
  });

  console.log(
    `[plans/job/answer] job=${job.id} answered=${questionId} answers=${next.length}/${MAX_QUESTIONS_ASKED} priced=${pricing.priced.length} unpriced=${pricing.unpriced.length} bidReady=${pricing.bidReady}`,
  );

  return NextResponse.json({
    takeoff,
    pricing,
    nextQuestion,
    progress: questionProgress(takeoff.questions, next),
    /* What we stopped asking about, so the team can raise it on the call rather
       than it silently vanishing when the conversation ends. */
    stillOpen: nextQuestion ? [] : unansweredQuestions(takeoff.questions, next),
  });
}
