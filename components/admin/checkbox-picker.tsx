"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export type PickerOption = { id: string; label: string; detail?: string };

const CHECK_CLASS =
  "size-4 shrink-0 rounded border-input accent-primary focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * A searchable list of checkboxes that submits one `name` value per checked
 * option. Checked options stay submitted even when the search hides them.
 */
export function CheckboxPicker({
  name,
  options,
  defaultSelected = [],
  legend,
  searchPlaceholder = "Search",
  emptyText = "Nothing to choose from yet.",
}: {
  name: string;
  options: PickerOption[];
  defaultSelected?: string[];
  legend: string;
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new Set(defaultSelected));

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) =>
      `${option.label} ${option.detail ?? ""}`.toLowerCase().includes(needle),
    );
  }, [options, query]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 flex w-full items-center justify-between gap-2 text-sm font-medium">
        {legend}
        <span className="tabular text-xs font-normal text-content-subtle">{selected.size} selected</span>
      </legend>
      {[...selected].map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      {options.length > 6 ? (
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-content-subtle" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-9 pl-8"
          />
        </div>
      ) : null}
      {options.length === 0 ? (
        <p className="text-sm text-content-muted">{emptyText}</p>
      ) : (
        <ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-lg ring-1 ring-line">
          {visible.map((option) => (
            <li key={option.id}>
              <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-sunken/60">
                <input
                  type="checkbox"
                  className={`${CHECK_CLASS} mt-0.5`}
                  checked={selected.has(option.id)}
                  onChange={() => toggle(option.id)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{option.label}</span>
                  {option.detail ? (
                    <span className="block truncate text-xs text-content-subtle">{option.detail}</span>
                  ) : null}
                </span>
              </label>
            </li>
          ))}
          {visible.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-content-muted">No matches for “{query}”.</li>
          ) : null}
        </ul>
      )}
    </fieldset>
  );
}
