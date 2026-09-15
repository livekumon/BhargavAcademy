import Link from "next/link";
import { Users } from "lucide-react";
import { cn } from "cn";
import { ChildAvatar } from "@/components/parent/child-avatar";
import { firstName, outstandingWork } from "@/lib/parent-insights";
import { parentChildPath, type ParentChildTab } from "@/lib/paths";
import type { ParentChild } from "@/lib/queries";

/**
 * Jump between siblings without going back. Stays on the same tab, and each
 * chip carries a dot when that child has open work.
 */
export function ChildSwitcher({
  family,
  currentId,
  tab,
}: {
  family: ParentChild[];
  currentId?: string;
  tab?: ParentChildTab;
}) {
  if (family.length < 2) return null;

  return (
    <nav aria-label="Switch child" className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <ul className="flex w-max items-center gap-2">
        <li>
          <Link
            href="/parent"
            aria-current={currentId ? undefined : "page"}
            className={cn(
              "flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium ring-1 transition-colors duration-(--dur-fast) focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              currentId
                ? "bg-surface text-content-muted ring-line hover:bg-sunken hover:text-content"
                : "bg-brand text-brand-fg ring-brand",
            )}
          >
            <Users aria-hidden="true" className="size-4" />
            Family
          </Link>
        </li>
        {family.map((child, index) => {
          const active = child.student.id === currentId;
          const open = outstandingWork(child.materials).total;
          return (
            <li key={child.student.id}>
              <Link
                href={parentChildPath(child.student.id, { tab })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-full py-1 pr-4 pl-1.5 text-sm font-medium ring-1 transition-colors duration-(--dur-fast) focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active
                    ? "bg-brand-subtle text-brand-subtle-fg ring-brand-line"
                    : "bg-surface text-content ring-line hover:bg-sunken",
                )}
              >
                <span className="relative">
                  <ChildAvatar name={child.student.name} index={index} size="sm" />
                  {open > 0 ? (
                    <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-warning ring-2 ring-surface" />
                  ) : null}
                </span>
                {firstName(child.student.name)}
                {open > 0 ? <span className="sr-only">, {open} outstanding</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
