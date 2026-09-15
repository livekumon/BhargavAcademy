import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Phone } from "lucide-react";
import { cn } from "cn";
import { ConvertLeadForm, LeadTriageForm } from "@/components/admin/lead-forms";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { relativeDay } from "@/lib/admin/format";
import { LEAD_STAGES, isLeadStage } from "@/lib/admin/policy";
import { listAllBatches, listTeacherOptions } from "@/lib/admin/queries";
import { SIGNAL_RULES } from "@/lib/admin/signals";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { LEAD_STATUS_LABELS, listLeads } from "@/lib/leads";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";

export const metadata: Metadata = {
  title: "Leads",
};

const stageTone: Record<string, StatusTone> = {
  new: "highlight",
  contacted: "info",
  demo: "brand",
  enrolled: "success",
  closed: "neutral",
};

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const stage = isLeadStage(status) ? status : null;
  const [leads, teachers, batches, catalog] = await Promise.all([
    listLeads(),
    listTeacherOptions(),
    listAllBatches(),
    getLookupCatalog(),
  ]);

  const teacherName = new Map(teachers.map((teacher) => [teacher.id, teacher.name]));
  const activeTeachers = teachers.filter((teacher) => teacher.active);
  const counts = Object.fromEntries(LEAD_STAGES.map((value) => [value, leads.filter((lead) => lead.status === value).length]));
  const visible = stage ? leads.filter((lead) => lead.status === stage) : leads;
  const slowCutoff = new Date().getTime() - SIGNAL_RULES.leadResponseHours * 60 * 60 * 1000;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Enquiries"
        title="Lead pipeline"
        description="Every enrolment enquiry from the website. Assign each one to a teacher to call back, move it through the stages, and enrol it straight into a batch."
      />

      <nav aria-label="Lead stage" className="-mx-1 overflow-x-auto px-1">
        <ul className="flex w-fit gap-1 rounded-xl bg-sunken p-1 ring-1 ring-line">
          {[{ value: null, label: "All", count: leads.length }, ...LEAD_STAGES.map((value) => ({ value, label: LEAD_STATUS_LABELS[value], count: counts[value] }))].map((tab) => (
            <li key={tab.label}>
              <Link
                href={tab.value ? `/admin/leads?status=${tab.value}` : "/admin/leads"}
                aria-current={stage === tab.value ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors duration-(--dur-fast) focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  stage === tab.value ? "bg-surface text-content shadow-elevation-xs ring-1 ring-line" : "text-content-muted hover:text-content",
                )}
              >
                {tab.label}
                <span className="tabular rounded-full bg-sunken px-1.5 text-xs text-content-subtle">{tab.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title={stage ? `No leads in ${LEAD_STATUS_LABELS[stage]}` : "No enquiries yet"}
          description="Enquiries from the enrol form on bhargavacademy.com land here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((lead) => {
            const slow = lead.status === "new" && new Date(lead.createdAt).getTime() < slowCutoff;
            return (
              <li key={lead.id}>
                <Surface className={cn("flex flex-col gap-4", slow && "ring-danger-line")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-heading text-title-3 font-semibold">{lead.studentName}</h2>
                      <p className="text-sm text-content-muted">
                        {lead.className} · {lead.subjects || "Subjects not specified"} · Parent: {lead.parentName}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slow ? <StatusPill tone="danger" size="sm">Waiting over {SIGNAL_RULES.leadResponseHours} h</StatusPill> : null}
                      <StatusPill tone={stageTone[lead.status]} dot>{LEAD_STATUS_LABELS[lead.status]}</StatusPill>
                    </div>
                  </div>

                  <dl className="grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-content-subtle">Phone</dt>
                      <dd className="mt-0.5 font-medium">
                        <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 hover:underline">
                          <Phone aria-hidden="true" className="size-3.5" />
                          {lead.phone}
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-content-subtle">Received</dt>
                      <dd className="mt-0.5 font-medium">{formatDateTime(lead.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-content-subtle">First contact</dt>
                      <dd className="mt-0.5 font-medium">
                        {lead.contactedAt ? relativeDay(lead.contactedAt) : "Not yet"}
                        {lead.assignedTeacherId ? ` · ${teacherName.get(lead.assignedTeacherId) ?? "Unknown teacher"}` : ""}
                      </dd>
                    </div>
                  </dl>

                  {lead.message ? (
                    <p className="rounded-lg bg-sunken px-3 py-2 text-sm text-content-muted text-pretty">{lead.message}</p>
                  ) : null}

                  <LeadTriageForm lead={lead} teachers={activeTeachers} />

                  {lead.status !== "enrolled" && lead.status !== "closed" ? (
                    <details className="group rounded-lg ring-1 ring-line [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-sunken/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                        Enrol as a student
                        <span aria-hidden="true" className="text-content-subtle transition-transform group-open:rotate-90">›</span>
                      </summary>
                      <div className="border-t border-line p-3">
                        <p className="mb-3 text-sm text-content-muted text-pretty">
                          Creates a student login for {lead.studentName} and a parent login for {lead.parentName}, both
                          with the default password, and marks the lead as enrolled.
                        </p>
                        <ConvertLeadForm
                          lead={lead}
                          batches={batches.map((batch) => ({ id: batch.id, name: batch.name, teacherName: batch.teacherName }))}
                          syllabuses={lookupChoices(catalog.syllabus)}
                          exams={lookupChoices(catalog.exam)}
                        />
                      </div>
                    </details>
                  ) : null}
                </Surface>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
