"use client";
import { readLeadAttribution } from "@/lib/leadAttributionBrowser";

import { EstimatorRecovery } from "@/components/estimate/recovery/EstimatorRecovery";
import { markEstimatorCompleted } from "@/lib/estimatorSession";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Check, CheckCircle2, Plus, X, ChevronDown } from "lucide-react";
import type { StoredEstimate } from "@/shared/estimateEngine";
import { FINISH_LABELS, PROJECT_LABELS, formatPlanningCurrency } from "@/shared/estimateEngine";
import { DisplayNum } from "@/components/marketing";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { EstimateCTA } from "@/components/modals/EstimateCTA";
import { CTA_FORM_SEND } from "@/shared/ctaCopy";
import { CONSULT_BULLETS } from "@/shared/siteContent";
import { BusinessPhoneContact } from "@/components/BusinessPhoneContact";
import { trackEvent, trackClaimedLeadConversion } from "@/lib/analytics";
import { readStoredPrefill, PREFILL_UPDATED_EVENT, hasPassedGate } from "@/lib/leadPrefill";
import {
  getOrCreateInquiryTracking,
  readInquiryTracking,
  recordInquiryAcceptance,
} from "@/lib/inquiryTracking";
import type { PropertyProfile } from "@/shared/propertyProfile";
import {
  isLocatableSite,
  SITE_LOCATION_ERROR_MESSAGE,
  buildCleanAddress,
  extractZip,
} from "@/shared/addressValidation";
import {
  AppFrame,
  SelectableCard,
  WizardActionBar,
  WizardProgress,
  WizardStep,
} from "@/components/estimate/wizard";

const LAND_SEARCH_PROJECT_TYPE = "looking-for-land";
const SOMETHING_ELSE = "something-else";

const CONTACT_METHODS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone call" },
  { value: "text", label: "Text" },
] as const;

const DRAFT_KEY = "construction_quote_wizard_v1";

const formSchema = z
  .object({
    name: z.string().min(2, "Please enter your full name"),
    preferredContact: z.enum(["email", "phone", "text"]),
    phone: z.string(),
    email: z.string(),
    address: z.string(),
    projectType: z.string().min(1, "Please select a project type"),
    message: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.preferredContact === "email") {
      if (!z.string().email().safeParse(data.email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "Please enter a valid email address",
        });
      }
    } else if (data.phone.replace(/\D/g, "").length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message:
          data.preferredContact === "text"
            ? "Please enter a valid mobile number"
            : "Please enter a valid phone number",
      });
    }

    if (data.projectType === LAND_SEARCH_PROJECT_TYPE || data.projectType === SOMETHING_ELSE) return;
    const address = data.address.trim();
    if (address.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: "Please enter your build site address",
      });
      return;
    }
    if (!isLocatableSite(address)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address"],
        message: SITE_LOCATION_ERROR_MESSAGE,
      });
    }
  });

type FormData = z.infer<typeof formSchema>;

/** Six primary cards (D2). Remaining types route through Something else. */
const PRIMARY_CHOICES = [
  { value: "custom-home", label: "Custom Home", sub: "Drawn from a blank page" },
  { value: "semi-custom-home", label: "Semi-Custom", sub: "Proven plan, your choices" },
  { value: "build-on-my-lot", label: "Build on My Lot", sub: "You already own the land" },
  { value: "shop-home", label: "Shop Home", sub: "House and shop together" },
  { value: "looking-for-land", label: "Still Looking for Land", sub: "No site address yet" },
  { value: SOMETHING_ELSE, label: "Something else", sub: "Plans, addition, lot eval, other" },
] as const;

const DETAIL_CHOICES = [
  { value: "plans-only", label: "Home Design & Plans", sub: "Drawings without building" },
  { value: "addition", label: "Home Addition", sub: "New space on an existing home" },
  { value: "lot-evaluation", label: "Lot Evaluation", sub: "Feasibility before you buy" },
  { value: "other", label: "Other / Not sure yet", sub: "Tell us in a note" },
] as const;

