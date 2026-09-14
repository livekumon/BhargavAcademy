"use server";

import { flash } from "@/lib/flash";
import { and, asc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { db, ensureDatabase } from "@/lib/db";
import { deletePdf, savePdf } from "@/lib/files";
import {
  batchPath,
  chapterPath,
  coursePath,
  libraryChapterPath,
  libraryCoursePath,
} from "@/lib/paths";
import { parseMaterialKind, type MaterialKind } from "@/lib/materials";
import {
  getBatchCourse,
  getBatchStudents,
  getOwnedCourse,
  getOwnedCourseForTeacher,
} from "@/lib/queries";
import { deleteSubmissionsForMaterials } from "@/lib/submissions";
import {
  chapterMaterialAssignments,
  chapterMaterials,
  chapters,
  studentBatches,
} from "@/lib/schema";

export type ChapterState = {
  error?: string;
};

function getOptionalPdf(formData: FormData) {
  const pdf = formData.get("pdf");
  if (!(pdf instanceof File) || pdf.size === 0) {
    return null;
  }
  return pdf;
}

function getSelectedStudentIds(formData: FormData) {
  return formData
    .getAll("studentIds")
    .map((value) => String(value))
    .filter(Boolean);
}

function readMaterialKind(formData: FormData):
  | { kind: MaterialKind; instructions: string }
  | { error: string } {
  const kind = parseMaterialKind(formData.get("kind"));
  const instructions = String(formData.get("instructions") ?? "").trim();

  if (kind === "assignment" && instructions.length < 2) {
    return {
      error: "Write assignment instructions so students know what to solve.",
    };
  }

  return {
    kind,
    instructions: kind === "assignment" ? instructions : "",
  };
}

async function addBatchPdf(
  batchId: string,
  chapterId: string,
  file: File,
  kind: MaterialKind,
  instructions: string,
) {
  const nextFileName = await savePdf(file);
  const [next] = await db
    .select({ value: max(chapterMaterials.position) })
    .from(chapterMaterials)
    .where(
      and(
        eq(chapterMaterials.batchId, batchId),
        eq(chapterMaterials.chapterId, chapterId),
      ),
    );

  const id = crypto.randomUUID();
  await db.insert(chapterMaterials).values({
    id,
    batchId,
    chapterId,
    pdfFileName: nextFileName,
    pdfOriginalName: file.name,
    kind,
    instructions,
    position: (next?.value ?? 0) + 1,
    updatedAt: new Date(),
  });
  return id;
}

async function replaceMaterialAssignments(
  materialId: string,
  batchId: string,
  studentIds: string[],
) {
  const batchStudents = await db
    .select({ id: studentBatches.studentId })
    .from(studentBatches)
    .where(eq(studentBatches.batchId, batchId));
  const allowed = new Set(batchStudents.map((student) => student.id));
  const uniqueIds = [...new Set(studentIds)].filter((id) => allowed.has(id));
  const nextIds = new Set(uniqueIds);

  const existing = await db
    .select()
    .from(chapterMaterialAssignments)
    .where(eq(chapterMaterialAssignments.materialId, materialId));

  for (const row of existing) {
    if (nextIds.has(row.studentId)) continue;
    await deletePdf(row.submissionFileName);
    await db
      .delete(chapterMaterialAssignments)
      .where(eq(chapterMaterialAssignments.id, row.id));
  }

  const existingIds = new Set(existing.map((row) => row.studentId));
  const now = new Date();
  const toInsert = uniqueIds.filter((studentId) => !existingIds.has(studentId));

  if (toInsert.length === 0) return;

  await db.insert(chapterMaterialAssignments).values(
    toInsert.map((studentId) => ({
      id: crypto.randomUUID(),
      materialId,
      studentId,
      createdAt: now,
    })),
  );
}

async function saveNewPdfAndAssignments(
  batchId: string,
  chapterId: string,
  pdf: File | null,
  studentIds: string[],
  kind: MaterialKind,
  instructions: string,
) {
  if (!pdf) {
    if (studentIds.length > 0) {
      throw new Error("Upload a PDF before assigning it to students.");
    }
    return;
  }

  const materialId = await addBatchPdf(
    batchId,
    chapterId,
    pdf,
    kind,
    instructions,
  );
  await replaceMaterialAssignments(materialId, batchId, studentIds);
}

export async function createChapter(
  batchId: string,
  courseId: string,
  _prev: ChapterState,
  formData: FormData,
): Promise<ChapterState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const owned = await getOwnedCourse(teacher.id, batchId, courseId);
  if (!owned) {
    return { error: "Course not found." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (title.length < 2) {
    return { error: "Chapter title is required." };
  }

  try {
    const pdf = getOptionalPdf(formData);
    const studentIds = getSelectedStudentIds(formData);
    const kindFields = pdf ? readMaterialKind(formData) : null;
    if (kindFields && "error" in kindFields) {
      return { error: kindFields.error };
    }
    const [next] = await db
      .select({ value: max(chapters.position) })
      .from(chapters)
      .where(eq(chapters.courseId, courseId));

    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(chapters).values({
      id,
      courseId,
      title,
      description,
      position: (next?.value ?? 0) + 1,
      createdAt: now,
      updatedAt: now,
    });

    await saveNewPdfAndAssignments(
      batchId,
      id,
      pdf,
      studentIds,
      kindFields?.kind ?? "class_material",
      kindFields?.instructions ?? "",
    );

    revalidatePath(libraryCoursePath(courseId));
    revalidatePath(coursePath(batchId, courseId));
    await flash(`${title} added`);
    redirect(chapterPath(batchId, courseId, id));
  } catch (error) {
    unstable_rethrow(error);
    return {
      error: error instanceof Error ? error.message : "Could not save chapter.",
    };
  }
}

export async function updateChapter(
  batchId: string,
  courseId: string,
  chapterId: string,
  _prev: ChapterState,
  formData: FormData,
): Promise<ChapterState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const owned = await getOwnedCourse(teacher.id, batchId, courseId);
  if (!owned) {
    return { error: "Course not found." };
  }

  const [chapter] = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.id, chapterId), eq(chapters.courseId, courseId)))
    .limit(1);

  if (!chapter) {
    return { error: "Chapter not found." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (title.length < 2) {
    return { error: "Chapter title is required." };
  }

  try {
    await db
      .update(chapters)
      .set({
        title,
        description,
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, chapterId));

    revalidatePath(libraryCoursePath(courseId));
    revalidatePath(coursePath(batchId, courseId));
    revalidatePath(chapterPath(batchId, courseId, chapterId));
    await flash("Chapter saved");
    redirect(chapterPath(batchId, courseId, chapterId));
  } catch (error) {
    unstable_rethrow(error);
    return {
      error: error instanceof Error ? error.message : "Could not update chapter.",
    };
  }
}

export type BatchUploadState = {
  error?: string;
  ok?: boolean;
  at?: number;
  chapterId?: string;
};

export async function uploadBatchMaterial(
  batchId: string,
  chapterId: string,
  _prev: BatchUploadState,
  formData: FormData,
): Promise<BatchUploadState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const course = await getBatchCourse(batchId);
  const owned = course
    ? await getOwnedCourse(teacher.id, batchId, course.id)
    : null;
  if (!owned) {
    return { error: "This batch needs a course before you can upload." };
  }

  const [chapter] = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(and(eq(chapters.id, chapterId), eq(chapters.courseId, course.id)))
    .limit(1);
  if (!chapter) {
    return { error: "Chapter not found." };
  }

  const pdf = getOptionalPdf(formData);
  if (!pdf) {
    return { error: "Choose a PDF to upload." };
  }

  const kindFields = readMaterialKind(formData);
  if ("error" in kindFields) {
    return { error: kindFields.error };
  }

  try {
    const enrolled = await getBatchStudents(batchId);
    await saveNewPdfAndAssignments(
      batchId,
      chapterId,
      pdf,
      enrolled.map((student) => student.id),
      kindFields.kind,
      kindFields.instructions,
    );
    revalidatePath("/dashboard");
    revalidatePath(batchPath(batchId));
    revalidatePath(coursePath(batchId, course.id));
    revalidatePath(chapterPath(batchId, course.id, chapterId));
    await flash(`${pdf.name} uploaded`, { description: `${kindFields.kind === "assignment" ? "Assignment" : "Class material"} for ${enrolled.length} ${enrolled.length === 1 ? "student" : "students"}.` });
    return { ok: true, at: Date.now(), chapterId };
  } catch (error) {
    unstable_rethrow(error);
    return {
      error: error instanceof Error ? error.message : "Could not upload PDF.",
    };
  }
}

