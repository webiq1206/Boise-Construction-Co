"use client";
import { readLeadAttribution } from "@/lib/leadAttributionBrowser";

import { EstimatorRecovery } from "@/components/estimate/recovery/EstimatorRecovery";
import { markEstimatorCompleted } from "@/lib/estimatorSession";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { uploadLeadFile, type PendingLeadFile } from "@/components/quote/LeadAttachments";
import { QuoteDetailsStep, type DetailsFields } from "@/components/quote/QuoteDetailsStep";
import { QuoteSteps } from "@/components/quote/QuoteSteps";
import { MAX_LEAD_FILES } from "@/shared/leadFiles";
import { BEST_TIMES, PROJECT_LABEL_LOOKUP } from "@/shared/quoteFormChoices";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StoredEstimate } from "@/shared/estimateEngine";
import { FINISH_LABELS, PROJECT_LABELS, formatPlanningCurrency } from "@/shared/estimateEngine";
import { DisplayNum } from "@/components/marketing/DisplayNum";
import { CTA_FORM_CALLBACK, CTA_FORM_SEND } from "@/shared/ctaCopy";
import { BusinessPhoneContact } from "@/components/BusinessPhoneContact";
import { SITE_CONFIG } from "@/shared/siteConfig";
import { trackEvent, trackClaimedLeadConversion } from "@/lib/analytics";
import { readStoredPrefill, PREFILL_UPDATED_EVENT, hasPassedGate } from "@/lib/leadPrefill";
import {
  getOrCreateInquiryTracking,
  readInquiryTracking,
  recordInquiryAcceptance,
} from "@/lib/inquiryTracking";
import { extractZip } from "@/shared/addressValidation";
import { AppFrame } from "@/components/estimate/wizard";

/**
 * THE QUOTE FORM, in two steps (owner, 1 November: "the easiest user
 * experience possible ... the more information we have, the better"; owner,
 * 11 November, after a client found a family form confusing because "it just
 * kept asking more questions": nothing optional is shown until asked for, and
 * the steps line above the form says plainly where the visitor is,
 * components/quote/QuoteSteps.tsx).
 *
 * Step 1, "Your request": only what we need to call back, in order.
 *   [Send a request | Have us call you]  (quiet underline tabs)
 *   What can we help with?
 *   Your name, Phone
 *   "Add an email or choose how we reach you (optional)": ONE closed dropdown
 *     holding Email and How should we reach you (Call, Text, Email; Text by
 *     default because the site has a text line). Its fields stay in the form
 *     while it is closed, so the request posts the same fields and defaults.
 *   Send my request, then one line: that is all we need.
 *   Prefer to talk? Call, text, chat  (one quiet line of links)
 * "Have us call you" reduces it to name, phone and an optional best time, and
 * posts through the same /api/consultation pipeline with requestKind
 * "callback"; the server writes the callback marker into the notes every
 * destination stores (server/services/consultationRequest.ts).
 *
 * Step 2, on the success screen: the confirmation that the request is sent and
 * nothing else is needed, then ONE closed dropdown, "Add photos, plans or
 * project details (optional)", that adds project type, build site, timing,
 * best time, files and (if missing) email to the SAME request
 * (components/quote/QuoteDetailsStep.tsx).
 *
 * Files are added on Step 2 only, after the lead is accepted: each file is
 * uploaded on its own (/api/consultation/files) and its link is sent to the
 * team as details on the same request. The lead never waits on an upload.
 *
 * Kept exactly as before: the endpoint and field names, the attached planning
 * range from the calculator (the server re-prices it), the honeypot and dwell
 * time, the session draft, the lead prefill, form_start / form_error, the
 * claimed generate_lead conversion (GA4, Meta, attribution) and the delegated
 * call and text tracking (any tel: or sms: link).
 *
 * data-step stays "project": scripts/verify-p5-mobile-seo.mjs (owner-approved,
 * not edited) asserts that attribute on arrival at /estimate. There is only one
 * step now; the attribute is the pinned marker, not a wizard position.
 */

const CONTACT_METHODS = [
  { value: "phone", label: "Call" },
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
] as const;

type ContactMethod = (typeof CONTACT_METHODS)[number]["value"];

/** The default way to reach you: this site has a text line (SITE_CONFIG.phoneSmsHref). */
const DEFAULT_CONTACT: ContactMethod = "text";

const DRAFT_KEY = "construction_quote_form_v2";
const FORM_ID = "quote-request-form";

const phoneDigits = (value: string) => value.replace(/\D/g, "").length;

const formSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name."),
    phone: z.string(),
    message: z.string().max(5_000, "Please keep this under 5,000 characters."),
    preferredContact: z.enum(["phone", "text", "email"]),
    email: z.string().trim(),
    callback: z.boolean(),
    bestTimeToCall: z.string(),
    projectType: z.string(),
    address: z.string().max(300),
  })
  .superRefine((data, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    if (data.callback) {
      if (phoneDigits(data.phone) < 10) issue("phone", "Please enter a phone number we can call, with area code.");
      return;
    }
    if (data.message.trim().length < 2) issue("message", "Please tell us a few words about what you need.");
    // Phone is always asked for: it is how the team follows up on any request.
    if (phoneDigits(data.phone) < 10) {
      issue(
        "phone",
        data.preferredContact === "text"
          ? "Please enter a mobile number we can text, with area code."
          : "Please enter a phone number, with area code.",
      );
    }
    if (data.preferredContact === "email") {
      if (!z.string().email().safeParse(data.email).success) {
        issue("email", "Please enter an email address so we can email you.");
      }
    } else if (data.email && !z.string().email().safeParse(data.email).success) {
      issue("email", "Please check the email address, or leave it blank.");
    }
  });

type FormData = z.infer<typeof formSchema>;
type FieldName = keyof FormData;

/** Field order, so the first error on submit is the first one on screen. */
const FIELD_ORDER: FieldName[] = ["message", "name", "phone", "email", "preferredContact"];

function readDraft(): Partial<FormData> {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<FormData> & { preferredContact?: string };
    // Drafts from the old wizard defaulted to email; keep a real choice only.
    if (!CONTACT_METHODS.some((m) => m.value === parsed.preferredContact)) delete parsed.preferredContact;
    return parsed;
  } catch {
    return {};
  }
}

function writeDraft(data: Partial<FormData>) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    /* best-effort */
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export interface QuoteRequestWizardProps {
  onRevise?: () => void;
  showTrust?: boolean;
  /** AppFrame full-screen page for /estimate; embedded for the home and contact pages. */
  mode?: "app" | "embedded";
}

type Tone = "inverse" | "default";

function toneClasses(tone: Tone) {
  const inverse = tone === "inverse";
  return {
    label: cn("block text-[0.9375rem] font-medium leading-snug", inverse ? "text-inverse-foreground" : "text-foreground"),
    hint: cn("text-[0.8125rem] font-normal", inverse ? "text-inverse-muted" : "text-muted-foreground"),
    error: cn("text-[0.8125rem]", inverse ? "text-[#f4c3b4]" : "text-destructive"),
    control: cn(
      "w-full rounded-sm border px-3 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      inverse
        ? "border-inverse-foreground/30 bg-[#fbfaf6] text-[#2c302f] placeholder:text-[#6b6d67] focus-visible:ring-[#e3c08d] focus-visible:ring-offset-[#2c302f]"
        : "border-input bg-background text-foreground placeholder:text-muted-foreground/80 focus-visible:ring-ring focus-visible:ring-offset-background",
    ),
    invalid: inverse ? "border-[#f4c3b4]" : "border-destructive",
    pill: cn(
      "flex min-h-12 cursor-pointer items-center justify-center rounded-sm border px-2 text-center text-[0.9375rem] transition-colors",
      "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
      inverse
        ? "border-inverse-foreground/30 text-inverse-foreground peer-checked:border-[#fbfaf6] peer-checked:bg-[#fbfaf6] peer-checked:text-[#2c302f] peer-focus-visible:ring-[#e3c08d] peer-focus-visible:ring-offset-[#2c302f]"
        : "border-border text-foreground peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-ring",
    ),
    // The "Send a request" | "Have us call you" switch: quiet underline tabs. As
    // filled pills, the active one looked exactly like the send button.
    tab: cn(
      "flex min-h-12 cursor-pointer items-center justify-center border-b-2 px-1.5 text-center text-[0.9375rem] font-medium transition-colors",
      "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
      inverse
        ? "border-inverse-foreground/20 text-inverse-muted hover:text-inverse-foreground peer-checked:border-inverse-foreground peer-checked:text-inverse-foreground peer-focus-visible:ring-[#e3c08d] peer-focus-visible:ring-offset-[#2c302f]"
        : "border-foreground/20 text-muted-foreground hover:text-foreground peer-checked:border-foreground peer-checked:text-foreground peer-focus-visible:ring-ring",
    ),
    // A closed-by-default dropdown that holds everything optional.
    disclosure: cn("group rounded-sm border", inverse ? "border-inverse-foreground/30" : "border-foreground/30"),
    summary: cn(
      "flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-sm px-3 py-2 text-[0.9375rem] font-medium leading-snug focus-visible:outline-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden",
      inverse
        ? "text-inverse-foreground hover:bg-inverse-foreground/[0.06] focus-visible:ring-[#e3c08d]"
        : "text-foreground hover:bg-foreground/[0.04] focus-visible:ring-ring",
    ),
    link: cn(
      "py-2 font-medium underline underline-offset-4 hover:no-underline",
      inverse ? "text-inverse-foreground decoration-inverse-foreground/40" : "text-foreground decoration-foreground/30",
    ),
    rule: inverse ? "border-inverse-foreground/15" : "border-border",
    muted: inverse ? "text-inverse-muted" : "text-muted-foreground",
    text: inverse ? "text-inverse-foreground" : "text-foreground",
  };
}

