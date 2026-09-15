import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

export type PageTab = { id: string; label: string; href: string; icon?: LucideIcon; count?: number };

/**
 * Section tabs as real links, so the tab lives in the URL and back, refresh
 * and sharing all land on the same view. Scrolls sideways on narrow screens
 * instead of wrapping.
 */
export function PageTabs({ tabs, current, label }: { tabs: PageTab[]; current: string; label: string }) {
  return (
    <nav aria-label={label} className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <ul className="flex w-max items-center gap-1 border-b border-line sm:w-full">
        {tabs.map((tab) => {
          const active = tab.id === current;
          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center gap-2 rounded-t-lg px-3 text-sm font-medium whitespace-nowrap transition-colors duration-(--dur-fast) focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active ? "text-brand" : "text-content-muted hover:text-content",
                )}
              >
                {tab.icon ? <tab.icon aria-hidden="true" className="size-4" /> : null}
                {tab.label}
                {typeof tab.count === "number" ? (
                  <span
                    className={cn(
                      "tabular rounded-full px-1.5 text-xs",
                      active ? "bg-brand-subtle text-brand-subtle-fg" : "bg-sunken text-content-muted",
                    )}
                  >
                    {tab.count}
                  </span>
                ) : null}
                {active ? (
                  <span aria-hidden="true" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Pill-style filter links, for narrowing a list within a tab. */
export function FilterChips({
  chips,
  current,
  label,
}: {
  chips: { id: string; label: string; href: string; count?: number }[];
  current: string;
  label: string;
}) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.id}>
            <Link
              href={chip.href}
              scroll={false}
              aria-current={chip.id === current ? "page" : undefined}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-content-muted ring-1 ring-line transition-colors duration-(--dur-fast) hover:bg-sunken hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-[current=page]:bg-brand-subtle aria-[current=page]:text-brand-subtle-fg aria-[current=page]:ring-brand-line"
            >
              {chip.label}
              {typeof chip.count === "number" ? <span className="tabular opacity-70">{chip.count}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
