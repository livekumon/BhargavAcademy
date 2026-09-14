"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type MaterialKind } from "@/lib/materials";
import { cn } from "@/lib/utils";

const OPTIONS: { value: MaterialKind; title: string; description: string }[] = [
  {
    value: "class_material",
    title: "Class material",
    description: "Notes or worksheets students can study from.",
  },
  {
    value: "assignment",
    title: "Assignment",
    description: "Work to complete, with your instructions.",
  },
];

export function MaterialKindFields({
  defaultKind = "class_material",
  defaultInstructions = "",
  defaultDueAt = "",
}: {
  defaultKind?: MaterialKind;
  defaultInstructions?: string;
  /** YYYY-MM-DD, or empty for no due date. */
  defaultDueAt?: string;
}) {
  const [kind, setKind] = useState<MaterialKind>(defaultKind);

  return (
    <div className="space-y-4">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Category</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {OPTIONS.map((option) => {
            const selected = kind === option.value;
            return (
              <label
                key={option.value}
                className={cn(
                  "cursor-pointer rounded-xl p-3 ring-1 transition-colors duration-(--dur-fast) has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  selected
                    ? "bg-brand-subtle ring-2 ring-brand"
                    : "bg-surface ring-line hover:bg-sunken",
                )}
              >
                <input
                  type="radio"
                  name="kind"
                  value={option.value}
                  checked={selected}
                  className="sr-only"
                  onChange={() => setKind(option.value)}
                />
                <p className="text-sm font-medium">{option.title}</p>
                <p className="mt-1 text-xs text-content-muted">
                  {option.description}
                </p>
              </label>
            );
          })}
        </div>
      </fieldset>

      {kind === "assignment" ? (
        <div className="space-y-2">
          <Label htmlFor="instructions">Assignment instructions</Label>
          <Textarea
            id="instructions"
            name="instructions"
            defaultValue={defaultInstructions}
            required
            rows={4}
            placeholder="Tell students what to solve and how to present their work."
          />
          <p className="text-xs text-content-muted">
            Students see these instructions separately from class material.
          </p>
          <div className="max-w-56 space-y-2 pt-2">
            <Label htmlFor="dueAt">Due date (optional)</Label>
            <input
              id="dueAt"
              name="dueAt"
              type="date"
              defaultValue={defaultDueAt}
              className="h-10 w-full rounded-lg border border-input bg-raised px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <p className="text-xs text-content-muted">Late work is flagged for you and the parent.</p>
          </div>
        </div>
      ) : (
        <>
          <input type="hidden" name="instructions" value="" />
          <input type="hidden" name="dueAt" value="" />
        </>
      )}
    </div>
  );
}
