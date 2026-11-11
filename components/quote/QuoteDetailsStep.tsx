"use client";

import { useState, type ReactNode } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { buildCleanAddress, extractZip } from "@/shared/addressValidation";
import { BEST_TIMES, PROJECT_CHOICES, TIMING_CHOICES } from "@/shared/quoteFormChoices";
import type { PropertyProfile } from "@/shared/propertyProfile";
import { AttachmentTile, useLeadFiles, type PendingLeadFile } from "@/components/quote/LeadAttachments";

/**
 * Step 2, on the success screen, below the confirmation: ONE quiet text toggle
 * (a native details with no box), "Add photos, plans or details (optional)".
 * It used to sit open under the confirmation as "Help us prepare", and a
 * client on a family site read it as the form asking for more before the
 * request counted (owner, 11 November). Leaving it closed is skipping, so
 * there is no Skip button. Every field is optional and native; nothing Step 1
 * already has is asked again. Saving posts to /api/consultation/details, which
 * merges into the SAME request and tells the team (email, lead dashboard, P5
 * intake).
 *
 * Analytics: `lead_details_added` once per save, with field names and a file
 * count only. No contact details, and never a second generate_lead.
 */

type Tone = "inverse" | "default";

export interface DetailsFields {
  projectType?: string;
  address?: string;
  zip?: string;
  propertyProfile?: PropertyProfile | null;
  timing?: string;
  bestTime?: string;
  email?: string;
}