function Field({
  id,
  label,
  optional,
  hint,
  error,
  tone,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  tone: Tone;
  children: ReactNode;
}) {
  const t = toneClasses(tone);
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className={t.label}>
        {label}
        {optional && <span className={cn("ml-1", t.hint)}>(optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className={t.hint}>
          {hint}
        </p>
      )}
      {children}
      <p id={`${id}-error`} className={t.error} aria-live="polite">
        {error ?? ""}
      </p>
    </div>
  );
}

export function QuoteRequestWizard({ onRevise: _onRevise, showTrust: _showTrust = false, mode = "embedded" }: QuoteRequestWizardProps = {}) {
  const tone: Tone = mode === "app" ? "inverse" : "default";
  const t = toneClasses(tone);
  // Stable ids, not useId: the error lookup, labels and aria-describedby must agree
  // with the server HTML on every load. One instance per surface: the /estimate page,
  // the in-page form (home or contact) and the consultation dialog.
  const uid = mode === "app" ? "app" : _showTrust ? "dialog" : "page";
  const ids = {
    heading: `quote-form-heading-${uid}`,
    name: `quote-name-${uid}`,
    phone: `quote-phone-${uid}`,
    message: `quote-message-${uid}`,
    email: `quote-email-${uid}`,
    best: `quote-best-${uid}`,
    next: `quote-next-${uid}`,
  };
  const formId = mode === "app" ? FORM_ID : `${FORM_ID}-${uid}`;

  const [estimate, setEstimate] = useState<StoredEstimate | null>(null);
  const [attached, setAttached] = useState(true);
  const [success, setSuccess] = useState(false);
  const [submitted, setSubmitted] = useState<FormData | null>(null);
  // The Step 1 dropdown of optional fields (email, how to reach you); closed until asked for.
  const [optionsOpen, setOptionsOpen] = useState(false);
  // Issued by /api/consultation: lets this visitor add files and details to the
  // same request for two hours.
  const [auth, setAuth] = useState<{ inquiryKey: string; token: string } | null>(null);
  // Stored file ids the team has not been sent yet, and the chain that keeps
  // details posts in order so one file is never announced twice.
  const unsentFileIds = useRef<string[]>([]);
  const detailsChain = useRef<Promise<unknown>>(Promise.resolve());
  const [website, setWebsite] = useState("");
  // Until React has hydrated, the send button is a plain button: a tap before then
  // must not fall through to a native GET submit that puts the fields in the URL.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const lastKeyRef = useRef<string | null>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const formMountedAtRef = useRef(Date.now());
  const draftHydrated = useRef(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    // Validate on blur, then on every change once a field has been touched.
    mode: "onTouched",
    shouldFocusError: false,
    defaultValues: {
      name: "",
      phone: "",
      message: "",
      preferredContact: DEFAULT_CONTACT,
      email: "",
      callback: false,
      bestTimeToCall: "",
      projectType: "",
      address: "",
    },
  });
  const { register, formState, setValue, getValues, watch } = form;
  const errors = formState.errors;
  const watched = watch();
  const callback = watched.callback;
  const preferredContact = watched.preferredContact;

  useEffect(() => {
    if (draftHydrated.current) return;
    draftHydrated.current = true;
    const draft = readDraft();
    (["name", "phone", "message", "email", "bestTimeToCall", "projectType", "address"] as const).forEach((key) => {
      const value = draft[key];
      if (typeof value === "string" && value) setValue(key, value, { shouldValidate: false });
    });
    if (draft.preferredContact) setValue("preferredContact", draft.preferredContact, { shouldValidate: false });
    if (draft.callback) setValue("callback", true, { shouldValidate: false });
    // Anything already entered in the optional dropdown is shown, never hidden.
    if (draft.email || (draft.preferredContact && draft.preferredContact !== DEFAULT_CONTACT)) setOptionsOpen(true);
  }, [setValue]);

  useEffect(() => {
    if (success || !draftHydrated.current) return;
    writeDraft(watched);
  }, [watched, success]);

  // The build site is asked on Step 2; a site typed earlier in the calculator
  // gate (lead prefill) still rides along on the request.
  const deriveZip = (addr: string) => extractZip(addr) || "";

  useEffect(() => {
    function applyPrefill() {
      const pf = readStoredPrefill();
      const fillIfEmpty = (field: "name" | "phone" | "email", value?: string) => {
        if (value && !getValues(field)) setValue(field, value, { shouldValidate: false });
      };
      fillIfEmpty("name", pf.name);
      fillIfEmpty("phone", pf.phone);
      fillIfEmpty("email", pf.email);
      if (getValues("email")) setOptionsOpen(true);
      if (pf.address && !getValues("address")) setValue("address", pf.address, { shouldValidate: false });
    }
    applyPrefill();
    if (new URLSearchParams(window.location.search).get("service") === "home-additions" && !getValues("projectType")) {
      setValue("projectType", "addition", { shouldValidate: false });
    }
    window.addEventListener(PREFILL_UPDATED_EVENT, applyPrefill);
    return () => window.removeEventListener(PREFILL_UPDATED_EVENT, applyPrefill);
  }, [getValues, setValue]);

  // A planning range built in the calculator rides along; the server re-prices it.
  useEffect(() => {
    function loadEstimate() {
      try {
        const raw = sessionStorage.getItem("brc_estimate");
        if (!raw) {
          lastKeyRef.current = null;
          setEstimate(null);
          return;
        }
        const parsed: StoredEstimate = JSON.parse(raw);
        if (!parsed.project || !parsed.finish || !parsed.sqft || !parsed.priceLow) return;
        const key = `${parsed.project}|${parsed.finish}|${parsed.sqft}|${parsed.priceLow}|${parsed.priceHigh}|${parsed.confidenceLabel}`;
        if (key === lastKeyRef.current) return;
        lastKeyRef.current = key;
        setEstimate(parsed);
        setAttached(true);
        setValue("projectType", parsed.project, { shouldValidate: false });
      } catch {}
    }
    loadEstimate();
    window.addEventListener("brc_estimate_updated", loadEstimate);
    return () => window.removeEventListener("brc_estimate_updated", loadEstimate);
  }, [setValue]);

  useEffect(() => {
    if (!success) return;
    const el = successHeadingRef.current;
    if (el && el.offsetParent !== null) {
      let ancestor: HTMLElement | null = el.parentElement;
      let scrolledContainer = false;
      while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
        const overflowY = getComputedStyle(ancestor).overflowY;
        if ((overflowY === "auto" || overflowY === "scroll") && ancestor.scrollHeight > ancestor.clientHeight) {
          ancestor.scrollTo({ top: 0, behavior: "auto" });
          scrolledContainer = true;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (!scrolledContainer) {
        const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-height")) || 64;
        const top = el.getBoundingClientRect().top + window.scrollY - header - 16;
        window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
      }
    }
    el?.focus({ preventScroll: true });
  }, [success]);

  /** Upload files one at a time for the accepted request; resolves with the stored ids. */
  async function uploadFiles(
    list: PendingLeadFile[],
    update: (key: string, patch: Partial<PendingLeadFile>) => void,
    granted = auth,
  ): Promise<string[]> {
    if (!granted) return [];
    const ids: string[] = [];
    for (const item of list) {
      update(item.key, { status: "uploading", error: undefined });
      const result = await uploadLeadFile(item.file, granted);
      if (result.ok) {
        ids.push(result.id);
        update(item.key, { status: "uploaded", storedId: result.id });
      } else {
        update(item.key, { status: "failed", error: result.message });
      }
    }
    return ids;
  }

  /** Details and file links for the same request, posted one at a time and in order. */
  function sendDetails(
    fields: DetailsFields,
    fileIds: string[],
    granted = auth,
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    const run = async (): Promise<{ ok: true } | { ok: false; message: string }> => {
      if (!granted) return { ok: false, message: "We could not save these details. Please text or call us." };
      const ids = [...new Set([...unsentFileIds.current, ...fileIds])];
      unsentFileIds.current = [];
      try {
        const res = await fetch("/api/consultation/details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inquiryKey: granted.inquiryKey, token: granted.token, ...fields, fileIds: ids, website: "" }),
        });
        if (res.ok) return { ok: true };
        unsentFileIds.current.push(...ids);
        const err = (await res.json().catch(() => ({}))) as { reason?: string };
        return {
          ok: false,
          message:
            err.reason === "expired"
              ? "This page has been open a while, so we could not save this. Please text or call us with the details."
              : "We could not save these details. Please try again, or text us.",
        };
      } catch {
        unsentFileIds.current.push(...ids);
        return { ok: false, message: "We could not save these details. Check your connection and try again." };
      }
    };
    const next = detailsChain.current.then(run, run);
    detailsChain.current = next;
    return next;
  }

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const existingTracking = readInquiryTracking();
      const tracking = getOrCreateInquiryTracking();
      const isCallback = data.callback;
      const payload = {
        name: data.name.trim(),
        // A callback is a call; the server enforces the same rule.
        preferredContact: isCallback ? "phone" : data.preferredContact,
        phone: data.phone.trim(),
        email: isCallback ? "" : data.email.trim(),
        address: isCallback ? "" : data.address.trim(),
        projectType: data.projectType || undefined,
        message: data.message.trim() || undefined,
        requestKind: isCallback ? "callback" : "quote",
        bestTimeToCall: isCallback && data.bestTimeToCall ? data.bestTimeToCall : undefined,
        inquiryKey: tracking.inquiryKey,
        submissionKind: hasPassedGate() || existingTracking?.acceptedAt ? "followup" : "initial",
        formStartedAt: formMountedAtRef.current,
        website,
        zip: isCallback ? "" : deriveZip(data.address),
        propertyProfile: null,
        skipEmail: hasPassedGate() ? true : undefined,
        estimate:
          estimate && attached
            ? {
                project: estimate.project,
                finish: estimate.finish,
                priceLow: estimate.priceLow,
                priceHigh: estimate.priceHigh,
                roi: estimate.roi,
                confidence: estimate.confidenceLabel,
                sqft: estimate.sqft,
                refinements: estimate.refinements,
                layoutLabel: estimate.layoutLabel,
                upgradeLabels: estimate.upgradeLabels,
              }
            : null,
      };
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, attribution: readLeadAttribution() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          res.status === 429 && err.message === "Please wait before submitting"
            ? "Please wait a moment, then send again."
            : err.message === "Invalid request"
              ? "Please check your details and try again."
              : err.message || "Something went wrong",
        );
      }
      const response = (await res.json()) as {
        accepted?: boolean;
        inquiryKey?: string;
        conversionId?: string;
        detailsToken?: string;
      };
      if (
        response.accepted !== true ||
        typeof response.inquiryKey !== "string" ||
        typeof response.conversionId !== "string"
      ) {
        throw new Error("We could not accept this request. Please try again.");
      }
      return { response, tracking };
    },
    onSuccess: ({ response }, variables) => {
      setSuccess(true);
      if (response.detailsToken) {
        const granted = { inquiryKey: response.inquiryKey!, token: response.detailsToken };
        setAuth(granted);
      }
      clearDraft();
      sessionStorage.removeItem("brc_estimate");
      markEstimatorCompleted("consultation");
      const acceptedTracking = recordInquiryAcceptance({
        inquiryKey: response.inquiryKey!,
        conversionId: response.conversionId!,
      });
      const projectType = variables.projectType || "other";
      void trackClaimedLeadConversion({
        inquiryKey: acceptedTracking.inquiryKey,
        claimKey: acceptedTracking.claimKey,
        conversionId: response.conversionId!,
        ga4Params: {
          form: "consultation",
          project_type: projectType,
          has_estimate: !!estimate && attached,
        },
        metaParams: {
          content_name: projectType,
          content_category: "consultation_request",
        },
      });
    },
    onError: () => {
      trackEvent("form_error", { form: "consultation", reason: "submit_failed" });
    },
  });

  const formStartedRef = useRef(false);
  function trackFormStart() {
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    trackEvent("form_start", { form: "consultation" });
  }

  function focusFirstError(fieldErrors: FieldErrors<FormData>) {
    const first = FIELD_ORDER.find((name) => fieldErrors[name]);
    if (!first) return;
    // Email and the reach choice sit in the optional dropdown: open it so the
    // field can take focus (the focus is applied again after the render).
    if (first === "email" || first === "preferredContact") setOptionsOpen(true);
    const target =
      first === "preferredContact"
        ? document.querySelector<HTMLInputElement>(`#${formId} input[name="preferredContact"]:checked`)
        : document.getElementById(ids[first as "name" | "phone" | "message" | "email"]);
    target?.focus();
  }

  // Focus the first error once React has committed the error state: a focus moved
  // inside the submit handler can be lost to the tap that is still landing on the
  // send button, so it is applied again after the render.
  const pendingErrorFocus = useRef<FieldErrors<FormData> | null>(null);
  useEffect(() => {
    if (!pendingErrorFocus.current) return;
    const frame = requestAnimationFrame(() => {
      const fieldErrors = pendingErrorFocus.current;
      pendingErrorFocus.current = null;
      if (fieldErrors) focusFirstError(fieldErrors);
    });
    return () => cancelAnimationFrame(frame);
  });

  const onSubmit = form.handleSubmit(
    (data) => {
      setSubmitted(data);
      mutation.mutate(data);
    },
    (fieldErrors) => {
      trackEvent("form_error", {
        form: "consultation",
        fields: Object.keys(fieldErrors).sort().join(","),
      });
      focusFirstError(fieldErrors);
      pendingErrorFocus.current = fieldErrors;
    },
  );

  function setCallback(on: boolean) {
    setValue("callback", on, { shouldDirty: true });
    // Re-check only what is still on screen, and only what was already touched.
    form.clearErrors(["message", "email"]);
    if (formState.touchedFields.phone) void form.trigger("phone");
  }

  const describedBy = (id: string, hasHint: boolean, error?: string) =>
    [hasHint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;

  const firstName = submitted?.name.trim().split(/\s+/)[0] ?? "";

  const successBlock = (
    <div className="flex flex-col items-start space-y-4 py-2" data-testid="consultation-success" data-clarity-mask="True" data-quote-follow-up="" data-family-bar-yield="">
      <QuoteSteps sent tone={tone} />
      <div>
        <h2
          ref={successHeadingRef}
          tabIndex={-1}
          data-clarity-mask="True"
          className={cn("flex items-start gap-3 font-serif text-2xl outline-none", t.text)}
        >
          <span
            className={cn(
              "mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-sm",
              tone === "inverse" ? "bg-[#fbfaf6] text-[#2c302f]" : "bg-foreground text-background",
            )}
            aria-hidden="true"
          >
            <Check className="h-4 w-4" />
          </span>
          <span>Thanks{firstName ? `, ${firstName}` : ""}. We have your request.</span>
        </h2>
        {submitted && !submitted.callback && submitted.projectType && (
          <p className={cn("mt-1 text-sm", t.muted)} data-clarity-mask="True">
            {PROJECT_LABEL_LOOKUP[submitted.projectType] ?? PROJECT_LABELS[submitted.projectType as keyof typeof PROJECT_LABELS]?.label ?? submitted.projectType}
            {submitted.address ? ` · ${submitted.address}` : ""}
          </p>
        )}
      </div>
      {submitted?.callback ? (
        <p className={cn("text-sm", t.muted)} data-testid="consultation-success-callback">
          We will call you at <span data-clarity-mask="True">{submitted.phone}</span>
          {submitted.bestTimeToCall ? ` (${submitted.bestTimeToCall.toLowerCase()} works best)` : ""}. We will answer your questions and help you work out
          the next step.
        </p>
      ) : (
        <div className="grid gap-2.5">
        <p id={`${ids.next}-list`} className={cn("text-[0.9375rem] font-medium", t.text)}>
          What happens next
        </p>
        <ol className={cn("space-y-2.5 text-sm", t.muted)} aria-labelledby={`${ids.next}-list`}>
          {[
            "We review your request and any planning range you attached.",
            "We reach out to answer your questions and find a time that works.",
            "Your free 60 to 90 minute planning consultation: planning guidance, design direction, no obligation.",
          ].map((line, i) => (
            <li key={line} className="flex gap-3">
              <span
                className={cn(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-caption font-normal",
                  t.rule,
                  t.text,
                )}
              >
                {i + 1}
              </span>
              <span className="pt-0.5">{line}</span>
            </li>
          ))}
        </ol>
        </div>
      )}
      <p className={cn("text-[0.9375rem] font-medium", t.text)} data-testid="quote-all-set">
        You are all set. Nothing else is needed.
      </p>
      <div className="flex flex-col gap-1">
        <p className={cn("text-sm", t.muted)}>
          Need us sooner?{" "}
          <BusinessPhoneContact
            inline
            showPhoneIcon
            phoneClassName={cn("inline-flex items-center gap-1.5 font-normal underline-offset-2 hover:underline", t.text)}
            saveClassName={cn("text-sm transition-colors", t.muted)}
            phoneTestId="link-consult-success-phone"
          />
        </p>
        {submitted?.email && !submitted.callback && (
          <p className={cn("text-xs", t.muted)}>Your request is saved. A confirmation email should follow at the address you gave.</p>
        )}
      </div>
      {auth && (
        <QuoteDetailsStep
          tone={tone}
          uid={uid}
          ask={{
            projectType: !submitted?.projectType,
            address: !submitted?.address?.trim(),
            bestTime: !(submitted?.callback && submitted.bestTimeToCall),
            email: !submitted?.email?.trim() || !!submitted?.callback,
          }}
          filesRemaining={MAX_LEAD_FILES}
          uploadFiles={(list, update) => uploadFiles(list, update)}
          saveDetails={(fields, ids) => sendDetails(fields, ids)}
        />
      )}
    </div>
  );

  if (success && mode === "embedded") {
    return successBlock;
  }

  const projectLabel = estimate?.project ? PROJECT_LABELS[estimate.project]?.label : null;
  const finishLabel = estimate?.finish ? FINISH_LABELS[estimate.finish]?.label : null;
  const nextLine = callback
    ? "We call you back during business hours."
    : "That is all we need. You can add photos or plans after you send.";

  // The site assistant is not mounted on /estimate (AssistantWidget), so chat is offered
  // only where it can open.
  const chatAvailable = mode !== "app";

  /** Prefer to talk? One quiet line of links under the send button, never a second set of buttons. */
  const talkPanel = (
    <p className={cn("text-[0.875rem] leading-relaxed", t.muted)} data-testid="quote-talk-options">
      Prefer to talk?{" "}
      <a href={SITE_CONFIG.phoneHref} className={t.link} data-testid="link-quote-call">
        Call {SITE_CONFIG.phone}
      </a>
      {chatAvailable ? ", " : " or "}
      <a href={SITE_CONFIG.phoneSmsHref} className={t.link} aria-label={`Text us at ${SITE_CONFIG.phone}`} data-testid="link-quote-text">
        text us
      </a>
      {chatAvailable && (
        <>
          {" or "}
          <button
            type="button"
            className={t.link}
            onClick={() => window.dispatchEvent(new Event("p5:assistant-open"))}
            data-testid="button-quote-chat"
          >
            chat
          </button>
        </>
      )}
      .
    </p>
  );

  /** "Send a request" | "Have us call you", directly under the heading. */
  const modeControl = (
    <fieldset className="grid" data-testid="quote-request-mode">
      <legend className="sr-only">How would you like to reach us?</legend>
      <div className="grid grid-cols-2">
        {([
          { value: false, label: "Send a request", testId: "request-mode-quote" },
          { value: true, label: "Have us call you", testId: "request-mode-callback" },
        ] as const).map((option) => (
          <label key={option.testId} className="relative" data-testid={option.testId}>
            <input
              type="radio"
              name={`${formId}-mode`}
              value={option.value ? "callback" : "quote"}
              checked={callback === option.value}
              onChange={() => setCallback(option.value)}
              className="peer sr-only"
            />
            <span className={t.tab}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  const submitBlock = (
    <div className="grid gap-2">
      <Button
        type={hydrated ? "submit" : "button"}
        form={formId}
        data-hydrated={hydrated ? "true" : undefined}
        variant="brand"
        disabled={mutation.isPending}
        aria-busy={mutation.isPending}
        aria-describedby={ids.next}
        className="min-h-12 w-full text-base"
        data-testid="button-send-request"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Sending
          </>
        ) : callback ? (
          CTA_FORM_CALLBACK
        ) : (
          CTA_FORM_SEND
        )}
      </Button>
      <p id={ids.next} className={cn("text-center text-[0.8125rem]", t.muted)}>
        {nextLine}
      </p>
    </div>
  );

  // The one send button, then the quiet talk line under it. On /estimate both sit
  // in the frame's pinned footer.
  const sendArea = (
    <div className={mode === "embedded" ? cn("grid gap-4 border-t pt-4", t.rule) : "grid gap-1.5 text-center"}>
      {submitBlock}
      {talkPanel}
    </div>
  );

  const body = (
    <div className="grid gap-4">
      {mode === "embedded" && (
        <h2 id={ids.heading} tabIndex={-1} className={cn("font-serif text-[1.75rem] leading-tight outline-none", t.text)} data-quote-form-heading="">
          {callback ? "Request a call" : "Request a quote"}
        </h2>
      )}
      <QuoteSteps sent={false} tone={tone} />
      {modeControl}
      {callback && (
        <p className={cn("text-[0.9375rem]", t.muted)}>Leave your name and number and we will call you.</p>
      )}

      {mutation.isError && (
        <div
          role="alert"
          className="rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          data-testid="quote-submit-error"
        >
          {(mutation.error as Error).message || "Something went wrong. Please try again."} You can also call{" "}
          <a href={SITE_CONFIG.phoneHref} className="underline">
            {SITE_CONFIG.phone}
          </a>
          .
        </div>
      )}

      {!callback && (
        <>
          <Field id={ids.message} label="What can we help with?" error={errors.message?.message} tone={tone}>
            <textarea
              id={ids.message}
              rows={3}
              aria-required="true"
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={describedBy(ids.message, false, errors.message?.message)}
              placeholder="For example: a single-level custom home on land we own near Star, with a shop if the budget allows."
              className={cn(t.control, "min-h-[7.5rem] py-2.5 leading-relaxed", errors.message && t.invalid)}
              data-testid="textarea-message"
              data-clarity-mask="True"
              {...register("message")}
            />
          </Field>
        </>
      )}

      <Field id={ids.name} label="Your name" error={errors.name?.message} tone={tone}>
        <input
          id={ids.name}
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          aria-required="true"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy(ids.name, false, errors.name?.message)}
          className={cn(t.control, "h-12", errors.name && t.invalid)}
          data-testid="input-name"
          data-clarity-mask="True"
          {...register("name")}
        />
      </Field>

      <Field
        id={ids.phone}
        label="Phone"
        error={errors.phone?.message}
        tone={tone}
      >
        <input
          id={ids.phone}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="next"
          aria-required="true"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={describedBy(ids.phone, false, errors.phone?.message)}
          className={cn(t.control, "h-12", errors.phone && t.invalid)}
          data-testid="input-phone"
          data-clarity-mask="True"
          {...register("phone")}
        />
      </Field>

      {callback ? (
        <Field id={ids.best} label="Best time to call" optional tone={tone}>
          <select
            id={ids.best}
            className={cn(t.control, "h-12 appearance-auto")}
            data-testid="select-best-time"
            data-clarity-mask="True"
            {...register("bestTimeToCall")}
          >
            <option value="">Any time</option>
            {BEST_TIMES.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <>
          {/* Everything optional lives in this one closed dropdown. Its fields stay
              registered while it is closed, so the request posts the same values. */}
          <details
            className={t.disclosure}
            open={optionsOpen}
            onToggle={(event) => setOptionsOpen(event.currentTarget.open)}
            data-testid="quote-options"
          >
            <summary className={t.summary}>
              <span>
                Add an email or choose how we reach you <span className={cn("font-normal", t.muted)}>(optional)</span>
              </span>
              <ChevronDown className="h-5 w-5 flex-none transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className={cn("grid gap-4 border-t p-3", tone === "inverse" ? "border-inverse-foreground/20" : "border-foreground/20")}>
          <Field
            id={ids.email}
            label="Email"
            optional={preferredContact !== "email"}
            hint={preferredContact === "email" ? "Needed so we can email you." : undefined}
            error={errors.email?.message}
            tone={tone}
          >
            <input
              id={ids.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              aria-required={preferredContact === "email" ? "true" : undefined}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy(ids.email, preferredContact === "email", errors.email?.message)}
              className={cn(t.control, "h-12", errors.email && t.invalid)}
              data-testid="input-email"
              data-clarity-mask="True"
              {...register("email")}
            />
          </Field>

          <fieldset className="grid gap-1.5">
            <legend className={cn(t.label, "mb-1.5")}>How should we reach you?</legend>
            <div className="grid grid-cols-3 gap-2">
              {CONTACT_METHODS.map((method) => (
                <label key={method.value} className="relative" data-testid={`button-preferred-contact-${method.value}`}>
                  <input
                    type="radio"
                    value={method.value}
                    className="peer sr-only"
                    {...register("preferredContact", {
                      onChange: () => {
                        if (formState.touchedFields.phone) void form.trigger("phone");
                        if (formState.touchedFields.email) void form.trigger("email");
                        else form.clearErrors("email");
                      },
                    })}
                  />
                  <span className={t.pill}>{method.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
            </div>
          </details>

          {estimate && attached && (
            <div className="flex items-center justify-between gap-2 text-xs" data-testid="text-estimate-summary">
              <span className={t.muted}>
                Range attached:{" "}
                <span className={t.text} data-testid="text-estimate-range">
                  <DisplayNum>
                    {formatPlanningCurrency(estimate.priceLow)} to {formatPlanningCurrency(estimate.priceHigh)}
                  </DisplayNum>
                </span>
                {projectLabel ? ` · ${projectLabel}` : ""}
                {finishLabel ? ` · ${finishLabel}` : ""}
              </span>
              <button
                type="button"
                onClick={() => setAttached(false)}
                className={cn("inline-flex min-h-12 flex-shrink-0 items-center gap-1", t.muted)}
                data-testid="button-drop-estimate"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </button>
            </div>
          )}
        </>
      )}

      {mode === "embedded" && sendArea}
    </div>
  );

  const formInner = (
    <>
      <EstimatorRecovery
        flow="consultation"
        currentStep={callback ? "callback" : "request"}
        currentStepIndex={0}
        totalSteps={1}
        selections={{ project_type: watched.projectType || null }}
        validationErrors={Object.keys(errors)}
        engaged={formState.isDirty}
        submitted={success}
      />
      {success ? (
        // The success screen carries its own optional details form, so it sits
        // outside the request form (forms cannot nest). Same test id and step
        // marker the request form had once sent. data-family-bar-yield (here and on the form):
        // the family mobile bar steps aside while either is on screen
        // (components/family/MobileActionBar.tsx).
        <div data-testid="consultation-wizard" data-step="sent" data-request-kind={callback ? "callback" : "quote"} data-family-bar-yield="">
          {successBlock}
        </div>
      ) : (
      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(event);
        }}
        onFocusCapture={trackFormStart}
        aria-labelledby={mode === "embedded" ? ids.heading : undefined}
        aria-label={mode === "app" ? "Request a quote" : undefined}
        data-testid="consultation-wizard"
        data-step="project"
        data-request-kind={callback ? "callback" : "quote"}
        data-family-bar-yield=""
        data-clarity-mask="True"
      >
        <div aria-hidden="true" className="pointer-events-none absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
          <label htmlFor="consultation-website">Website</label>
          <input
            id="consultation-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            // Rendered here so the server HTML already carries the mask the
            // beforeInteractive Clarity masker would add (lib/clarityFormMask);
            // otherwise hydration reports an attribute mismatch.
            data-clarity-mask="True"
          />
        </div>

        {body}
      </form>
      )}
    </>
  );

  if (mode === "app") {
    return (
      <AppFrame
        title={success ? "Request sent" : callback ? "Request a call" : "Request a quote"}
        steps={[{ id: "request", label: "Request" }]}
        currentIndex={0}
        hideProgress
        footer={success ? undefined : sendArea}
        className="quote-request-app-frame"
      >
        {formInner}
      </AppFrame>
    );
  }

  return formInner;
}
