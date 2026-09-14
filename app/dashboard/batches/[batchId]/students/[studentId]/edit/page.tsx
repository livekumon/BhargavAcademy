import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarksTimeline } from "@/components/marks-timeline";
import { StudentForm } from "@/components/student-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { optionLabel } from "@/lib/academics";
import { updateStudent } from "@/lib/actions/students";
import { requireTeacher } from "@/lib/auth";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import { batchPath } from "@/lib/paths";
import { getOwnedStudent, getStudentMarkEntries } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit student",
};

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ batchId: string; studentId: string }>;
}) {
  const { batchId, studentId } = await params;
  const teacher = await requireTeacher();
  const [owned, catalog] = await Promise.all([
    getOwnedStudent(teacher.id, batchId, studentId),
    getLookupCatalog(),
  ]);

  if (!owned) {
    notFound();
  }

  const marks = await getStudentMarkEntries(owned.student.id);
  const syllabuses = lookupChoices(catalog.syllabus);
  const exams = lookupChoices(catalog.exam);
  const examPapers = lookupChoices(catalog.exam_paper);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-3xl">Edit student</CardTitle>
        <CardDescription>
          Update contact details, syllabus, and the exam they are writing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StudentForm
          action={updateStudent.bind(null, owned.batch.id, owned.student.id)}
          syllabuses={syllabuses}
          exams={exams}
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
          cancelHref={batchPath(owned.batch.id)}
        />
      </CardContent>
    </Card>
    <Card id="marks">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">Chapter marks</CardTitle>
        <CardDescription>
          {owned.student.syllabus || owned.student.exam
            ? `${optionLabel(syllabuses, owned.student.syllabus) || "No syllabus"} · ${optionLabel(exams, owned.student.exam) || "No exam"}`
            : "Scores the student logged, with the exam date of each attempt."}
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