const PROJECT_LABEL_LOOKUP: Record<string, string> = {
  ...Object.fromEntries(PRIMARY_CHOICES.map((o) => [o.value, o.label])),
  ...Object.fromEntries(DETAIL_CHOICES.map((o) => [o.value, o.label])),
};

type StepId = "project" | "detail" | "name" | "prefer" | "reach" | "site" | "review";

/** Older drafts stored the combined contact step as `contact`. */
function normalizeDraftStep(step: string | undefined): StepId | undefined {
  if (!step) return undefined;
  if (step === "contact") return "name";
  if (
    step === "project" ||
    step === "detail" ||
    step === "name" ||
    step === "prefer" ||
    step === "reach" ||
    step === "site" ||
    step === "review"
  ) {
    return step;
  }
  return undefined;
}

const labelClass = "text-xs tracking-wide font-normal uppercase text-muted-foreground";

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      {" "}*
    </span>
  );
}

function readDraft(): Partial<FormData> & { step?: StepId; detailPending?: boolean } {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<FormData> & { step?: StepId; detailPending?: boolean };
  } catch {
    return {};
  }
}

function writeDraft(data: Partial<FormData> & { step: StepId; detailPending?: boolean }) {
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
  /** AppFrame full-screen flow for /estimate; embedded for contact / home / modal. */
  mode?: "app" | "embedded";
}

