"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { Camera, FileText, Image as ImageIcon, Loader2, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LEAD_FILE_ACCEPT,
  MAX_LEAD_FILE_MB,
  MAX_LEAD_FILES,
  checkLeadFile,
  formatFileSize,
  leadFileProblem,
} from "@/shared/leadFiles";

/**
 * "Add photos, plans or files (optional)": one friendly tile instead of the
 * browser's raw file control. Tapping it opens the native picker (on phones:
 * camera, photo library or files); on desktop files can be dropped on it.
 * Chosen files show as chips with a preview or a PDF icon, their size and a
 * 44px remove button. A file that is too large or not a photo or PDF gets a
 * plain inline note and is simply not added; the form is never blocked.
 *
 * Files are uploaded only AFTER the request is accepted (see
 * uploadLeadFile), so an upload can never delay or lose the lead.
 */

export type LeadFileStatus = "ready" | "uploading" | "uploaded" | "failed";

export interface PendingLeadFile {
  key: string;
  file: File;
  previewUrl: string | null;
  status: LeadFileStatus;
  /** Server id once stored. */
  storedId?: string;
  error?: string;
}

let counter = 0;

const isPreviewable = (file: File) => /^image\/(jpeg|png|webp|gif)$/.test(file.type);

/** Local state for one tile: what is chosen, what was refused and why. */
export function useLeadFiles(limit: number = MAX_LEAD_FILES) {
  const [files, setFiles] = useState<PendingLeadFile[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(
    () => () => {
      for (const f of filesRef.current) if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    },
    [],
  );

  const add = useCallback(
    (list: FileList | File[]) => {
      const notes: string[] = [];
      const next = [...filesRef.current];
      for (const file of Array.from(list)) {
        if (next.length >= limit) {
          notes.push(leadFileProblem(file.name, "count"));
          continue;
        }
        const check = checkLeadFile(file);
        if (!check.ok) {
          notes.push(leadFileProblem(file.name, check.reason));
          continue;
        }
        if (next.some((f) => f.file.name === file.name && f.file.size === file.size)) continue;
        next.push({
          key: `file-${++counter}`,
          file,
          previewUrl: isPreviewable(file) ? URL.createObjectURL(file) : null,
          status: "ready",
        });
      }
      setFiles(next);
      setProblems(notes);
    },
    [limit],
  );

  const remove = useCallback((key: string) => {
    setFiles((current) => {
      const gone = current.find((f) => f.key === key);
      if (gone?.previewUrl) URL.revokeObjectURL(gone.previewUrl);
      return current.filter((f) => f.key !== key);
    });
    setProblems([]);
  }, []);

  const update = useCallback((key: string, patch: Partial<PendingLeadFile>) => {
    setFiles((current) => current.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }, []);

  const reset = useCallback(() => {
    setFiles([]);
    setProblems([]);
  }, []);

  return { files, problems, add, remove, update, reset, filesRef };
}

export type UploadResult = { ok: true; id: string } | { ok: false; message: string; retryable: boolean };

/** One file, one request, after the lead exists. */
export async function uploadLeadFile(
  file: File,
  auth: { inquiryKey: string; token: string },
): Promise<UploadResult> {
  const body = new FormData();
  body.append("inquiryKey", auth.inquiryKey);
  body.append("token", auth.token);
  body.append("website", "");
  body.append("file", file, file.name);
  try {
    const res = await fetch("/api/consultation/files", { method: "POST", body });
    const json = (await res.json().catch(() => ({}))) as { file?: { id?: string }; message?: string; reason?: string };
    if (res.ok && json.file?.id) return { ok: true, id: json.file.id };
    const retryable = res.status >= 500 || res.status === 429 || res.status === 0;
    return {
      ok: false,
      message: json.message && json.reason !== "invalid" ? json.message : "This file did not upload.",
      retryable,
    };
  } catch {
    return { ok: false, message: "This file did not upload. Check your connection.", retryable: true };
  }
}

type Tone = "inverse" | "default";

export function AttachmentTile({
  id,
  label = "Add photos, plans or files",
  files,
  problems,
  onAdd,
  onRemove,
  onRetry,
  tone,
  limit = MAX_LEAD_FILES,
  disabled,
}: {
  id: string;
  label?: string;
  files: PendingLeadFile[];
  problems: string[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (key: string) => void;
  onRetry?: (key: string) => void;
  tone: Tone;
  limit?: number;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const inverse = tone === "inverse";
  const muted = inverse ? "text-inverse-muted" : "text-muted-foreground";
  const text = inverse ? "text-inverse-foreground" : "text-foreground";
  const full = files.length >= limit;

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled && event.dataTransfer?.files?.length) onAdd(event.dataTransfer.files);
  };

  return (
    <div className="grid gap-2" data-testid="quote-attachments">
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex min-h-14 cursor-pointer items-center gap-3 rounded-sm border border-dashed px-3 py-2.5 transition-colors",
          "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2",
          inverse
            ? "border-inverse-foreground/45 hover:bg-inverse-foreground/[0.06] has-[:focus-visible]:ring-[#e3c08d] has-[:focus-visible]:ring-offset-[#2c302f]"
            : "border-foreground/40 hover:bg-foreground/[0.04] has-[:focus-visible]:ring-ring",
          dragging && (inverse ? "bg-inverse-foreground/10" : "bg-foreground/[0.06]"),
          (disabled || full) && "cursor-default opacity-70",
        )}
        data-testid="quote-attach-tile"
      >
        <Camera className={cn("h-5 w-5 flex-shrink-0", text)} aria-hidden="true" />
        <span className="grid gap-0.5">
          <span className={cn("text-[0.9375rem] font-medium leading-snug", text)}>
            {label} <span className={cn("text-[0.8125rem] font-normal", muted)}>(optional)</span>
          </span>
          <span id={`${id}-hint`} className={cn("text-[0.8125rem] leading-snug", muted)}>
            Photos, PDFs or drawings. Up to {limit} files, {MAX_LEAD_FILE_MB} MB each.
          </span>
        </span>
        <input
          ref={inputRef}
          id={id}
          type="file"
          multiple
          accept={LEAD_FILE_ACCEPT}
          disabled={disabled || full}
          aria-describedby={`${id}-hint`}
          className="sr-only"
          data-testid="input-files"
          onChange={(event) => {
            if (event.target.files?.length) onAdd(event.target.files);
            // Let the same file be chosen again after a remove.
            event.target.value = "";
          }}
        />
      </label>

      <p className={cn("text-[0.8125rem]", inverse ? "text-[#f4c3b4]" : "text-destructive")} aria-live="polite" data-testid="quote-file-problems">
        {problems.join(" ")}
      </p>

      {files.length > 0 && (
        <ul className="grid gap-2" aria-label="Attached files">
          {files.map((f) => (
            <li
              key={f.key}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-sm border py-1 pl-1.5 pr-1",
                inverse ? "border-inverse-foreground/20" : "border-border",
              )}
              data-testid="quote-file-chip"
              data-status={f.status}
            >
              {f.previewUrl ? (
                // Object URLs of the visitor's own photos: next/image cannot load them.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.previewUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-sm object-cover" />
              ) : (
                <span
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm",
                    inverse ? "bg-inverse-foreground/10" : "bg-muted",
                  )}
                  aria-hidden="true"
                >
                  {/pdf$/i.test(f.file.type) || /\.pdf$/i.test(f.file.name) ? (
                    <FileText className={cn("h-5 w-5", text)} />
                  ) : (
                    <ImageIcon className={cn("h-5 w-5", text)} />
                  )}
                </span>
              )}
              <span className="grid min-w-0 flex-1">
                <span className={cn("truncate text-[0.875rem]", text)} data-clarity-mask="True">
                  {f.file.name}
                </span>
                <span className={cn("text-[0.75rem]", f.status === "failed" ? (inverse ? "text-[#f4c3b4]" : "text-destructive") : muted)}>
                  {formatFileSize(f.file.size)}
                  {f.status === "uploading" && " · Uploading"}
                  {f.status === "uploaded" && " · Added"}
                  {f.status === "failed" && ` · ${f.error ?? "Did not upload"}`}
                </span>
              </span>
              {f.status === "uploading" ? (
                <span className="flex h-11 w-11 items-center justify-center" aria-label="Uploading">
                  <Loader2 className={cn("h-4 w-4 animate-spin", muted)} aria-hidden="true" />
                </span>
              ) : f.status === "failed" && onRetry ? (
                <button
                  type="button"
                  onClick={() => onRetry(f.key)}
                  className={cn("inline-flex h-11 items-center gap-1 px-2 text-[0.8125rem] font-medium underline underline-offset-4", text)}
                  data-testid="button-retry-file"
                >
                  <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Retry
                </button>
              ) : null}
              {f.status !== "uploaded" && f.status !== "uploading" && (
                <button
                  type="button"
                  onClick={() => onRemove(f.key)}
                  aria-label={`Remove ${f.file.name}`}
                  className={cn("flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-sm", muted)}
                  data-testid="button-remove-file"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
