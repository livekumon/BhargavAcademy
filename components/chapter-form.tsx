"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { MaterialKindFields } from "@/components/material-kind-fields";
import { PdfDropField } from "@/components/teacher/pdf-drop-field";
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
            <p className="text-sm font-medium">First PDF (optional)</p>
            <PdfDropField
              required={false}
              hint="PDF only, up to 20 MB. You can add more after the chapter is created."
            />
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
        <p role="alert" className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-fg">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
