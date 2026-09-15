import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { deletePdf } from "./files";
import {
  chapterMaterialAssignments,
  chapterMaterials,
  studentBatches,
  students,
} from "./schema";

/*
 * Batch membership, shared by teacher actions and the admin console. These are
 * plain helpers, not server actions, so they never become public endpoints.
 */

export async function enrollInBatch(studentId: string, batchId: string) {
  await db
    .insert(studentBatches)
    .values({
      id: crypto.randomUUID(),
      studentId,
      batchId,
      createdAt: new Date(),
    })
    .onConflictDoNothing();
}

/**
 * Removes a student from one batch, with that batch's assignments and
 * submissions. A student left in no batch at all is deleted, matching how
 * teachers have always removed students.
 */
export async function unenrollFromBatch(studentId: string, batchId: string) {
  const assignments = await db
    .select({
      id: chapterMaterialAssignments.id,
      submissionFileName: chapterMaterialAssignments.submissionFileName,
    })
    .from(chapterMaterialAssignments)
    .innerJoin(
      chapterMaterials,
      eq(chapterMaterialAssignments.materialId, chapterMaterials.id),
    )
    .where(
      and(
        eq(chapterMaterialAssignments.studentId, studentId),
        eq(chapterMaterials.batchId, batchId),
      ),
    );

  await Promise.all(
    assignments.map((row) => deletePdf(row.submissionFileName)),
  );

  for (const row of assignments) {
    await db
      .delete(chapterMaterialAssignments)
      .where(eq(chapterMaterialAssignments.id, row.id));
  }

  await db
    .delete(studentBatches)
    .where(
      and(
        eq(studentBatches.studentId, studentId),
        eq(studentBatches.batchId, batchId),
      ),
    );

  const remaining = await db
    .select({ batchId: studentBatches.batchId })
    .from(studentBatches)
    .where(eq(studentBatches.studentId, studentId));

  if (remaining.length === 0) {
    await db.delete(students).where(eq(students.id, studentId));
    return;
  }

  const [student] = await db
    .select({ batchId: students.batchId })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (student && student.batchId === batchId) {
    await db
      .update(students)
      .set({ batchId: remaining[0].batchId })
      .where(eq(students.id, studentId));
  }
}
