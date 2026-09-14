import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { EnrollBatchStudentsForm } from "@/components/enroll-batch-students-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Surface } from "@/components/ui/surface";
import { requireTeacher } from "@/lib/auth";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import { batchPath, newStudentPath } from "@/lib/paths";
import { getOwnedBatch, getTeacherStudents } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Add students",
};

export default async function EnrollBatchStudentsPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const teacher = await requireTeacher();
  const [batch, studentList, catalog] = await Promise.all([
    getOwnedBatch(teacher.id, batchId),
    getTeacherStudents(teacher.id),
    getLookupCatalog(),
  ]);

  if (!batch) {
    notFound();
  }

  const available = studentList.filter(
    (student) => !student.batches.some((item) => item.id === batch.id),
  );

  if (studentList.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="No students in your directory"
        description="Create the first student straight into this batch. They get their own login."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild size="lg">
              <Link href={newStudentPath(batch.id)}>Create a new student</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={batchPath(batch.id)}>Back to batch</Link>
            </Button>
          </div>
        }
      />
    );
  }

  if (available.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="Everyone is already in this batch"
        description="Every student in your directory is already here. Create a new student to add someone else."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild size="lg">
              <Link href={newStudentPath(batch.id)}>Create a new student</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={batchPath(batch.id)}>Back to batch</Link>
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Batches", href: "/dashboard/batches" },
              { label: batch.name, href: batchPath(batch.id) },
              { label: "Add students" },
            ]}
          />
        }
        title={`Add students to ${batch.name}`}
        description="Pick people already in your directory, or create someone new straight into this batch."
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href={newStudentPath(batch.id)}>
              <Plus data-icon="inline-start" />
              New student
            </Link>
          </Button>
        }
      />
      <Surface pad="lg" className="max-w-3xl">
        <EnrollBatchStudentsForm
          students={available}
          batchId={batch.id}
          syllabuses={lookupChoices(catalog.syllabus)}
          exams={lookupChoices(catalog.exam)}
          cancelHref={batchPath(batch.id)}
        />
      </Surface>
    </div>
  );
}
