import Link from "next/link";
import { ArrowRight, CircleCheck, ShieldCheck } from "lucide-react";
import { cn } from "cn";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { Sparkline } from "@/components/admin/sparkline";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { relativeDay, daysSince } from "@/lib/admin/format";
import type { AdminOverview, AttentionItem, Kpi } from "@/lib/admin/metrics";

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const deltaTone =
    kpi.delta.good === null
      ? "text-content-subtle"
      : kpi.delta.good
        ? "text-success-subtle-fg"
        : "text-danger-subtle-fg";

  return (
    <Link
      href={kpi.href}
      className="group flex min-w-0 flex-col gap-1 rounded-xl bg-surface p-4 ring-1 ring-line transition-[box-shadow,background-color] duration-(--dur-base) hover:shadow-elevation-sm hover:ring-line-strong focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span className="text-sm font-medium text-content-muted">{kpi.label}</span>
      <span className="font-heading tabular text-title-1 font-semibold">{kpi.value}</span>
      <span className={cn("tabular text-xs font-medium", deltaTone)}>
        {kpi.delta.direction === "up" ? "▲ " : kpi.delta.direction === "down" ? "▼ " : ""}
        {kpi.delta.text}
      </span>
      <Sparkline values={kpi.series} className="mt-1 h-7 w-full" />
      <span className="text-xs text-content-subtle text-pretty">{kpi.hint}</span>
    </Link>
  );
}

const severityStripe: Record<AttentionItem["severity"], string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-info",
};

const severityLabel: Record<AttentionItem["severity"], string> = {
  danger: "Urgent",
  warning: "Soon",
  info: "When you can",
};

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  return (
    <Surface pad="none" className="flex min-w-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="font-heading text-title-3 font-semibold">Needs attention</h2>
        <span className="text-xs text-content-subtle">
          {items.length === 0 ? "All clear" : `Ranked by urgency · ${items.length}`}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-8 text-content-muted">
          <CircleCheck aria-hidden="true" className="size-5 text-success" />
          Nothing needs you right now. Every lead has been called and every batch is moving.
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="group grid grid-cols-[4px_minmax(0,1fr)_auto] items-center gap-4 py-3 pr-5 transition-colors duration-(--dur-fast) hover:bg-sunken/60 focus-visible:bg-sunken focus-visible:outline-none"
              >
                <span aria-hidden="true" className={cn("h-full min-h-10 rounded-r-full", severityStripe[item.severity])} />
                <span className="min-w-0">
                  <span className="sr-only">{severityLabel[item.severity]}: </span>
                  <span className="block text-sm font-medium text-content">{item.title}</span>
                  {item.detail ? (
                    <span className="block truncate text-xs text-content-subtle">{item.detail}</span>
                  ) : null}
                </span>
                <span className="flex flex-col items-end">
                  <span className="font-heading tabular text-title-3 font-semibold">{item.count}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
                    {item.action}
                    <ArrowRight aria-hidden="true" className="size-3 transition-transform duration-(--dur-fast) group-hover:translate-x-0.5" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}

export function LeadFunnel({ funnel, rangeDays }: { funnel: AdminOverview["funnel"]; rangeDays: number }) {
  const top = funnel.steps[0]?.count ?? 0;
  return (
    <Surface pad="none" className="flex min-w-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="font-heading text-title-3 font-semibold">Lead pipeline</h2>
        <span className="text-xs text-content-subtle">Last {rangeDays} days</span>
      </div>
      <div className="flex flex-col gap-4 px-5 py-4">
        {top === 0 ? (
          <p className="text-sm text-content-muted">No website enquiries in this period.</p>
        ) : (
          funnel.steps.map((step, index) => (
            <div key={step.label} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-content-muted">{step.label}</span>
                <span className="tabular font-semibold">{step.count}</span>
              </div>
              <ProgressMeter
                value={(step.count / top) * 100}
                label={`${step.label}: ${step.count} of ${top}`}
                tone={index === funnel.steps.length - 1 ? "highlight" : "brand"}
                size="sm"
              />
            </div>
          ))
        )}
        <p className="border-t border-dashed border-line pt-3 text-xs text-content-subtle text-pretty">
          {top > 0 ? `${funnel.conversion}% of enquiries enrolled.` : ""}{" "}
          {funnel.medianResponseHours === null
            ? "Response time appears once leads are marked contacted."
            : `Median time to first contact: ${funnel.medianResponseHours} h.`}
        </p>
        <Link href="/admin/leads" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
          Open the pipeline <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
    </Surface>
  );
}

export function TeacherTable({ teachers }: { teachers: AdminOverview["teachers"] }) {
  return (
    <Surface pad="none" className="flex min-w-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="font-heading text-title-3 font-semibold">Teachers</h2>
        <Link href="/admin/people?role=teacher" className="text-xs font-medium text-brand hover:underline">
          All teachers
        </Link>
      </div>
      {teachers.length === 0 ? (
        <EmptyState title="No teachers yet" border="none" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-content-subtle uppercase">
                <th scope="col" className="px-5 py-2.5 font-medium">Teacher</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Batches</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Students</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Work completion</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Uploads</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Last sign-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {teachers.map((teacher) => {
                const idle = daysSince(teacher.lastLoginAt);
                return (
                  <tr key={teacher.id} className="transition-colors hover:bg-sunken/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/teachers/${teacher.id}`}
                        className="inline-flex items-center gap-2 font-medium hover:underline"
                      >
                        {teacher.name}
                        {teacher.isAdmin ? (
                          <ShieldCheck
                            aria-label={teacher.isOwner ? "Owner" : "Admin"}
                            className="size-3.5 text-brand"
                          />
                        ) : null}
                      </Link>
                      {teacher.status !== "active" ? (
                        <StatusPill tone="danger" size="sm" className="ml-2">Suspended</StatusPill>
                      ) : null}
                    </td>
                    <td className="tabular px-3 py-3 text-right">{teacher.batchCount}</td>
                    <td className="tabular px-3 py-3 text-right">{teacher.studentCount}</td>
                    <td className="px-3 py-3">
                      {teacher.assigned === 0 ? (
                        <span className="text-content-subtle">Nothing assigned</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <ProgressMeter
                            value={teacher.completion}
                            label={`${teacher.name}: ${teacher.completion}% of work completed`}
                            tone={teacher.completion >= 75 ? "success" : teacher.completion >= 50 ? "info" : "warning"}
                            size="sm"
                            className="w-24"
                          />
                          <span className="tabular w-9 text-right text-xs">{teacher.completion}%</span>
                        </span>
                      )}
                    </td>
                    <td className="tabular px-3 py-3 text-right">{teacher.materialsThisPeriod}</td>
                    <td className="px-5 py-3">
                      <StatusPill
                        tone={idle === null ? "neutral" : idle <= 2 ? "success" : idle <= 7 ? "warning" : "danger"}
                        size="sm"
                      >
                        {relativeDay(teacher.lastLoginAt) ?? "Never"}
                      </StatusPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Surface>
  );
}

export function RecentActivity({ events }: { events: AdminOverview["activity"] }) {
  return (
    <Surface pad="none" className="flex min-w-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="font-heading text-title-3 font-semibold">Recent activity</h2>
        <Link href="/admin/activity" className="text-xs font-medium text-brand hover:underline">
          Activity log
        </Link>
      </div>
      <ActivityFeed events={events} compact />
    </Surface>
  );
}
