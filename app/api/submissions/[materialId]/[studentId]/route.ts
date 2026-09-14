import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCurrentStudent, getCurrentTeacher } from "@/lib/auth";
import { db, ensureDatabase } from "@/lib/db";
import { readPdf } from "@/lib/files";
import {
  batches,
  chapterMaterialAssignments,
  chapterMaterials,
} from "@/lib/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ materialId: string; studentId: string }> },
) {
  await ensureDatabase();
  const { materialId, studentId } = await params;
  const decodedMaterialId = decodeURIComponent(materialId);
  const decodedStudentId = decodeURIComponent(studentId);

  const teacher = await getCurrentTeacher();
  const student = teacher ? null : await getCurrentStudent();

  if (!teacher && !student) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (student && student.id !== decodedStudentId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [row] = teacher
    ? await db
        .select({
          submissionFileName: chapterMaterialAssignments.submissionFileName,
          submissionOriginalName:
            chapterMaterialAssignments.submissionOriginalName,
        })
        .from(chapterMaterialAssignments)
        .innerJoin(
          chapterMaterials,
          eq(chapterMaterialAssignments.materialId, chapterMaterials.id),
        )
        .innerJoin(batches, eq(chapterMaterials.batchId, batches.id))
        .where(
          and(
            eq(chapterMaterialAssignments.materialId, decodedMaterialId),
            eq(chapterMaterialAssignments.studentId, decodedStudentId),
            eq(batches.teacherId, teacher.id),
          ),
        )
        .limit(1)
    : await db
        .select({
          submissionFileName: chapterMaterialAssignments.submissionFileName,
          submissionOriginalName:
            chapterMaterialAssignments.submissionOriginalName,
        })
        .from(chapterMaterialAssignments)
        .where(
          and(
            eq(chapterMaterialAssignments.materialId, decodedMaterialId),
            eq(chapterMaterialAssignments.studentId, decodedStudentId),
            eq(chapterMaterialAssignments.studentId, student!.id),
          ),
        )
        .limit(1);

  if (!row?.submissionFileName) {
    notFound();
  }

  const file = await readPdf(row.submissionFileName);
  const fileName = row.submissionOriginalName ?? "assignment.pdf";

  return new Response(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName.replaceAll('"', "")}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
