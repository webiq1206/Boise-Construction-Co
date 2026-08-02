"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Check, X, AlertTriangle, ArrowRight, Loader2, Plus, Camera, FileText } from "lucide-react";
import { Section } from "@/components/marketing/Section";
import { Button } from "@/components/ui/button";
import { RECIPES, TRADE_LABELS, type RepairKind } from "@/shared/costs/re10Repairs";
import { RE10_PRICING_DISCLAIMER } from "@/shared/content/re10Content";
import type { ExtractedRepair, ExtractionResult } from "@/shared/re10/extraction";
import {
  classifyUpload,
  MAX_UPLOAD_FILES,
  MAX_TOTAL_UPLOAD_BYTES,
  UPLOAD_ACCEPT,
  READABLE_FORMATS_LABEL,
} from "@/shared/re10/uploads";
import { RE10_EVENTS } from "@/shared/re10/analyticsEvents";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";

/**
 * The RE-10 estimator wizard.
 *
 * FOUR STEPS, AND THE GATE SITS THIRD ON PURPOSE. Upload, review what we read,
 * contact details, range. The homeowner sees and corrects the extracted repair
 * list BEFORE giving us anything - so the contact form is the last step of
 * getting their estimate rather than the price of finding out we misread their
 * document. The brief asks for exactly this and it is also the only version
 * that is honest.
 *
 * Each step scrolls to the top of the wizard on entry. On a phone the steps are
 * taller than the viewport, and without it a homeowner lands halfway down the
 * next step with no idea the screen changed.
 */

type Step = "upload" | "review" | "contact" | "result";

interface EditableRepair extends ExtractedRepair {
  id: string;
  included: boolean;
}

