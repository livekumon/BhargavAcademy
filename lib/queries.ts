import { and, asc, count, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { isAssignment } from "./materials";
import { db, ensureDatabase } from "./db";
import { isCompletedInWindow, toDateInput } from "./dates";
import { summarizeProgress } from "./progress-summary";
import {
  batchCourses,
  batches,
  chapterMaterialAssignments,
  chapterMaterials,
  chapters,
  courses,
  parents,
  parentStudents,
  studentBatches,
  studentChapterMarks,
  studentMarkChapters,
  students,
} from "./schema";

export type BatchUploadChapter = {
  id: string;
  title: string;
  description: string;
  pdfCount: number;
};

export type BatchCourseSummary = {
  id: string;
  title: string;
  chapterCount: number;
  chaptersWithMaterial: number;
  chapters: BatchUploadChapter[];
};

export async function getTeacherBatches(teacherId: string) {
  await ensureDatabase();

  const batchRows = await db
    .select({
      id: batches.id,
      name: batches.name,
      description: batches.description,
      createdAt: batches.createdAt,
      updatedAt: batches.updatedAt,
      studentCount: count(students.id),
    })
    .from(batches)
    .leftJoin(studentBatches, eq(studentBatches.batchId, batches.id))
    .leftJoin(students, eq(students.id, studentBatches.studentId))
    .where(eq(batches.teacherId, teacherId))
    .groupBy(batches.id)
    .orderBy(desc(batches.updatedAt));

  const courseLinks = await db
    .select({
      batchId: batchCourses.batchId,
      courseId: courses.id,
      courseTitle: courses.title,
    })
    .from(batchCourses)
    .innerJoin(courses, eq(batchCourses.courseId, courses.id))
    .innerJoin(batches, eq(batchCourses.batchId, batches.id))
    .where(eq(batches.teacherId, teacherId));

  const courseIds = [...new Set(courseLinks.map((row) => row.courseId))];
  const chapterRows =
    courseIds.length > 0
      ? await db
          .select({
            id: chapters.id,
            courseId: chapters.courseId,
            title: chapters.title,
            description: chapters.description,
            position: chapters.position,
            createdAt: chapters.createdAt,
          })
          .from(chapters)
          .where(inArray(chapters.courseId, courseIds))
          .orderBy(asc(chapters.position), asc(chapters.createdAt))
      : [];

  const materialRows = await db
    .select({
      batchId: chapterMaterials.batchId,
      chapterId: chapterMaterials.chapterId,
    })
    .from(chapterMaterials)
    .innerJoin(batches, eq(chapterMaterials.batchId, batches.id))
    .where(eq(batches.teacherId, teacherId));

  const pdfCountByKey = new Map<string, number>();
  for (const row of materialRows) {
    const key = `${row.batchId}:${row.chapterId}`;
    pdfCountByKey.set(key, (pdfCountByKey.get(key) ?? 0) + 1);
  }

  const chaptersByCourse = new Map<string, typeof chapterRows>();
  for (const chapter of chapterRows) {
    const list = chaptersByCourse.get(chapter.courseId) ?? [];
    list.push(chapter);
    chaptersByCourse.set(chapter.courseId, list);
  }

  const courseByBatch = new Map<string, BatchCourseSummary>();
  for (const link of courseLinks) {
    if (courseByBatch.has(link.batchId)) continue;
    const chaptersForCourse = chaptersByCourse.get(link.courseId) ?? [];
    const courseChapters = chaptersForCourse.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      pdfCount: pdfCountByKey.get(`${link.batchId}:${chapter.id}`) ?? 0,
    }));
    courseByBatch.set(link.batchId, {
      id: link.courseId,
      title: link.courseTitle,
      chapterCount: courseChapters.length,
      chaptersWithMaterial: courseChapters.filter((chapter) => chapter.pdfCount > 0)
        .length,
      chapters: courseChapters,
    });
  }

  return batchRows.map((batch) => ({
    ...batch,
    course: courseByBatch.get(batch.id) ?? null,
  }));
}

