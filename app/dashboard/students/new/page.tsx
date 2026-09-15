import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StudentForm } from "@/components/student-form";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Surface } from "@/components/ui/surface";
import { createStudent } from "@/lib/actions/students";
import { requireTeacher } from "@/lib/auth";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import { studentsPath } from "@/lib/paths";
import { getTeacherBatches } from "@/lib/queries";
import { firstQueryValue } from "@/lib/teacher-format";

export const metadata: Metadata = {
  title: "New student",
};

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const teacher = await requireTeacher();
  const query = await searchParams;
  const [batchList, catalog] = await Promise.all([getTeacherBatches(teacher.id), getLookupCatalog()]);
  const defaultBatchId = firstQueryValue(query.batchId);
  const leadId = firstQueryValue(query.leadId);
  const fromLead = Boolean(leadId);

  if (batchList.length === 0) {
    return (
      <EmptyState
        icon={<LayoutGrid />}
        title="Create a batch first"
        description="Every student joins at least one batch. Create a batch, then come back to add students."
        action={
          <Button asChild size="lg">
            <Link href="/dashboard/batches/new">Create a batch</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={
              fromLead
                ? [{ label: "Leads", href: "/dashboard/leads" }, { label: "Add as student" }]
                : [{ label: "Students", href: studentsPath() }, { label: "New student" }]
            }
          />
        }
        title={fromLead ? "Add this enquiry as a student" : "Add a student"}
        description={
          fromLead
            ? "We've filled in what the parent gave on the website. Saving marks the lead as enrolled."
            : "Choose the first batch they join. Logins for the student and parent are created as you save."
        }
      />
      <Surface pad="lg" className="max-w-3xl">
        <StudentForm
          action={createStudent.bind(null, null)}
          syllabuses={lookupChoices(catalog.syllabus)}
          exams={lookupChoices(catalog.exam)}
          batches={batchList.map((batch) => ({ id: batch.id, name: batch.name }))}
          defaultBatchId={batchList.some((batch) => batch.id === defaultBatchId) ? defaultBatchId : undefined}
          prefill={{
            name: firstQueryValue(query.name),
            contactNumber: firstQueryValue(query.phone),
            parentName: firstQueryValue(query.parent),
          }}
          leadId={leadId}
          next={studentsPath()}
          submitLabel="Add student"
          cancelHref={fromLead ? "/dashboard/leads" : studentsPath()}
        />
      </Surface>
    </div>
  );
}