export async function addChapterPdf(
  batchId: string,
  courseId: string,
  chapterId: string,
  _prev: ChapterState,
  formData: FormData,
): Promise<ChapterState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const owned = await getOwnedCourse(teacher.id, batchId, courseId);
  if (!owned) {
    return { error: "Course not found." };
  }

  const pdf = getOptionalPdf(formData);
  if (!pdf) {
    return { error: "Choose a PDF to upload." };
  }

  const kindFields = readMaterialKind(formData);
  if ("error" in kindFields) {
    return { error: kindFields.error };
  }

  try {
    await saveNewPdfAndAssignments(
      batchId,
      chapterId,
      pdf,
      getSelectedStudentIds(formData),
      kindFields.kind,
      kindFields.instructions,
    );
    revalidatePath(coursePath(batchId, courseId));
    revalidatePath(chapterPath(batchId, courseId, chapterId));
    await flash(`${pdf.name} uploaded`);
    redirect(chapterPath(batchId, courseId, chapterId));
  } catch (error) {
    unstable_rethrow(error);
    return {
      error: error instanceof Error ? error.message : "Could not upload PDF.",
    };
  }
}

export async function updateChapterPdfAssignments(
  batchId: string,
  courseId: string,
  chapterId: string,
  materialId: string,
  _prev: ChapterState,
  formData: FormData,
): Promise<ChapterState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const owned = await getOwnedCourse(teacher.id, batchId, courseId);
  if (!owned) {
    return { error: "Course not found." };
  }

  const [material] = await db
    .select()
    .from(chapterMaterials)
    .where(
      and(
        eq(chapterMaterials.id, materialId),
        eq(chapterMaterials.batchId, batchId),
        eq(chapterMaterials.chapterId, chapterId),
      ),
    )
    .limit(1);

  if (!material) {
    return { error: "PDF not found." };
  }

  const kindFields = readMaterialKind(formData);
  if ("error" in kindFields) {
    return { error: kindFields.error };
  }

  await db
    .update(chapterMaterials)
    .set({
      kind: kindFields.kind,
      instructions: kindFields.instructions,
      updatedAt: new Date(),
    })
    .where(eq(chapterMaterials.id, material.id));

  await replaceMaterialAssignments(
    material.id,
    batchId,
    getSelectedStudentIds(formData),
  );
  revalidatePath(coursePath(batchId, courseId));
  revalidatePath(chapterPath(batchId, courseId, chapterId));
  await flash("Material saved");
  redirect(`${chapterPath(batchId, courseId, chapterId)}?material=${material.id}`);
}