export async function getOwnedBatch(teacherId: string, batchId: string) {
  await ensureDatabase();

  const [batch] = await db
    .select()
    .from(batches)
    .where(and(eq(batches.id, batchId), eq(batches.teacherId, teacherId)))
    .limit(1);

  return batch ?? null;
}

export async function getBatchStudents(batchId: string) {
  await ensureDatabase();

  return db
    .select({
      id: students.id,
      batchId: students.batchId,
      name: students.name,
      contactNumber: students.contactNumber,
      email: students.email,
      passwordHash: students.passwordHash,
      syllabus: students.syllabus,
      exam: students.exam,
      createdAt: students.createdAt,
    })
    .from(studentBatches)
    .innerJoin(students, eq(studentBatches.studentId, students.id))
    .where(eq(studentBatches.batchId, batchId))
    .orderBy(asc(students.name));
}

export async function getStudentEnrollments(studentId: string) {
  return db
    .select({
      id: batches.id,
      name: batches.name,
      description: batches.description,
    })
    .from(studentBatches)
    .innerJoin(batches, eq(studentBatches.batchId, batches.id))
    .where(eq(studentBatches.studentId, studentId))
    .orderBy(asc(batches.name));
}

export async function getLatestBatchCompletionDate(batchId: string) {
  await ensureDatabase();

  const [row] = await db
    .select({
      completedAt: chapterMaterialAssignments.completedAt,
    })
    .from(chapterMaterialAssignments)
    .innerJoin(
      chapterMaterials,
      eq(chapterMaterialAssignments.materialId, chapterMaterials.id),
    )
    .where(
      and(
        eq(chapterMaterials.batchId, batchId),
        isNotNull(chapterMaterialAssignments.completedAt),
      ),
    )
    .orderBy(desc(chapterMaterialAssignments.completedAt))
    .limit(1);

  return row?.completedAt ? toDateInput(row.completedAt) : null;
}

export async function getBatchProgressMatrix(
  batchId: string,
  from: string | null,
  to: string | null,
) {
  const studentList = await getBatchStudents(batchId);
  const rows = await db
    .select({
      studentId: chapterMaterialAssignments.studentId,
      kind: chapterMaterials.kind,
      completedAt: chapterMaterialAssignments.completedAt,
    })
    .from(chapterMaterialAssignments)
    .innerJoin(
      chapterMaterials,
      eq(chapterMaterialAssignments.materialId, chapterMaterials.id),
    )
    .where(eq(chapterMaterials.batchId, batchId));

  return studentList.map((student) => {
    const assigned = rows.filter((row) => row.studentId === student.id);
    const classMaterials = assigned.filter((row) => !isAssignment(row.kind));
    const assignments = assigned.filter((row) => isAssignment(row.kind));

    return {
      student,
      classMaterialAssigned: classMaterials.length,
      classMaterialCompleted: classMaterials.filter((row) =>
        isCompletedInWindow(row.completedAt, from, to),
      ).length,
      assignmentAssigned: assignments.length,
      assignmentCompleted: assignments.filter((row) =>
        isCompletedInWindow(row.completedAt, from, to),
      ).length,
    };
  });
}

export async function getBatchCourse(batchId: string) {
  const [course] = await getBatchCourses(batchId);
  return course ?? null;
}

export async function getBatchCourses(batchId: string) {
  await ensureDatabase();

  return db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
      chapterCount: count(chapters.id),
    })
    .from(batchCourses)
    .innerJoin(courses, eq(batchCourses.courseId, courses.id))
    .leftJoin(chapters, eq(chapters.courseId, courses.id))
    .where(eq(batchCourses.batchId, batchId))
    .groupBy(courses.id)
    .orderBy(asc(courses.title));
}

