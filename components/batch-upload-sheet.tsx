"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload } from "lucide-react";
import { MaterialKindFields } from "@/components/material-kind-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { StatusPill } from "@/components/ui/status-pill";
import {
  uploadBatchMaterial,
  type BatchUploadState,
} from "@/lib/actions/chapters";
import type { BatchUploadChapter } from "@/lib/queries";
import { libraryCoursePath } from "@/lib/paths";
import Link from "next/link";

export function BatchUploadSheet({
  batchId,
  batchName,
  courseId,
  courseTitle,
  chapters,
  trigger,
}: {
  batchId: string;
  batchName: string;
  courseId: string;
  courseTitle: string;
  chapters: BatchUploadChapter[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [counts, setCounts] = useState(() =>
    Object.fromEntries(chapters.map((chapter) => [chapter.id, chapter.pdfCount])),
  );

  useEffect(() => {
    setCounts(
      Object.fromEntries(chapters.map((chapter) => [chapter.id, chapter.pdfCount])),
    );
  }, [chapters]);

  const ordered = useMemo(() => {
    return [...chapters].sort((a, b) => {
      const aEmpty = (counts[a.id] ?? a.pdfCount) === 0;
      const bEmpty = (counts[b.id] ?? b.pdfCount) === 0;
      if (aEmpty !== bEmpty) return aEmpty ? -1 : 1;
      return 0;
    });
  }, [chapters, counts]);

  const selected = chapters.find((chapter) => chapter.id === chapterId) ?? null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setChapterId(null);
      }}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        title={`Upload to ${batchName}`}
        description={`Choose a chapter in ${courseTitle}, then upload a PDF.`}
        className="w-[min(36rem,94vw)] overflow-y-auto"
      >
        <div className="pr-8">
          <p className="text-sm font-medium text-brand">{batchName}</p>
          <h2 className="font-heading mt-1 text-title-2 font-semibold">
            Upload material
          </h2>
          <p className="mt-1 text-sm text-content-muted">
            {courseTitle}. Assigned to everyone currently in this batch.
          </p>
        </div>

        {chapters.length === 0 ? (
          <p className="text-sm text-content-muted">
            This course has no chapters yet.{" "}
            <Link href={libraryCoursePath(courseId)} className="text-brand underline-offset-4 hover:underline">
              Add chapters in the library
            </Link>
            , then come back to upload.
          </p>
        ) : selected ? (
          <UploadChapterForm
            key={selected.id}
            batchId={batchId}
            chapter={selected}
            onBack={() => setChapterId(null)}
            onUploaded={() => {
              setCounts((current) => ({
                ...current,
                [selected.id]: (current[selected.id] ?? selected.pdfCount) + 1,
              }));
              setChapterId(null);
            }}
          />
        ) : (
          <ul className="space-y-2">
            {ordered.map((chapter) => {
              const pdfCount = counts[chapter.id] ?? chapter.pdfCount;
              return (
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => setChapterId(chapter.id)}
                    className="flex w-full items-start justify-between gap-3 rounded-xl bg-surface px-4 py-3 text-left ring-1 ring-line transition-colors hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span>
                      <span className="block font-medium">{chapter.title}</span>
                      {chapter.description ? (
                        <span className="mt-0.5 block text-sm text-content-muted">
                          {chapter.description}
                        </span>
                      ) : null}
                    </span>
                    <StatusPill tone={pdfCount === 0 ? "warning" : "success"}>
                      {pdfCount === 0
                        ? "Needs material"
                        : `${pdfCount} PDF${pdfCount === 1 ? "" : "s"}`}
                    </StatusPill>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
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
  onBack: () => void;
  onUploaded: () => void;
}) {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    uploadBatchMaterial.bind(null, batchId, chapter.id),
    {} as BatchUploadState,
  );

  useEffect(() => {
    if (!state.at || !state.ok) return;
    router.refresh();
    onUploaded();
  }, [state.at, state.ok, onUploaded, router]);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Button type="button" variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
          Back to chapters
        </Button>
        <h3 className="font-heading mt-2 text-lg font-semibold">{chapter.title}</h3>
        <p className="mt-1 text-sm text-content-muted">
          Upload a PDF for this chapter. Students already in the batch get it
          automatically.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pdf">PDF file</Label>
        <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
          <Input
            id="pdf"
            name="pdf"
            type="file"
            accept="application/pdf,.pdf"
            className="cursor-pointer"
            required
            onChange={(event) => {
              setFileName(event.target.files?.[0]?.name ?? null);
            }}
          />
          {fileName ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium">
              <FileText className="size-4" />
              {fileName}
            </p>
          ) : null}
        </div>
      </div>

      <MaterialKindFields />

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          <Upload data-icon="inline-start" />
          {pending ? "Uploading..." : "Upload"}
        </Button>
        <Button type="button" variant="outline" onClick={onBack}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
