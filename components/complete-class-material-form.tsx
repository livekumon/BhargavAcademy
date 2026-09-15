"use client";

import { useActionState, useOptimistic } from "react";
import { Check, CheckCircle2, Undo2 } from "lucide-react";
import {
  markClassMaterialComplete,
  unmarkClassMaterialComplete,
  type ProgressState,
} from "@/lib/actions/progress";

/**
 * One tap to mark class material revised. The done state shows immediately
 * (optimistic) and offers Undo, rather than a second "mark as not revised" button.
 */
export function CompleteClassMaterialForm({
  materialId,
  completed,
  completedLabel,
}: {
  materialId: string;
  completed: boolean;
  completedLabel?: string | null;
}) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(completed);
  const [state, formAction, pending] = useActionState<ProgressState, FormData>(
    async (previous, formData) => {
      setOptimisticDone(!completed);
      return completed
        ? unmarkClassMaterialComplete(materialId, previous, formData)
        : markClassMaterialComplete(materialId, previous, formData);
    },
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      {optimisticDone ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg bg-success-subtle px-4 py-3 text-success-subtle-fg ring-1 ring-success-line"
        >
          <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
          <p className="min-w-0 flex-1 text-sm font-medium">
            Revised
            {completed && completedLabel ? (
              <span className="font-normal"> on {completedLabel}</span>
            ) : null}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors duration-(--dur-fast) hover:bg-success/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
          >
            <Undo2 aria-hidden="true" className="size-4" />
            Undo
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-brand-fg shadow-elevation-sm transition-[background-color,box-shadow] duration-(--dur-fast) hover:bg-brand-hover hover:shadow-elevation-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
        >
          <Check aria-hidden="true" className="size-4" />
          Mark as revised
        </button>
      )}

      {state.error ? (
        <p role="alert" className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-fg">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
