"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * What a millwork read looks like to the person who asked for it.
 *
 * THE DESIGN PROBLEM. A takeoff off real drawings is mostly holes at first: the
 * sheets name a bar die and a host stand and three server stations, and state a
 * quantity for almost none of them. The tempting thing is to show a single
 * confident number anyway. This shows the shape of what is known instead - what
 * was found, what could be priced, what could not and why - and then asks ONE
 * question to close the biggest gap.
 *
 * ONE QUESTION, NOT A FORM. Six questions presented together get abandoned and
 * the estimate stays as vague as it started. One question with real options,
 * and a price that visibly tightens when it is answered, gets answered - and
 * then so does the next one. The range moving is the argument for continuing;
 * nothing else here has to persuade anyone.
 */

interface Question {
  id: string;
  question: string;
  whyItMatters: string;
  impact: "high" | "medium" | "low";
  options: string[] | null;
}

interface PricedLine {
  label: string;
  categoryLabel: string;
  location: string | null;
  sheetRef: string | null;
  quantity: number;
  unit: string;
  low: number;
  high: number;
}

interface UnpricedLine {
  label: string;
  categoryLabel: string;
  sheetRef: string | null;
  reason: string;
}

interface Pricing {
  priced: PricedLine[];
  unpriced: UnpricedLine[];
  totalLow: number;
  totalHigh: number;
  bidReady: boolean;
  warnings: string[];
  assumptions: string[];
}

interface Takeoff {
  isCommercial: boolean;
  projectDescription: string | null;
  items: { label: string }[];
  confidence: "high" | "medium" | "low";
}

export interface MillworkData {
  takeoff: Takeoff | null;
  pricing: Pricing | null;
  nextQuestion: Question | null;
  progress: { asked: number; total: number } | null;
  coverage: { totalPages: number; processed: number; missing: number } | null;
}

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export function MillworkPanel({
  data,
  busy,
  onAnswer,
}: {
  data: MillworkData;
  busy: boolean;
  onAnswer: (questionId: string, answer: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const q = data.nextQuestion;

  // Clear the box when the question changes, so an answer to question 2 is
  // never pre-filled with the answer to question 1.
  useEffect(() => setDraft(""), [q?.id]);

  const pricing = data.pricing;
  const takeoff = data.takeoff;
  if (!takeoff || !pricing) return null;

  const hasPrice = pricing.priced.length > 0;

  return (
    <div
      className="mt-4 rounded-md border border-accent-legible/30 bg-inverse-foreground/[0.04] p-4"
      data-testid="calc-millwork-panel"
    >
      <p className="text-[13px] text-inverse-foreground font-medium">
        Millwork takeoff
      </p>
      {takeoff.projectDescription && (
        <p className="mt-1 text-[12px] text-inverse-muted">{takeoff.projectDescription}</p>
      )}

      {/* ---------------------------------------------------------- number */}
      <div className="mt-3">
        {hasPrice ? (
          <>
            <p className="text-[20px] text-inverse-foreground" data-testid="calc-millwork-range">
              {money(pricing.totalLow)} - {money(pricing.totalHigh)}
            </p>
            <p className="text-[12px] text-inverse-muted">
              {pricing.priced.length} line(s) priced from the drawings
              {pricing.unpriced.length > 0
                ? `, ${pricing.unpriced.length} not yet priceable`
                : ""}
              .
            </p>
          </>
        ) : (
          <p className="text-[13px] text-inverse-foreground">
            We found {takeoff.items.length} millwork item(s) in your drawings, but
            none of them state a quantity we can stand behind yet.
          </p>
        )}
      </div>

      {/* -------------------------------------------------------- question */}
      {q && (
        <div className="mt-4 rounded-md border border-accent-legible/40 bg-accent/10 p-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13px] text-inverse-foreground font-medium">{q.question}</p>
            {data.progress && data.progress.total > 0 && (
              <span className="shrink-0 text-[11px] text-inverse-muted">
                {data.progress.asked + 1} of {data.progress.total}
              </span>
            )}
          </div>
          <p className="mt-1 text-[12px] text-inverse-muted">{q.whyItMatters}</p>

          {q.options && q.options.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  disabled={busy}
                  onClick={() => onAnswer(q.id, opt)}
                  data-testid="calc-millwork-option"
                  className={cn(
                    "rounded-full border border-accent-legible/50 px-3 py-1.5",
                    "text-[12px] text-inverse-foreground hover:bg-inverse-foreground/10",
                    "transition-colors disabled:opacity-50",
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-2.5 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={busy}
                placeholder="Your answer"
                data-testid="calc-millwork-answer"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && draft.trim()) onAnswer(q.id, draft);
                }}
                className={cn(
                  "flex-1 rounded-md bg-inverse-foreground/[0.06] border border-accent-legible/20",
                  "px-3 py-2 text-[13px] text-inverse-foreground placeholder:text-inverse-muted",
                  "focus:outline-none focus:border-accent-legible/60 disabled:opacity-60",
                )}
              />
              <button
                type="button"
                disabled={busy || !draft.trim()}
                onClick={() => onAnswer(q.id, draft)}
                className={cn(
                  "rounded-md border border-accent-legible/50 px-3 py-2 text-[12px]",
                  "text-inverse-foreground hover:bg-inverse-foreground/10 disabled:opacity-40",
                )}
              >
                Answer
              </button>
            </div>
          )}
          {busy && (
            <p className="mt-2 text-[12px] text-inverse-muted" role="status">
              Re-pricing with your answer...
            </p>
          )}
        </div>
      )}

      {!q && (
        <p className="mt-3 text-[12px] text-inverse-muted">
          That is everything we needed to ask. Your answers are attached to the
          drawings for our team.
        </p>
      )}

      {/* -------------------------------------------------------- the lines */}
      {hasPrice && (
        <ul className="mt-4 space-y-1" data-testid="calc-millwork-lines">
          {pricing.priced.slice(0, 8).map((l, i) => (
            <li key={i} className="text-[12px] text-inverse-muted">
              {l.label} - {l.quantity} {l.unit}
              {l.sheetRef ? ` (${l.sheetRef})` : ""} - {money(l.low)} to {money(l.high)}
            </li>
          ))}
        </ul>
      )}

      {pricing.unpriced.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[12px] text-inverse-foreground">
            {pricing.unpriced.length} item(s) we found but could not price
          </summary>
          <ul className="mt-2 space-y-1.5">
            {pricing.unpriced.slice(0, 12).map((l, i) => (
              <li key={i} className="text-[12px] text-inverse-muted">
                <span className="text-inverse-foreground">{l.label}</span>
                {l.sheetRef ? ` (${l.sheetRef})` : ""} - {l.reason}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* ----------------------------------------------------- the caveats */}
      {pricing.warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {pricing.warnings.map((w, i) => (
            <li key={i} className="text-[12px] text-inverse-muted">
              {w}
            </li>
          ))}
        </ul>
      )}

      {!pricing.bidReady && hasPrice && (
        <p className="mt-3 text-[12px] text-inverse-muted">
          This is a planning figure, not a bid. We will confirm it against the
          schedules before quoting.
        </p>
      )}
    </div>
  );
}
