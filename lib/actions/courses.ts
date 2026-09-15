"use server";

import { flash } from "@/lib/flash";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { db, ensureDatabase } from "@/lib/db";
import { deletePdf } from "@/lib/files";
import { batchPath, coursePath } from "@/lib/paths";
import {
  getOwnedBatch,
  getOwnedCourse,
  getOwnedCourseForTeacher,
} from "@/lib/queries";
import { batchCourses, chapterMaterials, chapters, courses } from "@/lib/schema";
import { deleteSubmissionsForMaterials } from "@/lib/submissions";

export type CourseState = {
  error?: string;
};

async function deleteCourseMaterials(courseId: string) {
  const materials = await db
    .select({ pdfFileName: chapterMaterials.pdfFileName })
    .from(chapterMaterials)
    .innerJoin(chapters, eq(chapterMaterials.chapterId, chapters.id))
    .where(eq(chapters.courseId, courseId));

  await Promise.all(materials.map((row) => deletePdf(row.pdfFileName)));
}

export async function createCourse(
  batchId: string | null,
  _prev: CourseState,
  formData: FormData,
): Promise<CourseState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  if (batchId) {
    const batch = await getOwnedBatch(teacher.id, batchId);
    if (!batch) {
      return { error: "Batch not found." };
    }
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (title.length < 2) {
    return { error: "Course title is required." };
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(courses).values({
    id,
    teacherId: teacher.id,
    title,
    description,
    createdAt: now,
    updatedAt: now,
  });

  if (batchId) {
    const [linked] = await db
      .select({ id: batchCourses.id })
      .from(batchCourses)
      .where(eq(batchCourses.batchId, batchId))
      .limit(1);
    if (linked) {
      return { error: "This batch already has a course." };
    }
    await db.insert(batchCourses).values({
      id: crypto.randomUUID(),
      batchId,
      courseId: id,
      createdAt: now,
    });
    revalidatePath("/dashboard/courses");
    revalidatePath(batchPath(batchId));
    await flash(`${title} created`);
    redirect(batchPath(batchId));
  }

  revalidatePath("/dashboard/courses");
  await flash(`${title} created`, { description: "Add chapters next." });
  redirect(`/dashboard/courses/${id}`);
}

export async function attachCourseToBatch(
  batchId: string,
  _prev: CourseState,
  formData: FormData,
): Promise<CourseState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const batch = await getOwnedBatch(teacher.id, batchId);
  if (!batch) {
    return { error: "Batch not found." };
  }

  const [linked] = await db
    .select({ id: batchCourses.id })
    .from(batchCourses)
    .where(eq(batchCourses.batchId, batchId))
    .limit(1);
  if (linked) {
    return { error: "This batch already has a course." };
  }

  const courseId = String(formData.get("courseId") ?? "");
  const course = await getOwnedCourseForTeacher(teacher.id, courseId);
  if (!course) {
    return { error: "Choose a course to attach." };
  }

  await db.insert(batchCourses).values({
    id: crypto.randomUUID(),
    batchId,
    courseId,
    createdAt: new Date(),
  });
  revalidatePath(batchPath(batchId));
  await flash(`${course.title} attached to ${batch.name}`);
  redirect(batchPath(batchId));
}

export async function updateCourse(
  batchId: string | null,
  courseId: string,
  _prev: CourseState,
  formData: FormData,
): Promise<CourseState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const course = await getOwnedCourseForTeacher(teacher.id, courseId);
  if (!course) {
    return { error: "Course not found." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (title.length < 2) {
    return { error: "Course title is required." };
  }

  await db
    .update(courses)
    .set({ title, description, updatedAt: new Date() })
    .where(and(eq(courses.id, courseId), eq(courses.teacherId, teacher.id)));

  revalidatePath("/dashboard/courses");
  if (batchId) {
    revalidatePath(batchPath(batchId));
    revalidatePath(coursePath(batchId, courseId));
    await flash("Course saved");
    redirect(coursePath(batchId, courseId));
  }

  await flash("Course saved");
  redirect(`/dashboard/courses/${courseId}`);
}

export async function detachCourse(batchId: string, courseId: string) {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const owned = await getOwnedCourse(teacher.id, batchId, courseId);
  if (!owned) {
    redirect(batchPath(batchId));
  }

  const materials = await db
    .select()
    .from(chapterMaterials)
    .innerJoin(chapters, eq(chapterMaterials.chapterId, chapters.id))
    .where(
      and(eq(chapterMaterials.batchId, batchId), eq(chapters.courseId, courseId)),
    );

  await deleteSubmissionsForMaterials(
    materials.map((row) => row.chapter_materials.id),
  );
  await Promise.all(
    materials.map((row) => deletePdf(row.chapter_materials.pdfFileName)),
  );

  for (const row of materials) {
    await db
      .delete(chapterMaterials)
      .where(eq(chapterMaterials.id, row.chapter_materials.id));
  }

  await db
    .delete(batchCourses)
    .where(
      and(eq(batchCourses.batchId, batchId), eq(batchCourses.courseId, courseId)),
    );
  revalidatePath(batchPath(batchId));
  await flash(`${owned.course.title} detached`);
  redirect(batchPath(batchId));
}

export async function deleteCourse(courseId: string) {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const course = await getOwnedCourseForTeacher(teacher.id, courseId);
  if (!course) {
    redirect("/dashboard/courses");
  }

  await deleteCourseMaterials(courseId);
  await db
    .delete(courses)
    .where(and(eq(courses.id, courseId), eq(courses.teacherId, teacher.id)));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/courses");
  await flash("Course deleted");
  redirect("/dashboard/courses");
}
