import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrollStudentForm } from "@/components/enroll-student-form";
import { MarksTimeline } from "@/components/marks-timeline";
import { StudentForm } from "@/components/student-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { optionLabel } from "@/lib/academics";
import { deleteStudent, updateDirectoryStudent } from "@/lib/actions/students";
import { requireTeacher } from "@/lib/auth";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import { batchPath, studentManagePath, studentsPath } from "@/lib/paths";
import {
  getOwnedStudentForTeacher,
  getStudentMarkEntries,
  getTeacherBatches,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Manage student",
};

export default async function ManageStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const teacher = await requireTeacher();
  const [owned, catalog, batchList] = await Promise.all([
    getOwnedStudentForTeacher(teacher.id, studentId),
    getLookupCatalog(),
    getTeacherBatches(teacher.id),
  ]);

  if (!owned) {
    notFound();
  }

  const marks = await getStudentMarkEntries(owned.student.id);
  const syllabuses = lookupChoices(catalog.syllabus);
  const exams = lookupChoices(catalog.exam);
  const examPapers = lookupChoices(catalog.exam_paper);
  const availableBatches = batchList.filter(
    (batch) => !owned.batches.some((enrolled) => enrolled.id === batch.id),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href={studentsPath()}>Back to students</Link>
        </Button>
        <p className="text-sm font-medium text-primary">Student</p>
        <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
          {owned.student.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {optionLabel(syllabuses, owned.student.syllabus) || "No syllabus"} ·{" "}
          {optionLabel(exams, owned.student.exam) || "No exam"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-3xl">Profile</CardTitle>
          <CardDescription>
            Update contact details, syllabus, exam, and logins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentForm
            action={updateDirectoryStudent.bind(null, owned.student.id)}
            syllabuses={syllabuses}
            exams={exams}
            next={studentManagePath(owned.student.id)}
            defaultValues={{
              name: owned.student.name,
              contactNumber: owned.student.contactNumber,
              email: owned.student.email,
              parentName: owned.parent?.name,
              parentEmail: owned.parent?.email,
              syllabus: owned.student.syllabus,
              exam: owned.student.exam,
            }}
            submitLabel="Save student"
            cancelHref={studentsPath()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-3xl">Batches</CardTitle>
          <CardDescription>
            Enroll the same student in more than one batch without copying their
            profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {owned.batches.map((batch) => (
              <li
                key={batch.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2"
              >
                <Link
                  href={batchPath(batch.id)}
                  className="font-medium hover:underline"
                >
                  {batch.name}
                </Link>
                <form action={deleteStudent.bind(null, batch.id, owned.student.id)}>
                  <input
                    type="hidden"
                    name="next"
                    value={
                      owned.batches.length === 1
                        ? studentsPath()
                        : studentManagePath(owned.student.id)
                    }
                  />
                  <ConfirmSubmitButton
                    message={`Remove ${owned.student.name} from ${batch.name}?`}
                    variant="outline"
                  >
                    Remove
                  </ConfirmSubmitButton>
                </form>
              </li>
            ))}
          </ul>
          <EnrollStudentForm
            studentId={owned.student.id}
            batches={availableBatches.map((batch) => ({
              id: batch.id,
              name: batch.name,
            }))}
          />
        </CardContent>
      </Card>

      <Card id="marks">
        <CardHeader>
          <CardTitle className="font-heading text-3xl">Chapter marks</CardTitle>
          <CardDescription>
            Scores this student logged, with the exam date of each attempt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarksTimeline
            entries={marks}
            showContext
            syllabuses={syllabuses}
            examPapers={examPapers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
