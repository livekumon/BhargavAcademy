import { and, desc, eq, gte, isNotNull } from "drizzle-orm";
import { db, ensureDatabase } from "./db";
import { isAssignment } from "./materials";
import {
  batches,
  chapterMaterialAssignments,
  chapterMaterials,
  chapters,
  courses,
  studentChapterMarks,
  students,
} from "./schema";

/*
 * Read models for the redesigned teacher screens: what happened recently,
 * and per-student / per-chapter signals the progress tables need. Kept apart
 * from lib/queries.ts so each screen's data needs are easy to find.
 */

export type RecentWork = {
  id: string;
  type: "revised" | "submitted";
  at: Date;
  studentId: string;
  studentName: string;
  batchId: string;
  batchName: string;
  courseId: string;
  chapterId: string;
  chapterTitle: string;
  materialId: string;
  materialName: string;
  hasSubmission: boolean;
};

/** Completed class material and submitted assignments across the teacher's batches, newest first. */
export async function getTeacherRecentWork(teacherId: string, limit = 30): Promise<RecentWork[]> {
  await ensureDatabase();

  const rows = await db
    .select({
      id: chapterMaterialAssignments.id,
      completedAt: chapterMaterialAssignments.completedAt,
      submissionFileName: chapterMaterialAssignments.submissionFileName,
      studentId: students.id,
      studentName: students.name,
      batchId: batches.id,
      batchName: batches.name,
      courseId: courses.id,
      chapterId: chapters.id,
      chapterTitle: chapters.title,
      materialId: chapterMaterials.id,
      materialName: chapterMaterials.pdfOriginalName,
      kind: chapterMaterials.kind,
    })
    .from(chapterMaterialAssignments)
    .innerJoin(chapterMaterials, eq(chapterMaterialAssignments.materialId, chapterMaterials.id))
    .innerJoin(batches, eq(chapterMaterials.batchId, batches.id))
    .innerJoin(chapters, eq(chapterMaterials.chapterId, chapters.id))
    .innerJoin(courses, eq(chapters.courseId, courses.id))
    .innerJoin(students, eq(chapterMaterialAssignments.studentId, students.id))
    .where(and(eq(batches.teacherId, teacherId), isNotNull(chapterMaterialAssignments.completedAt)))
    .orderBy(desc(chapterMaterialAssignments.completedAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    type: isAssignment(row.kind) ? "submitted" : "revised",
    at: row.completedAt!,
    studentId: row.studentId,
    studentName: row.studentName,
    batchId: row.batchId,
    batchName: row.batchName,
    courseId: row.courseId,
    chapterId: row.chapterId,
    chapterTitle: row.chapterTitle,
    materialId: row.materialId,
    materialName: row.materialName ?? "PDF material",
    hasSubmission: Boolean(row.submissionFileName),
  }));
}

/** Marks logged in the teacher's batches since a date, newest first. */
export async function getTeacherRecentMarks(teacherId: string, since: Date) {
  await ensureDatabase();

  return db
    .select({
      id: studentChapterMarks.id,
      marks: studentChapterMarks.marks,
      createdAt: studentChapterMarks.createdAt,
      studentId: students.id,
      studentName: students.name,
      batchName: batches.name,
    })
    .from(studentChapterMarks)
    .innerJoin(batches, eq(studentChapterMarks.batchId, batches.id))
    .innerJoin(students, eq(studentChapterMarks.studentId, students.id))
    .where(and(eq(batches.teacherId, teacherId), gte(studentChapterMarks.createdAt, since)))
    .orderBy(desc(studentChapterMarks.createdAt));
}

export type StudentSignal = {
  lastActive: Date | null;
  latestMark: { marks: number; recordedAt: Date } | null;
};

/** For each student in a batch: when they last finished something, and their latest mark there. */
export async function getBatchStudentSignals(batchId: string): Promise<Map<string, StudentSignal>> {
  await ensureDatabase();

  const [completions, marks] = await Promise.all([
    db
      .select({
        studentId: chapterMaterialAssignments.studentId,
        completedAt: chapterMaterialAssignments.completedAt,
      })
      .from(chapterMaterialAssignments)
      .innerJoin(chapterMaterials, eq(chapterMaterialAssignments.materialId, chapterMaterials.id))
      .where(and(eq(chapterMaterials.batchId, batchId), isNotNull(chapterMaterialAssignments.completedAt))),
    db
      .select({
        studentId: studentChapterMarks.studentId,
        marks: studentChapterMarks.marks,
        recordedAt: studentChapterMarks.recordedAt,
      })
      .from(studentChapterMarks)
      .where(eq(studentChapterMarks.batchId, batchId))
      .orderBy(desc(studentChapterMarks.recordedAt), desc(studentChapterMarks.createdAt)),
  ]);

  const signals = new Map<string, StudentSignal>();
  const signalFor = (studentId: string) => {
    let signal = signals.get(studentId);
    if (!signal) {
      signal = { lastActive: null, latestMark: null };
      signals.set(studentId, signal);
    }
    return signal;
  };

  for (const row of completions) {
    const signal = signalFor(row.studentId);
    if (row.completedAt && (!signal.lastActive || row.completedAt > signal.lastActive)) {
      signal.lastActive = row.completedAt;
    }
  }
  for (const row of marks) {
    const signal = signalFor(row.studentId);
    signal.latestMark ??= { marks: row.marks, recordedAt: row.recordedAt };
  }

  return signals;
}

export type ChapterProgress = {
  classMaterialAssigned: number;
  classMaterialCompleted: number;
  assignmentAssigned: number;
  assignmentCompleted: number;
};

/** Assigned and completed work per chapter, for one batch. */
export async function getBatchChapterProgress(batchId: string): Promise<Map<string, ChapterProgress>> {
  await ensureDatabase();

  const rows = await db
    .select({
      chapterId: chapterMaterials.chapterId,
      kind: chapterMaterials.kind,
      completedAt: chapterMaterialAssignments.completedAt,
    })
    .from(chapterMaterialAssignments)
    .innerJoin(chapterMaterials, eq(chapterMaterialAssignments.materialId, chapterMaterials.id))
    .where(eq(chapterMaterials.batchId, batchId));

  const progress = new Map<string, ChapterProgress>();
  for (const row of rows) {
    const current = progress.get(row.chapterId) ?? {
      classMaterialAssigned: 0,
      classMaterialCompleted: 0,
      assignmentAssigned: 0,
      assignmentCompleted: 0,
    };
    if (isAssignment(row.kind)) {
      current.assignmentAssigned += 1;
      if (row.completedAt) current.assignmentCompleted += 1;
    } else {
      current.classMaterialAssigned += 1;
      if (row.completedAt) current.classMaterialCompleted += 1;
    }
    progress.set(row.chapterId, current);
  }
  return progress;
}
