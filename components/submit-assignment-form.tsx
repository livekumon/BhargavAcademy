"use client";

import { useActionState, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitAssignment, type ProgressState } from "@/lib/actions/progress";

export function SubmitAssignmentForm({
  materialId,
  completed,
  submissionName,
}: {
  materialId: string;
  completed: boolean;
  submissionName: string | null;
}) {
  const [state, formAction, pending] = useActionState<ProgressState, FormData>(
    submitAssignment.bind(null, materialId),
    {},
  );
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="assignment-pdf">
          {completed ? "Replace your assignment PDF" : "Upload your completed assignment"}
        </Label>
        <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
          <Input
            id="assignment-pdf"
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
            Upload a PDF of your work to mark this assignment as revision
            completed. Up to 20 MB.
          </p>
          {fileName ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium">
              <FileText className="size-4" />
              {fileName}
            </p>
          ) : submissionName ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Current file: {submissionName}
            </p>
          ) : null}
        </div>
      </div>

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending
          ? "Uploading..."
          : completed
            ? "Replace and keep revision completed"
            : "Upload and mark as revision completed"}
      </Button>
    </form>
  );
}