export async function getTeacherCourses(teacherId: string) {
  await ensureDatabase();

  return db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
      chapterCount: count(chapters.id),
    })
    .from(courses)
    .leftJoin(chapters, eq(chapters.courseId, courses.id))
    .where(eq(courses.teacherId, teacherId))
    .groupBy(courses.id)
    .orderBy(asc(courses.title));
}

export async function getUnattachedCourses(teacherId: string, batchId: string) {
  const attached = await db
    .select({ courseId: batchCourses.courseId })
    .from(batchCourses)
    .where(eq(batchCourses.batchId, batchId));

  const attachedIds = attached.map((row) => row.courseId);
  const allCourses = await getTeacherCourses(teacherId);

  if (attachedIds.length === 0) return allCourses;
  return allCourses.filter((course) => !attachedIds.includes(course.id));
}

export async function getOwnedCourseForTeacher(teacherId: string, courseId: string) {
  await ensureDatabase();

  const [course] = await db
    .select()
    .from(courses)
    .where(and(eq(courses.id, courseId), eq(courses.teacherId, teacherId)))
    .limit(1);

  return course ?? null;
}

export async function getOwnedCourse(
  teacherId: string,
  batchId: string,
  courseId: string,
) {
  await ensureDatabase();

  const [row] = await db
    .select({
      course: courses,
      batch: batches,
    })
    .from(batchCourses)
    .innerJoin(courses, eq(batchCourses.courseId, courses.id))
    .innerJoin(batches, eq(batchCourses.batchId, batches.id))
    .where(
      and(
        eq(batchCourses.batchId, batchId),
        eq(batchCourses.courseId, courseId),
        eq(batches.teacherId, teacherId),
        eq(courses.teacherId, teacherId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getCourseChapters(courseId: string) {
  await ensureDatabase();

  return db
    .select()
    .from(chapters)
    .where(eq(chapters.courseId, courseId))
    .orderBy(asc(chapters.position), asc(chapters.createdAt));
}

export async function getBatchCourseChapters(batchId: string, courseId: string) {
  const chapterRows = await getCourseChapters(courseId);
  const materials = await db
    .select()
    .from(chapterMaterials)
    .where(eq(chapterMaterials.batchId, batchId))
    .orderBy(asc(chapterMaterials.position), asc(chapterMaterials.updatedAt));

  const countsByChapter = new Map<
    string,
    { pdfCount: number; classMaterialCount: number; assignmentCount: number }
  >();
  for (const material of materials) {
    const current = countsByChapter.get(material.chapterId) ?? {
      pdfCount: 0,
      classMaterialCount: 0,
      assignmentCount: 0,
    };
    current.pdfCount += 1;
    if (material.kind === "assignment") {
      current.assignmentCount += 1;
    } else {
      current.classMaterialCount += 1;
    }
    countsByChapter.set(material.chapterId, current);
  }

  return chapterRows.map((chapter) => ({
    ...chapter,
    pdfCount: countsByChapter.get(chapter.id)?.pdfCount ?? 0,
    classMaterialCount: countsByChapter.get(chapter.id)?.classMaterialCount ?? 0,
    assignmentCount: countsByChapter.get(chapter.id)?.assignmentCount ?? 0,
  }));
}

export async function getOwnedChapter(
  teacherId: string,
  batchId: string,
  courseId: string,
  chapterId: string,
) {
  const owned = await getOwnedCourse(teacherId, batchId, courseId);
  if (!owned) return null;

  const [chapter] = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.id, chapterId), eq(chapters.courseId, courseId)))
    .limit(1);

  if (!chapter) return null;

  const materials = await db
    .select()
    .from(chapterMaterials)
    .where(
      and(
        eq(chapterMaterials.batchId, batchId),
        eq(chapterMaterials.chapterId, chapterId),
      ),
    )
    .orderBy(asc(chapterMaterials.position), asc(chapterMaterials.updatedAt));

  const assignments = materials.length
    ? await db
        .select({
          materialId: chapterMaterialAssignments.materialId,
          id: students.id,
          name: students.name,
          completedAt: chapterMaterialAssignments.completedAt,
          submissionFileName: chapterMaterialAssignments.submissionFileName,
          submissionOriginalName:
            chapterMaterialAssignments.submissionOriginalName,
        })
        .from(chapterMaterialAssignments)
        .innerJoin(
          students,
          eq(chapterMaterialAssignments.studentId, students.id),
        )
        .innerJoin(
          chapterMaterials,
          eq(chapterMaterialAssignments.materialId, chapterMaterials.id),
        )
        .where(
          and(
            eq(chapterMaterials.batchId, batchId),
            eq(chapterMaterials.chapterId, chapterId),
          ),
        )
        .orderBy(asc(students.name))
    : [];

  const assignedByMaterial = new Map<
    string,
    {
      id: string;
      name: string;
      completedAt: Date | null;
      submissionFileName: string | null;
      submissionOriginalName: string | null;
    }[]
  >();
  for (const row of assignments) {
    const list = assignedByMaterial.get(row.materialId) ?? [];
    list.push({
      id: row.id,
      name: row.name,
      completedAt: row.completedAt,
      submissionFileName: row.submissionFileName,
      submissionOriginalName: row.submissionOriginalName,
    });
    assignedByMaterial.set(row.materialId, list);
  }

  return {
    ...owned,
    chapter,
    materials: materials.map((material) => ({
      ...material,
      assignedStudents: assignedByMaterial.get(material.id) ?? [],
    })),
  };
}

export async function getCourseBatches(teacherId: string, courseId: string) {
  await ensureDatabase();

  return db
    .select({
      id: batches.id,
      name: batches.name,
    })
    .from(batchCourses)
    .innerJoin(batches, eq(batchCourses.batchId, batches.id))
    .where(
      and(eq(batchCourses.courseId, courseId), eq(batches.teacherId, teacherId)),
    )
    .orderBy(asc(batches.name));
}

export async function getOwnedLibraryChapter(
  teacherId: string,
  courseId: string,
  chapterId: string,
) {
  const course = await getOwnedCourseForTeacher(teacherId, courseId);
  if (!course) return null;

  const [chapter] = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.id, chapterId), eq(chapters.courseId, courseId)))
    .limit(1);

  if (!chapter) return null;
  return { course, chapter };
}