export async function removeChapterPdf(
  batchId: string,
  courseId: string,
  chapterId: string,
  materialId: string,
) {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const owned = await getOwnedCourse(teacher.id, batchId, courseId);
  if (!owned) return;

  const [material] = await db
    .select()
    .from(chapterMaterials)
    .where(
      and(
        eq(chapterMaterials.id, materialId),
        eq(chapterMaterials.batchId, batchId),
        eq(chapterMaterials.chapterId, chapterId),
      ),
    )
    .limit(1);

  if (!material) return;

  await deleteSubmissionsForMaterials([material.id]);
  await deletePdf(material.pdfFileName);
  await db.delete(chapterMaterials).where(eq(chapterMaterials.id, material.id));
  await flash(`${material.pdfOriginalName ?? "PDF"} removed`);

  revalidatePath(coursePath(batchId, courseId));
  revalidatePath(chapterPath(batchId, courseId, chapterId));
}

async function deleteSharedChapter(courseId: string, chapterId: string) {
  const materials = await db
    .select()
    .from(chapterMaterials)
    .where(eq(chapterMaterials.chapterId, chapterId));

  await deleteSubmissionsForMaterials(materials.map((row) => row.id));
  await Promise.all(materials.map((row) => deletePdf(row.pdfFileName)));
  await db.delete(chapters).where(eq(chapters.id, chapterId));
  revalidatePath(libraryCoursePath(courseId));
}

