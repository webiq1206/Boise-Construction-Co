"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  Plus,
  Camera,
  FileText,
  Image as ImageIcon,
  Printer,
  Copy,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Section } from "@/components/marketing/Section";
import { Button } from "@/components/ui/button";
import {
  WizardProgress,
  WizardActionBar,
  WizardStep,
  SelectableCard,
  HelpNote,
  ReviewSection,
  WizardField,
  WizardTextArea,
  WizardChoiceGroup,
} from "@/components/estimate/wizard";
import { RECIPES } from "@/shared/costs/re10Repairs";
import { RE10_PRICING_DISCLAIMER } from "@/shared/content/re10Content";
import type { ExtractedRepair, ExtractionResult } from "@/shared/re10/extraction";
import {
  classifyUpload,
  MAX_UPLOAD_FILES,
  MAX_TOTAL_UPLOAD_BYTES,
  UPLOAD_ACCEPT,
  READABLE_FORMATS_LABEL,
} from "@/shared/re10/uploads";
import { requestHideMobileNavBar } from "@/lib/mobileNavBar";
import { RE10_EVENTS } from "@/shared/re10/analyticsEvents";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";

/**
 * The RE-10 estimator, rebuilt as a guided, mobile-first application.
 *
 * ONE CLEAR STEP AT A TIME. Upload, confirm the repairs we read, then a handful
 * of short questions - never a wall of fields - and a structured price at the
 * end. The gate still sits after the repair review on purpose: the homeowner
 * corrects our reading BEFORE giving contact details, so the form is the last
 * step of getting a price rather than the price of finding out we misread.
 *
 * Every step carries the same sticky Back/Continue bar, the same progress
 * orientation, and the same selectable cards and inputs as the standard
 * estimator, so the two tools read as one product. Answers persist through
 * refresh, back-navigation and validation via sessionStorage; nothing entered
 * is ever thrown away by moving between steps.
 *
 * The scroll target keeps a scroll-mt so a step heading never lands behind the
 * sticky site header.
 */

type Step =
  | "upload"
  | "review"
  | "about"
  | "reach"
  | "property"
  | "timeline"
  | "summary"
  | "result";

/** The ordered flow shown in the progress rail (the result is the outcome). */
const FLOW: Step[] = ["upload", "review", "about", "reach", "property", "timeline", "summary"];

const STEP_META: { id: Step; label: string }[] = [
  { id: "upload", label: "Documents" },
  { id: "review", label: "Repairs" },
  { id: "about", label: "About you" },
  { id: "reach", label: "Contact" },
  { id: "property", label: "Property" },
  { id: "timeline", label: "Timeline" },
  { id: "summary", label: "Review" },
];

interface EditableRepair extends ExtractedRepair {
  id: string;
  included: boolean;
}

interface FileMeta {
  name: string;
  size: number;
  type: string;
}

interface EstimateResponse {
  price: number;
  validDays: number;
  confidence: "high" | "medium" | "low";
  propertyAddress: string;
  closingDate: string | null;
  repairDeadline: string | null;
  categories: {
    trade: string;
    label: string;
    itemCount: number;
    items: { description: string; label: string; location: string | null; quantityAssumed: boolean; quantity?: number; unit?: string }[];
  }[];
  needsOnsite: { description: string; why: string }[];
  uncertainty: string[];
  assumptions: string[];
  priced: number;
  unpriced: number;
  /** True only when the server confirms the customer copy actually sent. */
  emailed: boolean;
}

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

