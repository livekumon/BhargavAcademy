"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SELECT_CLASS_NAME } from "@/lib/academics";
import { enrollStudent, type StudentState } from "@/lib/actions/students";

export function EnrollStudentForm({
  studentId,
  batches,
}: {
  studentId: string;
  batches: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    enrollStudent.bind(null, studentId),
    {},
  );

  if (batches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This student is already in every batch.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="min-w-48 flex-1 space-y-2">
        <Label htmlFor="enrollBatchId">Add to another batch</Label>
        <select
          id="enrollBatchId"
          name="batchId"
          required
          className={SELECT_CLASS_NAME}
          defaultValue=""
        >
          <option value="" disabled>
            Choose a batch
          </option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Adding..." : "Enroll"}
      </Button>
      {state.error ? (
        <p className="w-full text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
