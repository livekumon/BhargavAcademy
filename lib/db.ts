import { createClient } from "@libsql/client";
import { compareSync, hashSync } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import fs from "node:fs";
import path from "node:path";
import { saveDummyPdf } from "./files";
import { EXAM_PAPERS, EXAMS, SYLLABUSES } from "./academics";
import * as schema from "./schema";
import {
  ADMIN_EMAIL,
  DEFAULT_PASSWORD,
  isLegacyStudentEmail,
  LEGACY_PARENT_EMAIL,
  LEGACY_TEACHER_EMAIL,
  uniqueAcademyEmail,
} from "./identity";
import {
  dummyBatches,
  dummyCourses,
  dummyExtraEnrollments,
  dummyMaterialId,
  dummyParents,
  PROTOTYPE_ENGLISH_BATCH_ID,
  PROTOTYPE_EVENING_BATCH_ID,
} from "./seed";

/*
 * A hosted libSQL database (Turso) when TURSO_DATABASE_URL is set. Without it
 * the app falls back to a local SQLite file, which on Vercel lives in /tmp and
 * is wiped on every cold start — fine for a demo, not for real accounts.
 */
function createDatabaseClient() {
  const remoteUrl = process.env.TURSO_DATABASE_URL?.trim();
  if (remoteUrl) {
    return createClient({
      url: remoteUrl,
      authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
    });
  }

  const dataDir = process.env.VERCEL
    ? path.join("/tmp", "bhargav-academy-data")
    : path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  return createClient({ url: `file:${path.join(dataDir, "academy.db")}` });
}

/** False only on Vercel without Turso, where every cold start resets the data. */
export const isPersistentDatabase =
  Boolean(process.env.TURSO_DATABASE_URL?.trim()) || !process.env.VERCEL;

const client = createDatabaseClient();

export const db = drizzle(client, { schema });

let initialized = false;
let initializing: Promise<void> | null = null;

let ensuring: Promise<void> | null = null;

/**
 * Concurrent callers share one in-flight run, so two requests arriving
 * together can't both decide a table is missing and both create it.
 */
export async function ensureDatabase() {
  ensuring ??= runEnsureDatabase().finally(() => {
    ensuring = null;
  });
  await ensuring;
}

async function runEnsureDatabase() {
  if (!initialized) {
    if (!initializing) {
      initializing = initializeDatabase().finally(() => {
        initializing = null;
      });
    }
    await initializing;
  }

  await ensureAssignmentSchema();
  await allowMultipleChapterPdfs();
  await ensureMaterialKindSchema();
  await ensureOneCoursePerBatch();
  await ensureMaterialDueColumn();
  await seedMissingDummyBatches();
  await seedMissingDummyMaterials();
  await ensureStudentLoginSchema();
  await ensureCompletionSchema();
  await ensureParentSchema();
  await ensureStudentBatchSchema();
  await ensureStudentMarksSchema();
  await ensureLookupSchema();
  await ensureLeadsSchema();
  await ensureMustChangePasswordSchema();
  await ensureLeadNotesColumn();
  await ensureAdminSchema();
  await ensureOwnerAdmin();
}

