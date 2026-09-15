"use client";

import { useId, useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { cn } from "cn";

const MAX_BYTES = 20 * 1024 * 1024;

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * A PDF picker you can also drop a file onto. It is still a real
 * `<input type="file" name="pdf">`, so forms and server actions work
 * unchanged, and it checks type and size before the upload starts.
 */
export function PdfDropField({
  name = "pdf",
  hint = "PDF only, up to 20 MB.",
  required = true,
}: {
  name?: string;
  hint?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function accept(next: File | null) {
    if (!next) {
      setFile(null);
      setError(null);
      return;
    }
    const isPdf = next.type === "application/pdf" || next.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("That file isn't a PDF.");
    } else if (next.size > MAX_BYTES) {
      setError(`That PDF is ${formatSize(next.size)}. The limit is 20 MB.`);
    } else {
      setError(null);
    }
    setFile(next);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = "";
    accept(null);
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
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
          "group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors duration-(--dur-fast) focus-within:ring-3 focus-within:ring-ring/50",
          dragging
            ? "border-brand bg-brand-subtle"
            : error
              ? "border-danger-line bg-danger-subtle/40"
              : file
                ? "border-success-line bg-success-subtle/40"
                : "border-line-strong bg-sunken/50 hover:border-brand-line hover:bg-brand-subtle/40",
        )}
      >
        {file ? (
          <FileText aria-hidden="true" className={cn("size-7", error ? "text-danger" : "text-success")} />
        ) : (
          <UploadCloud aria-hidden="true" className="size-7 text-content-subtle group-hover:text-brand" />
        )}
        {file ? (
          <span className="max-w-full">
            <span className="block truncate text-sm font-medium">{file.name}</span>
            <span className="block text-xs text-content-subtle">{formatSize(file.size)}</span>
          </span>
        ) : (
          <span className="text-sm">
            <span className="font-medium text-brand">Choose a PDF</span>
            <span className="text-content-muted"> or drag it here</span>
          </span>
        )}
        <span className="text-xs text-content-subtle">{hint}</span>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept="application/pdf,.pdf"
          required={required}
          aria-invalid={error ? true : undefined}
          className="sr-only"
          onChange={(event) => accept(event.target.files?.[0] ?? null)}
        />
      </label>
      {file ? (
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1 rounded text-xs font-medium text-content-muted hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <X aria-hidden="true" className="size-3.5" />
          Choose a different file
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