export async function getTeacherStudents(teacherId: string) {
  await ensureDatabase();

  const rows = await db
    .select({
      id: students.id,
      name: students.name,
      email: students.email,
      contactNumber: students.contactNumber,
      syllabus: students.syllabus,
      exam: students.exam,
      createdAt: students.createdAt,
      batchId: batches.id,
      batchName: batches.name,
    })
    .from(studentBatches)
    .innerJoin(students, eq(studentBatches.studentId, students.id))
    .innerJoin(batches, eq(studentBatches.batchId, batches.id))
    .where(eq(batches.teacherId, teacherId))
    .orderBy(asc(students.name), asc(batches.name));

  const byId = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      contactNumber: string;
      syllabus: string;
      exam: string;
      createdAt: Date;
      batches: { id: string; name: string }[];
    }
  >();

  for (const row of rows) {
    const current = byId.get(row.id);
    if (current) {
      if (!current.batches.some((batch) => batch.id === row.batchId)) {
        current.batches.push({ id: row.batchId, name: row.batchName });
      }
      continue;
    }

    byId.set(row.id, {
      id: row.id,
      name: row.name,
      email: row.email,
      contactNumber: row.contactNumber,
      syllabus: row.syllabus,
      exam: row.exam,
      createdAt: row.createdAt,
      batches: [{ id: row.batchId, name: row.batchName }],
    });
  }

  return [...byId.values()];
}

