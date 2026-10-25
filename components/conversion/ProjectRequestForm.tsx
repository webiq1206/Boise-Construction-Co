"use client";

import { useRef, useState } from "react";
import { readLeadAttribution } from "@/lib/leadAttributionBrowser";
import { getOrCreateInquiryTracking, readInquiryTracking, recordInquiryAcceptance } from "@/lib/inquiryTracking";
import { trackClaimedLeadConversion } from "@/lib/analytics";
import { PROJECT_FILE_LIMITS } from "@/lib/projectNoteFiles";

type StoredFile = { filename: string; url: string };

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,application/pdf,image/jpeg,image/png,image/webp,image/heic";

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

export function ProjectRequestForm() {
  const startedAt = useRef(Date.now());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...files];
    for (const file of Array.from(list)) {
      if (next.length >= PROJECT_FILE_LIMITS.maxFiles) break;
      if (file.size > PROJECT_FILE_LIMITS.maxBytes) {
        setError("Each file must be 10 MB or smaller.");
        setStatus("error");
        continue;
      }
      next.push(file);
    }
    const total = next.reduce((sum, file) => sum + file.size, 0);
    if (total > PROJECT_FILE_LIMITS.maxTotalBytes) {
      setError("Those files are too large together.");
      setStatus("error");
      return;
    }
    setFiles(next);
    if (status === "error") setStatus("idle");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const phoneDigits = digits(phone);
    if (trimmedName.length < 2) {
      setStatus("error");
      setError("Add your name.");
      return;
    }
    if (phoneDigits.length < 10) {
      setStatus("error");
      setError("Add a phone number we can call.");
      return;
    }
    if (Date.now() - startedAt.current < 2500) {
      setStatus("error");
      setError("Please wait a moment, then send again.");
      return;
    }

    setStatus("sending");
    setError("");
    try {
      let stored: StoredFile[] = [];
      if (files.length) {
        const body = new FormData();
        for (const file of files) body.append("files", file);
        const upload = await fetch("/api/consultation/files", { method: "POST", body });
        const uploadJson = (await upload.json().catch(() => ({}))) as { message?: string; files?: StoredFile[] };
        if (!upload.ok || !Array.isArray(uploadJson.files)) {
          throw new Error(uploadJson.message || "Those files did not upload. You can remove them and send the note.");
        }
        stored = uploadJson.files;
      }

      const existing = readInquiryTracking();
      const tracking = getOrCreateInquiryTracking();
      const message = ["Homepage project note.", note.trim()].filter(Boolean).join(" ");
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone,
          email: "",
          preferredContact: "phone",
          projectType: "other",
          message,
          projectFiles: stored,
          formStartedAt: startedAt.current,
          website,
          inquiryKey: tracking.inquiryKey,
          submissionKind: existing?.acceptedAt ? "followup" : "initial",
          attribution: readLeadAttribution(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        message?: string;
        accepted?: boolean;
        inquiryKey?: string;
        conversionId?: string;
        conversionEligible?: boolean;
      };
      if (!res.ok || json.accepted !== true || !json.inquiryKey || !json.conversionId) {
        throw new Error(json.message || "We could not send that. Call (208) 477-1169 and we will take it from here.");
      }
      const accepted = recordInquiryAcceptance({
        inquiryKey: json.inquiryKey,
        conversionId: json.conversionId,
      });
      void trackClaimedLeadConversion({
        inquiryKey: accepted.inquiryKey,
        claimKey: accepted.claimKey,
        conversionId: json.conversionId,
        ga4Params: { form: "project_note", project_type: "other", has_estimate: false },
        metaParams: { content_name: "project_note", content_category: "consultation_request" },
      });
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "We could not send that. Please call us.");
    }
  }

  if (status === "sent") {
    return (
      <div className="f-request" id="project-request" role="status" data-clarity-mask="True">
        <p className="f-request-kicker">Request received</p>
        <p className="f-request-title">We have your note.</p>
        <p>We will call {phone.trim()} to talk through the project.</p>
      </div>
    );
  }

  return (
    <form className="f-request" id="project-request" onSubmit={onSubmit} data-clarity-mask="True" noValidate>
      <div aria-hidden="true" className="f-request-trap">
        <label htmlFor="project-website">Website</label>
        <input id="project-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
      </div>
      <p className="f-request-kicker">Send a project note</p>
      <p className="f-request-title">Name and phone. We will call you.</p>
      <label className="f-request-field">
        <span>Name</span>
        <input name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} />
      </label>
      <label className="f-request-field">
        <span>Phone</span>
        <input name="phone" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
      </label>
      <label className="f-request-field">
        <span>Note, optional</span>
        <input name="note" value={note} maxLength={2000} placeholder="Lot, plan, or what you want to build" onChange={(event) => setNote(event.target.value)} />
      </label>
      <div className="f-request-field">
        <span id="project-files-label">Plans or photos, optional</span>
        <label className="f-request-file">
          <input
            type="file"
            accept={ACCEPT}
            multiple
            aria-labelledby="project-files-label"
            onChange={(event) => {
              addFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
          <span>Add a plan set or photos</span>
        </label>
        <p className="f-request-hint">A plan set helps us review a custom home. You can skip this.</p>
        {files.length > 0 && (
          <ul className="f-request-files">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`}>
                <span>{file.name}</span>
                <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== index))}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {status === "error" && <p className="f-request-error" role="alert">{error}</p>}
      <button className="f-request-submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending" : "Send my project"}
      </button>
    </form>
  );
}
