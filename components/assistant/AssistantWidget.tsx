"use client";

/**
 * Floating chat widget for the conversational estimating assistant.
 *
 * Session-only by design: the transcript lives in sessionStorage and is sent
 * whole with every request; nothing is stored server-side. The panel is
 * labelled "Virtual assistant" so a visitor always knows what they are
 * talking to - the conversation itself does the human part.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useFormInView } from "@/hooks/use-form-in-view";
import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "brc_assistant_v1";
const WIZ_DRAFT_KEY = "brc_estimate_wizard_v1";
const MAX_INPUT_CHARS = 2_000;

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hey - I can price out a project for you right here, or answer anything about building in the Treasure Valley. What are you thinking about?",
};

/** Paths the widget must never appear on. */
const EXCLUDED_PREFIXES = ["/admin", "/subcontractor"];

/**
 * Replies reference internal pages as bare paths ("/consultation",
 * "/#calculator"). Render those as links; everything else stays plain text.
 */
function renderMessageText(text: string) {
  const parts = text.split(/(\/(?:#[a-z-]+|[a-z][a-z0-9\-/#]*))(?=[\s.,;:!?)]|$)/g);
  return parts.map((part, i) =>
    part.startsWith("/") && part.length > 1 ? (
      <Link key={i} href={part} className="underline underline-offset-2 text-accent-legible hover:opacity-80">
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function AssistantWidget() {
  const pathname = usePathname();
  const formInView = useFormInView(pathname);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const openedOnce = useRef(false);

  /* Restore the session transcript once on mount. */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(saved) && saved.length > 0) setMessages(saved);
      }
    } catch {
      /* corrupt draft: start fresh */
    }
  }, []);

  /* Persist after every change. The untouched greeting-only state is never
     written: under StrictMode's double effect run it would race the restore
     effect and clobber a saved transcript with the empty greeting. */
  useEffect(() => {
    if (messages.length === 1 && messages[0] === GREETING) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)));
    } catch {
      /* storage full/unavailable: chat still works, just won't survive nav */
    }
  }, [messages]);

  /* Keep the newest message in view. */
  useEffect(() => {
    if (open) logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, sending, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");

    const next: ChatMessage[] = [...messages, { role: "user", content: text.slice(0, MAX_INPUT_CHARS) }];
    setMessages(next);
    setSending(true);
    trackEvent("assistant_message_sent", { page: pathname ?? "" });

    let draft: string | undefined;
    try {
      draft = sessionStorage.getItem(WIZ_DRAFT_KEY)?.slice(0, 2_000) ?? undefined;
    } catch {
      draft = undefined;
    }

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          /* The greeting is client-side furniture, not part of the billed
             conversation: drop leading assistant messages so the API
             transcript starts with the visitor. */
          messages: next.slice(next.findIndex((m) => m.role === "user")),
          page: pathname ?? undefined,
          draft,
        }),
      });
      const data = (await res.json().catch(() => null)) as { reply?: string } | null;
      const reply =
        data?.reply ??
        "I'm having trouble connecting right now. Try the estimator on the homepage, or call (208) 477-1169.";
      setMessages((cur) => [...cur, { role: "assistant", content: reply }]);
    } catch {
      setMessages((cur) => [
        ...cur,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Try the estimator on the homepage, or call (208) 477-1169.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending, messages, pathname]);

  if (pathname && EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <>
      {/* Launcher */}
      {!open && !formInView && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            if (!openedOnce.current) {
              openedOnce.current = true;
              trackEvent("assistant_opened", { page: pathname ?? "" });
            }
          }}
          aria-label="Chat with our estimating assistant"
          data-testid="button-assistant-open"
          className="brc-assistant-launcher fixed bottom-4 right-4 z-40 flex h-13 w-13 min-h-11 min-w-11 items-center justify-center rounded-full bg-accent-legible text-background shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-legible md:bottom-6 md:right-6"
          style={{ height: 52, width: 52 }}
        >
          <MessageCircle className="h-6 w-6" strokeWidth={1.75} />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Estimating assistant chat"
          data-testid="panel-assistant"
          className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-md border border-card-border bg-background shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[560px] sm:max-h-[calc(100dvh-6rem)] sm:w-[380px] sm:rounded-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-card-border bg-card px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-normal text-foreground">Boise Construction Co</p>
              <p className="text-xs text-muted-foreground">Virtual assistant · instant estimates</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close chat"
              data-testid="button-assistant-close"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-legible"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>

          {/* Transcript */}
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] whitespace-pre-wrap rounded-md rounded-br-sm bg-accent px-3.5 py-2.5 text-sm leading-relaxed text-accent-foreground"
                      : "max-w-[85%] whitespace-pre-wrap rounded-md rounded-bl-sm bg-card px-3.5 py-2.5 text-sm leading-relaxed text-foreground"
                  }
                >
                  {m.role === "assistant" ? renderMessageText(m.content) : m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start" aria-hidden>
                <div className="flex items-center gap-1.5 rounded-md rounded-bl-sm bg-card px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-end gap-2 border-t border-card-border bg-card px-3 py-3"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              maxLength={MAX_INPUT_CHARS}
              placeholder="Ask about your project..."
              aria-label="Message"
              data-testid="input-assistant-message"
              className="max-h-28 min-h-11 flex-1 resize-none rounded-sm border border-card-border bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-legible"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              data-testid="button-assistant-send"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-accent-legible text-background transition-opacity disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-legible"
            >
              <Send className="h-4.5 w-4.5" strokeWidth={1.75} style={{ height: 18, width: 18 }} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
