"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
      <p className="text-sm text-content-muted">
        This student is already in every batch.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="min-w-48 flex-1 space-y-1.5">
        <Label htmlFor="enrollBatchId">Add to another batch</Label>
        <select
          id="enrollBatchId"
          name="batchId"
          required
          className="h-10 w-full rounded-lg border border-input bg-raised px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Enrolling…" : "Enroll"}
      </Button>
      {state.error ? (
        <p role="alert" className="w-full text-sm text-danger">{state.error}</p>
      ) : null}
    </form>
  );
}
