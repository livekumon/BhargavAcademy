"use client";

import { useId, useState } from "react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";

export type AccessValue = "teacher" | "permanent" | "until";

const choices: { value: AccessValue; label: string; description: string }[] = [
  { value: "teacher", label: "Teacher", description: "Sees only their own batches, students and parents." },
  { value: "permanent", label: "Admin · permanent", description: "Sees and manages everyone until you change it." },
  { value: "until", label: "Admin · until a date", description: "Lapses back to teacher automatically — good for cover." },
];

/** Radio cards for teacher vs admin access, with an end date when time-limited. */
export function AccessChoice({
  defaultValue = "teacher",
  defaultUntil = "",
  disabled = false,
}: {
  defaultValue?: AccessValue;
  defaultUntil?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState<AccessValue>(defaultValue);
  const [until, setUntil] = useState(defaultUntil);
  const id = useId();
  const [tomorrow] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  });

  return (
    <fieldset className="@container flex flex-col gap-3" disabled={disabled}>
      <legend className="sr-only">Access</legend>
      <div className="grid gap-2 @xl:grid-cols-3">
        {choices.map((choice) => (
          <label
            key={choice.value}
            className={cn(
              "flex cursor-pointer flex-col gap-1 rounded-xl p-3 ring-1 transition-[box-shadow,background-color] duration-(--dur-fast) has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
              value === choice.value ? "bg-brand-subtle ring-brand" : "bg-surface ring-line hover:ring-line-strong",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <input
                type="radio"
                name="access"
                value={choice.value}
                checked={value === choice.value}
                onChange={() => setValue(choice.value)}
                className="size-4 accent-primary"
              />
              {choice.label}
            </span>
            <span className="text-xs text-content-muted text-pretty">{choice.description}</span>
          </label>
        ))}
      </div>
      {value === "until" ? (
        <div className="flex flex-col gap-1.5 sm:max-w-56">
          <label htmlFor={`${id}-until`} className="text-sm font-medium">
            Admin access ends on
          </label>
          <Input
            id={`${id}-until`}
            type="date"
            name="until"
            min={tomorrow}
            value={until}
            onChange={(event) => setUntil(event.target.value)}
            required
            className="h-9"
          />
        </div>
      ) : null}
    </fieldset>
  );
}
