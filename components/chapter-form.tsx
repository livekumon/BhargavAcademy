"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { MaterialKindFields } from "@/components/material-kind-fields";
import {
  StudentAssignmentFields,
  type StudentOption,
} from "@/components/student-assignment-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ChapterState } from "@/lib/actions/chapters";

export function ChapterForm({
  action,
  defaultValues,
  submitLabel,
  cancelHref,
  showPdf = true,
  students = [],
}: {
  action: (state: ChapterState, formData: FormData) => Promise<ChapterState>;
  defaultValues?: { title: string; description: string };
  submitLabel: string;
  cancelHref: string;
  showPdf?: boolean;
  students?: StudentOption[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    students.map((student) => student.id),
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Chapter title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={defaultValues?.title}
          placeholder="Chapter 1: Motion"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Summary</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description}
          placeholder="A short note about what this chapter covers."
          rows={4}
        />
      </div>

      {showPdf ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="pdf">First PDF (optional)</Label>
            <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
              <Input
                id="pdf"
                name="pdf"
                type="file"
                accept="application/pdf,.pdf"
                className="cursor-pointer"
                onChange={(event) => {
                  setFileName(event.target.files?.[0]?.name ?? null);
                }}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                You can add more PDFs to this chapter after it is created. PDF
                only, up to 20 MB.
              </p>
              {fileName ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium">
                  <FileText className="size-4" />
                  {fileName}
                </p>
              ) : null}
            </div>
          </div>

          <MaterialKindFields />

          <StudentAssignmentFields
            students={students}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
          />
        </>
      ) : null}

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
