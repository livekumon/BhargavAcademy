"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, LoaderCircle, Upload } from "lucide-react";
import { MaterialKindFields } from "@/components/material-kind-fields";
import { PdfDropField } from "@/components/teacher/pdf-drop-field";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { StatusPill } from "@/components/ui/status-pill";
import { uploadBatchMaterial, type BatchUploadState } from "@/lib/actions/chapters";
import { libraryCoursePath } from "@/lib/paths";
import type { BatchUploadChapter } from "@/lib/queries";

/**
 * The daily job in two taps: pick a chapter, drop a PDF. Chapters still
 * waiting for material float to the top. The PDF goes to everyone currently
 * in the batch; per-student assignment lives on the chapter page.
 */
export function BatchUploadSheet({
  batchId,
  batchName,
  courseId,
  courseTitle,
  chapters,
  trigger,
  defaultChapterId,
}: {
  batchId: string;
  batchName: string;
  courseId: string;
  courseTitle: string;
  chapters: BatchUploadChapter[];
  trigger: React.ReactNode;
  defaultChapterId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [chapterId, setChapterId] = useState<string | null>(defaultChapterId ?? null);

  const ordered = [...chapters].sort((a, b) => Number(a.pdfCount > 0) - Number(b.pdfCount > 0));
  const selected = chapters.find((chapter) => chapter.id === chapterId) ?? null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setChapterId(defaultChapterId ?? null);
      }}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        title={`Upload to ${batchName}`}
        description={`Choose a chapter in ${courseTitle}, then upload a PDF.`}
        className="w-[min(36rem,100vw)] overflow-y-auto"
      >
        <div data-role="teacher" className="flex flex-col gap-6">
          <div className="pr-8">
            <p className="text-sm font-medium text-brand">{batchName}</p>
            <h2 className="mt-1 text-title-2 font-semibold">Upload material</h2>
            <p className="mt-1 text-sm text-content-muted">
              {selected ? selected.title : `${courseTitle} · pick a chapter`}
            </p>
          </div>

          {chapters.length === 0 ? (
            <p className="text-sm text-content-muted">
              This course has no chapters yet.{" "}
              <Link href={libraryCoursePath(courseId)} className="font-medium text-brand hover:underline">
                Add chapters in the library
              </Link>
              , then come back to upload.
            </p>
          ) : selected ? (
            <UploadChapterForm
              key={selected.id}
              batchId={batchId}
              chapter={selected}
              onBack={defaultChapterId ? undefined : () => setChapterId(null)}
              onUploaded={() => setOpen(false)}
            />
          ) : (
            <ul className="space-y-2">
              {ordered.map((chapter) => (
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => setChapterId(chapter.id)}
                    className="group flex w-full items-center gap-3 rounded-xl bg-surface px-4 py-3 text-left ring-1 ring-line transition-colors duration-(--dur-fast) hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{chapter.title}</span>
                      {chapter.description ? (
                        <span className="mt-0.5 block truncate text-sm text-content-muted">
                          {chapter.description}
                        </span>
                      ) : null}
                    </span>
                    <StatusPill tone={chapter.pdfCount === 0 ? "warning" : "success"}>
                      {chapter.pdfCount === 0
                        ? "Needs material"
                        : `${chapter.pdfCount} PDF${chapter.pdfCount === 1 ? "" : "s"}`}
                    </StatusPill>
                    <ChevronRight
                      aria-hidden="true"
                      className="size-4 text-content-subtle transition-transform duration-(--dur-base) group-hover:translate-x-0.5"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function UploadChapterForm({
  batchId,
  chapter,
  onBack,
  onUploaded,
}: {
  batchId: string;
  chapter: BatchUploadChapter;
  onBack?: () => void;
  onUploaded: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    uploadBatchMaterial.bind(null, batchId, chapter.id),
    {} as BatchUploadState,
  );

  // A successful upload closes the sheet and refreshes the page behind it,
  // which also delivers the "uploaded" toast.
  useEffect(() => {
    if (!state.at || !state.ok) return;
    router.refresh();
    onUploaded();
  }, [state.at, state.ok, onUploaded, router]);

  return (
    <form action={formAction} className="space-y-6">
      {onBack ? (
        <Button type="button" variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          All chapters
        </Button>
      ) : null}

      <PdfDropField hint="PDF only, up to 20 MB. Everyone in the batch gets it." />
      <MaterialKindFields />

      {state.error ? (
        <p role="alert" className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-fg">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : (
            <Upload data-icon="inline-start" />
          )}
          {pending ? "Uploading…" : "Upload"}
        </Button>
        {onBack ? (
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
