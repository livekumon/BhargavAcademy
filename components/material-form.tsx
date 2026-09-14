"use client";

import { useActionState, useState } from "react";
import { MaterialKindFields } from "@/components/material-kind-fields";
import { PdfDropField } from "@/components/teacher/pdf-drop-field";
import {
  StudentAssignmentFields,
  type StudentOption,
} from "@/components/student-assignment-fields";
import { Button } from "@/components/ui/button";
import { type ChapterState } from "@/lib/actions/chapters";
import { type MaterialKind } from "@/lib/materials";

export function MaterialForm({
  action,
  students,
  assignedStudentIds,
  submitLabel,
  showFile = true,
  defaultKind = "class_material",
  defaultInstructions = "",
  defaultDueAt = "",
}: {
  action: (state: ChapterState, formData: FormData) => Promise<ChapterState>;
  students: StudentOption[];
  assignedStudentIds?: string[];
  submitLabel: string;
  showFile?: boolean;
  defaultKind?: MaterialKind;
  defaultInstructions?: string;
  defaultDueAt?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [selectedIds, setSelectedIds] = useState<string[]>(
    assignedStudentIds ?? students.map((student) => student.id),
  );

  return (
    <form action={formAction} className="space-y-5">
      {showFile ? (
        <PdfDropField hint="PDF only, up to 20 MB. Added to this chapter for this batch only." />
      ) : null}

      <MaterialKindFields
        defaultKind={defaultKind}
        defaultInstructions={defaultInstructions}
        defaultDueAt={defaultDueAt}
      />

      <StudentAssignmentFields
        students={students}
        selectedIds={selectedIds}
        onChange={setSelectedIds}
      />

      {state.error ? (
        <p role="alert" className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-fg">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
