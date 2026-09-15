import type { Metadata } from "next";
import { AddPersonForm } from "@/components/admin/add-person-form";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getPersonFormOptions } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";

export const metadata: Metadata = {
  title: "Add person",
};

export default async function AddPersonPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  await requireAdmin();
  const roleParam = (await searchParams).role;
  const role = roleParam === "student" || roleParam === "parent" ? roleParam : "teacher";
  const [options, catalog] = await Promise.all([getPersonFormOptions(), getLookupCatalog()]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "People", href: "/admin/people" }, { label: "Add person" }]} />}
        title="Add a person"
        description="Create a login for a teacher, student, or parent. You can change their access, batches, or children later from their profile."
      />
      <AddPersonForm
        defaultRole={role}
        batches={options.batches.map((batch) => ({
          id: batch.id,
          label: batch.name,
          detail: batch.teacherName ? `Teacher: ${batch.teacherName}` : undefined,
        }))}
        students={options.students.map((student) => ({
          id: student.id,
          label: student.name,
          detail: student.parentName
            ? `${student.email} · currently linked to ${student.parentName}`
            : student.email,
        }))}
        syllabuses={lookupChoices(catalog.syllabus)}
        exams={lookupChoices(catalog.exam)}
      />
    </div>
  );
}
