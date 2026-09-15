import { cache } from "react";
import { db, ensureDatabase } from "@/lib/db";
import { listLeads } from "@/lib/leads";
import {
  batchCourses,
  batches,
  chapterMaterialAssignments,
  chapterMaterials,
  courses,
  parentStudents,
  parents,
  studentBatches,
  studentChapterMarks,
  students,
  teachers,
} from "@/lib/schema";
import { eq } from "drizzle-orm";

/*
 * One read of everything the admin console reasons about. The academy is a
 * few hundred rows, so loading it whole and deriving views in memory is
 * simpler and faster than a query per widget. Revisit if it grows past that.
 * Wrapped in React's cache() so one page render shares a single read.
 */
export const loadAcademySnapshot = cache(readAcademySnapshot);

async function readAcademySnapshot() {
  await ensureDatabase();

  const [
    teacherRows,
    batchRows,
    studentRows,
    enrolmentRows,
    parentRows,
    parentLinkRows,
    courseRows,
    batchCourseRows,
    materialRows,
    assignmentRows,
    markRows,
    leadRows,
  ] = await Promise.all([
    db.select().from(teachers),
    db.select().from(batches),
    db
      .select({
        id: students.id,
        name: students.name,
        email: students.email,
        contactNumber: students.contactNumber,
        syllabus: students.syllabus,
        exam: students.exam,
        status: students.status,
        mustChangePassword: students.mustChangePassword,
        lastLoginAt: students.lastLoginAt,
        createdAt: students.createdAt,
      })
      .from(students),
    db.select().from(studentBatches),
    db
      .select({
        id: parents.id,
        name: parents.name,
        email: parents.email,
        status: parents.status,
        mustChangePassword: parents.mustChangePassword,
        lastLoginAt: parents.lastLoginAt,
        createdAt: parents.createdAt,
      })
      .from(parents),
    db.select().from(parentStudents),
    db.select().from(courses),
    db.select().from(batchCourses),
    db
      .select({
        id: chapterMaterials.id,
        batchId: chapterMaterials.batchId,
        kind: chapterMaterials.kind,
        updatedAt: chapterMaterials.updatedAt,
      })
      .from(chapterMaterials),
    db
      .select({
        studentId: chapterMaterialAssignments.studentId,
        batchId: chapterMaterials.batchId,
        kind: chapterMaterials.kind,
        createdAt: chapterMaterialAssignments.createdAt,
        completedAt: chapterMaterialAssignments.completedAt,
      })
      .from(chapterMaterialAssignments)
      .innerJoin(
        chapterMaterials,
        eq(chapterMaterialAssignments.materialId, chapterMaterials.id),
      ),
    db
      .select({
        studentId: studentChapterMarks.studentId,
        batchId: studentChapterMarks.batchId,
        marks: studentChapterMarks.marks,
        recordedAt: studentChapterMarks.recordedAt,
      })
      .from(studentChapterMarks),
    listLeads(),
  ]);

  return {
    teachers: teacherRows,
    batches: batchRows,
    students: studentRows,
    enrolments: enrolmentRows,
    parents: parentRows,
    parentLinks: parentLinkRows,
    courses: courseRows,
    batchCourses: batchCourseRows,
    materials: materialRows,
    assignments: assignmentRows,
    marks: markRows,
    leads: leadRows,
  };
}

export type AcademySnapshot = Awaited<ReturnType<typeof readAcademySnapshot>>;
