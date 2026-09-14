"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { db, ensureDatabase } from "@/lib/db";
import { deletePdf } from "@/lib/files";
import { batchPath } from "@/lib/paths";
import {
  batchCourses,
  batches,
  chapterMaterials,
  studentBatches,
  students,
} from "@/lib/schema";
import {
  getOwnedCourseForTeacher,
  getOwnedStudentForTeacher,
} from "@/lib/queries";

export type BatchState = {
  error?: string;
};

export async function createBatch(
  _prev: BatchState,
  formData: FormData,
): Promise<BatchState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const studentIds = [
    ...new Set(
      formData.getAll("studentIds").map((value) => String(value).trim()),
    ),
  ].filter(Boolean);

  if (name.length < 2) {
    return { error: "Batch name is required." };
  }

  const course = await getOwnedCourseForTeacher(teacher.id, courseId);
  if (!course) {
    return { error: "Select a course. Every batch needs one." };
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(batches).values({
    id,
    teacherId: teacher.id,
    name,
    description,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(batchCourses).values({
    id: crypto.randomUUID(),
    batchId: id,
    courseId: course.id,
    createdAt: now,
  });

  for (const studentId of studentIds) {
    const owned = await getOwnedStudentForTeacher(teacher.id, studentId);
    if (!owned) continue;
    await db
      .insert(studentBatches)
      .values({
        id: crypto.randomUUID(),
        studentId,
        batchId: id,
        createdAt: now,
      })
      .onConflictDoNothing();
  }

  revalidatePath("/dashboard");
  redirect(batchPath(id));
}

export async function updateBatch(
  batchId: string,
  _prev: BatchState,
  formData: FormData,
): Promise<BatchState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (name.length < 2) {
    return { error: "Batch name is required." };
  }

  await db
    .update(batches)
    .set({ name, description, updatedAt: new Date() })
    .where(and(eq(batches.id, batchId), eq(batches.teacherId, teacher.id)));

  revalidatePath("/dashboard");
  revalidatePath(batchPath(batchId));
  redirect(batchPath(batchId));
}

export async function deleteBatch(batchId: string) {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const [owned] = await db
    .select({ id: batches.id })
    .from(batches)
    .where(and(eq(batches.id, batchId), eq(batches.teacherId, teacher.id)))
    .limit(1);
  if (!owned) {
    redirect("/dashboard");
  }

  const materials = await db
    .select()
    .from(chapterMaterials)
    .innerJoin(batches, eq(chapterMaterials.batchId, batches.id))
    .where(and(eq(batches.id, batchId), eq(batches.teacherId, teacher.id)));

  await Promise.all(
    materials.map((row) => deletePdf(row.chapter_materials.pdfFileName)),
  );

  const enrolled = await db
    .select({
      studentId: studentBatches.studentId,
      homeBatchId: students.batchId,
    })
    .from(studentBatches)
    .innerJoin(students, eq(studentBatches.studentId, students.id))
    .where(eq(studentBatches.batchId, batchId));

  for (const row of enrolled) {
    if (row.homeBatchId !== batchId) continue;

    const [other] = await db
      .select({ batchId: studentBatches.batchId })
      .from(studentBatches)
      .where(
        and(
          eq(studentBatches.studentId, row.studentId),
          ne(studentBatches.batchId, batchId),
        ),
      )
      .limit(1);

    if (other) {
      await db
        .update(students)
        .set({ batchId: other.batchId })
        .where(eq(students.id, row.studentId));
    }
  }

  await db
    .delete(batches)
    .where(and(eq(batches.id, batchId), eq(batches.teacherId, teacher.id)));

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
