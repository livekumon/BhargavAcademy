import Link from "next/link";
import { CheckCheck, GraduationCap, Inbox, MessageCircle, NotebookPen, Phone, RotateCcw, UserPlus } from "lucide-react";
import { FilterChips } from "@/components/teacher/page-tabs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { saveLeadNotes, setLeadStatus } from "@/lib/actions/leads";
import { LEAD_STATUS_LABEL, type LeadRecord, type LeadStatus } from "@/lib/leads";
import { relativeDay, whatsappNumber } from "@/lib/teacher-format";

const tones: Record<LeadStatus, "highlight" | "info" | "success" | "brand" | "neutral"> = {
  new: "highlight",
  contacted: "info",
  demo: "brand",
  enrolled: "success",
  closed: "neutral",
};

function StatusButton({ lead, to, label, icon: Icon, primary = false }: {
  lead: LeadRecord;
  to: LeadStatus;
  label: string;
  icon: typeof CheckCheck;
  primary?: boolean;
}) {
  return (
    <form action={setLeadStatus}>
      <input type="hidden" name="id" value={lead.id} />
      <input type="hidden" name="status" value={to} />
      <Button type="submit" variant={primary ? "default" : "ghost"} size="lg">
        <Icon data-icon="inline-start" />
        {label}
      </Button>
    </form>
  );
}

/**
 * Website enquiries as a small call-back queue: New → Contacted → Enrolled.
 * Each card has one-tap Call and WhatsApp, and turning a lead into a student
 * pre-fills the new-student form and closes the lead.
 */
export function LeadsInbox({ leads, status }: { leads: LeadRecord[]; status: LeadStatus | "all" }) {
  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<Inbox />}
        title="No enquiries yet"
        description="When the academy admin assigns you a website enquiry, it lands here so you can call the family back."
      />
    );
  }

  const counts = {
    new: leads.filter((lead) => lead.status === "new").length,
    contacted: leads.filter((lead) => lead.status === "contacted").length,
    enrolled: leads.filter((lead) => lead.status === "enrolled").length,
  };
  const visible = status === "all" ? leads : leads.filter((lead) => lead.status === status);

  return (
    <div className="flex flex-col gap-4">
      <FilterChips
        label="Lead status"
        current={status}
        chips={[
          { id: "new", label: "New", href: "/dashboard/leads", count: counts.new },
          { id: "contacted", label: "Contacted", href: "/dashboard/leads?status=contacted", count: counts.contacted },
          { id: "enrolled", label: "Enrolled", href: "/dashboard/leads?status=enrolled", count: counts.enrolled },
          { id: "all", label: "All", href: "/dashboard/leads?status=all", count: leads.length },
        ]}
      />

      {visible.length === 0 ? (
        <Surface className="text-center text-sm text-content-muted">
          {status === "new" ? "No new enquiries. You're all caught up." : "Nothing here yet."}
        </Surface>
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {visible.map((lead) => {
            const created = new Date(lead.createdAt);
            const addAsStudent = `/dashboard/students/new?${new URLSearchParams({
              leadId: lead.id,
              name: lead.studentName,
              phone: lead.phone,
              parent: lead.parentName,
            }).toString()}`;
            return (
              <li key={lead.id}>
                <Surface className="flex h-full flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-heading text-title-2 font-semibold">{lead.studentName}</p>
                      <p className="text-sm text-content-muted">
                        {lead.className}
                        {lead.subjects ? ` · ${lead.subjects}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusPill tone={tones[lead.status]} dot>
                        {LEAD_STATUS_LABEL[lead.status]}
                      </StatusPill>
                      <span className="text-xs text-content-subtle" title={created.toLocaleString("en-IN")}>
                        {relativeDay(created)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span>
                      <span className="text-content-subtle">Parent </span>
                      <span className="font-medium">{lead.parentName}</span>
                    </span>
                    <span className="tabular text-content-muted">{lead.phone}</span>
                  </div>

                  <details className="group rounded-lg ring-1 ring-line">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                      <span className="flex min-w-0 items-center gap-2">
                        <NotebookPen aria-hidden="true" className="size-4 shrink-0 text-content-subtle" />
                        <span className="truncate text-content-muted">
                          {lead.notes ? lead.notes.split("\n")[0] : "Add a note from your call"}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-content-subtle group-open:hidden">{lead.notes ? "Edit" : "Add"}</span>
                    </summary>
                    <form action={saveLeadNotes} className="space-y-2 border-t border-line p-3">
                      <input type="hidden" name="id" value={lead.id} />
                      <label htmlFor={`notes-${lead.id}`} className="sr-only">
                        Notes about {lead.studentName}
                      </label>
                      <textarea
                        id={`notes-${lead.id}`}
                        name="notes"
                        defaultValue={lead.notes}
                        rows={3}
                        maxLength={2000}
                        placeholder="Called on Monday. Wants the evening batch; visiting on Saturday."
                        className="w-full rounded-lg border border-input bg-raised px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                      <Button type="submit" size="default" variant="outline">
                        Save note
                      </Button>
                    </form>
                  </details>

                  {lead.message ? (
                    <p className="rounded-lg bg-sunken px-3 py-2 text-sm text-content-muted text-pretty">
                      &ldquo;{lead.message}&rdquo;
                    </p>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    <Button asChild variant="outline" size="lg">
                      <a href={`tel:${lead.phone}`}>
                        <Phone data-icon="inline-start" />
                        Call
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <a
                        href={`https://wa.me/${whatsappNumber(lead.phone)}?text=${encodeURIComponent(
                          `Hello ${lead.parentName}, this is Bhargav Academy. Thank you for your enquiry about ${lead.studentName} (${lead.className}).`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle data-icon="inline-start" />
                        WhatsApp
                      </a>
                    </Button>
                    <span className="flex-1" />
                    {lead.status === "new" ? (
                      <StatusButton lead={lead} to="contacted" label="Mark contacted" icon={CheckCheck} />
                    ) : null}
                    {lead.status !== "enrolled" ? (
                      <Button asChild size="lg">
                        <Link href={addAsStudent}>
                          <UserPlus data-icon="inline-start" />
                          Add as student
                        </Link>
                      </Button>
                    ) : (
                      <StatusButton lead={lead} to="contacted" label="Not enrolled" icon={RotateCcw} />
                    )}
                    {lead.status === "contacted" ? (
                      <StatusButton lead={lead} to="new" label="Back to new" icon={RotateCcw} />
                    ) : null}
                    {lead.status === "enrolled" ? (
                      <StatusPill tone="success">
                        <GraduationCap />
                        Student added
                      </StatusPill>
                    ) : null}
                  </div>
                </Surface>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
