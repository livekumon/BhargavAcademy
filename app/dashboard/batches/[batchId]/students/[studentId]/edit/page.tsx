import { redirect } from "next/navigation";
import { studentManagePath } from "@/lib/paths";

/** Student editing lives on the student's profile now. Kept so old links still work. */
export default async function EditBatchStudentPage({
  params,
}: {
  params: Promise<{ batchId: string; studentId: string }>;
}) {
  const { studentId } = await params;
  redirect(`${studentManagePath(studentId)}?tab=profile`);
}