export function QuoteRequestWizard({
  onRevise,
  showTrust = false,
  mode = "embedded",
}: QuoteRequestWizardProps = {}) {
  const [estimate, setEstimate] = useState<StoredEstimate | null>(null);
  const [estimateChecked, setEstimateChecked] = useState(false);
  const [attached, setAttached] = useState(true);
  const [success, setSuccess] = useState(false);
  const [submitted, setSubmitted] = useState<FormData | null>(null);
  const [propertyProfile, setPropertyProfile] = useState<PropertyProfile | null>(null);
  const [addressInput, setAddressInput] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [showAddrInfo, setShowAddrInfo] = useState(false);
  const [website, setWebsite] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [detailPending, setDetailPending] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const lastKeyRef = useRef<string | null>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const formMountedAtRef = useRef(Date.now());
  const draftHydrated = useRef(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      preferredContact: "email",
      phone: "",
      email: "",
      address: "",
      projectType: "",
      message: "",
    },
  });

  const preferredContact = form.watch("preferredContact");
  const projectType = form.watch("projectType");
  const searchingForLand = projectType === LAND_SEARCH_PROJECT_TYPE;
  const watched = form.watch();

  const steps = useMemo(() => {
    const list: { id: StepId; label: string }[] = [{ id: "project", label: "Project" }];
    if (detailPending || projectType === SOMETHING_ELSE) {
      list.push({ id: "detail", label: "Details" });
    }
    // C10 fit sequence #1: one keyboard field per text step.
    list.push({ id: "name", label: "Name" });
    list.push({ id: "prefer", label: "Prefer" });
    list.push({ id: "reach", label: "Reach" });
    if (!searchingForLand) {
      list.push({ id: "site", label: "Site" });
    }
    list.push({ id: "review", label: "Review" });
    return list;
  }, [detailPending, projectType, searchingForLand]);

  // Keep stepIndex in range when the step list shrinks (e.g. land search).
  useEffect(() => {
    if (stepIndex > steps.length - 1) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, stepIndex]);

  useEffect(() => {
    if (draftHydrated.current) return;
    draftHydrated.current = true;
    const draft = readDraft();
    if (draft.projectType) {
      form.setValue("projectType", draft.projectType, { shouldValidate: false });
      if (draft.detailPending || draft.projectType === SOMETHING_ELSE) {
        setDetailPending(true);
      }
    }
    if (draft.name) form.setValue("name", draft.name, { shouldValidate: false });
    if (draft.preferredContact) {
      form.setValue("preferredContact", draft.preferredContact, { shouldValidate: false });
    }
    if (draft.phone) form.setValue("phone", draft.phone, { shouldValidate: false });
    if (draft.email) form.setValue("email", draft.email, { shouldValidate: false });
    if (draft.address) {
      setAddressInput(draft.address);
      form.setValue("address", draft.address, { shouldValidate: false });
    }
    if (draft.message) {
      form.setValue("message", draft.message, { shouldValidate: false });
      setShowNote(true);
    }
    const restoredStep = normalizeDraftStep(draft.step);
    if (restoredStep) {
      // Resolve after steps recompute on next paint
      requestAnimationFrame(() => {
        const idx = steps.findIndex((s) => s.id === restoredStep);
        if (idx >= 0) setStepIndex(idx);
      });
    }
  }, [form, steps]);

  useEffect(() => {
    if (success) return;
    const step = steps[stepIndex]?.id ?? "project";
    writeDraft({
      projectType: watched.projectType,
      name: watched.name,
      preferredContact: watched.preferredContact,
      phone: watched.phone,
      email: watched.email,
      address: watched.address,
      message: watched.message,
      step,
      detailPending,
    });
  }, [watched, stepIndex, success, steps, detailPending]);

  // Embedded mode: keep the focused field above the fixed Back/Next dock when
  // the software keyboard (or design-review VV mock) is open (C10).
  useEffect(() => {
    if (mode !== "embedded") return;
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches("input, textarea, [contenteditable='true']")) return;
      window.setTimeout(() => {
        const bar = document.querySelector<HTMLElement>("[data-wizard-action-bar-docked='true']");
        const barTop = bar?.getBoundingClientRect().top ?? window.innerHeight;
        const rect = target.getBoundingClientRect();
        if (rect.bottom > barTop - 12) {
          const delta = rect.bottom - barTop + 24;
          window.scrollBy({ top: delta, behavior: "smooth" });
        }
      }, 50);
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, [mode]);

  // Browser Back restores the previous wizard step (D2).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = (e: PopStateEvent) => {
      const idx = typeof e.state?.quoteStep === "number" ? e.state.quoteStep : null;
      if (idx !== null && idx >= 0 && idx < steps.length) {
        setStepIndex(idx);
        setStepError(null);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [steps.length]);

  function handleProfileResolved(profile: PropertyProfile | null) {
    setPropertyProfile(profile);
    if (profile) {
      const clean = buildCleanAddress(profile);
      if (clean) {
        setAddressInput(clean);
        form.setValue("address", clean, { shouldValidate: true });
      }
    }
  }

  const deriveZip = (addr: string) =>
    propertyProfile?.zip?.slice(0, 5) || extractZip(addr) || "";

  useEffect(() => {
    function applyPrefill() {
      const pf = readStoredPrefill();
      const fillIfEmpty = (field: "name" | "phone" | "email", value?: string) => {
        if (value && !form.getValues(field)) {
          form.setValue(field, value, { shouldValidate: false });
        }
      };
      fillIfEmpty("name", pf.name);
      fillIfEmpty("phone", pf.phone);
      fillIfEmpty("email", pf.email);
      if (pf.address && !form.getValues("address")) {
        setAddressInput(pf.address);
        form.setValue("address", pf.address, { shouldValidate: false });
      }
    }
    applyPrefill();
    if (
      new URLSearchParams(window.location.search).get("service") === "home-additions" &&
      !form.getValues("projectType")
    ) {
      form.setValue("projectType", "addition", { shouldValidate: false });
    }
    window.addEventListener(PREFILL_UPDATED_EVENT, applyPrefill);
    return () => window.removeEventListener(PREFILL_UPDATED_EVENT, applyPrefill);
  }, [form]);

  useEffect(() => {
    function loadEstimate() {
      setEstimateChecked(true);
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
        form.setValue("projectType", parsed.project, { shouldValidate: false });
      } catch {}
    }
    loadEstimate();
    window.addEventListener("brc_estimate_updated", loadEstimate);
    return () => window.removeEventListener("brc_estimate_updated", loadEstimate);
  }, [form]);

  useEffect(() => {
    if (!success) return;
    const el = successHeadingRef.current;
    if (el && el.offsetParent !== null) {
      let ancestor: HTMLElement | null = el.parentElement;
      let scrolledContainer = false;
      while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
        const overflowY = getComputedStyle(ancestor).overflowY;
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          ancestor.scrollHeight > ancestor.clientHeight
        ) {
          ancestor.scrollTo({ top: 0, behavior: "auto" });
          scrolledContainer = true;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (!scrolledContainer) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
      }
    }
    el?.focus({ preventScroll: true });
  }, [success]);

  function handleRevise() {
    if (onRevise) {
      onRevise();
    } else {
      document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const existingTracking = readInquiryTracking();
      const tracking = getOrCreateInquiryTracking();
      const payload = {
        ...data,
        inquiryKey: tracking.inquiryKey,
        submissionKind:
          hasPassedGate() || existingTracking?.acceptedAt ? "followup" : "initial",
        formStartedAt: formMountedAtRef.current,
        website,
        zip: deriveZip(data.address),
        propertyProfile,
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
        throw new Error(err.message || "Something went wrong");
      }
      const response = (await res.json()) as {
        accepted?: boolean;
        inquiryKey?: string;
        conversionId?: string;
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
      clearDraft();
      sessionStorage.removeItem("brc_estimate");
      markEstimatorCompleted("consultation");
      const acceptedTracking = recordInquiryAcceptance({
        inquiryKey: response.inquiryKey!,
        conversionId: response.conversionId!,
      });
      void trackClaimedLeadConversion({
        inquiryKey: acceptedTracking.inquiryKey,
        claimKey: acceptedTracking.claimKey,
        conversionId: response.conversionId!,
        ga4Params: {
          form: "consultation",
          project_type: variables.projectType,
          has_estimate: !!estimate && attached,
        },
        metaParams: {
          content_name: variables.projectType,
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

  const goBack = useCallback(() => {
    setStepError(null);
    setStepIndex((i) => {
      const next = Math.max(0, i - 1);
      if (typeof window !== "undefined") {
        window.history.pushState({ quoteStep: next }, "");
      }
      return next;
    });
  }, []);

  async function validateStep(id: StepId): Promise<boolean> {
    setStepError(null);
    if (id === "project") {
      const ok = await form.trigger("projectType");
      const value = form.getValues("projectType");
      if (!ok || !value || value === SOMETHING_ELSE) {
        if (value === SOMETHING_ELSE) {
          setDetailPending(true);
          return true;
        }
        setStepError("Please choose what you want to build.");
        return false;
      }
      setDetailPending(false);
      return true;
    }
    if (id === "detail") {
      const value = form.getValues("projectType");
      if (!DETAIL_CHOICES.some((c) => c.value === value)) {
        setStepError("Please choose a more specific project type.");
        return false;
      }
      return true;
    }
    if (id === "name") {
      const ok = await form.trigger("name");
      if (!ok) {
        setStepError("Please enter your name.");
        return false;
      }
      return true;
    }
    if (id === "prefer") {
      const ok = await form.trigger("preferredContact");
      if (!ok) {
        setStepError("Please choose how we should reach you.");
        return false;
      }
      return true;
    }
    if (id === "reach") {
      const method = form.getValues("preferredContact");
      const contactOk =
        method === "email"
          ? await form.trigger("email")
          : await form.trigger("phone");
      if (!contactOk) {
        setStepError(
          method === "email"
            ? "Please enter a valid email address."
            : "Please enter a valid phone number.",
        );
        return false;
      }
      return true;
    }
    if (id === "site") {
      if (form.getValues("projectType") === LAND_SEARCH_PROJECT_TYPE) return true;
      const ok = await form.trigger("address");
      if (!ok) {
        setStepError("Please enter your build site address.");
        return false;
      }
      return true;
    }
    return true;
  }

  async function goNext() {
    const id = steps[stepIndex]?.id;
    if (!id) return;
    const ok = await validateStep(id);
    if (!ok) return;
    if (stepIndex < steps.length - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      if (typeof window !== "undefined") {
        window.history.pushState({ quoteStep: next }, "");
      }
      return;
    }
    // Guard: never submit with the something-else sentinel.
    if (form.getValues("projectType") === SOMETHING_ELSE) {
      setStepError("Please choose a more specific project type.");
      return;
    }
    form.handleSubmit(
      (data) => {
        setSubmitted(data);
        mutation.mutate(data);
      },
      (errors) => {
        trackEvent("form_error", {
          form: "consultation",
          fields: Object.keys(errors).sort().join(","),
        });
        setStepError("Please fix the highlighted fields.");
      },
    )();
  }

  const successBlock = (
    <div
      className="flex flex-col items-start space-y-4 py-2"
      data-testid="consultation-success"
      data-clarity-mask="True"
    >
      <img
        src="/brand/svg/icon/boise-construction-co-icon-accent.svg"
        alt="Boise Construction Co"
        width={48}
        height={48}
        className="h-12 w-12"
      />
      <div>
        <h3
          ref={successHeadingRef}
          tabIndex={-1}
          data-clarity-mask="True"
          className="font-serif text-2xl text-foreground outline-none"
        >
          Request received{submitted ? `, ${submitted.name.split(" ")[0]}` : ""}.
        </h3>
        {submitted && (
          <p className="mt-1 text-sm text-muted-foreground" data-clarity-mask="True">
            {PROJECT_LABEL_LOOKUP[submitted.projectType] ?? submitted.projectType}
            {submitted.address ? ` · ${submitted.address}` : ""}
          </p>
        )}
      </div>
      <ol className="space-y-2.5 text-sm text-muted-foreground">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-border text-caption font-normal text-foreground">
            1
          </span>
          <span className="pt-0.5">We review your request and any planning range you attached.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-border text-caption font-normal text-foreground">
            2
          </span>
          <span className="pt-0.5">We reach out within one business day to find a time that works.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-border text-caption font-normal text-foreground">
            3
          </span>
          <span className="pt-0.5">
            Your free 60 to 90 minute in-home visit: planning guidance, design direction, no
            obligation.
          </span>
        </li>
      </ol>
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Need us sooner?{" "}
          <BusinessPhoneContact
            inline
            showPhoneIcon
            phoneClassName="inline-flex items-center gap-1.5 font-normal text-foreground underline-offset-2 hover:underline"
            saveClassName="text-sm text-muted-foreground hover:text-foreground transition-colors"
            phoneTestId="link-consult-success-phone"
          />
        </p>
        {submitted?.email && (
          <p className="text-xs text-muted-foreground">
            A confirmation email is on its way to your inbox.
          </p>
        )}
      </div>
    </div>
  );

  if (success && mode === "embedded") {
    return successBlock;
  }

  const projectLabel = estimate?.project ? PROJECT_LABELS[estimate.project]?.label : null;
  const finishLabel = estimate?.finish ? FINISH_LABELS[estimate.finish]?.label : null;
  const stepId = steps[stepIndex]?.id ?? "project";
  const primaryLabel =
    stepIndex === steps.length - 1
      ? mutation.isPending
        ? "Sending…"
        : CTA_FORM_SEND
      : "Continue";

  const stepBody = (
    <>
      {showTrust && (
        <ul
          className="mb-2 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2"
          data-testid="consult-trust-bullets"
        >
          {CONSULT_BULLETS.map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 flex-shrink-0 text-foreground/60" />
              {item}
            </li>
          ))}
        </ul>
      )}

      {estimateChecked && !estimate && stepId === "project" && mode === "embedded" && (
        <p className="mb-2 text-xs text-muted-foreground" data-testid="estimate-cta-card">
          Want a ballpark first?{" "}
          {onRevise ? (
            <button
              type="button"
              onClick={onRevise}
              className="font-normal text-foreground underline underline-offset-2"
              data-testid="button-start-estimate"
            >
              See planning range
            </button>
          ) : (
            <EstimateCTA
              size="sm"
              variant="ghost"
              className="h-auto p-0 text-xs font-normal text-foreground underline underline-offset-2"
              data-testid="button-start-estimate"
            >
              See planning range
            </EstimateCTA>
          )}
        </p>
      )}

      {estimate && attached && stepId === "project" && (
        <div
          className="mb-3 flex items-center justify-between gap-2 text-xs"
          data-testid="text-estimate-summary"
        >
          <span className="text-muted-foreground">
            Range attached:{" "}
            <span className="text-foreground" data-testid="text-estimate-range">
              <DisplayNum>
                {formatPlanningCurrency(estimate.priceLow)} to{" "}
                {formatPlanningCurrency(estimate.priceHigh)}
              </DisplayNum>
            </span>
            {projectLabel ? ` · ${projectLabel}` : ""}
            {finishLabel ? ` · ${finishLabel}` : ""}
          </span>
          <button
            type="button"
            onClick={() => setAttached(false)}
            className="inline-flex flex-shrink-0 items-center gap-1 text-muted-foreground hover:text-foreground"
            data-testid="button-drop-estimate"
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      )}

      {mutation.isError && (
        <div
          role="alert"
          className="mb-3 rounded-sm border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {(mutation.error as Error).message || "Something went wrong. Please try again."}
        </div>
      )}

      {stepError && (
        <div
          role="alert"
          className="mb-3 rounded-sm border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {stepError}
        </div>
      )}

      {stepId === "project" && (
        <WizardStep
          as="h3"
          compact
          heading="What are you planning to build?"
          instructions="One choice. Site and contact details come next."
          data-testid="consult-step-project"
          tone={mode === "app" ? "inverse" : "default"}
        >
          <div role="radiogroup" aria-label="Project type" className="grid grid-cols-2 gap-2">
            {PRIMARY_CHOICES.map((opt) => {
              const selected =
                projectType === opt.value ||
                (opt.value === SOMETHING_ELSE &&
                  (detailPending || DETAIL_CHOICES.some((d) => d.value === projectType)));
              return (
                <SelectableCard
                  key={opt.value}
                  dense
                  control="radio"
                  tone={mode === "app" ? "inverse" : "default"}
                  selected={selected}
                  onSelect={() => {
                    if (opt.value === SOMETHING_ELSE) {
                      setDetailPending(true);
                      form.setValue("projectType", SOMETHING_ELSE, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    } else {
                      setDetailPending(false);
                      form.setValue("projectType", opt.value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                    setStepError(null);
                  }}
                  title={opt.label}
                  description={opt.sub}
                  data-testid={`consult-project-${opt.value}`}
                />
              );
            })}
          </div>
          <FormField
            control={form.control}
            name="projectType"
            render={() => (
              <FormItem className="sr-only">
                <FormMessage />
              </FormItem>
            )}
          />
        </WizardStep>
      )}

      {stepId === "detail" && (
        <WizardStep
          as="h3"
          compact
          heading="Tell us a bit more"
          instructions="Pick the closest match."
          data-testid="consult-step-detail"
          tone={mode === "app" ? "inverse" : "default"}
        >
          <div role="radiogroup" aria-label="Project details" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DETAIL_CHOICES.map((opt) => (
              <SelectableCard
                key={opt.value}
                dense
                control="radio"
                tone={mode === "app" ? "inverse" : "default"}
                selected={projectType === opt.value}
                onSelect={() => {
                  form.setValue("projectType", opt.value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  setStepError(null);
                }}
                title={opt.label}
                description={opt.sub}
                data-testid={`consult-detail-${opt.value}`}
              />
            ))}
          </div>
        </WizardStep>
      )}

      {stepId === "name" && (
        <WizardStep
          as="h3"
          compact
          heading="What's your name?"
          instructions="So we know who to reply to."
          data-testid="consult-step-name"
          tone={mode === "app" ? "inverse" : "default"}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Full name
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Jane Smith"
                    autoComplete="name"
                    aria-required="true"
                    data-testid="input-name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </WizardStep>
      )}

      {stepId === "prefer" && (
        <WizardStep
          as="h3"
          compact
          heading="How should we reach you?"
          instructions="Email, phone call, or text."
          data-testid="consult-step-prefer"
          tone={mode === "app" ? "inverse" : "default"}
        >
          <FormField
            control={form.control}
            name="preferredContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Preferred contact
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <div
                    role="radiogroup"
                    aria-label="Preferred contact method"
                    className="grid grid-cols-3 gap-2"
                  >
                    {CONTACT_METHODS.map((method) => {
                      const selected = field.value === method.value;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => field.onChange(method.value)}
                          className={cn(
                            "min-h-12 rounded-sm border px-3 py-2.5 text-sm font-normal transition-colors",
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-transparent text-foreground",
                          )}
                          data-testid={`button-preferred-contact-${method.value}`}
                        >
                          {method.label}
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </WizardStep>
      )}

      {stepId === "reach" && (
        <WizardStep
          as="h3"
          compact
          heading={preferredContact === "email" ? "What's your email?" : "What's your number?"}
          instructions={
            preferredContact === "email"
              ? "We'll reply within one business day."
              : preferredContact === "text"
                ? "A mobile number we can text."
                : "A number we can call."
          }
          data-testid="consult-step-reach"
          tone={mode === "app" ? "inverse" : "default"}
        >
          {preferredContact === "email" ? (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>
                    Email
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jane@example.com"
                      autoComplete="email"
                      aria-required="true"
                      data-testid="input-email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>
                    Phone
                    <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="(208) 555-0000"
                      autoComplete="tel"
                      aria-required="true"
                      data-testid="input-phone"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </WizardStep>
      )}

      {stepId === "site" && (
        <WizardStep
          as="h3"
          compact
          heading="Where is the build site?"
          instructions="Street address, parcel number, or lot and subdivision."
          data-testid="consult-step-site"
          tone={mode === "app" ? "inverse" : "default"}
        >
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Build site address
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <AddressAutocomplete
                    value={addressInput || field.value}
                    onChange={(v) => {
                      setAddressInput(v);
                      field.onChange(v);
                    }}
                    onProfileResolved={handleProfileResolved}
                    data-testid="input-address"
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowAddrInfo((v) => !v)}
                  aria-expanded={showAddrInfo}
                  aria-controls="address-info"
                  className="mt-1 inline-flex min-h-11 items-center gap-1 py-2 text-xs text-muted-foreground hover:text-foreground [[data-keyboard-inset]_&]:hidden"
                  data-testid="button-address-info"
                >
                  Why we ask
                  <ChevronDown
                    className={cn("h-3 w-3 transition-transform", showAddrInfo && "rotate-180")}
                  />
                </button>
                {showAddrInfo && (
                  <FormDescription
                    id="address-info"
                    className="mt-1 text-xs text-muted-foreground [[data-keyboard-inset]_&]:hidden"
                  >
                    We pull county parcel records before we meet, so we can tell you what your site
                    will require. Your information is never shared or sold -{" "}
                    <Link
                      href="/privacy-policy"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      privacy policy
                    </Link>
                    .
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </WizardStep>
      )}

      {stepId === "review" && (
        <WizardStep
          as="h3"
          compact
          heading="Review and send"
          instructions="Check the summary, add an optional note, then send."
          data-testid="consult-step-review"
          tone={mode === "app" ? "inverse" : "default"}
        >
          <div className="space-y-4">
            <dl className="space-y-2 rounded-sm border border-border bg-muted/30 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Project</dt>
                <dd className="text-right font-normal text-foreground">
                  {PROJECT_LABEL_LOOKUP[form.watch("projectType")] ?? form.watch("projectType")}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="text-right text-foreground" data-clarity-mask="True">
                  {form.watch("name")}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Reach by</dt>
                <dd className="text-right text-foreground">
                  {CONTACT_METHODS.find((m) => m.value === preferredContact)?.label}
                  {preferredContact === "email"
                    ? ` · ${form.watch("email")}`
                    : ` · ${form.watch("phone")}`}
                </dd>
              </div>
              {!searchingForLand && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Site</dt>
                  <dd className="text-right text-foreground" data-clarity-mask="True">
                    {form.watch("address") || "-"}
                  </dd>
                </div>
              )}
            </dl>

            {showNote ? (
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>
                      Anything else we should know?{" "}
                      <span className="normal-case text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Your home, your vision, or your timeline..."
                        rows={3}
                        autoFocus
                        data-testid="textarea-message"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowNote(true)}
                className="inline-flex min-h-11 items-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground"
                data-testid="button-add-note"
              >
                <Plus className="h-3.5 w-3.5" />
                Add a note <span className="text-muted-foreground">(optional)</span>
              </button>
            )}

            <p className="text-xs text-muted-foreground">
              No spam. We respond within one business day.
            </p>
          </div>
        </WizardStep>
      )}
    </>
  );

  const actionBar = (
    <WizardActionBar
      onBack={stepIndex > 0 ? goBack : undefined}
      onPrimary={() => void goNext()}
      primaryLabel={primaryLabel}
      primaryDisabled={mutation.isPending}
      busy={mutation.isPending}
      busyLabel="Sending…"
      primaryIcon={stepIndex === steps.length - 1 ? "none" : "arrow"}
      ownsBottomEdge
      pinned={mode !== "app"}
      tone={mode === "app" ? "inverse" : "default"}
      data-testid="consult-wizard-actions"
    />
  );

  const formInner = (
    <Form {...form}>
      <EstimatorRecovery
        flow="consultation"
        currentStep={stepId}
        currentStepIndex={stepIndex}
        totalSteps={steps.length}
        lastCompletedStep={stepIndex > 0 ? steps[stepIndex - 1]?.id : undefined}
        selections={{ project_type: String(form.watch("projectType") ?? "") || null }}
        validationErrors={Object.keys(form.formState.errors)}
        engaged={form.formState.isDirty || stepIndex > 0}
        submitted={success}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void goNext();
        }}
        onFocusCapture={trackFormStart}
        className={mode === "embedded" ? "space-y-4" : undefined}
        data-testid="consultation-wizard"
        data-step={stepId}
        data-clarity-mask="True"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
        >
          <label htmlFor="consultation-website">Website</label>
          <input
            id="consultation-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>

        {mode === "embedded" && (
          <WizardProgress steps={steps} currentIndex={stepIndex} className="!mb-3" />
        )}

        {success && mode === "app" ? successBlock : stepBody}

        {mode === "embedded" && !success && actionBar}
      </form>
    </Form>
  );

  if (mode === "app") {
    return (
      <AppFrame
        title="Request a quote"
        eyebrow="Planning conversation"
        steps={steps}
        currentIndex={success ? steps.length - 1 : stepIndex}
        hideProgress={success}
        footer={success ? undefined : actionBar}
        className="quote-request-app-frame"
      >
        {formInner}
      </AppFrame>
    );
  }

  return formInner;
}
