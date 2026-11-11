"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { trackEvent } from "@/lib/analytics";
import { deviceCategory, getEstimatorSessionId, recordRecoveryAction, type EstimatorFlow } from "@/lib/estimatorSession";
import type { ExitMethod } from "./useAbandonmentRecovery";

export interface AbandonmentPromptProps {
  open: boolean;
  flow: EstimatorFlow;
  method: ExitMethod | null;
  /** True when a link click was intercepted: "continue" resumes that navigation. */
  leaving: boolean;
  onStay: () => void;
  onContinue: () => void;
}

type CallbackState = "idle" | "sending" | "sent" | "error";

/**
 * "Prefer to talk instead?" - shown once when a visitor is about to leave an
 * incomplete estimator. Call, text, or leave a number for a callback; or simply
 * continue. It is a helper, not a wall: Escape and the backdrop dismiss it, and
 * dismissal is remembered for the session.
 */
export function AbandonmentPrompt({ open, flow, method, leaving, onStay, onContinue }: AbandonmentPromptProps) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<CallbackState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const shownFor = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const key = `${flow}:${method}`;
    if (shownFor.current === key) return;
    shownFor.current = key;
    recordRecoveryAction(flow, { shown: true }, method ?? undefined);
    trackEvent("estimator_recovery_prompt", { flow, method: method ?? "unknown", action: "shown" });
  }, [open, flow, method]);

  const dismiss = (how: "stay" | "continue") => {
    recordRecoveryAction(flow, { dismissed: true });
    trackEvent("estimator_recovery_prompt", { flow, action: how === "continue" ? "continue_leaving" : "stay" });
    if (how === "continue") onContinue();
    else onStay();
  };

  const onCall = () => { recordRecoveryAction(flow, { call: true }); trackEvent("estimator_recovery_prompt", { flow, action: "call" }); };
  const onText = () => { recordRecoveryAction(flow, { text: true }); trackEvent("estimator_recovery_prompt", { flow, action: "text" }); };

  async function submitCallback(event: FormEvent) {
    event.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) { setState("error"); setMessage("Please enter a 10-digit phone number."); return; }
    setState("sending"); setMessage(null);
    try {
      const res = await fetch("/api/recovery/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getEstimatorSessionId(), flow, phone: digits, name: name.trim() || undefined, pagePath: window.location.pathname, device: deviceCategory() }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setState("error");
        setMessage(json.message ?? `We could not save that. Please call ${SITE_CONFIG.phone}.`);
        return;
      }
      setState("sent");
      trackEvent("estimator_recovery_prompt", { flow, action: "callback_requested" });
    } catch {
      setState("error");
      setMessage(`We could not reach the server. Please call ${SITE_CONFIG.phone}.`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) dismiss("stay"); }}>
      <DialogContent
        className="max-w-md rounded-sm border border-inverse-foreground/15 bg-[hsl(var(--inverse))] p-6 text-inverse-foreground sm:p-7"
        data-testid="abandonment-prompt"
        aria-describedby="abandonment-prompt-desc"
      >
        <DialogTitle className="ed-h3 !leading-tight">
          {state === "sent" ? "We will call you back." : "Prefer to talk it through instead?"}
        </DialogTitle>
        <DialogDescription id="abandonment-prompt-desc" className="ed-body mt-2 text-[0.9375rem] text-inverse-muted">
          {state === "sent"
            ? "Thanks. We have your number. Nothing else is needed."
            : "Leave a number and we will call you back."}
        </DialogDescription>

        {state !== "sent" && (
          <form onSubmit={submitCallback} noValidate className="mt-5 grid gap-4" data-testid="recovery-callback-form">
            <div className="grid gap-1.5">
              <label className="block text-[0.9375rem] font-medium leading-snug text-inverse-foreground" htmlFor="recovery-phone">
                Phone
              </label>
              <input
                id="recovery-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (state === "error") setState("idle"); }}
                className="h-12 w-full rounded-sm border border-inverse-foreground/25 bg-inverse-foreground/[0.06] px-3 text-base text-inverse-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-legible"
                aria-required="true"
                aria-invalid={state === "error" || undefined}
                aria-describedby={message ? "recovery-callback-msg" : undefined}
                data-testid="recovery-phone"
              />
              {message && (
                <p id="recovery-callback-msg" role="alert" className="text-[0.8125rem] text-red-300">
                  {message}
                </p>
              )}
            </div>
            {/* The number is all a callback needs; the optional name sits behind one quiet text toggle. */}
            <details className="group" data-testid="recovery-options">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-sm text-[0.875rem] text-inverse-muted hover:text-inverse-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-legible [&::-webkit-details-marker]:hidden">
                <Plus className="h-4 w-4 flex-none transition-transform group-open:rotate-45" aria-hidden />
                Add your name (optional)
              </summary>
              <div className="grid gap-1.5 pt-2">
                <label className="block text-[0.9375rem] font-medium leading-snug text-inverse-foreground" htmlFor="recovery-name">
                  Your name
                </label>
                <input
                  id="recovery-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 w-full rounded-sm border border-inverse-foreground/25 bg-inverse-foreground/[0.06] px-3 text-base text-inverse-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-legible"
                />
              </div>
            </details>
            <Button type="submit" variant="brand" className="min-h-12 w-full text-base" disabled={state === "sending"} data-testid="recovery-callback-submit">
              {state === "sending" ? "Sending" : "Call me"}
            </Button>
            <p className="text-[0.875rem] leading-relaxed text-inverse-muted">
              Or{" "}
              <a href={SITE_CONFIG.phoneHref} onClick={onCall} className="py-2 text-inverse-foreground underline underline-offset-4 hover:no-underline" data-testid="recovery-call">
                call {SITE_CONFIG.phone}
              </a>
              {" or "}
              <a href={SITE_CONFIG.phoneSmsHref} onClick={onText} className="py-2 text-inverse-foreground underline underline-offset-4 hover:no-underline" data-testid="recovery-text">
                text us
              </a>
              .
            </p>
          </form>
        )}

        {/* One way out. Leaving: carry on leaving (Escape, the close button and the
            backdrop all stay). Not leaving: back to the estimate. */}
        <button
          type="button"
          onClick={() => (state === "sent" ? (leaving ? onContinue() : onStay()) : dismiss(leaving ? "continue" : "stay"))}
          className="mt-4 min-h-11 text-left text-[0.875rem] text-inverse-muted underline underline-offset-4 hover:text-inverse-foreground"
          data-testid="recovery-dismiss"
        >
          {state === "sent" ? (leaving ? "Continue" : "Close") : leaving ? "No thanks, continue" : "No thanks"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