const ROLES = [
  { value: "buyer-agent", label: "Buyer's agent" },
  { value: "seller-agent", label: "Seller's agent" },
  { value: "coordinator", label: "Transaction coordinator" },
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "other", label: "Other" },
] as const;
type RoleValue = (typeof ROLES)[number]["value"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_KEY = "brc_re10_wizard";

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const isImage = (type: string, name: string) =>
  type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(name);

export function Re10Wizard() {
  const [step, setStep] = useState<Step>("upload");
  const topRef = useRef<HTMLDivElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  /** Persisted description of the files, so a refresh can still show them. */
  const [fileMeta, setFileMeta] = useState<FileMeta[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  // Nested children fire dragleave as the pointer crosses them, so a boolean
  // set on the events alone flickers the whole box. Count enter/leave instead.
  const dragDepth = useRef(0);
  const pickerRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  /** Files we hold and forward, but cannot read - a Word addendum, a HEIC. */
  const [attachedOnly, setAttachedOnly] = useState<string[]>([]);
  const [documents, setDocuments] = useState<{ filename: string; url: string }[]>([]);
  const [repairs, setRepairs] = useState<EditableRepair[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredContact, setPreferredContact] = useState<"email" | "phone" | "text">("email");
  const [role, setRole] = useState<RoleValue>("buyer-agent");
  const [brokerage, setBrokerage] = useState("");
  const [address, setAddress] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [repairDeadline, setRepairDeadline] = useState("");
  const [occupancy, setOccupancy] = useState<"occupied" | "vacant" | "unknown">("unknown");
  const [notes, setNotes] = useState("");

  const [result, setResult] = useState<EstimateResponse | null>(null);
  /**
   * Where Continue/Back should return after a single-section edit. When a user
   * jumps back to fix one answer from the Review screen we send them straight
   * back to Review, not forward through every step they had already completed.
   * When they edit their scope from the results, we recalculate and return to
   * the results.
   */
  const [returnTo, setReturnTo] = useState<Step | null>(null);
  const [copied, setCopied] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const restoredRef = useRef(false);

  // Fires once on mount. The denominator for every other stage, so it must
  // not re-fire when React re-renders or when a step changes.
  useEffect(() => {
    trackEvent(RE10_EVENTS.started);
  }, []);

  /* ---------------------------------------------------------- persistence */
  // Restore a saved session before the first paint's effects settle. File
  // objects cannot be serialised, so an upload that was never analysed cannot
  // be recovered - but every typed answer, the confirmed repair list, the
  // stored document links and the final price all come back.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.name) setName(s.name);
      if (s.email) setEmail(s.email);
      if (s.phone) setPhone(s.phone);
      if (s.preferredContact) setPreferredContact(s.preferredContact);
      if (s.role) setRole(s.role);
      if (s.brokerage) setBrokerage(s.brokerage);
      if (s.address) setAddress(s.address);
      if (s.closingDate) setClosingDate(s.closingDate);
      if (s.repairDeadline) setRepairDeadline(s.repairDeadline);
      if (s.occupancy) setOccupancy(s.occupancy);
      if (s.notes) setNotes(s.notes);
      if (Array.isArray(s.fileMeta)) setFileMeta(s.fileMeta);
      if (Array.isArray(s.documents)) setDocuments(s.documents);
      if (Array.isArray(s.attachedOnly)) setAttachedOnly(s.attachedOnly);
      if (s.extraction) setExtraction(s.extraction);
      if (Array.isArray(s.repairs)) setRepairs(s.repairs);
      if (s.result) setResult(s.result);
      // Only restore to a step we can actually render from restored state.
      const savedStep: Step | undefined = s.step;
      if (savedStep === "result" && s.result) setStep("result");
      else if (savedStep && savedStep !== "upload" && Array.isArray(s.repairs) && s.repairs.length > 0) {
        setStep(savedStep);
      }
    } catch {
      /* A corrupt snapshot should never break the wizard - start fresh. */
    }
  }, []);

  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step,
          name,
          email,
          phone,
          preferredContact,
          role,
          brokerage,
          address,
          closingDate,
          repairDeadline,
          occupancy,
          notes,
          fileMeta,
          documents,
          attachedOnly,
          extraction,
          repairs,
          result,
        }),
      );
    } catch {
      /* Storage full or blocked (private mode); the wizard still works. */
    }
  }, [
    step,
    name,
    email,
    phone,
    preferredContact,
    role,
    brokerage,
    address,
    closingDate,
    repairDeadline,
    occupancy,
    notes,
    fileMeta,
    documents,
    attachedOnly,
    extraction,
    repairs,
    result,
  ]);

  /* ---------------------------------------------------- global nav bar */
  // While the wizard is on screen its own sticky Back/Continue owns the bottom
  // edge; hide the global Call/Text bar so two bars never stack. Released the
  // moment the wizard scrolls out of view, so the rest of the page keeps it.
  useEffect(() => {
    const el = topRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let release: (() => void) | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !release) {
          release = requestHideMobileNavBar();
        } else if (!entry.isIntersecting && release) {
          release();
          release = null;
        }
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      release?.();
    };
  }, []);

  /**
   * A file dropped anywhere except the box must not navigate away. The
   * browser's default for a dropped PDF is to open it, replacing the page and
   * losing the wizard, the uploads and the step.
   */
  useEffect(() => {
    const swallow = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", swallow);
    window.addEventListener("drop", swallow);
    return () => {
      window.removeEventListener("dragover", swallow);
      window.removeEventListener("drop", swallow);
    };
  }, []);

  // Object URLs for image thumbnails, revoked when the file set changes.
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const f of files) {
      if (isImage(f.type, f.name)) next[`${f.name}:${f.size}`] = URL.createObjectURL(f);
    }
    setPreviews(next);
    return () => {
      Object.values(next).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const fileKey = (f: File) => `${f.name}:${f.size}`;

  /**
   * Add to the list rather than replace it. Everything turned away is named -
   * a file that vanished without explanation is worse than one refused aloud.
   */
  function addFiles(incoming: File[], method: "picker" | "camera" | "drop") {
    if (incoming.length === 0) return;

    const problems: string[] = [];
    const seen = new Set(files.map(fileKey));
    const next = [...files];
    let bytes = files.reduce((sum, f) => sum + f.size, 0);

    for (const f of incoming) {
      if (classifyUpload(f.name, f.type) === "rejected") {
        problems.push(`${f.name} is not a format we can take`);
        continue;
      }
      if (seen.has(fileKey(f))) continue;
      if (next.length >= MAX_UPLOAD_FILES) {
        problems.push(`${f.name} would be past our limit of ${MAX_UPLOAD_FILES} files`);
        continue;
      }
      if (bytes + f.size > MAX_TOTAL_UPLOAD_BYTES) {
        problems.push(`${f.name} is more than we can send in one go`);
        continue;
      }
      seen.add(fileKey(f));
      bytes += f.size;
      next.push(f);
    }

    const added = next.length - files.length;
    setFiles(next);
    setFileMeta(next.map((f) => ({ name: f.name, size: f.size, type: f.type })));
    setError(
      problems.length > 0
        ? `We can read ${READABLE_FORMATS_LABEL}. Left out: ${problems.join("; ")}.`
        : null,
    );
    if (added > 0) {
      trackEvent(RE10_EVENTS.documentUploaded, { file_count: next.length, added, method });
    }
  }

  function removeFile(target: File) {
    const next = files.filter((f) => fileKey(f) !== fileKey(target));
    setFiles(next);
    setFileMeta(next.map((f) => ({ name: f.name, size: f.size, type: f.type })));
    setError(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer?.files ?? []), "drop");
  }

  const goTo = useCallback((next: Step) => {
    setStep(next);
    setError(null);
    setFieldErrors({});
    // Land at the top of the wizard, not wherever the previous step ended.
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, []);

  async function analyze() {
    if (files.length === 0) {
      setError(
        fileMeta.length > 0
          ? "Your files were cleared when the page reloaded. Add them again to read the repair list."
          : "Attach your RE-10, the inspection pages, or photos to get started.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const res = await fetch("/api/re10/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "We could not read those documents.");
        trackEvent(RE10_EVENTS.analysisFailed, { reason: String(data.error ?? res.status) });
        return;
      }
      const extracted = data as ExtractionResult;
      setExtraction(extracted);
      setDocuments(Array.isArray(data.stored) ? data.stored : []);
      setAttachedOnly(Array.isArray(data.attachedOnly) ? data.attachedOnly : []);
      // The RE-10 states the property and often the dates. Prefill, and leave
      // every field editable.
      if (extracted.propertyAddress) setAddress((a) => a || extracted.propertyAddress!);
      if (extracted.closingDate) setClosingDate((d) => d || extracted.closingDate!);
      if (extracted.repairDeadline) setRepairDeadline((d) => d || extracted.repairDeadline!);
      trackEvent(RE10_EVENTS.analysisCompleted, {
        repairs_found: extracted.repairs.length,
        unmapped: extracted.unmapped.length,
      });
      setRepairs(extracted.repairs.map((r, i) => ({ ...r, id: `r${i}`, included: true })));

      // NOTHING TO REVIEW IS A DEAD END, NOT A STEP. Zero priceable repairs
      // must stop here with an explanation, not push someone onto a review
      // screen whose only button refuses to work.
      if (extracted.repairs.length === 0) {
        const reason = !extracted.looksLikeRe10
          ? "not-a-re10"
          : extracted.unmapped.length > 0
            ? "none-priceable"
            : "no-repairs-found";
        setError(
          reason === "not-a-re10"
            ? "This does not look like an RE-10 or an inspection response - we could not find a repair list in it. Send the RE-10 itself, or the inspection report pages that list the repairs, and we will read those."
            : reason === "none-priceable"
              ? `We read ${extracted.unmapped.length} request${extracted.unmapped.length === 1 ? "" : "s"}, but none of them are the kind we can price automatically. Call us and we will price this list by hand - it is the sort of thing we do every week.`
              : "We read the document but could not find any repair requests in it. If the repair list is on another page, add that page and try again.",
        );
        trackEvent(RE10_EVENTS.analysisFailed, { reason });
        return;
      }

      goTo("review");
    } catch {
      setError("Something went wrong sending those files. Try again.");
      trackEvent(RE10_EVENTS.analysisFailed, { reason: "network" });
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    const included = repairs.filter((r) => r.included);
    if (included.length === 0) {
      setError("Keep at least one repair in the list to get a price.");
      goTo("review");
      return;
    }

    setBusy(true);
    setError(null);
    trackEvent(RE10_EVENTS.contactSubmitted, { preferred_contact: preferredContact, role });
    try {
      const res = await fetch("/api/re10/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repairs: included.map((r) => ({
            id: r.id,
            description: r.verbatim,
            kind: r.kind,
            location: r.location,
            quantity: r.quantity ?? null,
            sourceRef: r.sourceRef,
            needsReview: r.needsReview,
          })),
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          preferredContact,
          role,
          brokerage: brokerage.trim() || undefined,
          propertyAddress: address.trim(),
          closingDate: closingDate || undefined,
          repairDeadline: repairDeadline || undefined,
          occupancy,
          hasInspectionReport: fileMeta.length > 1,
          documents,
          // The items we could not categorise. They are excluded from the
          // range, which is exactly why they have to travel.
          unmapped: extraction?.unmapped ?? [],
          documentNotes: extraction?.documentNotes ?? [],
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // A bare "Invalid request" names nothing the reader can change. When
        // the response carries field errors, show those instead.
        const fe: Record<string, string[] | undefined> = data.errors?.fieldErrors ?? {};
        const detail = Object.values(fe)
          .flatMap((messages) => messages ?? [])
          .filter(Boolean);
        setError(
          detail.length > 0 ? detail.join(" ") : (data.message ?? "We could not build your price."),
        );
        trackEvent(RE10_EVENTS.analysisFailed, {
          reason: "estimate-rejected",
          fields: Object.keys(fe).join(",") || String(res.status),
        });
        return;
      }
      const estimate = data as EstimateResponse;
      setResult(estimate);
      setReturnTo(null);

      trackEvent(RE10_EVENTS.estimateGenerated, {
        value: estimate.price,
        currency: "USD",
        confidence: estimate.confidence,
        priced_items: estimate.priced,
        onsite_items: estimate.unpriced,
      });
      trackMetaEvent(
        "Lead",
        { content_name: "RE-10 repair estimate", value: estimate.price, currency: "USD" },
        { email: email.trim() || undefined, phone: phone.trim() || undefined },
      );
      if (estimate.emailed) trackEvent(RE10_EVENTS.estimateEmailed);

      goTo("result");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  // The gate's own impression. Without it, abandonment at the contact steps is
  // indistinguishable from abandonment at the review step before them. Fired
  // once, when the first contact step ("about") is reached.
  useEffect(() => {
    if (step === "about") trackEvent(RE10_EVENTS.contactViewed);
  }, [step]);

  /* ------------------------------------------------- step validation */
  function validate(current: Step): boolean {
    setFieldErrors({});
    if (current === "review") {
      if (repairs.filter((r) => r.included).length === 0) {
        setError("Keep at least one repair in the list to get a price.");
        return false;
      }
      return true;
    }
    if (current === "about") {
      if (name.trim().length < 2) {
        setFieldErrors({ name: "Please enter your full name so we know who to reply to." });
        requestAnimationFrame(() => nameRef.current?.focus());
        return false;
      }
      return true;
    }
    if (current === "reach") {
      if (preferredContact === "email") {
        if (!EMAIL_RE.test(email.trim())) {
          setFieldErrors({ email: "Enter a valid email, or switch your preferred method below." });
          requestAnimationFrame(() => emailRef.current?.focus());
          return false;
        }
      } else if (phone.replace(/\D/g, "").length < 10) {
        setFieldErrors({ phone: "Enter a 10-digit phone number, or switch to email above." });
        requestAnimationFrame(() => phoneRef.current?.focus());
        return false;
      }
      return true;
    }
    if (current === "property") {
      if (address.trim().length < 4) {
        setFieldErrors({ address: "Enter the property address the repairs are for." });
        requestAnimationFrame(() => addressRef.current?.focus());
        return false;
      }
      return true;
    }
    return true;
  }

  function advance() {
    if (!validate(step)) return;
    setError(null);

    if (step === "upload") {
      analyze();
      return;
    }
    if (step === "review") {
      trackEvent(RE10_EVENTS.repairsConfirmed, {
        kept: repairs.filter((r) => r.included).length,
        removed: repairs.filter((r) => !r.included).length,
      });
      // Editing the scope from the results recalculates straight away.
      if (returnTo === "result") {
        submit();
        return;
      }
    }
    if (step === "summary") {
      submit();
      return;
    }
    // A single-section edit launched from Review returns to Review.
    if (returnTo === "summary") {
      setReturnTo(null);
      goTo("summary");
      return;
    }
    const idx = FLOW.indexOf(step);
    goTo(FLOW[Math.min(idx + 1, FLOW.length - 1)]);
  }

  function back() {
    if (returnTo === "summary") {
      setReturnTo(null);
      goTo("summary");
      return;
    }
    if (returnTo === "result" && result) {
      setReturnTo(null);
      goTo("result");
      return;
    }
    if (step === "review") {
      trackEvent(RE10_EVENTS.additionalDocuments, { from: "review" });
      goTo("upload");
      return;
    }
    const idx = FLOW.indexOf(step);
    goTo(FLOW[Math.max(idx - 1, 0)]);
  }

  function editFromSummary(target: Step) {
    setReturnTo("summary");
    goTo(target);
  }

  function editScopeFromResult() {
    setReturnTo("result");
    goTo("review");
  }

  function startOver() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setFiles([]);
    setFileMeta([]);
    setExtraction(null);
    setAttachedOnly([]);
    setDocuments([]);
    setRepairs([]);
    setResult(null);
    setReturnTo(null);
    setError(null);
    setFieldErrors({});
    goTo("upload");
  }

  const includedCount = repairs.filter((r) => r.included).length;
  const displayFiles: FileMeta[] =
    files.length > 0 ? files.map((f) => ({ name: f.name, size: f.size, type: f.type })) : fileMeta;

  /* ---------------------------------------------- result helpers */
  function copySummary() {
    if (!result) return;
    const lines: string[] = [
      `RE-10 repair estimate - ${result.propertyAddress}`,
      `Estimated price: ${usd(result.price)} (held ${result.validDays} days)`,
      "",
      "What this covers:",
      ...result.categories.flatMap((c) => [
        `- ${c.label}:`,
        ...c.items.map((i) => `    - ${i.description}`),
      ]),
    ];
    if (result.needsOnsite.length > 0) {
      lines.push("", "Needs an onsite evaluation:", ...result.needsOnsite.map((n) => `- ${n.description}`));
    }
    navigator.clipboard?.writeText(lines.join("\n")).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => setError("Could not copy to the clipboard on this device."),
    );
  }

  const currentIndex = FLOW.indexOf(step);

  return (
    <Section id="re10-estimator" variant="inverse" divider>
      {/* scroll-mt clears the sticky header so a step heading never lands
          behind the navigation. The regex-guarded scroll-mt must sit on the
          element carrying ref={topRef}. */}
      <div className="container px-4 max-w-3xl mx-auto scroll-mt-24" ref={topRef}>
        {step !== "result" && (
          <>
            <WizardProgress steps={STEP_META} currentIndex={currentIndex} tone="inverse" />
            <p className="mb-6 -mt-4 flex items-center gap-1.5 text-[11px] text-inverse-muted">
              <Check className="h-3 w-3 text-accent-legible" aria-hidden="true" /> Your answers save
              as you go
            </p>
          </>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-sm border border-red-400/40 bg-red-500/10 p-4 text-[13.5px] text-inverse-foreground leading-relaxed"
          >
            {error}
          </div>
        )}

        {/* ------------------------------------------------------- 1. upload */}
        {step === "upload" && (
          <WizardStep
            tone="inverse"
            eyebrow="Step 1 of 7 - Documents"
            heading="Upload your RE-10 and get an instant estimate"
            instructions="Send the RE-10, the relevant inspection report pages, and any photos. We read the repair list, show you what we found, and you correct it before anything is priced."
          >
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                dragDepth.current += 1;
                setIsDragging(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                e.preventDefault();
                dragDepth.current = Math.max(0, dragDepth.current - 1);
                if (dragDepth.current === 0) setIsDragging(false);
              }}
              onDrop={onDrop}
              data-testid="dropzone-re10-files"
              className={
                "rounded-sm border border-dashed p-7 sm:p-8 text-center transition-colors " +
                (isDragging
                  ? "border-accent-legible bg-accent-legible/10"
                  : "border-inverse-foreground/30 bg-inverse-foreground/[0.04]")
              }
            >
              <Upload className="h-6 w-6 mx-auto mb-3 text-inverse-muted" aria-hidden="true" />

              <span className="hidden [@media(pointer:fine)]:block text-[15px] text-inverse-foreground mb-1">
                {isDragging ? "Drop them here" : "Drag your files here"}
              </span>
              <span className="[@media(pointer:fine)]:hidden block text-[15px] text-inverse-foreground mb-1">
                Add your RE-10
              </span>

              <span className="block text-[12.5px] text-inverse-muted mb-5">
                {READABLE_FORMATS_LABEL}. Up to {MAX_UPLOAD_FILES} files,{" "}
                {Math.round(MAX_TOTAL_UPLOAD_BYTES / (1024 * 1024))} MB total. A phone photo of a
                printed form works.
              </span>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <Button
                  type="button"
                  variant="heroGhost"
                  className="w-full sm:w-auto min-h-12"
                  onClick={() => pickerRef.current?.click()}
                  data-testid="button-re10-choose-files"
                >
                  <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span className="hidden [@media(pointer:fine)]:inline">Browse files</span>
                  <span className="[@media(pointer:fine)]:hidden">Choose files or photos</span>
                </Button>
                {/* Coarse pointers only. On a laptop this opens the same dialog
                    as the button beside it. */}
                <Button
                  type="button"
                  variant="heroGhost"
                  className="w-full sm:w-auto min-h-12 [@media(pointer:fine)]:hidden"
                  onClick={() => cameraRef.current?.click()}
                  data-testid="button-re10-take-photo"
                >
                  <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
                  Take a photo
                </Button>
              </div>

              {/* THE PLAIN PICKER CARRIES NO `capture`. That attribute makes a
                  phone open the camera and nothing else, which is the wrong
                  default when the document is usually a PDF someone was emailed.
                  The camera is the second button, where it belongs. */}
              <input
                ref={pickerRef}
                id="re10-files"
                type="file"
                multiple
                accept={UPLOAD_ACCEPT}
                className="sr-only"
                data-testid="input-re10-files"
                onChange={(e) => {
                  addFiles(Array.from(e.target.files ?? []), "picker");
                  e.target.value = "";
                }}
              />
              <input
                ref={cameraRef}
                id="re10-camera"
                type="file"
                multiple
                accept="image/*"
                capture="environment"
                className="sr-only"
                data-testid="input-re10-camera"
                onChange={(e) => {
                  addFiles(Array.from(e.target.files ?? []), "camera");
                  e.target.value = "";
                }}
              />
            </div>

            {displayFiles.length > 0 && (
              <ul className="mt-4 space-y-2" data-testid="list-re10-files">
                {displayFiles.map((f) => {
                  const key = `${f.name}:${f.size}`;
                  const preview = previews[key];
                  const original = files.find((x) => fileKey(x) === key);
                  return (
                    <li
                      key={key}
                      className="flex items-center gap-3 rounded-sm border border-inverse-foreground/15 bg-inverse-foreground/[0.05] p-2.5"
                    >
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-sm bg-inverse-foreground/10">
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={preview} alt="" className="h-full w-full object-cover" />
                        ) : isImage(f.type, f.name) ? (
                          <ImageIcon className="h-4 w-4 text-inverse-muted" aria-hidden="true" />
                        ) : (
                          <FileText className="h-4 w-4 text-inverse-muted" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-[13.5px] text-inverse-foreground">
                          <Check className="h-3.5 w-3.5 flex-shrink-0 text-accent-legible" aria-hidden="true" />
                          <span className="truncate">{f.name}</span>
                        </span>
                        <span className="block text-[11.5px] text-inverse-muted">
                          {humanSize(f.size)}
                          {!original && files.length === 0 ? " - re-add to read" : ""}
                        </span>
                      </span>
                      {original && (
                        <button
                          type="button"
                          onClick={() => removeFile(original)}
                          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-sm text-inverse-muted transition-colors hover:text-inverse-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-legible"
                          aria-label={`Remove ${f.name}`}
                          data-testid="button-re10-remove-file"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <HelpNote tone="inverse" label="Not sure which pages to send?">
              Send the RE-10 (the inspection response form) itself. If your repair list lives in the
              inspection report, add the pages that list the requested repairs. Photos of problem
              areas help but are optional. You can add more later.
            </HelpNote>

            <p className="mt-5 text-[12px] text-inverse-muted leading-relaxed">
              No contact details needed yet. You will see the repairs we found first.
            </p>
          </WizardStep>
        )}

        {/* ------------------------------------------------------- 2. review */}
        {step === "review" && extraction && (
          <WizardStep
            tone="inverse"
            eyebrow="Step 2 of 7 - Repairs"
            heading="Here is what we read. Is it right?"
            instructions="Remove anything that should not be included, and add a measurement where we did not find one. The more you correct here, the more exact your price."
          >
            {!extraction.looksLikeRe10 && (
              <div className="mb-5 flex items-start gap-2.5 rounded-sm border border-inverse-foreground/20 bg-inverse-foreground/[0.06] p-4">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-accent-legible mt-0.5" aria-hidden="true" />
                <p className="text-[13.5px] text-inverse-foreground leading-relaxed">
                  This did not read like an RE-10 or inspection response. Check you sent the right
                  pages, or carry on and we will review it by hand.
                </p>
              </div>
            )}

            {attachedOnly.length > 0 && (
              <div
                className="mb-5 rounded-sm border border-inverse-foreground/20 bg-inverse-foreground/[0.06] p-4"
                data-testid="notice-re10-attached-only"
              >
                <p className="text-[13.5px] text-inverse-foreground leading-relaxed">
                  {attachedOnly.join(", ")} {attachedOnly.length === 1 ? "is" : "are"} attached for
                  our team but {attachedOnly.length === 1 ? "was" : "were"} not read automatically.
                  Mention anything in {attachedOnly.length === 1 ? "it" : "them"} in the notes, or we
                  will catch it when we review.
                </p>
              </div>
            )}

            <p className="mb-3 text-[12px] uppercase tracking-[0.08em] text-inverse-muted">
              {includedCount} of {repairs.length} repairs included
            </p>

            <ul className="space-y-3" data-testid="list-re10-repairs">
              {repairs.map((r) => (
                <li
                  key={r.id}
                  className={
                    "rounded-sm border p-4 transition-colors " +
                    (r.included
                      ? "border-inverse-foreground/15 bg-inverse-foreground/[0.05]"
                      : "border-inverse-foreground/10 bg-transparent opacity-50")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14.5px] text-inverse-foreground leading-relaxed">{r.verbatim}</p>
                      <p className="mt-1 text-[12.5px] text-inverse-muted">
                        {RECIPES[r.kind]?.label ?? r.kind}
                        {r.location ? ` \u00b7 ${r.location}` : ""}
                        {r.confidence !== "high" ? ` \u00b7 ${r.confidence} confidence` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setRepairs((prev) =>
                          prev.map((p) => (p.id === r.id ? { ...p, included: !p.included } : p)),
                        )
                      }
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-sm border border-inverse-foreground/25 text-inverse-muted transition-colors hover:text-inverse-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-legible"
                      aria-pressed={r.included}
                      aria-label={r.included ? `Remove ${r.verbatim}` : `Add back ${r.verbatim}`}
                    >
                      {r.included ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </div>

                  {r.needsReview && (
                    <p className="mt-2.5 flex items-start gap-2 text-[12.5px] text-inverse-foreground/75 leading-relaxed">
                      <AlertTriangle className="h-3.5 w-3.5 text-accent-legible flex-shrink-0 mt-0.5" aria-hidden="true" />
                      Needs an onsite look. We will list it separately rather than guess at a price.
                    </p>
                  )}

                  {r.included && (
                    <div className="mt-3 flex items-center gap-2">
                      <label
                        htmlFor={`qty-${r.id}`}
                        className="text-[12.5px] text-inverse-muted whitespace-nowrap"
                      >
                        {r.quantity == null ? "Add a measurement" : "Measurement"}
                      </label>
                      <input
                        id={`qty-${r.id}`}
                        type="text"
                        inputMode="decimal"
                        value={r.quantity ?? ""}
                        placeholder={String(RECIPES[r.kind]?.defaultQty ?? "")}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^\d.]/g, "");
                          const n = raw === "" ? null : Number(raw);
                          setRepairs((prev) =>
                            prev.map((p) =>
                              p.id === r.id
                                ? { ...p, quantity: n != null && Number.isFinite(n) ? n : null }
                                : p,
                            ),
                          );
                        }}
                        className="w-24 min-h-11 rounded-sm border border-inverse-foreground/25 bg-inverse-foreground/5 px-3 text-[16px] text-inverse-foreground placeholder:text-inverse-muted/60 focus:outline-none focus:ring-2 focus:ring-accent-legible"
                      />
                      <span className="text-[12.5px] text-inverse-muted">
                        {RECIPES[r.kind]?.unit === "SF"
                          ? "sq ft"
                          : RECIPES[r.kind]?.unit === "LF"
                            ? "linear ft"
                            : "count"}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {extraction.unmapped.length > 0 && (
              <div className="mt-6 rounded-sm border border-inverse-foreground/15 p-4">
                <p className="text-[13px] text-inverse-foreground mb-2">
                  We could not categorise these, so a person will look at them:
                </p>
                <ul className="space-y-1.5">
                  {extraction.unmapped.map((u) => (
                    <li key={u.verbatim} className="text-[12.5px] text-inverse-muted leading-relaxed">
                      {u.verbatim} <span className="text-inverse-muted/70">({u.reason})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </WizardStep>
        )}

        {/* If a refresh landed us on review with no extraction, recover. */}
        {step === "review" && !extraction && (
          <WizardStep
            tone="inverse"
            heading="Let's pick up where you left off"
            instructions="Your uploaded files were cleared when the page reloaded. Add them again and we will read the repair list."
          >
            <Button variant="brand" className="min-h-12" onClick={() => goTo("upload")}>
              Back to upload <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </WizardStep>
        )}

        {/* -------------------------------------------------------- 3. about */}
        {step === "about" && (
          <WizardStep
            tone="inverse"
            eyebrow="Step 3 of 7 - About you"
            heading="Who is this estimate for?"
            instructions="So we address the reply to the right person and understand the transaction."
          >
            <div className="space-y-5">
              <WizardField
                ref={nameRef}
                tone="inverse"
                label="Full name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={fieldErrors.name}
                autoComplete="name"
                data-testid="input-re10-name"
              />
              <div>
                <span className="mb-2 block text-[12.5px] text-inverse-muted">Your role</span>
                <div role="radiogroup" aria-label="Your role" className="grid grid-cols-2 gap-2.5">
                  {ROLES.map((r) => (
                    <SelectableCard
                      key={r.value}
                      tone="inverse"
                      control="radio"
                      selected={role === r.value}
                      onSelect={() => setRole(r.value)}
                      title={r.label}
                    />
                  ))}
                </div>
              </div>
              <WizardField
                tone="inverse"
                label="Brokerage or company (optional)"
                value={brokerage}
                onChange={(e) => setBrokerage(e.target.value)}
                autoComplete="organization"
              />
            </div>
          </WizardStep>
        )}

        {/* -------------------------------------------------------- 4. reach */}
        {step === "reach" && (
          <WizardStep
            tone="inverse"
            eyebrow="Step 4 of 7 - Contact"
            heading="How should we send it?"
            instructions="Enter your contact details to view your RE-10 repair estimate and receive a copy."
          >
            <div className="space-y-5">
              <WizardChoiceGroup
                tone="inverse"
                label="Preferred contact method"
                value={preferredContact}
                onChange={(v) => setPreferredContact(v)}
                options={[
                  { value: "email", label: "Email" },
                  { value: "phone", label: "Phone" },
                  { value: "text", label: "Text" },
                ]}
              />
              <WizardField
                ref={emailRef}
                tone="inverse"
                label="Email"
                type="email"
                required={preferredContact === "email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
                autoComplete="email"
                data-testid="input-re10-email"
              />
              <WizardField
                ref={phoneRef}
                tone="inverse"
                label="Phone"
                type="tel"
                required={preferredContact !== "email"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={fieldErrors.phone}
                autoComplete="tel"
                data-testid="input-re10-phone"
              />
            </div>
          </WizardStep>
        )}

        {/* ----------------------------------------------------- 5. property */}
        {step === "property" && (
          <WizardStep
            tone="inverse"
            eyebrow="Step 5 of 7 - Property"
            heading="Where are the repairs?"
            instructions="The property address and whether anyone is living there - it changes how we schedule access."
          >
            <div className="space-y-5">
              <WizardField
                ref={addressRef}
                tone="inverse"
                label="Property address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                error={fieldErrors.address}
                hint={extraction?.propertyAddress ? "Read from your document - edit if needed." : undefined}
                autoComplete="street-address"
                data-testid="input-re10-address"
              />
              <WizardChoiceGroup
                tone="inverse"
                label="Property is"
                value={occupancy}
                onChange={(v) => setOccupancy(v)}
                options={[
                  { value: "vacant", label: "Vacant" },
                  { value: "occupied", label: "Occupied" },
                  { value: "unknown", label: "Not sure" },
                ]}
              />
            </div>
          </WizardStep>
        )}

        {/* ----------------------------------------------------- 6. timeline */}
        {step === "timeline" && (
          <WizardStep
            tone="inverse"
            eyebrow="Step 6 of 7 - Timeline"
            heading="What are your dates?"
            instructions="Optional, but they let us tell you what fits before closing. Leave them blank if you are not sure yet."
          >
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <WizardField
                  tone="inverse"
                  label="Repair deadline"
                  type="date"
                  value={repairDeadline}
                  onChange={(e) => setRepairDeadline(e.target.value)}
                />
                <WizardField
                  tone="inverse"
                  label="Closing date"
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                />
              </div>
              <WizardTextArea
                tone="inverse"
                label="Anything else we should know (optional)"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <HelpNote tone="inverse" label="Why we ask for dates first">
                Inspection repairs sit inside a chain of dates - the response deadline, the
                re-inspection, the walkthrough, the closing. Knowing them lets us tell you honestly
                what can be finished in time rather than promising a date we have not checked.
              </HelpNote>
            </div>
          </WizardStep>
        )}

        {/* ------------------------------------------------------ 7. summary */}
        {step === "summary" && (
          <WizardStep
            tone="inverse"
            eyebrow="Step 7 of 7 - Review"
            heading="Check everything before we price it"
            instructions="Edit any section without losing the rest. When it looks right, get your price."
          >
            <div className="space-y-3">
              <ReviewSection
                tone="inverse"
                title="Repairs"
                onEdit={() => editFromSummary("review")}
                data-testid="review-repairs"
              >
                <ul className="space-y-1.5">
                  {repairs
                    .filter((r) => r.included)
                    .map((r) => (
                      <li key={r.id} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent-legible" aria-hidden="true" />
                        <span>
                          {RECIPES[r.kind]?.label ?? r.kind}
                          {r.location ? ` \u00b7 ${r.location}` : ""}
                        </span>
                      </li>
                    ))}
                  {includedCount === 0 && <li>No repairs selected yet.</li>}
                </ul>
              </ReviewSection>

              <ReviewSection tone="inverse" title="About you" onEdit={() => editFromSummary("about")}>
                {name || "(name not set)"}
                {brokerage ? ` \u00b7 ${brokerage}` : ""}
                <br />
                {ROLES.find((r) => r.value === role)?.label}
              </ReviewSection>

              <ReviewSection tone="inverse" title="Contact" onEdit={() => editFromSummary("reach")}>
                Preferred: {preferredContact}
                <br />
                {email && <>{email}</>}
                {email && phone && <br />}
                {phone && <>{phone}</>}
                {!email && !phone && "(no contact details yet)"}
              </ReviewSection>

              <ReviewSection tone="inverse" title="Property" onEdit={() => editFromSummary("property")}>
                {address || "(address not set)"}
                <br />
                {occupancy === "unknown" ? "Occupancy not sure" : `${occupancy}`}
              </ReviewSection>

              <ReviewSection tone="inverse" title="Timeline" onEdit={() => editFromSummary("timeline")}>
                {repairDeadline ? `Repairs due ${repairDeadline}` : "No repair deadline set"}
                <br />
                {closingDate ? `Closing ${closingDate}` : "No closing date set"}
                {notes && (
                  <>
                    <br />
                    <span className="text-inverse-muted">Note: {notes}</span>
                  </>
                )}
              </ReviewSection>

              {displayFiles.length > 0 && (
                <ReviewSection tone="inverse" title="Documents" onEdit={() => editFromSummary("upload")}>
                  <ul className="space-y-1">
                    {displayFiles.map((f) => (
                      <li key={`${f.name}:${f.size}`} className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 flex-shrink-0 text-inverse-muted" aria-hidden="true" />
                        <span className="truncate">{f.name}</span>
                      </li>
                    ))}
                  </ul>
                </ReviewSection>
              )}
            </div>
          </WizardStep>
        )}

        {/* -------------------------------------------------------- 8. result */}
        {step === "result" && result && (
          <div data-testid="re10-result">
            <ResultView
              result={result}
              documents={displayFiles}
              onEditScope={editScopeFromResult}
              onUploadMore={() => {
                trackEvent(RE10_EVENTS.additionalDocuments, { from: "result" });
                goTo("upload");
              }}
              onCopy={copySummary}
              copied={copied}
              onStartOver={startOver}
            />
          </div>
        )}

        {/* --------------------------------------------- sticky navigation */}
        {step !== "result" && (
          <WizardActionBar
            tone="inverse"
            ownsBottomEdge={false}
            onBack={step === "upload" ? undefined : back}
            backLabel={step === "review" ? "Add docs" : "Back"}
            onPrimary={advance}
            busy={busy}
            primaryLabel={
              step === "upload"
                ? "Review my repair list"
                : step === "review"
                  ? returnTo === "result"
                    ? "Update my price"
                    : "These look right"
                  : step === "summary"
                    ? "See my repair price"
                    : "Continue"
            }
            busyLabel={
              step === "upload" ? "Reading your documents..." : step === "summary" ? "Building your price..." : undefined
            }
            data-testid="button-re10-analyze"
          />
        )}
      </div>
    </Section>
  );
}

/* ============================================================ result view */

function ResultView({
  result,
  documents,
  onEditScope,
  onUploadMore,
  onCopy,
  copied,
  onStartOver,
}: {
  result: EstimateResponse;
  documents: FileMeta[];
  onEditScope: () => void;
  onUploadMore: () => void;
  onCopy: () => void;
  copied: boolean;
  onStartOver: () => void;
}) {
  const keyboardInsetRelease = useRef<(() => void) | null>(null);
  // The result screen owns the bottom edge with its own sticky actions, so it
  // hides the global Call/Text bar for as long as it is mounted.
  useEffect(() => {
    keyboardInsetRelease.current = requestHideMobileNavBar();
    return () => keyboardInsetRelease.current?.();
  }, []);

  return (
    <>
      {/* -------- estimate overview: the most important information first */}
      <p className="text-[12px] tracking-[0.14em] uppercase text-inverse-muted mb-2">
        Price for the repairs below
      </p>
      <div
        className="brc-display-num tabular-nums leading-none text-inverse-foreground text-[clamp(30px,7vw,48px)]"
        aria-live="polite"
      >
        {usd(result.price)}
      </div>
      <p className="mt-2 text-[13px] text-accent-legible">Held for {result.validDays} days</p>
      <p className="mt-3 text-[13px] text-inverse-muted">
        {result.propertyAddress}
        {result.repairDeadline ? ` \u00b7 repairs due ${result.repairDeadline}` : ""}
        {result.closingDate ? ` \u00b7 closing ${result.closingDate}` : ""}
      </p>

      {result.emailed && (
        <p className="mt-4 text-[13px] text-inverse-foreground/85">A copy is on its way to your inbox.</p>
      )}

      {/* Prominent, reassuring scope-editing CTA, right by the price. */}
      <div className="mt-6 flex flex-col gap-3 rounded-sm border border-accent-legible/40 bg-accent-legible/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-[14px] text-inverse-foreground">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-accent-legible" aria-hidden="true" />
          Not what you expected?
        </p>
        <Button
          variant="heroGhost"
          className="min-h-12 w-full sm:w-auto"
          onClick={onEditScope}
          data-testid="button-re10-edit-scope"
        >
          Edit Your Project Scope
        </Button>
      </div>

      <p className="mt-5 text-[12.5px] text-inverse-foreground/90 leading-relaxed">
        {RE10_PRICING_DISCLAIMER}
      </p>

      {/* -------- scope summary, itemised by trade in the document's order */}
      <div className="mt-8">
        <p className="text-[13px] tracking-[0.06em] uppercase text-inverse-foreground mb-3">
          What this covers
        </p>
        <ul className="space-y-3">
          {result.categories.map((c) => (
            <li key={c.trade} className="rounded-sm bg-inverse-foreground/[0.05] p-4">
              <p className="text-[14px] text-inverse-foreground mb-1.5">
                {c.label}{" "}
                <span className="text-inverse-muted">
                  ({c.itemCount} {c.itemCount === 1 ? "item" : "items"})
                </span>
              </p>
              <ul className="space-y-1">
                {c.items.map((i, n) => (
                  <li key={n} className="text-[12.5px] text-inverse-muted leading-relaxed">
                    {i.description}
                    {i.quantityAssumed && i.quantity ? ` (priced for ${i.quantity} ${i.unit ?? ""})` : ""}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      {/* -------- exclusions: what needs an onsite look, said plainly */}
      {result.needsOnsite.length > 0 && (
        <div className="mt-6 rounded-sm border border-inverse-foreground/20 p-4">
          <p className="text-[13px] tracking-[0.06em] uppercase text-inverse-foreground mb-3">
            Not included - needs an onsite evaluation
          </p>
          <ul className="space-y-2.5">
            {result.needsOnsite.map((n, i) => (
              <li key={i} className="text-[12.5px] text-inverse-muted leading-relaxed">
                <span className="text-inverse-foreground/90">{n.description}</span> - {n.why}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* -------- assumptions used to reach the price, in plain language */}
      {result.assumptions.length > 0 && (
        <div className="mt-6">
          <p className="text-[13px] tracking-[0.06em] uppercase text-inverse-foreground mb-2">
            What we assumed
          </p>
          <ul className="space-y-1.5">
            {result.assumptions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-inverse-muted leading-relaxed">
                <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent-legible" aria-hidden="true" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* -------- pricing notes / what would firm this up */}
      {result.uncertainty.length > 0 && (
        <div className="mt-6">
          <p className="text-[13px] tracking-[0.06em] uppercase text-inverse-foreground mb-2">
            What would firm this up
          </p>
          <ul className="space-y-1.5">
            {result.uncertainty.map((u, i) => (
              <li key={i} className="text-[12.5px] text-inverse-muted leading-relaxed">
                {u}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* -------- uploaded files, so the user can confirm we received them */}
      {documents.length > 0 && (
        <div className="mt-6">
          <p className="text-[13px] tracking-[0.06em] uppercase text-inverse-foreground mb-2">
            Documents you sent
          </p>
          <ul className="space-y-1.5">
            {documents.map((f) => (
              <li key={`${f.name}:${f.size}`} className="flex items-center gap-2 text-[12.5px] text-inverse-muted">
                <FileText className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{f.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* -------- save / share, kept off the sticky bar to avoid crowding */}
      <div className="mt-8 flex flex-wrap gap-2.5">
        <Button
          variant="brandInverseOutline"
          className="min-h-11"
          onClick={() => window.print()}
          data-testid="button-re10-print"
        >
          <Printer className="mr-2 h-4 w-4" aria-hidden="true" /> Print or save as PDF
        </Button>
        <Button variant="brandInverseOutline" className="min-h-11" onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" aria-hidden="true" /> {copied ? "Copied" : "Copy summary"}
        </Button>
        <Button variant="brandInverseOutline" className="min-h-11" onClick={onUploadMore}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Upload more documents
        </Button>
        <Button variant="brandInverseOutline" className="min-h-11" onClick={onStartOver}>
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" /> Start another estimate
        </Button>
      </div>

      {/* -------- sticky next-step actions: one primary, one scope edit */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-8 border-t border-inverse-foreground/15 bg-[hsl(var(--inverse))]/95 px-4 pb-safe pt-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 pb-3">
          <Button
            variant="heroGhost"
            className="min-h-12 flex-shrink-0"
            onClick={onEditScope}
          >
            <Sparkles className="mr-1.5 h-4 w-4" aria-hidden="true" /> Edit scope
          </Button>
          <Button variant="brand" className="min-h-12 flex-1" asChild>
            <a
              href="/contact#consult"
              onClick={() => trackEvent(RE10_EVENTS.onsiteRequested)}
              data-testid="link-re10-onsite"
            >
              Book a free site visit <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>

      {/* -------- print-only clean version (black on white, structured) */}
      <PrintableEstimate result={result} documents={documents} />
    </>
  );
}

function PrintableEstimate({ result, documents }: { result: EstimateResponse; documents: FileMeta[] }) {
  return (
    <div className="re10-print-only" aria-hidden="true">
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>RE-10 Repair Estimate</h1>
      <p style={{ margin: "0 0 2px" }}>{result.propertyAddress}</p>
      <p style={{ fontSize: 26, fontWeight: 700, margin: "8px 0 2px" }}>{usd(result.price)}</p>
      <p style={{ margin: 0, color: "#555" }}>
        Held for {result.validDays} days
        {result.repairDeadline ? ` \u00b7 repairs due ${result.repairDeadline}` : ""}
        {result.closingDate ? ` \u00b7 closing ${result.closingDate}` : ""}
      </p>
      <p style={{ marginTop: 12, fontSize: 12 }}>{RE10_PRICING_DISCLAIMER}</p>

      <h2 style={{ fontSize: 15, marginTop: 16 }}>What this covers</h2>
      {result.categories.map((c) => (
        <div key={c.trade} style={{ marginBottom: 8 }}>
          <p style={{ margin: "0 0 2px", fontWeight: 600 }}>
            {c.label} ({c.itemCount})
          </p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {c.items.map((i, n) => (
              <li key={n} style={{ fontSize: 12 }}>
                {i.description}
                {i.quantityAssumed && i.quantity ? ` (priced for ${i.quantity} ${i.unit ?? ""})` : ""}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {result.needsOnsite.length > 0 && (
        <>
          <h2 style={{ fontSize: 15, marginTop: 12 }}>Not included - needs an onsite evaluation</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {result.needsOnsite.map((n, i) => (
              <li key={i} style={{ fontSize: 12 }}>
                {n.description} - {n.why}
              </li>
            ))}
          </ul>
        </>
      )}

      {result.assumptions.length > 0 && (
        <>
          <h2 style={{ fontSize: 15, marginTop: 12 }}>What we assumed</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {result.assumptions.map((a, i) => (
              <li key={i} style={{ fontSize: 12 }}>
                {a}
              </li>
            ))}
          </ul>
        </>
      )}

      {documents.length > 0 && (
        <>
          <h2 style={{ fontSize: 15, marginTop: 12 }}>Documents received</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {documents.map((f) => (
              <li key={`${f.name}:${f.size}`} style={{ fontSize: 12 }}>
                {f.name}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