export async function getOwnedStudentForTeacher(
  teacherId: string,
  studentId: string,
) {
  await ensureDatabase();

  const enrollments = await db
    .select({
      id: batches.id,
      name: batches.name,
    })
    .from(studentBatches)
    .innerJoin(batches, eq(studentBatches.batchId, batches.id))
    .where(
      and(
        eq(studentBatches.studentId, studentId),
        eq(batches.teacherId, teacherId),
      ),
    )
    .orderBy(asc(batches.name));

  if (enrollments.length === 0) return null;

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) return null;

  const parent = await getStudentParent(student.id);
  return { student, parent, batches: enrollments };
}

export async function getOwnedStudent(
  teacherId: string,
  batchId: string,
  studentId: string,
) {
  const batch = await getOwnedBatch(teacherId, batchId);
  if (!batch) return null;

  const [enrollment] = await db
    .select({ id: studentBatches.id })
    .from(studentBatches)
    .where(
      and(eq(studentBatches.studentId, studentId), eq(studentBatches.batchId, batchId)),
    )
    .limit(1);

  if (!enrollment) return null;

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) return null;
  const parent = await getStudentParent(student.id);
  return { batch, student, parent };
}

export async function getOwnedMaterial(
  teacherId: string,
  batchId: string,
  courseId: string,
  materialId: string,
) {
  const owned = await getOwnedCourse(teacherId, batchId, courseId);
  if (!owned) return null;

  const [material] = await db
    .select()
    .from(chapterMaterials)
    .where(
      and(eq(chapterMaterials.id, materialId), eq(chapterMaterials.batchId, batchId)),
    )
    .limit(1);

  if (!material) return null;
  return { ...owned, material };
}

export async function getStudentHome(studentId: string) {
  await ensureDatabase();

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  if (!student) return null;

  const enrollments = await getStudentEnrollments(studentId);
  const [batch] = enrollments;

  const rows = await db
    .select({
      courseId: courses.id,
      courseTitle: courses.title,
      courseDescription: courses.description,
      chapterId: chapters.id,
      chapterTitle: chapters.title,
      chapterDescription: chapters.description,
      chapterPosition: chapters.position,
      materialId: chapterMaterials.id,
      pdfOriginalName: chapterMaterials.pdfOriginalName,
      materialKind: chapterMaterials.kind,
      materialInstructions: chapterMaterials.instructions,
      materialPosition: chapterMaterials.position,
      completedAt: chapterMaterialAssignments.completedAt,
      submissionOriginalName: chapterMaterialAssignments.submissionOriginalName,
      batchId: chapterMaterials.batchId,
      batchName: batches.name,
    })
    .from(chapterMaterialAssignments)
    .innerJoin(
      chapterMaterials,
      eq(chapterMaterialAssignments.materialId, chapterMaterials.id),
    )
    .innerJoin(chapters, eq(chapterMaterials.chapterId, chapters.id))
    .innerJoin(courses, eq(chapters.courseId, courses.id))
    .innerJoin(batches, eq(chapterMaterials.batchId, batches.id))
    .innerJoin(
      studentBatches,
      and(
        eq(studentBatches.studentId, studentId),
        eq(studentBatches.batchId, chapterMaterials.batchId),
      ),
    )
    .where(eq(chapterMaterialAssignments.studentId, studentId))
    .orderBy(
      asc(courses.title),
      asc(chapters.position),
      asc(chapterMaterials.position),
    );

  const coursesById = new Map<
    string,
    {
      id: string;
      title: string;
      description: string;
      chapters: Map<
        string,
        {
          id: string;
          title: string;
          description: string;
          materials: {
            id: string;
            pdfOriginalName: string | null;
            kind: string;
            instructions: string;
            completedAt: Date | null;
            submissionOriginalName: string | null;
            batchId: string;
            batchName: string;
          }[];
        }
      >;
    }
  >();

  for (const row of rows) {
    let course = coursesById.get(row.courseId);
    if (!course) {
      course = {
        id: row.courseId,
        title: row.courseTitle,
        description: row.courseDescription,
        chapters: new Map(),
      };
      coursesById.set(row.courseId, course);
    }

    let chapter = course.chapters.get(row.chapterId);
    if (!chapter) {
      chapter = {
        id: row.chapterId,
        title: row.chapterTitle,
        description: row.chapterDescription,
        materials: [],
      };
      course.chapters.set(row.chapterId, chapter);
    }

    chapter.materials.push({
      id: row.materialId,
      pdfOriginalName: row.pdfOriginalName,
      kind: row.materialKind,
      instructions: row.materialInstructions,
      completedAt: row.completedAt,
      submissionOriginalName: row.submissionOriginalName,
      batchId: row.batchId,
      batchName: row.batchName,
    });
  }

  return {
    student,
    batch: batch ?? null,
    batches: enrollments,
    courses: [...coursesById.values()].map((course) => ({
      ...course,
      chapters: [...course.chapters.values()],
    })),
  };
}

