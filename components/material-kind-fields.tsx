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
}: {
  defaultKind?: MaterialKind;
  defaultInstructions?: string;
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
                  "cursor-pointer rounded-xl border p-3 transition-colors",
                  selected
                    ? "border-primary bg-secondary/70"
                    : "border-border bg-muted/30 hover:bg-muted/50",
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
                <p className="mt-1 text-xs text-muted-foreground">
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
          <p className="text-xs text-muted-foreground">
            Students see these instructions separately from class material.
          </p>
        </div>
      ) : (
        <input type="hidden" name="instructions" value="" />
      )}
    </div>
  );
}
