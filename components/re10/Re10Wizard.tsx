"use client";

import { useRef, useState } from "react";
import { Upload, Check, X, AlertTriangle, ArrowRight, Loader2, Plus } from "lucide-react";
import { Section } from "@/components/marketing/Section";
import { Button } from "@/components/ui/button";
import { RECIPES, TRADE_LABELS, type RepairKind } from "@/shared/costs/re10Repairs";
import { RE10_PRICING_DISCLAIMER } from "@/shared/content/re10Content";
import type { ExtractedRepair, ExtractionResult } from "@/shared/re10/extraction";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
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
        return;
      }
      const extracted = data as ExtractionResult;
      setExtraction(extracted);
      setRepairs(
        extracted.repairs.map((r, i) => ({ ...r, id: `r${i}`, included: true })),
      );
      goTo("review");
    } catch {
      setError("Something went wrong sending those files. Try again.");
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
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "We could not build your range.");
        return;
      }
      setResult(data as EstimateResponse);
      goTo("result");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <Section id="re10-estimator" variant="inverse" divider>
      <div className="container px-4 max-w-3xl mx-auto" ref={topRef}>
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

            <label
              htmlFor="re10-files"
              className="block rounded-sm border border-dashed border-inverse-foreground/30 bg-inverse-foreground/[0.04] p-8 text-center cursor-pointer hover:border-inverse-foreground/50 transition-colors"
            >
              <Upload className="h-6 w-6 mx-auto mb-3 text-inverse-muted" aria-hidden="true" />
              <span className="block text-[15px] text-inverse-foreground mb-1">
                Choose files, or take a photo
              </span>
              <span className="block text-[12.5px] text-inverse-muted">
                PDFs and photos. A phone photo of a printed form works.
              </span>
              <input
                id="re10-files"
                type="file"
                multiple
                accept="application/pdf,image/*"
                capture="environment"
                className="sr-only"
                data-testid="input-re10-files"
                onChange={(e) => {
                  setFiles(Array.from(e.target.files ?? []));
                  setError(null);
                }}
              />
            </label>

            {files.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {files.map((f) => (
                  <li key={f.name} className="flex items-center gap-2 text-[13px] text-inverse-muted">
                    <Check className="h-3.5 w-3.5 text-accent-legible flex-shrink-0" aria-hidden="true" />
                    {f.name}
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
              <Button variant="brand" onClick={() => goTo("contact")} data-testid="button-re10-confirm">
                These look right <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="brandInverseOutline" onClick={() => goTo("upload")}>
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
                <a href="/contact#consult">
                  Request an onsite evaluation <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="brandInverseOutline" onClick={() => goTo("upload")}>
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