async function initializeDatabase() {
  if (initialized) return;

  await client.execute("PRAGMA foreign_keys = ON");
  await rebuildLegacyCourseSchema();
  await client.execute(`
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      must_change_password INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      must_change_password INTEGER NOT NULL DEFAULT 1,
      syllabus TEXT NOT NULL DEFAULT '',
      exam TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      teacher_id TEXT REFERENCES teachers(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS batch_courses (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      UNIQUE (batch_id, course_id),
      UNIQUE (batch_id)
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS chapter_materials (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
      chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
      pdf_file_name TEXT,
      pdf_original_name TEXT,
      kind TEXT NOT NULL DEFAULT 'class_material',
      instructions TEXT NOT NULL DEFAULT '',
      due_at INTEGER,
      position INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    )
  `);
  await ensureMaterialDueColumn();
  await createAssignmentTable();
  await createParentTables();
  await createStudentBatchTable();
  // Drizzle names every schema column in its queries, so the admin columns
  // must exist before the first select or insert below touches these tables.
  await ensureAdminSchema();
  await ensureMustChangePasswordSchema();

  const existing = await db
    .select({ id: schema.teachers.id })
    .from(schema.teachers)
    .where(eq(schema.teachers.email, ADMIN_EMAIL))
    .limit(1);

  const legacyTeacher =
    existing.length === 0
      ? await db
          .select({ id: schema.teachers.id })
          .from(schema.teachers)
          .where(eq(schema.teachers.email, LEGACY_TEACHER_EMAIL))
          .limit(1)
      : [];

  let teacherId = existing[0]?.id ?? legacyTeacher[0]?.id ?? "teacher-demo";

  if (existing.length === 0 && legacyTeacher.length === 0) {
    await db
      .insert(schema.teachers)
      .values({
        id: teacherId,
        name: "Bhargav",
        email: ADMIN_EMAIL,
        passwordHash: hashSync(DEFAULT_PASSWORD, 10),
        mustChangePassword: true,
        createdAt: new Date(),
      })
      .onConflictDoNothing();

    const [created] = await db
      .select({ id: schema.teachers.id })
      .from(schema.teachers)
      .where(eq(schema.teachers.email, ADMIN_EMAIL))
      .limit(1);
    teacherId = created?.id ?? teacherId;
  }

  const [eveningBatch] = await db
    .select({ id: schema.batches.id })
    .from(schema.batches)
    .where(eq(schema.batches.id, PROTOTYPE_EVENING_BATCH_ID))
    .limit(1);

  if (!eveningBatch) {
    const now = new Date();

    for (const course of dummyCourses) {
      await db
        .insert(schema.courses)
        .values({
          id: course.id,
          teacherId,
          title: course.title,
          description: course.description,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();

      for (const [index, chapter] of course.chapters.entries()) {
        await db
          .insert(schema.chapters)
          .values({
            id: chapter.id,
            courseId: course.id,
            title: chapter.title,
            description: chapter.description,
            position: index + 1,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing();
      }
    }

    for (const batch of dummyBatches) {
      await db
        .insert(schema.batches)
        .values({
          id: batch.id,
          teacherId,
          name: batch.name,
          description: batch.description,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();

      const studentPasswordHash = hashSync(DEFAULT_PASSWORD, 10);
      for (const student of batch.students) {
        await db
          .insert(schema.students)
          .values({
            id: student.id,
            batchId: batch.id,
            name: student.name,
            contactNumber: student.contactNumber,
            email: student.email,
            passwordHash: studentPasswordHash,
            mustChangePassword: true,
            createdAt: now,
          })
          .onConflictDoNothing();
      }

      for (const courseId of batch.courseIds) {
        await db
          .insert(schema.batchCourses)
          .values({
            id: `${batch.id}-${courseId}`,
            batchId: batch.id,
            courseId,
            createdAt: now,
          })
          .onConflictDoNothing();
      }

      for (const [index, material] of batch.materials.entries()) {
        const pdfFileName = await saveDummyPdf(
          material.pdf,
          material.title,
          [...material.lines],
        );

        await db
          .insert(schema.chapterMaterials)
          .values({
            id: dummyMaterialId(batch.id, material.pdf),
            batchId: batch.id,
            chapterId: material.chapterId,
            pdfFileName,
            pdfOriginalName: material.pdf,
            kind: "kind" in material ? material.kind : "class_material",
            instructions:
              "instructions" in material ? material.instructions : "",
            position: index + 1,
            updatedAt: now,
          })
          .onConflictDoNothing();
      }
    }
  }

  await seedDummyAssignmentsIfNeeded();
  initialized = true;
}

async function createAssignmentTable() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS chapter_material_assignments (
      id TEXT PRIMARY KEY,
      material_id TEXT NOT NULL REFERENCES chapter_materials(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      completed_at INTEGER,
      submission_file_name TEXT,
      submission_original_name TEXT,
      UNIQUE (material_id, student_id)
    )
  `);
}

async function ensureAssignmentSchema() {
  await createAssignmentTable();
  await seedDummyAssignmentsIfNeeded();
}

async function seedDummyAssignmentsIfNeeded() {
  const existing = await client.execute(
    "SELECT COUNT(*) AS count FROM chapter_material_assignments",
  );
  if (Number(existing.rows[0]?.count ?? 0) > 0) return;

  const now = new Date();

  for (const batch of dummyBatches) {
    for (const material of batch.materials) {
      const materialId = dummyMaterialId(batch.id, material.pdf);
      const studentIds =
        "studentIds" in material
          ? [...material.studentIds]
          : batch.students.map((student) => student.id);

      for (const studentId of studentIds) {
        await db
          .insert(schema.chapterMaterialAssignments)
          .values({
            id: `${materialId}-${studentId}`,
            materialId,
            studentId,
            createdAt: now,
          })
          .onConflictDoNothing();
      }
    }
  }
}

async function ensureStudentLoginSchema() {
  const info = await client.execute("PRAGMA table_info(students)");
  const columns = info.rows.map((row) => String(row.name));

  if (!columns.includes("email")) {
    await client.execute("ALTER TABLE students ADD COLUMN email TEXT");
  }
  if (!columns.includes("password_hash")) {
    await client.execute("ALTER TABLE students ADD COLUMN password_hash TEXT");
  }

  const missing = await client.execute(
    "SELECT id FROM students WHERE password_hash IS NULL OR password_hash = '' LIMIT 1",
  );
  const passwordHash =
    missing.rows.length > 0 ? hashSync(DEFAULT_PASSWORD, 10) : "";

  for (const batch of dummyBatches) {
    for (const student of batch.students) {
      await client.execute({
        sql: `
          UPDATE students
          SET email = COALESCE(NULLIF(email, ''), ?),
              password_hash = COALESCE(NULLIF(password_hash, ''), ?)
          WHERE id = ?
        `,
        args: [student.email, passwordHash, student.id],
      });
    }
  }

  await client.execute(
    "CREATE UNIQUE INDEX IF NOT EXISTS students_email_unique ON students(email)",
  );
}

async function allowMultipleChapterPdfs() {
  const table = await client.execute(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='chapter_materials'",
  );
  const sql = String(table.rows[0]?.sql ?? "");
  if (!sql) return;

  await client.execute("DROP INDEX IF EXISTS chapter_materials_unique");

  if (
    !sql.includes("UNIQUE (batch_id, chapter_id)") &&
    !sql.includes("UNIQUE(batch_id, chapter_id)")
  ) {
    return;
  }

  await client.execute("PRAGMA foreign_keys = OFF");
  await client.execute(`
    CREATE TABLE chapter_materials_v2 (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
      chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
      pdf_file_name TEXT,
      pdf_original_name TEXT,
      kind TEXT NOT NULL DEFAULT 'class_material',
      instructions TEXT NOT NULL DEFAULT '',
      due_at INTEGER,
      position INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    )
  `);
  await client.execute(`
    INSERT INTO chapter_materials_v2 (
      id, batch_id, chapter_id, pdf_file_name, pdf_original_name, position, updated_at
    )
    SELECT id, batch_id, chapter_id, pdf_file_name, pdf_original_name, 0, updated_at
    FROM chapter_materials
  `);
  await client.execute("DROP TABLE chapter_materials");
  await client.execute("ALTER TABLE chapter_materials_v2 RENAME TO chapter_materials");
  await client.execute("PRAGMA foreign_keys = ON");
}

async function ensureOneCoursePerBatch() {
  const links = await db
    .select({
      id: schema.batchCourses.id,
      batchId: schema.batchCourses.batchId,
      courseId: schema.batchCourses.courseId,
      createdAt: schema.batchCourses.createdAt,
    })
    .from(schema.batchCourses)
    .orderBy(schema.batchCourses.createdAt);

  const extrasByBatch = new Map<string, typeof links>();
  const seenBatch = new Set<string>();
  for (const link of links) {
    if (!seenBatch.has(link.batchId)) {
      seenBatch.add(link.batchId);
      continue;
    }
    const extras = extrasByBatch.get(link.batchId) ?? [];
    extras.push(link);
    extrasByBatch.set(link.batchId, extras);
  }

  for (const [batchId, extras] of extrasByBatch) {
    const [batch] = await db
      .select()
      .from(schema.batches)
      .where(eq(schema.batches.id, batchId))
      .limit(1);
    if (!batch) continue;

    const enrolled = await db
      .select({ studentId: schema.studentBatches.studentId })
      .from(schema.studentBatches)
      .where(eq(schema.studentBatches.batchId, batchId));
    const fallbackStudents =
      enrolled.length > 0
        ? enrolled
        : (
            await db
              .select({ studentId: schema.students.id })
              .from(schema.students)
              .where(eq(schema.students.batchId, batchId))
          ).map((row) => ({ studentId: row.studentId }));

    for (const extra of extras) {
      const [course] = await db
        .select({ title: schema.courses.title })
        .from(schema.courses)
        .where(eq(schema.courses.id, extra.courseId))
        .limit(1);

      const specialEnglish =
        batchId === "batch-grade-10" && extra.courseId === "course-english";
      const nextBatchId = specialEnglish
        ? PROTOTYPE_ENGLISH_BATCH_ID
        : `${batchId}--${extra.courseId}`;
      const now = new Date();

      await db
        .insert(schema.batches)
        .values({
          id: nextBatchId,
          teacherId: batch.teacherId,
          name: specialEnglish
            ? "Grade 10 English"
            : `${batch.name} — ${course?.title || "Course"}`,
          description: specialEnglish
            ? "English literature for the morning class. Uses the shared English course."
            : `Split from ${batch.name} so each batch keeps one course.`,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();

      const [alreadyLinked] = await db
        .select({ id: schema.batchCourses.id })
        .from(schema.batchCourses)
        .where(eq(schema.batchCourses.batchId, nextBatchId))
        .limit(1);

      if (alreadyLinked) {
        await db
          .delete(schema.batchCourses)
          .where(eq(schema.batchCourses.id, extra.id));
      } else {
        await db
          .update(schema.batchCourses)
          .set({ batchId: nextBatchId })
          .where(eq(schema.batchCourses.id, extra.id));
      }

      await client.execute({
        sql: `
          UPDATE chapter_materials
          SET batch_id = ?
          WHERE batch_id = ?
            AND chapter_id IN (SELECT id FROM chapters WHERE course_id = ?)
        `,
        args: [nextBatchId, batchId, extra.courseId],
      });

      for (const row of fallbackStudents) {
        await db
          .insert(schema.studentBatches)
          .values({
            id: `${row.studentId}-${nextBatchId}`,
            studentId: row.studentId,
            batchId: nextBatchId,
            createdAt: now,
          })
          .onConflictDoNothing();
      }
    }
  }

  await client.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS batch_courses_batch_unique
    ON batch_courses (batch_id)
  `);
}

async function seedMissingDummyBatches() {
  const teacher = await getPrototypeTeacher();
  if (!teacher) return;

  const now = new Date();
  for (const batch of dummyBatches) {
    await db
      .insert(schema.batches)
      .values({
        id: batch.id,
        teacherId: teacher.id,
        name: batch.name,
        description: batch.description,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    if (batch.id === "batch-grade-10") {
      const [current] = await db
        .select({ description: schema.batches.description })
        .from(schema.batches)
        .where(eq(schema.batches.id, batch.id))
        .limit(1);
      if (current?.description.includes("English courses")) {
        await db
          .update(schema.batches)
          .set({ description: batch.description })
          .where(eq(schema.batches.id, batch.id));
      }
    }

    const [linked] = await db
      .select({ id: schema.batchCourses.id })
      .from(schema.batchCourses)
      .where(eq(schema.batchCourses.batchId, batch.id))
      .limit(1);
    if (linked) continue;

    const courseId = batch.courseIds[0];
    if (!courseId) continue;
    await db
      .insert(schema.batchCourses)
      .values({
        id: `${batch.id}-${courseId}`,
        batchId: batch.id,
        courseId,
        createdAt: now,
      })
      .onConflictDoNothing();
  }
}

async function seedMissingDummyMaterials() {
  const now = new Date();

  for (const batch of dummyBatches) {
    for (const [index, material] of batch.materials.entries()) {
      const [existing] = await db
        .select({ id: schema.chapterMaterials.id })
        .from(schema.chapterMaterials)
        .where(
          and(
            eq(schema.chapterMaterials.batchId, batch.id),
            eq(schema.chapterMaterials.chapterId, material.chapterId),
            eq(schema.chapterMaterials.pdfOriginalName, material.pdf),
          ),
        )
        .limit(1);

      if (existing) continue;

      const pdfFileName = await saveDummyPdf(
        material.pdf,
        material.title,
        [...material.lines],
      );
      const materialId = dummyMaterialId(batch.id, material.pdf);

      await db
        .insert(schema.chapterMaterials)
        .values({
          id: materialId,
          batchId: batch.id,
          chapterId: material.chapterId,
          pdfFileName,
          pdfOriginalName: material.pdf,
          kind: "kind" in material ? material.kind : "class_material",
          instructions: "instructions" in material ? material.instructions : "",
          position: index + 1,
          updatedAt: now,
        })
        .onConflictDoNothing();

      const studentIds =
        "studentIds" in material
          ? [...material.studentIds]
          : batch.students.map((student) => student.id);

      for (const studentId of studentIds) {
        await db
          .insert(schema.chapterMaterialAssignments)
          .values({
            id: `${materialId}-${studentId}`,
            materialId,
            studentId,
            createdAt: now,
          })
          .onConflictDoNothing();
      }
    }
  }
}

async function ensureMaterialKindSchema() {
  const info = await client.execute("PRAGMA table_info(chapter_materials)");
  const columns = info.rows.map((row) => String(row.name));

  if (!columns.includes("kind")) {
    await client.execute(
      "ALTER TABLE chapter_materials ADD COLUMN kind TEXT NOT NULL DEFAULT 'class_material'",
    );
  }
  if (!columns.includes("instructions")) {
    await client.execute(
      "ALTER TABLE chapter_materials ADD COLUMN instructions TEXT NOT NULL DEFAULT ''",
    );
  }

  await client.execute({
    sql: `
      UPDATE chapter_materials
      SET kind = 'assignment',
          instructions = CASE
            WHEN instructions IS NULL OR instructions = '' OR instructions = 'Solve the problems in this worksheet. Show every step.'
            THEN 'Solve the average-speed problems in the worksheet. Show every step, and write the final answers for questions 1 to 3.'
            ELSE instructions
          END
      WHERE pdf_original_name = 'morning-motion-worksheet.pdf'
        AND (
          kind IS NULL OR kind = '' OR kind = 'class_material'
          OR instructions IS NULL OR instructions = ''
          OR instructions = 'Solve the problems in this worksheet. Show every step.'
        )
    `,
  });
}

async function ensureCompletionSchema() {
  const info = await client.execute(
    "PRAGMA table_info(chapter_material_assignments)",
  );
  const columns = info.rows.map((row) => String(row.name));

  if (!columns.includes("completed_at")) {
    await client.execute(
      "ALTER TABLE chapter_material_assignments ADD COLUMN completed_at INTEGER",
    );
  }
  if (!columns.includes("submission_file_name")) {
    await client.execute(
      "ALTER TABLE chapter_material_assignments ADD COLUMN submission_file_name TEXT",
    );
  }
  if (!columns.includes("submission_original_name")) {
    await client.execute(
      "ALTER TABLE chapter_material_assignments ADD COLUMN submission_original_name TEXT",
    );
  }
}

async function createStudentBatchTable() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS student_batches (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      UNIQUE (student_id, batch_id)
    )
  `);
}

async function ensureStudentBatchSchema() {
  await createStudentBatchTable();
  const now = new Date();

  const allStudents = await db
    .select({ id: schema.students.id, batchId: schema.students.batchId })
    .from(schema.students);

  for (const student of allStudents) {
    await db
      .insert(schema.studentBatches)
      .values({
        id: `${student.id}-${student.batchId}`,
        studentId: student.id,
        batchId: student.batchId,
        createdAt: now,
      })
      .onConflictDoNothing();
  }

  for (const enrollment of dummyExtraEnrollments) {
    await db
      .insert(schema.studentBatches)
      .values({
        id: `${enrollment.studentId}-${enrollment.batchId}`,
        studentId: enrollment.studentId,
        batchId: enrollment.batchId,
        createdAt: now,
      })
      .onConflictDoNothing();
  }

  const [eveningNotes] = await db
    .select({ id: schema.chapterMaterials.id })
    .from(schema.chapterMaterials)
    .where(
      and(
        eq(schema.chapterMaterials.batchId, PROTOTYPE_EVENING_BATCH_ID),
        eq(schema.chapterMaterials.pdfOriginalName, "evening-motion-notes.pdf"),
      ),
    )
    .limit(1);

  if (eveningNotes) {
    await db
      .insert(schema.chapterMaterialAssignments)
      .values({
        id: `${eveningNotes.id}-student-ananya`,
        materialId: eveningNotes.id,
        studentId: "student-ananya",
        createdAt: now,
      })
      .onConflictDoNothing();
  }
}

async function ensureStudentMarksSchema() {
  const info = await client.execute("PRAGMA table_info(students)");
  const columns = info.rows.map((row) => String(row.name));
  if (!columns.includes("syllabus")) {
    await client.execute(
      "ALTER TABLE students ADD COLUMN syllabus TEXT NOT NULL DEFAULT ''",
    );
  }
  if (!columns.includes("exam")) {
    await client.execute(
      "ALTER TABLE students ADD COLUMN exam TEXT NOT NULL DEFAULT ''",
    );
  }

  await migrateStudentMarksToMultiChapter();

  await client.execute(`
    UPDATE students
    SET syllabus = 'cbse', exam = 'jee_mains'
    WHERE id = 'student-ananya' AND (syllabus = '' OR exam = '')
  `);
  await client.execute(`
    UPDATE students
    SET syllabus = 'state', exam = 'ca_foundation'
    WHERE id = 'student-aarav' AND (syllabus = '' OR exam = '')
  `);
  await client.execute(`
    UPDATE students
    SET syllabus = 'ip', exam = 'jee_advanced'
    WHERE id = 'student-rohan' AND (syllabus = '' OR exam = '')
  `);

  const existing = await client.execute(
    "SELECT COUNT(*) AS count FROM student_chapter_marks",
  );
  if (Number(existing.rows[0]?.count ?? 0) > 0) return;

  const now = new Date();
  await db.insert(schema.studentChapterMarks).values([
    {
      id: "mark-ananya-motion-1",
      studentId: "student-ananya",
      batchId: "batch-grade-10",
      syllabus: "cbse",
      examPaper: "mains",
      marks: 72,
      recordedAt: new Date(2026, 8, 1, 10, 0, 0),
      createdAt: now,
    },
    {
      id: "mark-ananya-motion-2",
      studentId: "student-ananya",
      batchId: "batch-grade-10",
      syllabus: "cbse",
      examPaper: "mains",
      marks: 81,
      recordedAt: new Date(2026, 8, 5, 18, 30, 0),
      createdAt: now,
    },
  ]);
  await db.insert(schema.studentMarkChapters).values([
    {
      id: "mark-ananya-motion-1-chapter-physics-1",
      markId: "mark-ananya-motion-1",
      chapterId: "chapter-physics-1",
    },
    {
      id: "mark-ananya-motion-2-chapter-physics-1",
      markId: "mark-ananya-motion-2",
      chapterId: "chapter-physics-1",
    },
  ]);
}

async function migrateStudentMarksToMultiChapter() {
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='student_chapter_marks'",
  );

  if (tables.rows.length === 0) {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS student_chapter_marks (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
        syllabus TEXT NOT NULL,
        exam_paper TEXT NOT NULL,
        marks REAL NOT NULL,
        recorded_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
  } else {
    const info = await client.execute("PRAGMA table_info(student_chapter_marks)");
    const columns = info.rows.map((row) => String(row.name));
    if (columns.includes("chapter_id")) {
      await client.execute("PRAGMA foreign_keys = OFF");
      await client.execute(`
        CREATE TABLE student_mark_chapters_migrate (
          id TEXT PRIMARY KEY,
          mark_id TEXT NOT NULL,
          chapter_id TEXT NOT NULL,
          UNIQUE (mark_id, chapter_id)
        )
      `);
      await client.execute(`
        INSERT OR IGNORE INTO student_mark_chapters_migrate (id, mark_id, chapter_id)
        SELECT id || '-' || chapter_id, id, chapter_id
        FROM student_chapter_marks
      `);
      await client.execute(`
        CREATE TABLE student_chapter_marks_v2 (
          id TEXT PRIMARY KEY,
          student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
          batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
          syllabus TEXT NOT NULL,
          exam_paper TEXT NOT NULL,
          marks REAL NOT NULL,
          recorded_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        )
      `);
      await client.execute(`
        INSERT INTO student_chapter_marks_v2 (
          id, student_id, batch_id, syllabus, exam_paper, marks, recorded_at, created_at
        )
        SELECT id, student_id, batch_id, syllabus, exam_paper, marks, recorded_at, created_at
        FROM student_chapter_marks
      `);
      await client.execute("DROP TABLE student_chapter_marks");
      await client.execute(
        "ALTER TABLE student_chapter_marks_v2 RENAME TO student_chapter_marks",
      );
      await client.execute("DROP TABLE IF EXISTS student_mark_chapters");
      await client.execute(
        "ALTER TABLE student_mark_chapters_migrate RENAME TO student_mark_chapters",
      );
      await client.execute("PRAGMA foreign_keys = ON");
    }
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS student_mark_chapters (
      id TEXT PRIMARY KEY,
      mark_id TEXT NOT NULL REFERENCES student_chapter_marks(id) ON DELETE CASCADE,
      chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
      UNIQUE (mark_id, chapter_id)
    )
  `);
}

async function createParentTables() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS parents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      must_change_password INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS parent_students (
      id TEXT PRIMARY KEY,
      parent_id TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      UNIQUE (parent_id, student_id),
      UNIQUE (student_id)
    )
  `);
}

async function ensureParentSchema() {
  await createParentTables();

  const now = new Date();
  const missingDummyStudent = await client.execute(
    "SELECT id FROM students WHERE id = 'student-aarav' LIMIT 1",
  );
  const studentPasswordHash =
    missingDummyStudent.rows.length === 0
      ? hashSync(DEFAULT_PASSWORD, 10)
      : "";

  if (studentPasswordHash) {
    for (const batch of dummyBatches) {
      for (const student of batch.students) {
        await db
          .insert(schema.students)
          .values({
            id: student.id,
            batchId: batch.id,
            name: student.name,
            contactNumber: student.contactNumber,
            email: student.email,
            passwordHash: studentPasswordHash,
            mustChangePassword: true,
            createdAt: now,
          })
          .onConflictDoNothing();
      }
    }
  }

  const missingParent = await client.execute({
    sql: "SELECT id FROM parents WHERE id = ? OR email = ? OR email = ? LIMIT 1",
    args: [dummyParents[0].id, dummyParents[0].email, LEGACY_PARENT_EMAIL],
  });
  const parentPasswordHash =
    missingParent.rows.length === 0 ? hashSync(DEFAULT_PASSWORD, 10) : "";

  for (const parent of dummyParents) {
    if (parentPasswordHash) {
      await db
        .insert(schema.parents)
        .values({
          id: parent.id,
          name: parent.name,
          email: parent.email,
          passwordHash: parentPasswordHash,
          mustChangePassword: true,
          createdAt: now,
        })
        .onConflictDoNothing();
    }

    for (const studentId of parent.studentIds) {
      await db
        .insert(schema.parentStudents)
        .values({
          id: `${parent.id}-${studentId}`,
          parentId: parent.id,
          studentId,
          createdAt: now,
        })
        .onConflictDoNothing();
    }
  }

  const [mathMaterial] = await db
    .select({ id: schema.chapterMaterials.id })
    .from(schema.chapterMaterials)
    .where(
      and(
        eq(schema.chapterMaterials.batchId, "batch-grade-8"),
        eq(schema.chapterMaterials.pdfOriginalName, "grade8-linear-equations.pdf"),
      ),
    )
    .limit(1);

  if (mathMaterial) {
    await db
      .insert(schema.chapterMaterialAssignments)
      .values({
        id: `${mathMaterial.id}-student-aarav`,
        materialId: mathMaterial.id,
        studentId: "student-aarav",
        createdAt: now,
      })
      .onConflictDoNothing();
  }
}

async function rebuildLegacyCourseSchema() {
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='courses'",
  );
  if (tables.rows.length === 0) return;

  const info = await client.execute("PRAGMA table_info(courses)");
  const columns = info.rows.map((row) => String(row.name));
  const isLegacy = columns.includes("batch_id") || !columns.includes("teacher_id");
  if (!isLegacy) return;

  await client.execute("PRAGMA foreign_keys = OFF");
  for (const table of [
    "parent_students",
    "parents",
    "student_mark_chapters",
    "student_chapter_marks",
    "student_batches",
    "chapter_material_assignments",
    "chapter_materials",
    "batch_courses",
    "chapters",
    "courses",
    "students",
    "batches",
  ]) {
    await client.execute(`DROP TABLE IF EXISTS ${table}`);
  }
  await client.execute("PRAGMA foreign_keys = ON");
}

async function ensureLookupSchema() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS lookup_options (
      id TEXT PRIMARY KEY,
      list_key TEXT NOT NULL,
      value TEXT NOT NULL,
      label TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      UNIQUE (list_key, value)
    )
  `);

  const existing = await client.execute(
    "SELECT COUNT(*) AS count FROM lookup_options",
  );
  if (Number(existing.rows[0]?.count ?? 0) > 0) return;

  const now = new Date();
  const seeds = [
    ...SYLLABUSES.map((item, position) => ({
      id: `lookup-syllabus-${item.value}`,
      listKey: "syllabus",
      value: item.value,
      label: item.label,
      position,
      createdAt: now,
    })),
    ...EXAMS.map((item, position) => ({
      id: `lookup-exam-${item.value}`,
      listKey: "exam",
      value: item.value,
      label: item.label,
      position,
      createdAt: now,
    })),
    ...EXAM_PAPERS.map((item, position) => ({
      id: `lookup-exam-paper-${item.value}`,
      listKey: "exam_paper",
      value: item.value,
      label: item.label,
      position,
      createdAt: now,
    })),
  ];

  await db.insert(schema.lookupOptions).values(seeds);
}

async function ensureLeadsSchema() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      parent_name TEXT NOT NULL,
      student_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      class_name TEXT NOT NULL,
      subjects TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      notes TEXT NOT NULL DEFAULT '',
      assigned_teacher_id TEXT,
      contacted_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `);
  await addMissingColumns("leads", [
    ["assigned_teacher_id", "TEXT"],
    ["contacted_at", "INTEGER"],
  ]);
}

async function addMissingColumns(table: string, columns: [name: string, definition: string][]) {
  const info = await client.execute(`PRAGMA table_info(${table})`);
  if (info.rows.length === 0) return false;
  const existing = new Set(info.rows.map((row) => String(row.name)));
  for (const [name, definition] of columns) {
    if (!existing.has(name)) {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
    }
  }
  return true;
}

let adminSchemaReady = false;

/** Roles, account status, last sign-in, and the activity log. Idempotent. */
async function ensureAdminSchema() {
  if (adminSchemaReady) return;

  const accountColumns: [string, string][] = [
    ["status", "TEXT NOT NULL DEFAULT 'active'"],
    ["last_login_at", "INTEGER"],
  ];
  const ready = [
    await addMissingColumns("teachers", [
      ["role", "TEXT NOT NULL DEFAULT 'teacher'"],
      ["role_expires_at", "INTEGER"],
      ["role_granted_by", "TEXT"],
      ...accountColumns,
    ]),
    await addMissingColumns("students", accountColumns),
    await addMissingColumns("parents", accountColumns),
  ];

  await client.execute(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_role TEXT NOT NULL,
      actor_name TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      summary TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  await client.execute(
    "CREATE INDEX IF NOT EXISTS audit_events_created ON audit_events(created_at)",
  );

  // A table created later in the boot sequence gets its columns on the next pass.
  adminSchemaReady = ready.every(Boolean);
}

let ownerAdminReady = false;

/** The founder account is always an active, permanent admin. */
async function ensureOwnerAdmin() {
  if (ownerAdminReady) return;
  await client.execute({
    sql: `UPDATE teachers SET role = 'admin', role_expires_at = NULL, status = 'active'
          WHERE lower(email) = ?
            AND (role != 'admin' OR role_expires_at IS NOT NULL OR status != 'active')`,
    args: [ADMIN_EMAIL],
  });
  ownerAdminReady = true;
}

let passwordSchemaReady = false;
let cachedDefaultPasswordHash: string | null = null;

function defaultPasswordHash() {
  cachedDefaultPasswordHash ??= hashSync(DEFAULT_PASSWORD, 10);
  return cachedDefaultPasswordHash;
}

async function getPrototypeTeacher() {
  for (const email of [ADMIN_EMAIL, LEGACY_TEACHER_EMAIL]) {
    const [teacher] = await db
      .select()
      .from(schema.teachers)
      .where(eq(schema.teachers.email, email))
      .limit(1);
    if (teacher) return teacher;
  }

  const [teacher] = await db
    .select()
    .from(schema.teachers)
    .where(eq(schema.teachers.id, "teacher-demo"))
    .limit(1);
  return teacher ?? null;
}

export async function loadTakenEmails() {
  const taken = new Set<string>([ADMIN_EMAIL]);
  const [teacherRows, studentRows, parentRows] = await Promise.all([
    db.select({ email: schema.teachers.email }).from(schema.teachers),
    db.select({ email: schema.students.email }).from(schema.students),
    db.select({ email: schema.parents.email }).from(schema.parents),
  ]);

  for (const row of [...teacherRows, ...studentRows, ...parentRows]) {
    if (row.email) taken.add(row.email.toLowerCase());
  }

  return taken;
}

export async function nextAcademyEmail(name: string, extraTaken: Iterable<string> = []) {
  const taken = await loadTakenEmails();
  for (const email of extraTaken) {
    if (email) taken.add(email.toLowerCase());
  }
  return uniqueAcademyEmail(name, taken);
}

async function ensureMustChangePasswordSchema() {
  if (passwordSchemaReady) return;

  for (const table of ["teachers", "students", "parents"] as const) {
    const info = await client.execute(`PRAGMA table_info(${table})`);
    if (info.rows.length === 0) continue;
    const columns = info.rows.map((row) => String(row.name));
    if (!columns.includes("must_change_password")) {
      await client.execute(
        `ALTER TABLE ${table} ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 1`,
      );
    }
  }

  await migrateDemoIdentities();
  passwordSchemaReady = true;
}

const DEMO_PASSWORDS = ["Teacher123!", "Student123!", "Parent123!", DEFAULT_PASSWORD];

function usesDemoPassword(passwordHash: string | null | undefined) {
  if (!passwordHash) return true;
  return DEMO_PASSWORDS.some((password) => compareSync(password, passwordHash));
}

async function migrateDemoIdentities() {
  const defaultHash = defaultPasswordHash();
  const [legacyTeacher] = await db
    .select()
    .from(schema.teachers)
    .where(eq(schema.teachers.email, LEGACY_TEACHER_EMAIL))
    .limit(1);
  const [adminTeacher] = await db
    .select()
    .from(schema.teachers)
    .where(eq(schema.teachers.email, ADMIN_EMAIL))
    .limit(1);

  if (legacyTeacher && !adminTeacher) {
    await db
      .update(schema.teachers)
      .set({
        email: ADMIN_EMAIL,
        name: legacyTeacher.name === "Demo Teacher" ? "Bhargav" : legacyTeacher.name,
      })
      .where(eq(schema.teachers.id, legacyTeacher.id));
  } else if (adminTeacher?.name === "Demo Teacher") {
    await db
      .update(schema.teachers)
      .set({ name: "Bhargav" })
      .where(eq(schema.teachers.id, adminTeacher.id));
  }

  const demoTeacher = await getPrototypeTeacher();
  if (demoTeacher && usesDemoPassword(demoTeacher.passwordHash)) {
    await db
      .update(schema.teachers)
      .set({
        passwordHash: defaultHash,
        mustChangePassword: true,
      })
      .where(eq(schema.teachers.id, demoTeacher.id));
  }

  const taken = await loadTakenEmails();

  for (const batch of dummyBatches) {
    for (const student of batch.students) {
      const [row] = await db
        .select({
          id: schema.students.id,
          email: schema.students.email,
          passwordHash: schema.students.passwordHash,
          mustChangePassword: schema.students.mustChangePassword,
        })
        .from(schema.students)
        .where(eq(schema.students.id, student.id))
        .limit(1);
      if (!row) continue;

      if (!row.email || isLegacyStudentEmail(row.email)) {
        if (row.email) taken.delete(row.email.toLowerCase());
        const email = taken.has(student.email)
          ? uniqueAcademyEmail(student.name, taken)
          : student.email;
        taken.add(email);
        await db
          .update(schema.students)
          .set({ email })
          .where(eq(schema.students.id, student.id));
      }

      if (usesDemoPassword(row.passwordHash)) {
        await db
          .update(schema.students)
          .set({
            passwordHash: defaultHash,
            mustChangePassword: true,
          })
          .where(eq(schema.students.id, student.id));
      }
    }
  }

  for (const parent of dummyParents) {
    const [byId] = await db
      .select()
      .from(schema.parents)
      .where(eq(schema.parents.id, parent.id))
      .limit(1);
    const [byLegacy] = byId
      ? [byId]
      : await db
          .select()
          .from(schema.parents)
          .where(eq(schema.parents.email, LEGACY_PARENT_EMAIL))
          .limit(1);
    const current = byId ?? byLegacy;
    if (!current) continue;

    if (
      current.email === LEGACY_PARENT_EMAIL ||
      current.email.endsWith("@academy.test")
    ) {
      taken.delete(current.email.toLowerCase());
      const email = taken.has(parent.email)
        ? uniqueAcademyEmail(parent.name, taken)
        : parent.email;
      taken.add(email);
      await db
        .update(schema.parents)
        .set({ email })
        .where(eq(schema.parents.id, current.id));
    }

    if (usesDemoPassword(current.passwordHash)) {
      await db
        .update(schema.parents)
        .set({
          passwordHash: defaultHash,
          mustChangePassword: true,
        })
        .where(eq(schema.parents.id, current.id));
    }
  }
}

/*
 * Columns added with the teacher portal redesign. The due date is checked
 * before any seed insert, and again after the legacy chapter_materials
 * rebuild, because both write rows through the current Drizzle schema.
 */
async function addColumnIfMissing(table: string, column: string, definition: string) {
  const columns = (await client.execute(`PRAGMA table_info(${table})`)).rows.map((row) => String(row.name));
  if (columns.length === 0 || columns.includes(column)) return;
  try {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (error) {
    // Another process (a parallel build worker) may have just added it.
    if (!(error instanceof Error && /duplicate column/i.test(error.message))) throw error;
  }
}

async function ensureMaterialDueColumn() {
  await addColumnIfMissing("chapter_materials", "due_at", "INTEGER");
}

async function ensureLeadNotesColumn() {
  await addColumnIfMissing("leads", "notes", "TEXT NOT NULL DEFAULT ''");
}
