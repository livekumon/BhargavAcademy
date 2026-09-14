"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { db, ensureDatabase } from "@/lib/db";
import { deletePdf, savePdf } from "@/lib/files";
import { isAssignment } from "@/lib/materials";
import {
  chapterPath,
  studentCoursePath,
  studentMaterialPath,
} from "@/lib/paths";
import { getStudentAssignedMaterial } from "@/lib/queries";
import { chapterMaterialAssignments } from "@/lib/schema";

export type ProgressState = {
  error?: string;
};

function getOptionalPdf(formData: FormData) {
  const pdf = formData.get("pdf");
  if (!(pdf instanceof File) || pdf.size === 0) {
    return null;
  }
  return pdf;
}

async function getOwnedAssignment(studentId: string, materialId: string) {
  const owned = await getStudentAssignedMaterial(studentId, materialId);
  if (!owned) return null;

  const [assignment] = await db
    .select()
    .from(chapterMaterialAssignments)
    .where(
      and(
        eq(chapterMaterialAssignments.materialId, owned.material.id),
        eq(chapterMaterialAssignments.studentId, studentId),
      ),
    )
    .limit(1);

  if (!assignment) return null;
  return { ...owned, assignment };
}

function revalidateProgress(
  batchId: string,
  courseId: string,
  chapterId: string,
  materialId: string,
) {
  revalidatePath("/student");
  revalidatePath(studentCoursePath(courseId));
  revalidatePath(studentMaterialPath(materialId));
  revalidatePath(chapterPath(batchId, courseId, chapterId));
}

export async function markClassMaterialComplete(
  materialId: string,
  _prev: ProgressState,
  _formData: FormData,
): Promise<ProgressState> {
  const student = await requireStudent();
  await ensureDatabase();

  const owned = await getOwnedAssignment(student.id, materialId);
  if (!owned) {
    return { error: "Material not found." };
  }

  if (isAssignment(owned.material.kind)) {
    return { error: "Upload your work to complete this assignment." };
  }

  await db
    .update(chapterMaterialAssignments)
    .set({ completedAt: new Date() })
    .where(eq(chapterMaterialAssignments.id, owned.assignment.id));

  revalidateProgress(
    owned.material.batchId,
    owned.course.id,
    owned.chapter.id,
    owned.material.id,
  );
  redirect(studentMaterialPath(owned.material.id));
}

export async function unmarkClassMaterialComplete(
  materialId: string,
  _prev: ProgressState,
  _formData: FormData,
): Promise<ProgressState> {
  const student = await requireStudent();
  await ensureDatabase();

  const owned = await getOwnedAssignment(student.id, materialId);
  if (!owned) {
    return { error: "Material not found." };
  }

  if (isAssignment(owned.material.kind)) {
    return { error: "Assignments stay complete after you upload your work." };
  }

  await db
    .update(chapterMaterialAssignments)
    .set({ completedAt: null })
    .where(eq(chapterMaterialAssignments.id, owned.assignment.id));

  revalidateProgress(
    owned.material.batchId,
    owned.course.id,
    owned.chapter.id,
    owned.material.id,
  );
  redirect(studentMaterialPath(owned.material.id));
}

export async function submitAssignment(
  materialId: string,
  _prev: ProgressState,
  formData: FormData,
): Promise<ProgressState> {
  const student = await requireStudent();
  await ensureDatabase();

  const owned = await getOwnedAssignment(student.id, materialId);
  if (!owned) {
    return { error: "Assignment not found." };
  }

  if (!isAssignment(owned.material.kind)) {
    return { error: "This file is class material, not an assignment." };
  }

  const pdf = getOptionalPdf(formData);
  if (!pdf) {
    return { error: "Upload your completed assignment as a PDF." };
  }

  try {
    const fileName = await savePdf(pdf);
    await deletePdf(owned.assignment.submissionFileName);

    await db
      .update(chapterMaterialAssignments)
      .set({
        completedAt: new Date(),
        submissionFileName: fileName,
        submissionOriginalName: pdf.name,
      })
      .where(eq(chapterMaterialAssignments.id, owned.assignment.id));

    revalidateProgress(
      owned.material.batchId,
      owned.course.id,
      owned.chapter.id,
      owned.material.id,
    );
    redirect(studentMaterialPath(owned.material.id));
  } catch (error) {
    unstable_rethrow(error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not upload your assignment.",
    };
  }
}
