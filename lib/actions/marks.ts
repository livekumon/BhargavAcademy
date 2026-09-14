"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseMarks, parseOption } from "@/lib/academics";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import { requireStudent } from "@/lib/auth";
import { db, ensureDatabase } from "@/lib/db";
import { parseDateInput, startOfDateInput } from "@/lib/dates";
import { parentChildPath, studentMarksPath } from "@/lib/paths";
import { getStudentEnrollments } from "@/lib/queries";
import {
  batchCourses,
  chapters,
  studentBatches,
  studentChapterMarks,
  studentMarkChapters,
} from "@/lib/schema";

export type MarksState = {
  error?: string;
};

export async function addChapterMarks(
  _prev: MarksState,
  formData: FormData,
): Promise<MarksState> {
  const student = await requireStudent();
  await ensureDatabase();

  const batchId = String(formData.get("batchId") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const chapterIds = [
    ...new Set(
      formData
        .getAll("chapterIds")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  ];
  const catalog = await getLookupCatalog();
  const syllabus = parseOption(
    lookupChoices(catalog.syllabus),
    formData.get("syllabus"),
  );
  const examPaper = parseOption(
    lookupChoices(catalog.exam_paper),
    formData.get("examPaper"),
  );
  const marks = parseMarks(formData.get("marks"));
  const recordedDate = parseDateInput(String(formData.get("recordedAt") ?? ""));

  if (!batchId || !courseId) {
    return { error: "Select a batch and course first." };
  }
  if (chapterIds.length === 0) {
    return { error: "Select one or more chapters for this exam." };
  }
  if (!syllabus) {
    return { error: "Select a syllabus." };
  }
  if (!examPaper) {
    return { error: "Select an exam paper." };
  }
  if (marks === null) {
    return { error: "Enter marks between 0 and 500." };
  }
  if (!recordedDate) {
    return { error: "Choose the exam date." };
  }

  const [enrollment] = await db
    .select({ id: studentBatches.id })
    .from(studentBatches)
    .where(
      and(
        eq(studentBatches.studentId, student.id),
        eq(studentBatches.batchId, batchId),
      ),
    )
    .limit(1);
  if (!enrollment) {
    return { error: "You are not enrolled in that batch." };
  }

  const [attached] = await db
    .select({ id: batchCourses.id })
    .from(batchCourses)
    .where(
      and(eq(batchCourses.batchId, batchId), eq(batchCourses.courseId, courseId)),
    )
    .limit(1);
  if (!attached) {
    return { error: "That course is not in the selected batch." };
  }

  const courseChapters = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(
      and(eq(chapters.courseId, courseId), inArray(chapters.id, chapterIds)),
    );
  if (courseChapters.length !== chapterIds.length) {
    return { error: "One or more selected chapters are not in that course." };
  }

  const markId = crypto.randomUUID();
  await db.insert(studentChapterMarks).values({
    id: markId,
    studentId: student.id,
    batchId,
    syllabus,
    examPaper,
    marks,
    recordedAt: startOfDateInput(recordedDate),
    createdAt: new Date(),
  });
  await db.insert(studentMarkChapters).values(
    chapterIds.map((chapterId) => ({
      id: crypto.randomUUID(),
      markId,
      chapterId,
    })),
  );

  revalidatePath(studentMarksPath());
  revalidatePath("/parent");
  revalidatePath(parentChildPath(student.id));
  const enrollments = await getStudentEnrollments(student.id);
  for (const batch of enrollments) {
    revalidatePath(`/dashboard/batches/${batch.id}`);
  }

  redirect(studentMarksPath({ batchId, courseId, syllabus, examPaper }));
}