export async function getStudentAssignedMaterial(
  studentId: string,
  materialId: string,
) {
  const home = await getStudentHome(studentId);
  if (!home) return null;

  const [row] = await db
    .select({
      material: chapterMaterials,
      chapter: chapters,
      course: courses,
      assignment: chapterMaterialAssignments,
    })
    .from(chapterMaterialAssignments)
    .innerJoin(
      chapterMaterials,
      eq(chapterMaterialAssignments.materialId, chapterMaterials.id),
    )
    .innerJoin(chapters, eq(chapterMaterials.chapterId, chapters.id))
    .innerJoin(courses, eq(chapters.courseId, courses.id))
    .where(
      and(
        eq(chapterMaterialAssignments.studentId, studentId),
        eq(chapterMaterials.id, materialId),
      ),
    )
    .limit(1);

  if (!row) return null;

  const materialBatch =
    home.batches.find((batch) => batch.id === row.material.batchId) ?? null;
  if (!materialBatch) return null;

  return { ...home, ...row, batch: materialBatch };
}

export async function getStudentParent(studentId: string) {
  const [row] = await db
    .select({ parent: parents })
    .from(parentStudents)
    .innerJoin(parents, eq(parentStudents.parentId, parents.id))
    .where(eq(parentStudents.studentId, studentId))
    .limit(1);

  return row?.parent ?? null;
}

async function getStudentProgressRows(studentId: string) {
  return db
    .select({
      kind: chapterMaterials.kind,
      completedAt: chapterMaterialAssignments.completedAt,
      chapterId: chapters.id,
      chapterTitle: chapters.title,
      chapterDescription: chapters.description,
      chapterPosition: chapters.position,
      courseId: courses.id,
      courseTitle: courses.title,
      batchId: chapterMaterials.batchId,
      batchName: batches.name,
    })
    .from(chapterMaterialAssignments)
    .innerJoin(
      chapterMaterials,
      eq(chapterMaterialAssignments.materialId, chapterMaterials.id),
    )
    .innerJoin(chapters, eq(chapterMaterials.chapterId, chapters.id))
    .innerJoin(courses, eq(chapters.courseId, courses.id))
    .innerJoin(batches, eq(chapterMaterials.batchId, batches.id))
    .innerJoin(
      studentBatches,
      and(
        eq(studentBatches.studentId, studentId),
        eq(studentBatches.batchId, chapterMaterials.batchId),
      ),
    )
    .where(eq(chapterMaterialAssignments.studentId, studentId))
    .orderBy(asc(batches.name), asc(courses.title), asc(chapters.position));
}

