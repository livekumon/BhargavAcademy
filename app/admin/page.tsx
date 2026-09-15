import type { Metadata } from "next";
import Link from "next/link";
import { Download, UserPlus } from "lucide-react";
import {
  AttentionPanel,
  KpiCard,
  LeadFunnel,
  RecentActivity,
  TeacherTable,
} from "@/components/admin/overview-panels";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { OVERVIEW_RANGES, getAdminOverview, parseOverviewRange } from "@/lib/admin/metrics";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Overview",
};

function greeting(date: Date) {
  const hour = Number(
    date.toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const admin = await requireAdmin();
  const range = parseOverviewRange((await searchParams).range);
  const overview = await getAdminOverview(range);
  const now = new Date();
  const firstName = admin.name.split(/\s+/)[0] ?? admin.name;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={now.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "Asia/Kolkata",
        })}
        title={`${greeting(now)}, ${firstName}`}
        description={`Across ${plural(overview.totals.teachers, "teacher")}, ${plural(overview.totals.batches, "batch", "batches")}, ${plural(overview.totals.students, "student")} and ${plural(overview.totals.parents, "parent")}.`}
        actions={
          <>
            <nav aria-label="Reporting period">
              <ul className="flex rounded-lg bg-sunken p-1 ring-1 ring-line">
                {OVERVIEW_RANGES.map((days) => (
                  <li key={days}>
                    <Link
                      href={days === 30 ? "/admin" : `/admin?range=${days}`}
                      aria-current={days === range ? "page" : undefined}
                      className={cn(
                        "flex h-7 items-center rounded-md px-3 text-sm font-medium transition-colors duration-(--dur-fast) focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                        days === range
                          ? "bg-surface text-content shadow-elevation-xs ring-1 ring-line"
                          : "text-content-muted hover:text-content",
                      )}
                    >
                      {days} days
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <Button asChild variant="outline" size="lg">
              <a href="/api/admin/export/people.csv">
                <Download data-icon="inline-start" />
                Export
              </a>
            </Button>
            <Button asChild size="lg">
              <Link href="/admin/people/new">
                <UserPlus data-icon="inline-start" />
                Add person
              </Link>
            </Button>
          </>
        }
      />

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {overview.kpis.map((kpi) => (
          <KpiCard key={kpi.key} kpi={kpi} />
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:items-start">
        <AttentionPanel items={overview.attention} />
        <LeadFunnel funnel={overview.funnel} rangeDays={overview.rangeDays} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:items-start">
        <TeacherTable teachers={overview.teachers} />
        <RecentActivity events={overview.activity} />
      </div>
    </div>
  );
}
