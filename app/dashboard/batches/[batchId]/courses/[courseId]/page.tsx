import { redirect } from "next/navigation";
import { batchPath } from "@/lib/paths";

/** A batch's course now lives in the batch's Chapters tab. Kept so old links still work. */
export default async function BatchCoursePage({
  params,
}: {
  params: Promise<{ batchId: string; courseId: string }>;
}) {
  const { batchId } = await params;
  redirect(`${batchPath(batchId)}?tab=chapters`);
}
