"use client";

import { useActionState, useId, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { cn } from "cn";
import { submitAssignment, type ProgressState } from "@/lib/actions/progress";

const MAX_BYTES = 20 * 1024 * 1024;

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload a completed assignment. The drop zone is a real <label> for the file
 * input, so tapping or pressing Enter picks a file — dragging is a shortcut,
 * never the only way (WCAG 2.2 · 2.5.7). Type and size are checked before
 * anything is sent.
 */
export function SubmitAssignmentForm({
  materialId,
  completed,
  submissionName,
  submissionUrl,
  submittedLabel,
}: {
  materialId: string;
  completed: boolean;
  submissionName: string | null;
  submissionUrl?: string | null;
  submittedLabel?: string | null;
}) {
  const [state, formAction, pending] = useActionState<ProgressState, FormData>(
    submitAssignment.bind(null, materialId),
    {},
  );
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [replacing, setReplacing] = useState(false);

  function accept(next: File | null) {
    if (!next) {
      setFile(null);
      return;
    }
    const isPdf =
      next.type === "application/pdf" || next.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setProblem("That file isn't a PDF. Export or scan your work as a PDF and try again.");
      clear();
      return;
    }
    if (next.size > MAX_BYTES) {
      setProblem(`That PDF is ${formatSize(next.size)}. The limit is 20 MB — try a lower scan quality.`);
      clear();
      return;
    }
    setProblem(null);
    setFile(next);
  }

  function clear() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const showPicker = !completed || replacing;
  const error = problem ?? state.error;

  return (
    <form action={formAction} className="space-y-4">
      {completed ? (
        <div
          role="status"
          className="space-y-2 rounded-lg bg-success-subtle px-4 py-3 text-success-subtle-fg ring-1 ring-success-line"
        >
          <p className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
            Submitted
            {submittedLabel ? <span className="font-normal">on {submittedLabel}</span> : null}
          </p>
          {submissionName ? (
            <div className="flex items-center gap-2 pl-7">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{submissionName}</span>
              {submissionUrl ? (
                <a
                  href={submissionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium hover:bg-success/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  View
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {completed && !replacing ? (
        <button
          type="button"
          onClick={() => setReplacing(true)}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-lg px-4 text-sm font-medium ring-1 ring-line-strong transition-colors duration-(--dur-fast) hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Replace with a new file
        </button>
      ) : null}

      <div hidden={!showPicker} className="space-y-3">
        <input
          ref={inputRef}
          id={inputId}
          name="pdf"
          type="file"
          accept="application/pdf,.pdf"
          className="peer sr-only"
          onChange={(event) => accept(event.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center gap-3 rounded-lg bg-sunken px-3 py-2.5 ring-1 ring-line">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand"
            >
              <FileText className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{file.name}</span>
              <span className="block text-xs text-content-subtle tabular">{formatSize(file.size)}</span>
            </span>
            <button
              type="button"
              onClick={clear}
              disabled={pending}
              aria-label={`Remove ${file.name}`}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-content-subtle transition-colors duration-(--dur-fast) hover:bg-surface hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const dropped = event.dataTransfer.files?.[0];
              if (!dropped || !inputRef.current) return;
              const transfer = new DataTransfer();
              transfer.items.add(dropped);
              inputRef.current.files = transfer.files;
              accept(dropped);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors duration-(--dur-fast) peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
              dragging
                ? "border-brand bg-brand-subtle"
                : "border-line-strong bg-sunken/60 hover:border-brand hover:bg-brand-subtle/60"
            )}
          >
            <UploadCloud aria-hidden="true" className="size-6 text-brand" />
            <span className="text-sm font-medium">
              <span className="text-brand">Choose a PDF</span>
              <span className="hidden text-content-muted sm:inline"> or drag it here</span>
            </span>
            <span className="text-xs text-content-subtle">One PDF, up to 20 MB</span>
          </label>
        )}

        {error ? (
          <p role="alert" className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-fg">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2">
          {completed ? (
            <button
              type="button"
              onClick={() => {
                clear();
                setProblem(null);
                setReplacing(false);
              }}
              disabled={pending}
              className="inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-content-muted transition-colors duration-(--dur-fast) hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={pending || !file}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-brand-fg shadow-elevation-sm transition-[background-color,box-shadow,opacity] duration-(--dur-fast) hover:bg-brand-hover hover:shadow-elevation-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Uploading…
              </>
            ) : completed ? (
              "Replace submission"
            ) : (
              "Submit assignment"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