function groupProgressByCourse(rows: Awaited<ReturnType<typeof getStudentProgressRows>>) {
  const coursesById = new Map<
    string,
    {
      id: string;
      title: string;
      chapters: {
        id: string;
        title: string;
        description: string;
        progress: ReturnType<typeof summarizeProgress>;
      }[];
    }
  >();

  const rowsByChapter = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${row.batchId}:${row.chapterId}`;
    const list = rowsByChapter.get(key) ?? [];
    list.push(row);
    rowsByChapter.set(key, list);
  }

  for (const [chapterKey, chapterRows] of rowsByChapter) {
    const first = chapterRows[0];
    const courseKey = `${first.batchId}:${first.courseId}`;
    let course = coursesById.get(courseKey);
    if (!course) {
      course = { id: courseKey, title: first.courseTitle, chapters: [] };
      coursesById.set(courseKey, course);
    }
    course.chapters.push({
      id: chapterKey,
      title: first.chapterTitle,
      description: first.chapterDescription,
      progress: summarizeProgress(chapterRows),
    });
  }

  return [...coursesById.values()];
}

export async function getParentChildren(parentId: string) {
  await ensureDatabase();

  const kids = await db
    .select({
      student: students,
    })
    .from(parentStudents)
    .innerJoin(students, eq(parentStudents.studentId, students.id))
    .where(eq(parentStudents.parentId, parentId))
    .orderBy(asc(students.name));

  return Promise.all(
    kids.map(async ({ student }) => {
      const enrollments = await getStudentEnrollments(student.id);
      const rows = await getStudentProgressRows(student.id);
      return {
        student,
        batches: enrollments.map((batch) => ({
          id: batch.id,
          name: batch.name,
          progress: summarizeProgress(
            rows.filter((row) => row.batchId === batch.id),
          ),
        })),
        progress: summarizeProgress(rows),
      };
    }),
  );
}

export async function getParentChildDetails(parentId: string, studentId: string) {
  await ensureDatabase();

  const [link] = await db
    .select({ student: students })
    .from(parentStudents)
    .innerJoin(students, eq(parentStudents.studentId, students.id))
    .where(
      and(
        eq(parentStudents.parentId, parentId),
        eq(parentStudents.studentId, studentId),
      ),
    )
    .limit(1);

  if (!link) return null;

  const enrollments = await getStudentEnrollments(studentId);
  const rows = await getStudentProgressRows(studentId);

  return {
    student: link.student,
    batches: enrollments.map((batch) => {
      const batchRows = rows.filter((row) => row.batchId === batch.id);
      return {
        id: batch.id,
        name: batch.name,
        progress: summarizeProgress(batchRows),
        courses: groupProgressByCourse(batchRows),
      };
    }),
    progress: summarizeProgress(rows),
    marks: await getStudentMarkEntries(studentId),
  };
}

export async function getStudentMarkEntries(studentId: string) {
  await ensureDatabase();

  const rows = await db
    .select({
      id: studentChapterMarks.id,
      marks: studentChapterMarks.marks,
      syllabus: studentChapterMarks.syllabus,
      examPaper: studentChapterMarks.examPaper,
      recordedAt: studentChapterMarks.recordedAt,
      createdAt: studentChapterMarks.createdAt,
      batchId: batches.id,
      batchName: batches.name,
      courseId: courses.id,
      courseTitle: courses.title,
      chapterId: chapters.id,
      chapterTitle: chapters.title,
    })
    .from(studentChapterMarks)
    .innerJoin(batches, eq(studentChapterMarks.batchId, batches.id))
    .innerJoin(
      studentMarkChapters,
      eq(studentMarkChapters.markId, studentChapterMarks.id),
    )
    .innerJoin(chapters, eq(studentMarkChapters.chapterId, chapters.id))
    .innerJoin(courses, eq(chapters.courseId, courses.id))
    .where(eq(studentChapterMarks.studentId, studentId))
    .orderBy(
      desc(studentChapterMarks.recordedAt),
      desc(studentChapterMarks.createdAt),
      asc(chapters.position),
    );

  const byId = new Map<
    string,
    {
      id: string;
      marks: number;
      syllabus: string;
      examPaper: string;
      recordedAt: Date;
      createdAt: Date;
      batchId: string;
      batchName: string;
      courseId: string;
      courseTitle: string;
      chapterTitles: string[];
    }
  >();

  for (const row of rows) {
    const existing = byId.get(row.id);
    if (existing) {
      if (!existing.chapterTitles.includes(row.chapterTitle)) {
        existing.chapterTitles.push(row.chapterTitle);
      }
      continue;
    }
    byId.set(row.id, {
      id: row.id,
      marks: row.marks,
      syllabus: row.syllabus,
      examPaper: row.examPaper,
      recordedAt: row.recordedAt,
      createdAt: row.createdAt,
      batchId: row.batchId,
      batchName: row.batchName,
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      chapterTitles: [row.chapterTitle],
    });
  }

  return [...byId.values()];
}

export type ParentDirectoryStudent = {
  id: string;
  name: string;
  email: string;
  batches: { id: string; name: string }[];
  currentParent: { id: string; name: string } | null;
};

export type TeacherParentRow = {
  id: string;
  name: string;
  email: string;
  mustChangePassword: boolean;
  students: { id: string; name: string; email: string }[];
};

export async function getTeacherParentPickerStudents(
  teacherId: string,
): Promise<ParentDirectoryStudent[]> {
  const directory = await getTeacherStudents(teacherId);
  if (directory.length === 0) return [];

  const links = await db
    .select({
      studentId: parentStudents.studentId,
      parentId: parents.id,
      parentName: parents.name,
    })
    .from(parentStudents)
    .innerJoin(parents, eq(parentStudents.parentId, parents.id))
    .where(
      inArray(
        parentStudents.studentId,
        directory.map((student) => student.id),
      ),
    );

  const parentByStudent = new Map(
    links.map((row) => [
      row.studentId,
      { id: row.parentId, name: row.parentName },
    ]),
  );

  return directory.map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    batches: student.batches,
    currentParent: parentByStudent.get(student.id) ?? null,
  }));
}

export async function getTeacherParents(
  teacherId: string,
): Promise<TeacherParentRow[]> {
  await ensureDatabase();

  const directory = await getTeacherStudents(teacherId);
  if (directory.length === 0) return [];

  const studentIds = directory.map((student) => student.id);
  const rows = await db
    .select({
      parent: parents,
      studentId: students.id,
      studentName: students.name,
      studentEmail: students.email,
    })
    .from(parentStudents)
    .innerJoin(parents, eq(parentStudents.parentId, parents.id))
    .innerJoin(students, eq(parentStudents.studentId, students.id))
    .where(inArray(parentStudents.studentId, studentIds))
    .orderBy(asc(parents.name), asc(students.name));

  const byId = new Map<string, TeacherParentRow>();
  for (const row of rows) {
    const current = byId.get(row.parent.id);
    if (current) {
      if (!current.students.some((student) => student.id === row.studentId)) {
        current.students.push({
          id: row.studentId,
          name: row.studentName,
          email: row.studentEmail,
        });
      }
      continue;
    }
    byId.set(row.parent.id, {
      id: row.parent.id,
      name: row.parent.name,
      email: row.parent.email,
      mustChangePassword: row.parent.mustChangePassword,
      students: [
        {
          id: row.studentId,
          name: row.studentName,
          email: row.studentEmail,
        },
      ],
    });
  }

  return [...byId.values()];
}

export async function getOwnedParentForTeacher(
  teacherId: string,
  parentId: string,
) {
  const list = await getTeacherParents(teacherId);
  return list.find((parent) => parent.id === parentId) ?? null;
}

export async function getStudentMarksWorkspace(studentId: string) {
  const enrollments = await getStudentEnrollments(studentId);
  const batchesWithCourses = await Promise.all(
    enrollments.map(async (batch) => ({
      ...batch,
      courses: await getBatchCourses(batch.id),
    })),
  );

  return {
    batches: batchesWithCourses,
    marks: await getStudentMarkEntries(studentId),
  };
}
