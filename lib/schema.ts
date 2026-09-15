import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const teachers = sqliteTable("teachers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  mustChangePassword: integer("must_change_password", { mode: "boolean" })
    .notNull()
    .default(true),
  /** "teacher" | "admin". Read through effectiveRole(), which honours expiry. */
  role: text("role").notNull().default("teacher"),
  /** Null means a permanent grant. */
  roleExpiresAt: integer("role_expires_at", { mode: "timestamp" }),
  roleGrantedBy: text("role_granted_by"),
  status: text("status").notNull().default("active"),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const batches = sqliteTable("batches", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const students = sqliteTable("students", {
  id: text("id").primaryKey(),
  batchId: text("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  mustChangePassword: integer("must_change_password", { mode: "boolean" })
    .notNull()
    .default(true),
  syllabus: text("syllabus").notNull().default(""),
  exam: text("exam").notNull().default(""),
  status: text("status").notNull().default("active"),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const chapters = sqliteTable("chapters", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const batchCourses = sqliteTable(
  "batch_courses",
  {
    id: text("id").primaryKey(),
    batchId: text("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("batch_courses_unique").on(table.batchId, table.courseId),
    uniqueIndex("batch_courses_batch_unique").on(table.batchId),
  ],
);

export const chapterMaterials = sqliteTable("chapter_materials", {
  id: text("id").primaryKey(),
  batchId: text("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  chapterId: text("chapter_id")
    .notNull()
    .references(() => chapters.id, { onDelete: "cascade" }),
  pdfFileName: text("pdf_file_name"),
  pdfOriginalName: text("pdf_original_name"),
  kind: text("kind").notNull().default("class_material"),
  instructions: text("instructions").notNull().default(""),
  position: integer("position").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const chapterMaterialAssignments = sqliteTable(
  "chapter_material_assignments",
  {
    id: text("id").primaryKey(),
    materialId: text("material_id")
      .notNull()
      .references(() => chapterMaterials.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    submissionFileName: text("submission_file_name"),
    submissionOriginalName: text("submission_original_name"),
  },
  (table) => [
    uniqueIndex("chapter_material_assignments_unique").on(
      table.materialId,
      table.studentId,
    ),
  ],
);

export const parents = sqliteTable("parents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  mustChangePassword: integer("must_change_password", { mode: "boolean" })
    .notNull()
    .default(true),
  status: text("status").notNull().default("active"),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const studentBatches = sqliteTable(
  "student_batches",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    batchId: text("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("student_batches_unique").on(table.studentId, table.batchId),
  ],
);

export const studentChapterMarks = sqliteTable("student_chapter_marks", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  batchId: text("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  syllabus: text("syllabus").notNull(),
  examPaper: text("exam_paper").notNull(),
  marks: real("marks").notNull(),
  recordedAt: integer("recorded_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const studentMarkChapters = sqliteTable(
  "student_mark_chapters",
  {
    id: text("id").primaryKey(),
    markId: text("mark_id")
      .notNull()
      .references(() => studentChapterMarks.id, { onDelete: "cascade" }),
    chapterId: text("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("student_mark_chapters_unique").on(table.markId, table.chapterId)],
);

export const lookupOptions = sqliteTable(
  "lookup_options",
  {
    id: text("id").primaryKey(),
    listKey: text("list_key").notNull(),
    value: text("value").notNull(),
    label: text("label").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [uniqueIndex("lookup_options_list_value").on(table.listKey, table.value)],
);

export const parentStudents = sqliteTable(
  "parent_students",
  {
    id: text("id").primaryKey(),
    parentId: text("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("parent_students_unique").on(table.parentId, table.studentId),
    uniqueIndex("parent_students_student_unique").on(table.studentId),
  ],
);

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  parentName: text("parent_name").notNull(),
  studentName: text("student_name").notNull(),
  phone: text("phone").notNull(),
  className: text("class_name").notNull(),
  subjects: text("subjects").notNull().default(""),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("new"),
  assignedTeacherId: text("assigned_teacher_id"),
  contactedAt: integer("contacted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  actorId: text("actor_id"),
  actorRole: text("actor_role").notNull(),
  actorName: text("actor_name").notNull().default(""),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  summary: text("summary").notNull(),
  metadata: text("metadata"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Teacher = typeof teachers.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Chapter = typeof chapters.$inferSelect;
export type ChapterMaterial = typeof chapterMaterials.$inferSelect;
export type ChapterMaterialAssignment = typeof chapterMaterialAssignments.$inferSelect;
export type Parent = typeof parents.$inferSelect;
export type ParentStudent = typeof parentStudents.$inferSelect;
export type StudentBatch = typeof studentBatches.$inferSelect;
export type StudentChapterMark = typeof studentChapterMarks.$inferSelect;
export type StudentMarkChapter = typeof studentMarkChapters.$inferSelect;
export type LookupOption = typeof lookupOptions.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
