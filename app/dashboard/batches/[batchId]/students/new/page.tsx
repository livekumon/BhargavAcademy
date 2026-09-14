import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { EnrollBatchStudentsForm } from "@/components/enroll-batch-students-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        description="New students are added from the Students tab. After you add someone, come back here to enroll them in this batch."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild size="lg">
              <Link href={newStudentPath()}>Go to Students</Link>
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
        description="Every student in your directory is enrolled here. Add someone new from the Students tab, then enroll them."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild size="lg">
              <Link href={newStudentPath()}>Go to Students</Link>
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
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">
          Add students to {batch.name}
        </CardTitle>
        <CardDescription>
          Select people from your directory. New student profiles are created
          only from the Students tab.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EnrollBatchStudentsForm
          students={available}
          batchId={batch.id}
          syllabuses={lookupChoices(catalog.syllabus)}
          exams={lookupChoices(catalog.exam)}
          cancelHref={batchPath(batch.id)}
        />
      </CardContent>
    </Card>
  );
}
