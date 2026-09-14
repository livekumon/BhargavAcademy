import { inArray } from "drizzle-orm";
import { db } from "./db";
import { deletePdf } from "./files";
import { chapterMaterialAssignments } from "./schema";

export async function deleteSubmissionsForMaterials(materialIds: string[]) {
  if (materialIds.length === 0) return;

  const rows = await db
    .select({
      submissionFileName: chapterMaterialAssignments.submissionFileName,
    })
    .from(chapterMaterialAssignments)
    .where(inArray(chapterMaterialAssignments.materialId, materialIds));

  await Promise.all(rows.map((row) => deletePdf(row.submissionFileName)));
}

export function formatCompletedAt(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
