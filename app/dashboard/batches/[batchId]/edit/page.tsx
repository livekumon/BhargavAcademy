import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BatchForm } from "@/components/batch-form";
import { FormPage } from "@/components/teacher/form-page";
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
    <FormPage
      crumbs={[{ label: "Batches", href: "/dashboard/batches" }, { label: batch.name, href: `/dashboard/batches/${batch.id}` }, { label: "Edit" }]}
      title={<>Edit batch</>}
      description={<>Update the batch name or description.</>}
    >
        <BatchForm
          action={updateBatch.bind(null, batch.id)}
          defaultValues={{
            name: batch.name,
            description: batch.description,
          }}
          submitLabel="Save changes"
          cancelHref={batchPath(batch.id)}
        />
      </FormPage>
  );
}
