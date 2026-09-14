"use client";

import { useActionState, useState } from "react";
import { FileText } from "lucide-react";
import { MaterialKindFields } from "@/components/material-kind-fields";
import {
  StudentAssignmentFields,
  type StudentOption,
} from "@/components/student-assignment-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}: {
  action: (state: ChapterState, formData: FormData) => Promise<ChapterState>;
  students: StudentOption[];
  assignedStudentIds?: string[];
  submitLabel: string;
  showFile?: boolean;
  defaultKind?: MaterialKind;
  defaultInstructions?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    assignedStudentIds ?? students.map((student) => student.id),
  );

  return (
    <form action={formAction} className="space-y-5">
      {showFile ? (
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
            <p className="mt-2 text-xs text-muted-foreground">
              This PDF is added to this chapter for the current batch only. PDF
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
      ) : null}

      <MaterialKindFields
        defaultKind={defaultKind}
        defaultInstructions={defaultInstructions}
      />

      <StudentAssignmentFields
        students={students}
        selectedIds={selectedIds}
        onChange={setSelectedIds}
      />

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
