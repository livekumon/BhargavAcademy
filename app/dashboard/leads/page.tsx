import type { Metadata } from "next";
import { LeadsInbox } from "@/components/leads-inbox";
import { PageHeader } from "@/components/layout/page-header";
import { requireTeacher } from "@/lib/auth";
import { listLeads } from "@/lib/leads";

export const metadata: Metadata = {
  title: "Leads",
};

export default async function LeadsPage() {
  await requireTeacher();
  const leads = await listLeads();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Enquiries"
        title="Website leads"
        description="Every enroll form submitted on bhargavacademy.com lands here so you can call the parent back."
      />
      <LeadsInbox leads={leads} />
    </div>
  );
}