interface EstimateResponse {
  range: { low: number; high: number };
  confidence: "high" | "medium" | "low";
  propertyAddress: string;
  closingDate: string | null;
  repairDeadline: string | null;
  categories: {
    trade: string;
    label: string;
    itemCount: number;
    items: { description: string; label: string; location: string | null; quantityAssumed: boolean }[];
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

const STEP_LABELS: Record<Step, string> = {
  upload: "Upload",
  review: "Confirm repairs",
  contact: "Your details",
  result: "Your range",
};
const STEP_ORDER: Step[] = ["upload", "review", "contact", "result"];

export function Re10Wizard() {
  const [step, setStep] = useState<Step>("upload");
  const topRef = useRef<HTMLDivElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  // Nested children fire dragleave as the pointer crosses them, so a boolean
  // set on the events alone flickers the whole box. Count enter/leave instead.
  const dragDepth = useRef(0);
  const pickerRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  /** Files we hold and forward, but cannot read - a Word addendum, a HEIC. */
  const [attachedOnly, setAttachedOnly] = useState<string[]>([]);
  const [documents, setDocuments] = useState<{ filename: string; url: string }[]>([]);
  const [repairs, setRepairs] = useState<EditableRepair[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredContact, setPreferredContact] = useState<"email" | "phone" | "text">("email");
  const [role, setRole] = useState<(typeof ROLES)[number]["value"]>("buyer-agent");
  const [brokerage, setBrokerage] = useState("");
  const [address, setAddress] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [repairDeadline, setRepairDeadline] = useState("");
  const [occupancy, setOccupancy] = useState<"occupied" | "vacant" | "unknown">("unknown");
  const [notes, setNotes] = useState("");

  const [result, setResult] = useState<EstimateResponse | null>(null);

  // Fires once on mount. The denominator for every other stage, so it must
  // not re-fire when React re-renders or when a step changes.
  useEffect(() => {
    trackEvent(RE10_EVENTS.started);
  }, []);

  /**
   * A file dropped anywhere except the box must not navigate away.
   *
   * The browser's default for a dropped PDF is to open it, which replaces the
   * page - losing the wizard, the uploads and the step. Someone who misses the
   * target by an inch should get nothing, not a lost session.
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

  const fileKey = (f: File) => `${f.name}:${f.size}`;

  /**
   * Add to the list rather than replace it.
   *
   * Someone drops the RE-10, then picks the inspection pages, then adds two
   * photos from their phone. Replacing on each interaction would silently throw
   * away the previous ones, and the only sign would be a short repair list.
   *
   * Everything turned away is named. A file that vanished without explanation
   * is worse than one refused out loud.
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
    setFiles((prev) => prev.filter((f) => fileKey(f) !== fileKey(target)));
    setError(null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer?.files ?? []), "drop");
  }

  function goTo(next: Step) {
    setStep(next);
    setError(null);
    // Land at the top of the wizard, not wherever the previous step ended.
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function analyze() {
    if (files.length === 0) {
      setError("Attach your RE-10, the inspection pages, or photos to get started.");
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
        // Tracked so a drop-off here reads as a failure rather than as the
        // homeowner losing interest.
        trackEvent(RE10_EVENTS.analysisFailed, { reason: String(data.error ?? res.status) });
        return;
      }
      const extracted = data as ExtractionResult;
      setExtraction(extracted);
      setDocuments(Array.isArray(data.stored) ? data.stored : []);
      setAttachedOnly(Array.isArray(data.attachedOnly) ? data.attachedOnly : []);
      // The RE-10 states the property and often the dates. Making someone
      // retype what they just uploaded is the kind of friction that reads as
      // the form not working. Prefill, and leave every field editable.
      if (extracted.propertyAddress) setAddress((a) => a || extracted.propertyAddress!);
      if (extracted.closingDate) setClosingDate((d) => d || extracted.closingDate!);
      if (extracted.repairDeadline) setRepairDeadline((d) => d || extracted.repairDeadline!);
      trackEvent(RE10_EVENTS.analysisCompleted, {
        repairs_found: extracted.repairs.length,
        unmapped: extracted.unmapped.length,
      });
      setRepairs(
        extracted.repairs.map((r, i) => ({ ...r, id: `r${i}`, included: true })),
      );

      // NOTHING TO REVIEW IS A DEAD END, NOT A STEP. Sending someone to the
      // review screen with an empty list puts them in front of one button that
      // refuses to work ("keep at least one repair"), with no way forward and
      // no idea what went wrong. Uploading an inspection AGREEMENT instead of
      // the RE-10 does exactly this, and it is an easy mistake - the two files
      // sit next to each other in the same transaction folder.
      // The estimate needs at least one priceable repair, so zero of them is a
      // dead end whatever the reason - including the case where we read plenty
      // of requests but none of them fit a category we price.
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
      setError("Keep at least one repair in the list to get a range.");
      return;
    }
    if (!name.trim() || !address.trim()) {
      setError("We need your name and the property address.");
      return;
    }
    if (preferredContact === "email" && !email.trim()) {
      setError("Add an email address, or change your preferred contact method.");
      return;
    }
    if (preferredContact !== "email" && !phone.trim()) {
      setError("Add a phone number, or change your preferred contact method.");
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
          hasInspectionReport: files.length > 1,
          documents,
          // The items we could not categorise. They are excluded from the
          // range, which is exactly why they have to travel: without them the
          // customer sees a number that looks like the whole job, and nobody
          // on our side ever learns the rest of the list exists.
          unmapped: extraction?.unmapped ?? [],
          documentNotes: extraction?.documentNotes ?? [],
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // A bare "Invalid request" is what the server says and it is useless to
        // the person reading it - it names nothing they can change. When the
        // response carries field errors, show those instead; they are written
        // for a human because the schema's messages are.
        const fieldErrors: Record<string, string[] | undefined> = data.errors?.fieldErrors ?? {};
        const detail = Object.values(fieldErrors)
          .flatMap((messages) => messages ?? [])
          .filter(Boolean);
        setError(
          detail.length > 0
            ? detail.join(" ")
            : (data.message ?? "We could not build your range."),
        );
        // Tracked, because a validation failure at the gate looks exactly like
        // someone changing their mind unless it is recorded as a failure.
        trackEvent(RE10_EVENTS.analysisFailed, {
          reason: "estimate-rejected",
          fields: Object.keys(fieldErrors).join(",") || String(res.status),
        });
        return;
      }
      const estimate = data as EstimateResponse;
      setResult(estimate);

      trackEvent(RE10_EVENTS.estimateGenerated, {
        value: Math.round((estimate.range.low + estimate.range.high) / 2),
        currency: "USD",
        confidence: estimate.confidence,
        priced_items: estimate.priced,
        onsite_items: estimate.unpriced,
      });
      // The conversion Meta optimizes against. Email and phone go server-side
      // only, hashed there, and are never handed to the browser Pixel.
      trackMetaEvent(
        "Lead",
        {
          content_name: "RE-10 repair estimate",
          value: Math.round((estimate.range.low + estimate.range.high) / 2),
          currency: "USD",
        },
        { email: email.trim() || undefined, phone: phone.trim() || undefined },
      );
      // Only when the server confirms it actually sent, so this stage is not
      // inflated by leads who chose phone contact and got no email at all.
      if (estimate.emailed) trackEvent(RE10_EVENTS.estimateEmailed);

      goTo("result");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  // The gate's own impression. Without it, abandonment at the contact step is
  // indistinguishable from abandonment at the review step before it.
  useEffect(() => {
    if (step === "contact") trackEvent(RE10_EVENTS.contactViewed);
  }, [step]);

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <Section id="re10-estimator" variant="inverse" divider>
      {/* scroll-mt clears the sticky header. Without it every step change
          scrolls this element to y=0, which is UNDER the 61px header - so the
          step's own heading, and the range on the final step, land behind the
          navigation. Found on the live site: the words "estimated repair
          range" were half hidden at the moment they mattered most. */}
      <div className="container px-4 max-w-3xl mx-auto scroll-mt-24" ref={topRef}>
        {/* Progress. Named steps, not just dots: on a phone a bare dot row does
            not tell you what is left to do. */}
        <ol className="flex flex-wrap gap-x-2 gap-y-1 mb-8" aria-label="Progress">
          {STEP_ORDER.map((s, i) => (
            <li
              key={s}
              className={
                "text-[12px] tracking-[0.08em] uppercase " +
                (i === stepIndex
                  ? "text-inverse-foreground"
                  : i < stepIndex
                    ? "text-accent-legible"
                    : "text-inverse-muted/60")
              }
            >
              {i > 0 && <span className="mr-2 text-inverse-muted/40">/</span>}
              {i < stepIndex && <Check className="inline h-3 w-3 mr-1" aria-hidden="true" />}
              {STEP_LABELS[s]}
            </li>
          ))}
        </ol>

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
          <div>
            <h2 className="font-sans font-light text-2xl md:text-3xl tracking-tight text-inverse-foreground mb-3">
              Upload your RE-10 and get an instant estimate
            </h2>
            <p className="text-sm md:text-base text-inverse-foreground/80 leading-relaxed mb-7">
              Send the RE-10, the relevant inspection report pages, and any photos. We read the
              repair list, show you what we found, and you correct it before anything is priced.
            </p>

            {/* The drop target. Buttons rather than a wrapping label, because a
                label around the whole box makes every click inside it - including
                a file's remove button - reopen the file dialog. */}
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

              {/* Shown only where dragging is possible. A phone has no drag and
                  drop, and telling someone to drag with their thumb is noise. */}
              <span className="hidden [@media(pointer:fine)]:block text-[15px] text-inverse-foreground mb-1">
                {isDragging ? "Drop them here" : "Drag your files here"}
              </span>
              <span className="[@media(pointer:fine)]:hidden block text-[15px] text-inverse-foreground mb-1">
                Add your RE-10
              </span>

              <span className="block text-[12.5px] text-inverse-muted mb-5">
                PDFs, photos or scans. A phone photo of a printed form works.
              </span>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <Button
                  type="button"
                  variant="heroGhost"
                  className="w-full sm:w-auto"
                  onClick={() => pickerRef.current?.click()}
                  data-testid="button-re10-choose-files"
                >
                  <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span className="hidden [@media(pointer:fine)]:inline">Browse files</span>
                  <span className="[@media(pointer:fine)]:hidden">Choose files or photos</span>
                </Button>
                {/* Coarse pointers only. On a laptop this opens the same dialog
                    as the button beside it, which is just a duplicate. */}
                <Button
                  type="button"
                  variant="heroGhost"
                  className="w-full sm:w-auto [@media(pointer:fine)]:hidden"
                  onClick={() => cameraRef.current?.click()}
                  data-testid="button-re10-take-photo"
                >
                  <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
                  Take a photo
                </Button>
              </div>

              {/* THE PLAIN PICKER CARRIES NO `capture`. That attribute makes a
                  phone open the camera and nothing else - no photo library, no
                  Files, no iCloud, no Drive - which is the wrong default when
                  the document being uploaded is usually a PDF someone was
                  emailed. The camera is the second button, where it belongs. */}
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
                  // Cleared so re-picking the same file fires change again.
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

            {files.length > 0 && (
              <ul className="mt-4 space-y-1.5" data-testid="list-re10-files">
                {files.map((f) => (
                  <li
                    key={fileKey(f)}
                    className="flex items-center gap-2 text-[13px] text-inverse-muted"
                  >
                    <Check className="h-3.5 w-3.5 text-accent-legible flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(f)}
                      className="ml-auto flex-shrink-0 p-1 -m-1 text-inverse-muted hover:text-inverse-foreground transition-colors"
                      aria-label={`Remove ${f.name}`}
                      data-testid="button-re10-remove-file"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Button
              variant="brand"
              className="mt-7 w-full sm:w-auto"
              disabled={busy}
              onClick={analyze}
              data-testid="button-re10-analyze"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reading your documents...
                </>
              ) : (
                <>
                  Review my repair list <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <p className="mt-4 text-[12px] text-inverse-muted leading-relaxed">
              No contact details needed yet. You will see the repairs we found first.
            </p>
          </div>
        )}

        {/* ------------------------------------------------------- 2. review */}
        {step === "review" && extraction && (
          <div>
            <h2 className="font-sans font-light text-2xl md:text-3xl tracking-tight text-inverse-foreground mb-3">
              Here is what we read. Is it right?
            </h2>
            <p className="text-sm text-inverse-foreground/80 leading-relaxed mb-7">
              Remove anything that should not be included, and add a measurement where we did not
              find one. The more you correct here, the narrower your range.
            </p>

            {!extraction.looksLikeRe10 && (
              <div className="mb-6 rounded-sm border border-inverse-foreground/20 bg-inverse-foreground/[0.06] p-4">
                <p className="text-[13.5px] text-inverse-foreground leading-relaxed">
                  This did not read like an RE-10 or inspection response. Check you sent the right
                  pages, or carry on and we will review it by hand.
                </p>
              </div>
            )}

            {/* Said out loud, because a file that was filed but not read would
                otherwise look identical to one that was read and found empty. */}
            {attachedOnly.length > 0 && (
              <div
                className="mb-6 rounded-sm border border-inverse-foreground/20 bg-inverse-foreground/[0.06] p-4"
                data-testid="notice-re10-attached-only"
              >
                <p className="text-[13.5px] text-inverse-foreground leading-relaxed">
                  {attachedOnly.join(", ")} {attachedOnly.length === 1 ? "is" : "are"} attached for
                  our team but {attachedOnly.length === 1 ? "was" : "were"} not read automatically.
                  Anything in {attachedOnly.length === 1 ? "it" : "them"} is not in the list below.
                  Mention it in the notes on the next step, or we will catch it when we review.
                </p>
              </div>
            )}

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
                        {r.location ? ` · ${r.location}` : ""}
                        {r.confidence !== "high" ? ` · ${r.confidence} confidence` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setRepairs((prev) =>
                          prev.map((p) => (p.id === r.id ? { ...p, included: !p.included } : p)),
                        )
                      }
                      className="flex-shrink-0 rounded-sm border border-inverse-foreground/25 p-2 text-inverse-muted hover:text-inverse-foreground transition-colors"
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
                              p.id === r.id ? { ...p, quantity: n != null && Number.isFinite(n) ? n : null } : p,
                            ),
                          );
                        }}
                        /* 16px so iOS does not zoom the page on focus. */
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

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Button
                variant="brand"
                onClick={() => {
                  trackEvent(RE10_EVENTS.repairsConfirmed, {
                    kept: repairs.filter((r) => r.included).length,
                    removed: repairs.filter((r) => !r.included).length,
                  });
                  goTo("contact");
                }}
                data-testid="button-re10-confirm"
              >
                These look right <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="brandInverseOutline"
                onClick={() => {
                  trackEvent(RE10_EVENTS.additionalDocuments, { from: "review" });
                  goTo("upload");
                }}
              >
                Add more documents
              </Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------ 3. contact */}
        {step === "contact" && (
          <div>
            <h2 className="font-sans font-light text-2xl md:text-3xl tracking-tight text-inverse-foreground mb-3">
              Where should we send it?
            </h2>
            <p className="text-sm text-inverse-foreground/80 leading-relaxed mb-7">
              Enter your contact information to view your RE-10 repair estimate and receive a copy
              by email.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" required value={name} onChange={setName} testId="input-re10-name" />
              <div>
                <label htmlFor="re10-role" className="block text-[12.5px] text-inverse-muted mb-1.5">
                  Your role
                </label>
                <select
                  id="re10-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                  className="w-full min-h-11 rounded-sm border border-inverse-foreground/25 bg-inverse-foreground/5 px-3 text-[16px] text-inverse-foreground focus:outline-none focus:ring-2 focus:ring-accent-legible"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value} className="bg-neutral-900">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[12.5px] text-inverse-muted mb-1.5">
                  Preferred contact method
                </label>
                <div className="flex gap-2">
                  {(["email", "phone", "text"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPreferredContact(m)}
                      aria-pressed={preferredContact === m}
                      className={
                        "min-h-11 flex-1 rounded-sm border px-3 text-[14px] capitalize transition-colors " +
                        (preferredContact === m
                          ? "border-accent-legible bg-inverse-foreground/10 text-inverse-foreground"
                          : "border-inverse-foreground/25 text-inverse-muted hover:text-inverse-foreground")
                      }
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional requirement, matching the brief: we ask for what the
                  chosen contact method actually needs and nothing else. */}
              <Field
                label="Email"
                required={preferredContact === "email"}
                type="email"
                value={email}
                onChange={setEmail}
                testId="input-re10-email"
              />
              <Field
                label="Phone"
                required={preferredContact !== "email"}
                type="tel"
                value={phone}
                onChange={setPhone}
                testId="input-re10-phone"
              />

              <Field label="Brokerage or company" value={brokerage} onChange={setBrokerage} />
              <Field label="Property address" required value={address} onChange={setAddress} testId="input-re10-address" />
              <Field label="Repair deadline" type="date" value={repairDeadline} onChange={setRepairDeadline} />
              <Field label="Closing date" type="date" value={closingDate} onChange={setClosingDate} />

              <div className="sm:col-span-2">
                <label className="block text-[12.5px] text-inverse-muted mb-1.5">Property is</label>
                <div className="flex gap-2">
                  {(["vacant", "occupied", "unknown"] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOccupancy(o)}
                      aria-pressed={occupancy === o}
                      className={
                        "min-h-11 flex-1 rounded-sm border px-3 text-[14px] capitalize transition-colors " +
                        (occupancy === o
                          ? "border-accent-legible bg-inverse-foreground/10 text-inverse-foreground"
                          : "border-inverse-foreground/25 text-inverse-muted hover:text-inverse-foreground")
                      }
                    >
                      {o === "unknown" ? "Not sure" : o}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="re10-notes" className="block text-[12.5px] text-inverse-muted mb-1.5">
                  Anything else we should know
                </label>
                <textarea
                  id="re10-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-sm border border-inverse-foreground/25 bg-inverse-foreground/5 px-3 py-2.5 text-[16px] text-inverse-foreground focus:outline-none focus:ring-2 focus:ring-accent-legible"
                />
              </div>
            </div>

            <Button
              variant="brand"
              className="mt-7 w-full sm:w-auto"
              disabled={busy}
              onClick={submit}
              data-testid="button-re10-submit"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Building your range...
                </>
              ) : (
                <>
                  See my estimated repair range <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* ------------------------------------------------------- 4. result */}
        {step === "result" && result && (
          <div data-testid="re10-result">
            <p className="text-[12px] tracking-[0.14em] uppercase text-inverse-muted mb-2">
              Estimated repair range
            </p>
            <div className="brc-display-num tabular-nums leading-none text-inverse-foreground text-[clamp(30px,7vw,48px)]">
              {usd(result.range.low)}
              <span className="text-inverse-muted/90 mx-2 text-xl">to</span>
              {usd(result.range.high)}
            </div>
            <p className="mt-3 text-[13px] text-inverse-muted">
              {result.propertyAddress}
              {result.repairDeadline ? ` · repairs due ${result.repairDeadline}` : ""}
              {result.closingDate ? ` · closing ${result.closingDate}` : ""}
            </p>

            {/* Claimed only when the server confirms it sent. Telling an agent
                we emailed a copy that never arrived is worse than saying nothing. */}
            {result.emailed && (
              <p className="mt-4 text-[13px] text-inverse-foreground/85">
                A copy is on its way to your inbox.
              </p>
            )}

            <p className="mt-5 text-[12.5px] text-inverse-foreground/90 leading-relaxed">
              {RE10_PRICING_DISCLAIMER}
            </p>

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
                          {i.quantityAssumed ? " (typical size assumed)" : ""}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>

            {result.needsOnsite.length > 0 && (
              <div className="mt-6 rounded-sm border border-inverse-foreground/20 p-4">
                <p className="text-[13px] tracking-[0.06em] uppercase text-inverse-foreground mb-3">
                  Needs an onsite evaluation
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

            {result.uncertainty.length > 0 && (
              <div className="mt-6">
                <p className="text-[13px] tracking-[0.06em] uppercase text-inverse-foreground mb-2">
                  What would narrow this range
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

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button variant="brand" asChild>
                <a
                  href="/contact#consult"
                  onClick={() => trackEvent(RE10_EVENTS.onsiteRequested)}
                  data-testid="link-re10-onsite"
                >
                  Request an onsite evaluation <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="brandInverseOutline"
                onClick={() => {
                  trackEvent(RE10_EVENTS.additionalDocuments, { from: "result" });
                  goTo("upload");
                }}
              >
                Upload more documents
              </Button>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  testId?: string;
}) {
  const id = `re10-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="block text-[12.5px] text-inverse-muted mb-1.5">
        {label}
        {required && <span className="text-accent-legible"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        /* 16px throughout: iOS Safari zooms the page on focus below that and
           does not zoom back out. */
        className="w-full min-h-11 rounded-sm border border-inverse-foreground/25 bg-inverse-foreground/5 px-3 text-[16px] text-inverse-foreground focus:outline-none focus:ring-2 focus:ring-accent-legible"
      />
    </div>
  );
}
