import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { readFile } from "node:fs/promises";
import { getCurrentStudent, getCurrentTeacher } from "@/lib/auth";
import { db, ensureDatabase } from "@/lib/db";
import { getPdfPath } from "@/lib/files";
import {
  batches,
  chapterMaterialAssignments,
  chapterMaterials,
} from "@/lib/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ materialId: string }> },
) {
  await ensureDatabase();
  const materialId = decodeURIComponent((await params).materialId);

  const teacher = await getCurrentTeacher();
  const student = teacher ? null : await getCurrentStudent();

  if (!teacher && !student) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [row] = teacher
    ? await db
        .select({
          pdfFileName: chapterMaterials.pdfFileName,
          pdfOriginalName: chapterMaterials.pdfOriginalName,
        })
        .from(chapterMaterials)
        .innerJoin(batches, eq(chapterMaterials.batchId, batches.id))
        .where(
          and(
            eq(chapterMaterials.id, materialId),
            eq(batches.teacherId, teacher.id),
          ),
        )
        .limit(1)
    : await db
        .select({
          pdfFileName: chapterMaterials.pdfFileName,
          pdfOriginalName: chapterMaterials.pdfOriginalName,
        })
        .from(chapterMaterialAssignments)
        .innerJoin(
          chapterMaterials,
          eq(chapterMaterialAssignments.materialId, chapterMaterials.id),
        )
        .where(
          and(
            eq(chapterMaterials.id, materialId),
            eq(chapterMaterialAssignments.studentId, student!.id),
          ),
        )
        .limit(1);

  if (!row?.pdfFileName) {
    notFound();
  }

  const file = await readFile(getPdfPath(row.pdfFileName));
  const fileName = row.pdfOriginalName ?? "material.pdf";

  return new Response(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName.replaceAll('"', "")}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
