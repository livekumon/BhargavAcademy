import type { Metadata } from "next";
import { LeadsInbox } from "@/components/leads-inbox";
import { PageHeader } from "@/components/layout/page-header";
import { requireTeacher } from "@/lib/auth";
import { listLeadsForTeacher } from "@/lib/leads";
import { firstQueryValue } from "@/lib/teacher-format";

export const metadata: Metadata = {
  title: "Leads",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const teacher = await requireTeacher();
  // Admins own the enquiry pipeline; a teacher sees only the leads handed to them.
  const [leads, query] = await Promise.all([listLeadsForTeacher(teacher.id), searchParams]);
  const requested = firstQueryValue(query.status);
  const status =
    requested === "contacted" || requested === "enrolled" || requested === "all" ? requested : "new";
  const fresh = leads.filter((lead) => lead.status === "new").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Grow"
        title="Leads"
        description={
          fresh > 0
            ? `${fresh} ${fresh === 1 ? "family is" : "families are"} waiting for a call back. These are the enquiries the academy admin assigned to you.`
            : "Enquiries the academy admin assigns to you land here."
        }
      />
      <LeadsInbox leads={leads} status={status} />
    </div>
  );
}
