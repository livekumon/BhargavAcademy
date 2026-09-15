import { Inbox, Phone } from "lucide-react";
import { setLeadStatus } from "@/lib/actions/leads";
import { formatDateTime } from "@/lib/dates";
import { LEAD_STATUS_LABELS, type LeadRecord } from "@/lib/leads";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";

export function LeadsInbox({
  leads,
  emptyDescription = "When a parent submits the enroll form on the website, it will show up here.",
}: {
  leads: LeadRecord[];
  emptyDescription?: string;
}) {
  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<Inbox />}
        title="No enquiries yet"
        description={emptyDescription}
      />
    );
  }

  const openCount = leads.filter((lead) => lead.status === "new").length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-content-muted">
        {openCount} new · {leads.length} total
      </p>
      <div className="flex flex-col gap-3">
        {leads.map((lead) => (
          <Surface key={lead.id} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-heading text-lg font-semibold">
                  {lead.studentName}
                </p>
                <p className="text-sm text-content-muted">
                  Parent: {lead.parentName}
                </p>
              </div>
              <StatusPill
                tone={lead.status === "new" ? "highlight" : "success"}
                dot
              >
                {LEAD_STATUS_LABELS[lead.status]}
              </StatusPill>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-content-subtle">Phone</dt>
                <dd className="mt-0.5 font-medium">
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1.5 hover:underline"
                  >
                    <Phone aria-hidden="true" className="size-3.5" />
                    {lead.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-content-subtle">Class</dt>
                <dd className="mt-0.5 font-medium">{lead.className}</dd>
              </div>
              <div>
                <dt className="text-content-subtle">Subjects</dt>
                <dd className="mt-0.5 font-medium">
                  {lead.subjects || "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-content-subtle">Received</dt>
                <dd className="mt-0.5 font-medium">
                  {formatDateTime(lead.createdAt)}
                </dd>
              </div>
            </dl>

            {lead.message ? (
              <p className="rounded-lg bg-sunken px-3 py-2 text-sm text-content-muted text-pretty">
                {lead.message}
              </p>
            ) : null}

            {lead.status === "new" || lead.status === "contacted" ? (
              <form action={setLeadStatus}>
                <input type="hidden" name="id" value={lead.id} />
                <input
                  type="hidden"
                  name="status"
                  value={lead.status === "contacted" ? "new" : "contacted"}
                />
                <Button type="submit" variant="outline" size="sm">
                  {lead.status === "contacted"
                    ? "Mark as new"
                    : "Mark as contacted"}
                </Button>
              </form>
            ) : null}
          </Surface>
        ))}
      </div>
    </div>
  );
}
