import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { StudentForm } from "@/components/student-form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createStudent } from "@/lib/actions/students";
import { requireTeacher } from "@/lib/auth";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import { studentsPath } from "@/lib/paths";
import { getTeacherBatches } from "@/lib/queries";

export const metadata: Metadata = {
  title: "New student",
};

export default async function NewStudentDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ batchId?: string | string[] }>;
}) {
  const teacher = await requireTeacher();
  const query = await searchParams;
  const [batchList, catalog] = await Promise.all([
    getTeacherBatches(teacher.id),
    getLookupCatalog(),
  ]);
  const defaultBatchId = Array.isArray(query.batchId)
    ? query.batchId[0]
    : query.batchId;

  if (batchList.length === 0) {
    return (
      <EmptyState
        icon={<LayoutGrid />}
        title="Create a batch first"
        description="Students belong to a batch. Add a batch, then come back to enroll someone."
        action={
          <Button asChild size="lg">
            <Link href="/dashboard/batches/new">Create a batch</Link>
          </Button>
        }
      />
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">Add a student</CardTitle>
        <CardDescription>
          Choose the first batch they join. You can enroll them in more batches
          from their page after you save.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StudentForm
          action={createStudent.bind(null, null)}
          syllabuses={lookupChoices(catalog.syllabus)}
          exams={lookupChoices(catalog.exam)}
          batches={batchList.map((batch) => ({ id: batch.id, name: batch.name }))}
          defaultBatchId={
            batchList.some((batch) => batch.id === defaultBatchId)
              ? defaultBatchId
              : undefined
          }
          next={studentsPath()}
          submitLabel="Add student"
          cancelHref={studentsPath()}
        />
      </CardContent>
    </Card>
  );
}