export async function deleteChapter(
  batchId: string,
  courseId: string,
  chapterId: string,
) {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const course = await getOwnedCourseForTeacher(teacher.id, courseId);
  if (!course) {
    redirect("/dashboard");
  }

  await deleteSharedChapter(courseId, chapterId);
  revalidatePath(coursePath(batchId, courseId));
  await flash("Chapter deleted");
  redirect(`${batchPath(batchId)}?tab=chapters`);
}

export async function createLibraryChapter(
  courseId: string,
  _prev: ChapterState,
  formData: FormData,
): Promise<ChapterState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const course = await getOwnedCourseForTeacher(teacher.id, courseId);
  if (!course) {
    return { error: "Course not found." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (title.length < 2) {
    return { error: "Chapter title is required." };
  }

  const [next] = await db
    .select({ value: max(chapters.position) })
    .from(chapters)
    .where(eq(chapters.courseId, courseId));

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(chapters).values({
    id,
    courseId,
    title,
    description,
    position: (next?.value ?? 0) + 1,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath(libraryCoursePath(courseId));
  await flash(`${title} added`);
  redirect(libraryChapterPath(courseId, id));
}

export async function updateLibraryChapter(
  courseId: string,
  chapterId: string,
  _prev: ChapterState,
  formData: FormData,
): Promise<ChapterState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const course = await getOwnedCourseForTeacher(teacher.id, courseId);
  if (!course) {
    return { error: "Course not found." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (title.length < 2) {
    return { error: "Chapter title is required." };
  }

  await db
    .update(chapters)
    .set({
      title,
      description,
      updatedAt: new Date(),
    })
    .where(and(eq(chapters.id, chapterId), eq(chapters.courseId, courseId)));

  revalidatePath(libraryCoursePath(courseId));
  revalidatePath(libraryChapterPath(courseId, chapterId));
  await flash("Chapter saved");
  redirect(libraryChapterPath(courseId, chapterId));
}

export async function deleteLibraryChapter(courseId: string, chapterId: string) {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const course = await getOwnedCourseForTeacher(teacher.id, courseId);
  if (!course) {
    redirect("/dashboard/courses");
  }

  await deleteSharedChapter(courseId, chapterId);
  await flash("Chapter deleted");
  redirect(libraryCoursePath(courseId));
}

/** Swap a chapter with its neighbour. Order is shared by every batch using the course. */
export async function moveLibraryChapter(courseId: string, chapterId: string, direction: "up" | "down") {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const course = await getOwnedCourseForTeacher(teacher.id, courseId);
  if (!course) return;

  const ordered = await db
    .select({ id: chapters.id, position: chapters.position })
    .from(chapters)
    .where(eq(chapters.courseId, courseId))
    .orderBy(asc(chapters.position), asc(chapters.createdAt));

  const index = ordered.findIndex((chapter) => chapter.id === chapterId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= ordered.length) return;

  // Rewrite positions densely so legacy duplicates can't block a swap.
  const next = [...ordered];
  [next[index], next[swapWith]] = [next[swapWith], next[index]];
  for (const [position, chapter] of next.entries()) {
    await db.update(chapters).set({ position: position + 1 }).where(eq(chapters.id, chapter.id));
  }

  revalidatePath(libraryCoursePath(courseId));
  revalidatePath("/dashboard", "layout");
}
