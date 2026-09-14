import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { shiftDateInput, todayDateInput } from "@/lib/dates";
import { batchPath } from "@/lib/paths";

export function BatchWindowForm({
  batchId,
  from,
  to,
  latestDate,
}: {
  batchId: string;
  from: string | null;
  to: string | null;
  latestDate: string | null;
}) {
  const today = todayDateInput();
  const last7 = shiftDateInput(today, -6);
  const last30 = shiftDateInput(today, -29);
  const defaultDay = latestDate ?? today;
  const href = batchPath(batchId);

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`${href}?from=${today}&to=${today}`}>Today</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`${href}?from=${last7}&to=${today}`}>Last 7 days</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`${href}?from=${last30}&to=${today}`}>Last 30 days</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`${href}?from=${defaultDay}&to=${defaultDay}`}>
            Latest date
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`${href}?all=1`}>All time</Link>
        </Button>
      </div>

      <form action={href} method="get" className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={from ?? defaultDay}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            name="to"
            type="date"
            defaultValue={to ?? defaultDay}
            required
          />
        </div>
        <Button type="submit">Apply window</Button>
      </form>
    </div>
  );
}