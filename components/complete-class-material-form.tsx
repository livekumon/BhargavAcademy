"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  markClassMaterialComplete,
  unmarkClassMaterialComplete,
  type ProgressState,
} from "@/lib/actions/progress";

export function CompleteClassMaterialForm({
  materialId,
  completed,
}: {
  materialId: string;
  completed: boolean;
}) {
  const action = completed
    ? unmarkClassMaterialComplete.bind(null, materialId)
    : markClassMaterialComplete.bind(null, materialId);
  const [state, formAction, pending] = useActionState<ProgressState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant={completed ? "outline" : "default"} disabled={pending}>
        {pending
          ? "Saving..."
          : completed
            ? "Mark as not revision completed"
            : "Mark as revision completed"}
      </Button>
    </form>
  );
}
