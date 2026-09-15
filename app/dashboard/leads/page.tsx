import type { Metadata } from "next";
import { LeadsInbox } from "@/components/leads-inbox";
import { PageHeader } from "@/components/layout/page-header";
import { requireTeacher } from "@/lib/auth";
import { listLeadsForTeacher } from "@/lib/leads";

export const metadata: Metadata = {
  title: "Leads",
};

export default async function LeadsPage() {
  const teacher = await requireTeacher();
  const leads = await listLeadsForTeacher(teacher.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Enquiries"
        title="Your leads"
        description="Enquiries the academy admin has passed to you. Call the parent back, then mark the lead as contacted."
      />
      <LeadsInbox
        leads={leads}
        emptyDescription="When the admin assigns a website enquiry to you, it will show up here."
      />
    </div>
  );
}
