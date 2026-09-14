import type { Metadata } from "next";
import { LeadsInbox } from "@/components/leads-inbox";
import { PageHeader } from "@/components/layout/page-header";
import { requireTeacher } from "@/lib/auth";
import { listLeads } from "@/lib/leads";
import { firstQueryValue } from "@/lib/teacher-format";

export const metadata: Metadata = {
  title: "Leads",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  await requireTeacher();
  const [leads, query] = await Promise.all([listLeads(), searchParams]);
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
            ? `${fresh} ${fresh === 1 ? "family is" : "families are"} waiting for a call back. Enquiries from the enrol form on bhargavacademy.com land here.`
            : "Enquiries from the enrol form on bhargavacademy.com land here."
        }
      />
      <LeadsInbox leads={leads} status={status} />
    </div>
  );
}
