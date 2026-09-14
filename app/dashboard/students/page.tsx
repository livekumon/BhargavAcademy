import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  StudentDirectory,
  type DirectoryView,
} from "@/components/student-directory";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireTeacher } from "@/lib/auth";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import { newStudentPath } from "@/lib/paths";
import { getTeacherBatches, getTeacherStudents } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Students",
};

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const teacher = await requireTeacher();
  const query = await searchParams;
  const [studentList, catalog, batchList] = await Promise.all([
    getTeacherStudents(teacher.id),
    getLookupCatalog(),
    getTeacherBatches(teacher.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="People"
        title="Students"
        description={
          studentList.length > 0
            ? `${studentList.length} ${studentList.length === 1 ? "student" : "students"} across ${batchList.length} ${batchList.length === 1 ? "batch" : "batches"}. Select several to enroll them together.`
            : "Add a student once, then enroll them in as many batches as they need."
        }
        actions={
          <Button asChild size="lg">
            <Link href={newStudentPath()}>
              <Plus data-icon="inline-start" />
              New student
            </Link>
          </Button>
        }
      />

      {studentList.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No students yet"
          description="Add a student and put them in a batch. You can enroll the same student in more than one batch later."
          action={
            <Button asChild size="lg">
              <Link href={newStudentPath()}>Add your first student</Link>
            </Button>
          }
        />
      ) : (
        <StudentDirectory
          students={studentList}
          view={toDirectoryView(query.view)}
          syllabuses={lookupChoices(catalog.syllabus)}
          exams={lookupChoices(catalog.exam)}
          batches={batchList.map((batch) => ({ id: batch.id, name: batch.name }))}
        />
      )}
    </div>
  );
}

function toDirectoryView(value: string | string[] | undefined): DirectoryView {
  const view = Array.isArray(value) ? value[0] : value;
  return view === "list" || view === "table" ? view : "cards";
}
