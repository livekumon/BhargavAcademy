import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BatchForm } from "@/components/batch-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateBatch } from "@/lib/actions/batches";
import { requireTeacher } from "@/lib/auth";
import { batchPath } from "@/lib/paths";
import { getOwnedBatch } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit batch",
};

export default async function EditBatchPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  const teacher = await requireTeacher();
  const batch = await getOwnedBatch(teacher.id, batchId);

  if (!batch) {
    notFound();
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">Edit batch</CardTitle>
        <CardDescription>Update the batch name or description.</CardDescription>
      </CardHeader>
      <CardContent>
        <BatchForm
          action={updateBatch.bind(null, batch.id)}
          defaultValues={{
            name: batch.name,
            description: batch.description,
          }}
          submitLabel="Save changes"
          cancelHref={batchPath(batch.id)}
        />
      </CardContent>
    </Card>
  );
}