export function QuoteDetailsStep({
  tone,
  uid,
  ask,
  filesRemaining,
  uploadFiles,
  saveDetails,
}: {
  tone: Tone;
  uid: string;
  /** Which questions are still open after Step 1. */
  ask: { projectType: boolean; address: boolean; bestTime: boolean; email: boolean };
  filesRemaining: number;
  /** Uploads the given files for this request; resolves with the stored ids. */
  uploadFiles: (files: PendingLeadFile[], update: (key: string, patch: Partial<PendingLeadFile>) => void) => Promise<string[]>;
  /** Posts the details (and any stored file ids) to the same request. */
  saveDetails: (fields: DetailsFields, fileIds: string[]) => Promise<{ ok: true } | { ok: false; message: string }>;
}) {
  const inverse = tone === "inverse";
  const label = cn("block text-[0.9375rem] font-medium leading-snug", inverse ? "text-inverse-foreground" : "text-foreground");
  const hint = cn("text-[0.8125rem] font-normal", inverse ? "text-inverse-muted" : "text-muted-foreground");
  const control = cn(
    "w-full rounded-sm border px-3 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    inverse
      ? "border-inverse-foreground/30 bg-[#fbfaf6] text-[#2c302f] focus-visible:ring-[#e3c08d] focus-visible:ring-offset-[#2c302f]"
      : "border-input bg-background text-foreground focus-visible:ring-ring focus-visible:ring-offset-background",
  );
  const pill = cn(
    "flex min-h-12 cursor-pointer items-center justify-center rounded-sm border px-2 text-center text-[0.9375rem] transition-colors",
    "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
    inverse
      ? "border-inverse-foreground/30 text-inverse-foreground peer-checked:border-[#fbfaf6] peer-checked:bg-[#fbfaf6] peer-checked:text-[#2c302f] peer-focus-visible:ring-[#e3c08d] peer-focus-visible:ring-offset-[#2c302f]"
      : "border-border text-foreground peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-ring",
  );
  const muted = inverse ? "text-inverse-muted" : "text-muted-foreground";
  const text = inverse ? "text-inverse-foreground" : "text-foreground";

  const [projectType, setProjectType] = useState("");
  const [address, setAddress] = useState("");
  const [profile, setProfile] = useState<PropertyProfile | null>(null);
  const [timing, setTiming] = useState("");
  const [bestTime, setBestTime] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [state, setState] = useState<"open" | "saving" | "saved">("open");
  const [error, setError] = useState("");
  const tile = useLeadFiles(filesRemaining);

  if (state === "saved") {
    return (
      <div className="w-full" data-testid="quote-details-step">
        <p className={cn("text-[0.9375rem] font-medium", text)} role="status" data-testid="quote-details-saved">
          Saved. Thank you.
        </p>
        {tile.files.some((f) => f.status === "failed") && (
          <p className={cn("mt-1 text-sm", muted)}>
            Some files did not upload. You can text them to us instead.
          </p>
        )}
      </div>
    );
  }

  const fieldIds = {
    address: `quote-details-address-${uid}`,
    best: `quote-details-best-${uid}`,
    email: `quote-details-email-${uid}`,
    files: `quote-details-files-${uid}`,
  };

  async function onSave() {
    setError("");
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please check the email address, or leave it blank.");
      document.getElementById(fieldIds.email)?.focus();
      return;
    }
    setEmailError("");
    setState("saving");
    const pending = tile.filesRef.current.filter((f) => f.status === "ready" || f.status === "failed");
    const fileIds = pending.length ? await uploadFiles(pending, tile.update) : [];
    const trimmedAddress = address.trim();
    const fields: DetailsFields = {
      projectType: projectType || undefined,
      address: trimmedAddress || undefined,
      zip: trimmedAddress ? profile?.zip?.slice(0, 5) || extractZip(trimmedAddress) || undefined : undefined,
      propertyProfile: trimmedAddress ? profile : null,
      timing: timing || undefined,
      bestTime: bestTime || undefined,
      email: email.trim() || undefined,
    };
    const sent = Object.entries(fields).filter(([key, value]) => value && key !== "propertyProfile" && key !== "zip").map(([key]) => key);
    if (!sent.length && !fileIds.length) {
      setError(
        pending.length
          ? "Those files did not upload. Retry, or text them to us."
          : "Add a detail or a file first. If you have nothing to add, you are already done.",
      );
      setState("open");
      return;
    }
    const result = await saveDetails(fields, fileIds);
    if (!result.ok) {
      setError(result.message);
      setState("open");
      return;
    }
    trackEvent("lead_details_added", {
      form: "consultation",
      fields: sent
        .map((key) => ({ projectType: "project_type", address: "address", timing: "timing", bestTime: "best_time", email: "email" })[key] ?? key)
        .sort()
        .join(","),
      file_count: fileIds.length,
    });
    setState("saved");
  }

  const saving = state === "saving";

  return (
    <section
      className="w-full"
      aria-labelledby={`quote-details-heading-${uid}`}
      data-testid="quote-details-step"
    >
      <details className="group" data-testid="quote-details-disclosure">
        <summary
          id={`quote-details-heading-${uid}`}
          className={cn(
            "inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-sm text-[0.875rem] focus-visible:outline-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden",
            inverse ? "text-inverse-muted hover:text-inverse-foreground focus-visible:ring-[#e3c08d]" : "text-muted-foreground hover:text-foreground focus-visible:ring-ring",
          )}
        >
          <Plus className="h-4 w-4 flex-none transition-transform group-open:rotate-45" aria-hidden="true" />
          Add photos, plans or details (optional)
        </summary>
      <form
        noValidate
        className="grid gap-4 pt-2"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave();
        }}
        data-clarity-mask="True"
      >
        {ask.projectType && (
          <Group legend="What are you planning?" className={label}>
            <div className="grid grid-cols-2 gap-2">
              {PROJECT_CHOICES.map((choice) => (
                <label key={choice.value} className="relative" data-testid={`consult-project-${choice.value}`}>
                  <input
                    type="radio"
                    name={`details-project-${uid}`}
                    value={choice.value}
                    checked={projectType === choice.value}
                    onChange={() => setProjectType(choice.value)}
                    className="peer sr-only"
                  />
                  <span className={cn(pill, "justify-start px-3 text-left text-[0.875rem] leading-tight")}>{choice.label}</span>
                </label>
              ))}
            </div>
          </Group>
        )}

        {ask.address && (
          <div className="grid gap-1.5">
            <label htmlFor={fieldIds.address} className={label}>
              Build site address or ZIP
            </label>
            <p id={`${fieldIds.address}-hint`} className={hint}>
              Street address, parcel number, or lot and subdivision.
            </p>
            <AddressAutocomplete
              id={fieldIds.address}
              value={address}
              onChange={setAddress}
              onProfileResolved={(resolved) => {
                setProfile(resolved);
                if (resolved) {
                  const clean = buildCleanAddress(resolved);
                  if (clean) setAddress(clean);
                }
              }}
              aria-label="Build site address or ZIP"
              aria-describedby={`${fieldIds.address}-hint`}
              variant={inverse ? "inverse" : "default"}
              data-testid="input-address"
            />
          </div>
        )}

        <Group legend="When would you like to start?" className={label}>
          <div className="grid grid-cols-2 gap-2">
            {TIMING_CHOICES.map((choice, index) => (
              <label key={choice} className="relative" data-testid={`details-timing-${index}`}>
                <input
                  type="radio"
                  name={`details-timing-${uid}`}
                  value={choice}
                  checked={timing === choice}
                  onChange={() => setTiming(choice)}
                  className="peer sr-only"
                />
                <span className={pill}>{choice}</span>
              </label>
            ))}
          </div>
        </Group>

        {ask.bestTime && (
          <div className="grid gap-1.5">
            <label htmlFor={fieldIds.best} className={label}>
              Best time to call
            </label>
            <select
              id={fieldIds.best}
              value={bestTime}
              onChange={(event) => setBestTime(event.target.value)}
              className={cn(control, "h-12 appearance-auto")}
              data-testid="select-details-best-time"
            >
              <option value="">Any time</option>
              {BEST_TIMES.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        )}

        {ask.email && (
          <div className="grid gap-1.5">
            <label htmlFor={fieldIds.email} className={label}>
              Email
            </label>
            <input
              id={fieldIds.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? `${fieldIds.email}-error` : undefined}
              className={cn(control, "h-12")}
              data-testid="input-details-email"
            />
            <p id={`${fieldIds.email}-error`} className={cn("text-[0.8125rem]", inverse ? "text-[#f4c3b4]" : "text-destructive")} aria-live="polite">
              {emailError}
            </p>
          </div>
        )}

        {filesRemaining > 0 && (
          <AttachmentTile
            id={fieldIds.files}
            label="Add photos, plans or files"
            files={tile.files}
            problems={tile.problems}
            onAdd={tile.add}
            onRemove={tile.remove}
            tone={tone}
            limit={filesRemaining}
            disabled={saving}
          />
        )}

        {error && (
          <p role="alert" className={cn("text-sm", inverse ? "text-[#f4c3b4]" : "text-destructive")} data-testid="quote-details-error">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="brand"
          disabled={saving}
          aria-busy={saving}
          className="min-h-12 justify-self-start px-6 text-base"
          data-testid="button-save-details"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Saving
            </>
          ) : (
            "Save details"
          )}
        </Button>
      </form>
      </details>
    </section>
  );
}

function Group({ legend, className, children }: { legend: string; className: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className={cn(className, "mb-1.5")}>{legend}</legend>
      {children}
    </fieldset>
  );
}
