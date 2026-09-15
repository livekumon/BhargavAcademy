import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "cn";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { SELECT_CLASS_NAME } from "@/lib/academics";
import { listTeacherOptions } from "@/lib/admin/queries";
import { listAuditEvents } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Activity",
};

const families = [
  { value: "", label: "All changes" },
  { value: "person", label: "People added, edited, suspended" },
  { value: "role", label: "Admin access" },
  { value: "teaching", label: "Teaching handovers" },
  { value: "student", label: "Student batches" },
  { value: "parent", label: "Parent links" },
  { value: "lead", label: "Leads" },
  { value: "auth", label: "Sign-ins" },
];

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; actorId?: string; before?: string }>;
}) {
  await requireAdmin();
  const { action, actorId, before } = await searchParams;
  const family = families.some((option) => option.value === action) ? action : "";
  const beforeDate = before && !Number.isNaN(Date.parse(before)) ? new Date(before) : undefined;

  const [{ events, nextBefore }, teachers] = await Promise.all([
    listAuditEvents({
      action: family || undefined,
      actorId: actorId || undefined,
      before: beforeDate,
      limit: 50,
      excludeLogins: family !== "auth",
    }),
    listTeacherOptions(),
  ]);

  const olderHref = nextBefore
    ? `/admin/activity?${new URLSearchParams({
        ...(family ? { action: family } : {}),
        ...(actorId ? { actorId } : {}),
        before: nextBefore,
      })}`
    : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Audit trail"
        title="Activity log"
        description="Who changed what, and when. Every admin change is recorded here with the values before and after, and cannot be edited."
      />

      <Surface pad="sm">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-56 flex-col gap-1.5 text-sm font-medium">
            Kind of change
            <select name="action" defaultValue={family} className={cn(SELECT_CLASS_NAME, "h-9 font-normal")}>
              {families.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="flex min-w-48 flex-col gap-1.5 text-sm font-medium">
            Done by
            <select name="actorId" defaultValue={actorId ?? ""} className={cn(SELECT_CLASS_NAME, "h-9 font-normal")}>
              <option value="">Anyone</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary" size="lg" className="h-9">Apply</Button>
        </form>
      </Surface>

      <Surface pad="none" className="overflow-hidden">
        <ActivityFeed events={events} />
      </Surface>

      <div className="flex gap-2">
        {beforeDate ? (
          <Button asChild variant="outline">
            <Link href={`/admin/activity${family || actorId ? `?${new URLSearchParams({ ...(family ? { action: family } : {}), ...(actorId ? { actorId } : {}) })}` : ""}`}>
              Back to latest
            </Link>
          </Button>
        ) : null}
        {olderHref ? (
          <Button asChild variant="outline">
            <Link href={olderHref}>Older entries</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
