import { CalendarRange } from "lucide-react";
import { FilterChips } from "@/components/teacher/page-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateInput, shiftDateInput, todayDateInput } from "@/lib/dates";
import { batchPath } from "@/lib/paths";

/**
 * Which completions count: quick presets as chips, exact dates tucked behind
 * a disclosure because they are needed far less often.
 */
export function BatchWindowForm({
  batchId,
  from,
  to,
  preset,
  show,
}: {
  batchId: string;
  from: string | null;
  to: string | null;
  preset: "all" | "range";
  show?: string;
}) {
  const today = todayDateInput();
  const last7 = shiftDateInput(today, -6);
  const last30 = shiftDateInput(today, -29);
  const base = batchPath(batchId);
  const extra = show && show !== "all" ? `&show=${show}` : "";

  const chips = [
    { id: "all", label: "All time", href: `${base}?all=1${extra}` },
    { id: "today", label: "Today", href: `${base}?from=${today}&to=${today}${extra}` },
    { id: "7", label: "Last 7 days", href: `${base}?from=${last7}&to=${today}${extra}` },
    { id: "30", label: "Last 30 days", href: `${base}?from=${last30}&to=${today}${extra}` },
  ];
  const current =
    preset === "all"
      ? "all"
      : to === today && from === today
        ? "today"
        : to === today && from === last7
          ? "7"
          : to === today && from === last30
            ? "30"
            : "custom";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterChips chips={chips} current={current} label="Completion window" />
      <details className="group relative" open={current === "custom" ? true : undefined}>
        <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-content-muted ring-1 ring-line hover:bg-sunken hover:text-content group-open:bg-brand-subtle group-open:text-brand-subtle-fg group-open:ring-brand-line focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <CalendarRange aria-hidden="true" className="size-4" />
          {current === "custom" && from && to
            ? `${formatDateInput(from)} – ${formatDateInput(to)}`
            : "Custom dates"}
        </summary>
        <form
          action={base}
          method="get"
          className="mt-2 flex flex-wrap items-end gap-3 rounded-xl bg-raised p-3 shadow-elevation-md ring-1 ring-line sm:absolute sm:z-20"
        >
          {show && show !== "all" ? <input type="hidden" name="show" value={show} /> : null}
          <div className="space-y-1.5">
            <Label htmlFor="window-from">From</Label>
            <Input id="window-from" name="from" type="date" defaultValue={from ?? last7} required className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="window-to">To</Label>
            <Input id="window-to" name="to" type="date" defaultValue={to ?? today} required className="h-9" />
          </div>
          <Button type="submit" size="lg">
            Apply
          </Button>
        </form>
      </details>
    </div>
  );
}
