import { hash } from "bcryptjs";
import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { parseOption } from "@/lib/academics";
import { audit, type AuditActor } from "@/lib/audit";
import { db, ensureDatabase, nextAcademyEmail } from "@/lib/db";
import { enrollInBatch, unenrollFromBatch } from "@/lib/enrolments";
import { DEFAULT_PASSWORD, resolveAccountPassword } from "@/lib/identity";
import { getLead, listLeads, updateLead, LEAD_STATUS_LABELS } from "@/lib/leads";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import {
  batchCourses,
  batches,
  courses,
  parentStudents,
  parents,
  studentBatches,
  students,
  teachers,
  type Teacher,
} from "@/lib/schema";
import {
  canEditTeacher,
  canGrantAdmin,
  canRevokeAdmin,
  canSuspend,
  canTransferTeaching,
  effectiveRole,
  isAdmin,
  isLeadStage,
  isOwner,
  type LeadStage,
  type PersonRole,
} from "./policy";

/*
 * Every write the admin console can make. Pages (through server actions) and
 * the JSON API both call these, so authorization, validation, and the audit
 * trail live in exactly one place. Each function re-checks that the actor is
 * an active admin; callers are never trusted to have done it.
 */

export type ServiceResult<T = null> =
  | { ok: true; data: T; message: string }
  | { ok: false; error: string; status: number };

function ok<T>(data: T, message: string): ServiceResult<T> {
  return { ok: true, data, message };
}

function fail(error: string, status = 400): { ok: false; error: string; status: number } {
  return { ok: false, error, status };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?\d{8,15}$/;

function text(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function ids(value: unknown) {
  const list = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  return [...new Set(list.map((item) => text(item)).filter(Boolean))];
}

function normalizePhone(value: unknown) {
  return text(value, 40).replace(/[^\d+]/g, "");
}

function auditActor(actor: Teacher): AuditActor {
  return { id: actor.id, role: "admin", name: actor.name };
}

function requireActiveAdmin(actor: Teacher) {
  if (actor.status !== "active" || !isAdmin(actor)) {
    return fail("Only admins can do this.", 403);
  }
  return null;
}

/** Admin changes show up everywhere, so refresh every portal. */
export function revalidateAcademy() {
  for (const root of ["/admin", "/dashboard", "/student", "/parent"]) {
    revalidatePath(root, "layout");
  }
}

async function findTeacher(id: string) {
  const [row] = await db.select().from(teachers).where(eq(teachers.id, id)).limit(1);
  return row ?? null;
}

async function findStudent(id: string) {
  const [row] = await db.select().from(students).where(eq(students.id, id)).limit(1);
  return row ?? null;
}

async function findParent(id: string) {
  const [row] = await db.select().from(parents).where(eq(parents.id, id)).limit(1);
  return row ?? null;
}

async function findAccount(role: PersonRole, id: string) {
  if (role === "teacher") return findTeacher(id);
  if (role === "student") return findStudent(id);
  return findParent(id);
}

const tableFor = { teacher: teachers, student: students, parent: parents } as const;

async function emailTaken(role: PersonRole, email: string, exceptId?: string) {
  const table = tableFor[role];
  const [row] = await db
    .select({ id: table.id })
    .from(table)
    .where(exceptId ? and(eq(table.email, email), ne(table.id, exceptId)) : eq(table.email, email))
    .limit(1);
  return Boolean(row);
}

async function resolveEmail(role: PersonRole, name: string, provided: unknown, exceptId?: string) {
  const email = text(provided).toLowerCase();
  if (!email) {
    return { email: await nextAcademyEmail(name) };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Enter a valid email address, or leave it blank to generate one." };
  }
  if (await emailTaken(role, email, exceptId)) {
    return { error: `Another ${role} already uses ${email}.` };
  }
  return { email };
}

async function readAcademicProfile(syllabusValue: unknown, examValue: unknown) {
  const catalog = await getLookupCatalog();
  const syllabus = parseOption(lookupChoices(catalog.syllabus), syllabusValue);
  const exam = parseOption(lookupChoices(catalog.exam), examValue);
  if (!syllabus) return { error: "Select the student's syllabus." } as const;
  if (!exam) return { error: "Select the exam this student is preparing for." } as const;
  return { syllabus, exam };
}

async function existingBatchIds(requested: string[]) {
  if (requested.length === 0) return [];
  const rows = await db.select({ id: batches.id }).from(batches).where(inArray(batches.id, requested));
  return rows.map((row) => row.id);
}

async function existingStudentIds(requested: string[]) {
  if (requested.length === 0) return [];
  const rows = await db.select({ id: students.id }).from(students).where(inArray(students.id, requested));
  return rows.map((row) => row.id);
}

/** A student has at most one parent login, so linking moves them. */
async function replaceChildren(parentId: string, studentIds: string[]) {
  await db.delete(parentStudents).where(eq(parentStudents.parentId, parentId));
  if (studentIds.length === 0) return;
  await db.delete(parentStudents).where(inArray(parentStudents.studentId, studentIds));
  const now = new Date();
  await db.insert(parentStudents).values(
    studentIds.map((studentId) => ({
      id: crypto.randomUUID(),
      parentId,
      studentId,
      createdAt: now,
    })),
  );
}

async function countActiveAdmins() {
  const rows = await db.select().from(teachers).where(eq(teachers.role, "admin"));
  return rows.filter((row) => isAdmin(row)).length;
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export type CreatePersonInput = {
  role: unknown;
  name: unknown;
  email?: unknown;
  phone?: unknown;
  password?: unknown;
  batchIds?: unknown;
  syllabus?: unknown;
  exam?: unknown;
  studentIds?: unknown;
  /** Teachers only. Omit for a plain teacher; expiresAt null means permanent. */
  admin?: { expiresAt: Date | null } | null;
};

export type CreatedPerson = { id: string; role: PersonRole; name: string; email: string; href: string };

export async function createPerson(
  actor: Teacher,
  input: CreatePersonInput,
): Promise<ServiceResult<CreatedPerson>> {
  await ensureDatabase();
  const denied = requireActiveAdmin(actor);
  if (denied) return denied;

  const role = input.role;
  if (role !== "teacher" && role !== "student" && role !== "parent") {
    return fail("Choose whether this person is a teacher, student, or parent.");
  }

  const name = text(input.name, 80);
  if (name.length < 2) return fail("Enter the person's full name.");

  const emailResult = await resolveEmail(role, name, input.email);
  if ("error" in emailResult) return fail(emailResult.error!);
  const email = emailResult.email;

  const passwordResult = resolveAccountPassword(text(input.password, 200));
  if ("error" in passwordResult) return fail(passwordResult.error!);
  const passwordHash = await hash(passwordResult.password, 10);
  const usesDefault = passwordResult.password === DEFAULT_PASSWORD;
  const signInHint = usesDefault ? ` They sign in with ${email} and the default password 123456.` : "";

  const id = crypto.randomUUID();
  const now = new Date();

  if (role === "teacher") {
    const grant = input.admin ?? null;
    if (grant) {
      const decision = canGrantAdmin(
        actor,
        { id, email, role: "teacher", roleExpiresAt: null, status: "active" },
        grant.expiresAt,
      );
      if (!decision.ok) return fail(decision.reason, 403);
    }

    await db.insert(teachers).values({
      id,
      name,
      email,
      passwordHash,
      mustChangePassword: true,
      role: grant ? "admin" : "teacher",
      roleExpiresAt: grant?.expiresAt ?? null,
      roleGrantedBy: grant ? actor.id : null,
      status: "active",
      lastLoginAt: null,
      createdAt: now,
    });

    const access = grant
      ? grant.expiresAt
        ? ` as an admin until ${grant.expiresAt.toLocaleDateString("en-IN")}`
        : " as a permanent admin"
      : "";
    await audit({
      actor: auditActor(actor),
      action: "person.create",
      entityType: "teacher",
      entityId: id,
      summary: `${actor.name} added teacher ${name}${access}`,
      metadata: { email, admin: Boolean(grant), expiresAt: grant?.expiresAt ?? null },
    });
    revalidateAcademy();
    return ok(
      { id, role, name, email, href: `/admin/teachers/${id}` },
      `Added ${name}${access}.${signInHint}`,
    );
  }

  if (role === "student") {
    const phone = normalizePhone(input.phone);
    if (!PHONE_PATTERN.test(phone)) return fail("Enter a valid contact number (8–15 digits).");

    const batchIds = await existingBatchIds(ids(input.batchIds));
    if (batchIds.length === 0) return fail("Choose at least one batch for the student.");

    const academic = await readAcademicProfile(input.syllabus, input.exam);
    if ("error" in academic) return fail(academic.error!);

    await db.insert(students).values({
      id,
      batchId: batchIds[0],
      name,
      contactNumber: phone,
      email,
      passwordHash,
      mustChangePassword: true,
      syllabus: academic.syllabus,
      exam: academic.exam,
      status: "active",
      lastLoginAt: null,
      createdAt: now,
    });
    for (const batchId of batchIds) {
      await enrollInBatch(id, batchId);
    }

    await audit({
      actor: auditActor(actor),
      action: "person.create",
      entityType: "student",
      entityId: id,
      summary: `${actor.name} added student ${name}`,
      metadata: { email, batchIds },
    });
    revalidateAcademy();
    return ok({ id, role, name, email, href: `/admin/students/${id}` }, `Added ${name}.${signInHint}`);
  }

  const studentIds = await existingStudentIds(ids(input.studentIds));
  if (studentIds.length === 0) return fail("Choose at least one child for this parent.");

  await db.insert(parents).values({
    id,
    name,
    email,
    passwordHash,
    mustChangePassword: true,
    status: "active",
    lastLoginAt: null,
    createdAt: now,
  });
  await replaceChildren(id, studentIds);

  await audit({
    actor: auditActor(actor),
    action: "person.create",
    entityType: "parent",
    entityId: id,
    summary: `${actor.name} added parent ${name}`,
    metadata: { email, studentIds },
  });
  revalidateAcademy();
  return ok({ id, role, name, email, href: `/admin/parents/${id}` }, `Added ${name}.${signInHint}`);
}

export type UpdatePersonInput = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  syllabus?: unknown;
  exam?: unknown;
};

export async function updatePerson(
  actor: Teacher,
  role: PersonRole,
  id: string,
  input: UpdatePersonInput,
): Promise<ServiceResult> {
  await ensureDatabase();
  const denied = requireActiveAdmin(actor);
  if (denied) return denied;

  const account = await findAccount(role, id);
  if (!account) return fail(`That ${role} no longer exists.`, 404);

  if (role === "teacher") {
    const decision = canEditTeacher(actor, account as Teacher);
    if (!decision.ok) return fail(decision.reason, 403);
  }

  const name = input.name === undefined ? account.name : text(input.name, 80);
  if (name.length < 2) return fail("Enter the person's full name.");

  let email = account.email;
  if (input.email !== undefined && text(input.email).toLowerCase() !== account.email) {
    const result = await resolveEmail(role, name, input.email, id);
    if ("error" in result) return fail(result.error!);
    email = result.email;
  }
  if (role === "teacher" && isOwner(account as Teacher) && email !== account.email) {
    return fail("The owner's email identifies the academy owner and cannot be changed here.", 403);
  }

  const changes: string[] = [];
  if (name !== account.name) changes.push("name");
  if (email !== account.email) changes.push("email");

  if (role === "student") {
    const student = account as typeof students.$inferSelect;
    const phone = input.phone === undefined ? student.contactNumber : normalizePhone(input.phone);
    if (!PHONE_PATTERN.test(phone)) return fail("Enter a valid contact number (8–15 digits).");
    const academic =
      input.syllabus === undefined && input.exam === undefined
        ? { syllabus: student.syllabus, exam: student.exam }
        : await readAcademicProfile(input.syllabus ?? student.syllabus, input.exam ?? student.exam);
    if ("error" in academic) return fail(academic.error!);
    if (phone !== student.contactNumber) changes.push("phone");
    if (academic.syllabus !== student.syllabus || academic.exam !== student.exam) changes.push("syllabus/exam");
    await db
      .update(students)
      .set({ name, email, contactNumber: phone, syllabus: academic.syllabus, exam: academic.exam })
      .where(eq(students.id, id));
  } else {
    await db.update(tableFor[role]).set({ name, email }).where(eq(tableFor[role].id, id));
  }

  if (changes.length === 0) return ok(null, "Nothing changed.");

  await audit({
    actor: auditActor(actor),
    action: "person.update",
    entityType: role,
    entityId: id,
    summary: `${actor.name} updated ${changes.join(", ")} for ${name}`,
    metadata: { before: { name: account.name, email: account.email }, after: { name, email } },
  });
  revalidateAcademy();
  return ok(null, `Saved changes to ${name}.`);
}

export async function resetPassword(actor: Teacher, role: PersonRole, id: string): Promise<ServiceResult> {
  await ensureDatabase();
  const denied = requireActiveAdmin(actor);
  if (denied) return denied;

  const account = await findAccount(role, id);
  if (!account) return fail(`That ${role} no longer exists.`, 404);
  if (role === "teacher" && account.id === actor.id) {
    return fail("Change your own password from the sign-in screen instead.", 403);
  }
  if (role === "teacher" && isOwner(account as Teacher) && !isOwner(actor)) {
    return fail("Only the owner can reset the owner's password.", 403);
  }

  const passwordHash = await hash(DEFAULT_PASSWORD, 10);
  await db
    .update(tableFor[role])
    .set({ passwordHash, mustChangePassword: true })
    .where(eq(tableFor[role].id, id));

  await audit({
    actor: auditActor(actor),
    action: "person.reset_password",
    entityType: role,
    entityId: id,
    summary: `${actor.name} reset the password for ${account.name}`,
  });
  revalidateAcademy();
  return ok(null, `${account.name} can now sign in with 123456 and will be asked to choose a new password.`);
}

export async function setAccountStatus(
  actor: Teacher,
  role: PersonRole,
  id: string,
  status: "active" | "suspended",
): Promise<ServiceResult> {
  await ensureDatabase();
  const denied = requireActiveAdmin(actor);
  if (denied) return denied;

  const account = await findAccount(role, id);
  if (!account) return fail(`That ${role} no longer exists.`, 404);

  if (status === "suspended") {
    const decision = canSuspend(actor, account);
    if (!decision.ok) return fail(decision.reason, 403);
    if (role === "teacher" && isAdmin(account as Teacher) && (await countActiveAdmins()) <= 1) {
      return fail("The academy needs at least one active admin.", 403);
    }
  } else if (account.status === "active") {
    return fail("This account is already active.");
  }

  await db.update(tableFor[role]).set({ status }).where(eq(tableFor[role].id, id));
  await audit({
    actor: auditActor(actor),
    action: status === "suspended" ? "person.suspend" : "person.reactivate",
    entityType: role,
    entityId: id,
    summary: `${actor.name} ${status === "suspended" ? "suspended" : "reactivated"} ${account.name}`,
  });
  revalidateAcademy();
  return ok(
    null,
    status === "suspended"
      ? `${account.name} is suspended and will be signed out on their next click.`
      : `${account.name} can sign in again.`,
  );
}

// ---------------------------------------------------------------------------
// Admin access
// ---------------------------------------------------------------------------

export async function grantAdmin(
  actor: Teacher,
  teacherId: string,
  expiresAt: Date | null,
): Promise<ServiceResult> {
  await ensureDatabase();
  const denied = requireActiveAdmin(actor);
  if (denied) return denied;

  const teacher = await findTeacher(teacherId);
  if (!teacher) return fail("That teacher no longer exists.", 404);

  const decision = canGrantAdmin(actor, teacher, expiresAt);
  if (!decision.ok) return fail(decision.reason, 403);

  await db
    .update(teachers)
    .set({ role: "admin", roleExpiresAt: expiresAt, roleGrantedBy: actor.id })
    .where(eq(teachers.id, teacherId));

  const until = expiresAt ? `until ${expiresAt.toLocaleDateString("en-IN")}` : "permanently";
  await audit({
    actor: auditActor(actor),
    action: "role.grant",
    entityType: "teacher",
    entityId: teacherId,
    summary: `${actor.name} made ${teacher.name} an admin ${until}`,
    metadata: {
      before: { role: effectiveRole(teacher), expiresAt: teacher.roleExpiresAt },
      after: { role: "admin", expiresAt },
    },
  });
  revalidateAcademy();
  return ok(null, `${teacher.name} is an admin ${until}.`);
}

export async function revokeAdmin(actor: Teacher, teacherId: string): Promise<ServiceResult> {
  await ensureDatabase();
  const denied = requireActiveAdmin(actor);
  if (denied) return denied;

  const teacher = await findTeacher(teacherId);
  if (!teacher) return fail("That teacher no longer exists.", 404);

  const decision = canRevokeAdmin(actor, teacher, await countActiveAdmins());
  if (!decision.ok) return fail(decision.reason, 403);

  await db
    .update(teachers)
    .set({ role: "teacher", roleExpiresAt: null, roleGrantedBy: null })
    .where(eq(teachers.id, teacherId));

  await audit({
    actor: auditActor(actor),
    action: "role.revoke",
    entityType: "teacher",
    entityId: teacherId,
    summary: `${actor.name} removed admin access from ${teacher.name}`,
  });
  revalidateAcademy();
  return ok(null, `${teacher.name} is a teacher again.`);
}

// ---------------------------------------------------------------------------
// Teaching ownership
// ---------------------------------------------------------------------------

export async function transferTeaching(
  actor: Teacher,
  fromTeacherId: string,
  input: { toTeacherId: unknown; batchIds?: unknown },
): Promise<ServiceResult<{ batches: number; courses: number }>> {
  await ensureDatabase();
  const denied = requireActiveAdmin(actor);
  if (denied) return denied;

  const from = await findTeacher(fromTeacherId);
  if (!from) return fail("That teacher no longer exists.", 404);
  const toId = text(input.toTeacherId);
  const to = toId ? await findTeacher(toId) : null;

  const decision = canTransferTeaching(actor, fromTeacherId, to);
  if (!decision.ok) return fail(decision.reason);

  const owned = await db.select().from(batches).where(eq(batches.teacherId, fromTeacherId));
  const requested = input.batchIds === undefined ? null : ids(input.batchIds);
  if (requested && requested.length === 0) return fail("Choose at least one batch to move.");
  if (requested && requested.some((id) => !owned.some((batch) => batch.id === id))) {
    return fail(`Some of those batches don't belong to ${from.name}.`);
  }

  const moving = requested ? owned.filter((batch) => requested.includes(batch.id)) : owned;
  const movingIds = new Set(moving.map((batch) => batch.id));
  const movesEverything = moving.length === owned.length;

  const links =
    owned.length > 0
      ? await db
          .select()
          .from(batchCourses)
          .where(inArray(batchCourses.batchId, owned.map((batch) => batch.id)))
      : [];
  const movingCourseIds = new Set(links.filter((link) => movingIds.has(link.batchId)).map((link) => link.courseId));

  // Teacher pages require a batch and its course to share an owner, so a course
  // used by a batch that stays behind cannot move on its own.
  for (const link of links) {
    if (!movingIds.has(link.batchId) && movingCourseIds.has(link.courseId)) {
      const staying = owned.find((batch) => batch.id === link.batchId);
      const [course] = await db.select({ title: courses.title }).from(courses).where(eq(courses.id, link.courseId));
      return fail(
        `“${course?.title ?? "A course"}” is also used by ${staying?.name ?? "another batch"}. Move both batches together.`,
      );
    }
  }

  const now = new Date();
  if (movingIds.size > 0) {
    await db
      .update(batches)
      .set({ teacherId: to!.id, updatedAt: now })
      .where(inArray(batches.id, [...movingIds]));
  }

  let courseCount = movingCourseIds.size;
  if (movesEverything) {
    const library = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.teacherId, fromTeacherId));
    courseCount = library.length;
    await db.update(courses).set({ teacherId: to!.id, updatedAt: now }).where(eq(courses.teacherId, fromTeacherId));

    const leads = await listLeads();
    for (const lead of leads.filter((row) => row.assignedTeacherId === fromTeacherId)) {
      await updateLead(lead.id, { assignedTeacherId: to!.id });
    }
  } else if (movingCourseIds.size > 0) {
    await db
      .update(courses)
      .set({ teacherId: to!.id, updatedAt: now })
      .where(inArray(courses.id, [...movingCourseIds]));
  }

  const summary = movesEverything
    ? `${actor.name} moved all of ${from.name}'s teaching to ${to!.name}`
    : `${actor.name} moved ${moving.map((batch) => batch.name).join(", ")} from ${from.name} to ${to!.name}`;
  await audit({
    actor: auditActor(actor),
    action: "teaching.transfer",
    entityType: "teacher",
    entityId: fromTeacherId,
    summary,
    metadata: { toTeacherId: to!.id, batchIds: [...movingIds], courseCount },
  });
  revalidateAcademy();
  return ok(
    { batches: movingIds.size, courses: courseCount },
    `Moved ${movingIds.size} ${movingIds.size === 1 ? "batch" : "batches"} to ${to!.name}.`,
  );
}

export async function setStudentBatches(
  actor: Teacher,
  studentId: string,
  batchIdsInput: unknown,
): Promise<ServiceResult> {
  await ensureDatabase();
  const denied = requireActiveAdmin(actor);
  if (denied) return denied;

  const student = await findStudent(studentId);
  if (!student) return fail("That student no longer exists.", 404);

  const next = await existingBatchIds(ids(batchIdsInput));
  if (next.length === 0) {
    return fail("A student needs at least one batch. Suspend them instead to remove access.");
  }

  const current = (
    await db.select({ batchId: studentBatches.batchId }).from(studentBatches).where(eq(studentBatches.studentId, studentId))
  ).map((row) => row.batchId);

  const added = next.filter((id) => !current.includes(id));
  const removed = current.filter((id) => !next.includes(id));
  // Add first so removing the last old batch never deletes the student.
  for (const batchId of added) await enrollInBatch(studentId, batchId);
  for (const batchId of removed) await unenrollFromBatch(studentId, batchId);

  if (added.length === 0 && removed.length === 0) return ok(null, "Nothing changed.");

  await audit({
    actor: auditActor(actor),
    action: "student.enrolments",
    entityType: "student",
    entityId: studentId,
    summary: `${actor.name} changed ${student.name}'s batches (${added.length} added, ${removed.length} removed)`,
    metadata: { added, removed },
  });
  revalidateAcademy();
  return ok(null, `Updated ${student.name}'s batches.`);
}

export async function setParentChildren(
  actor: Teacher,
  parentId: string,
  studentIdsInput: unknown,
): Promise<ServiceResult> {
  await ensureDatabase();
  const denied = requireActiveAdmin(actor);
  if (denied) return denied;

  const parent = await findParent(parentId);
  if (!parent) return fail("That parent no longer exists.", 404);

  const next = await existingStudentIds(ids(studentIdsInput));
  if (next.length === 0) return fail("Choose at least one child for this parent.");

  await replaceChildren(parentId, next);
  await audit({
    actor: auditActor(actor),
    action: "parent.children",
    entityType: "parent",
    entityId: parentId,
    summary: `${actor.name} linked ${next.length} ${next.length === 1 ? "child" : "children"} to ${parent.name}`,
    metadata: { studentIds: next },
  });
  revalidateAcademy();
  return ok(null, `Updated ${parent.name}'s children.`);
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function updateLeadAsAdmin(
  actor: Teacher,
  leadId: string,
  input: { status?: unknown; assignedTeacherId?: unknown },
): Promise<ServiceResult> {
  await ensureDatabase();
  const denied = requireActiveAdmin(actor);
  if (denied) return denied;

  const lead = await getLead(leadId);
  if (!lead) return fail("That lead no longer exists.", 404);

  const patch: { status?: LeadStage; assignedTeacherId?: string | null } = {};
  if (input.status !== undefined) {
    if (!isLeadStage(input.status)) return fail("Choose a valid lead stage.");
    patch.status = input.status;
  }
  if (input.assignedTeacherId !== undefined) {
    const teacherId = text(input.assignedTeacherId);
    if (teacherId) {
      const teacher = await findTeacher(teacherId);
      if (!teacher || teacher.status !== "active") return fail("Choose an active teacher.");
    }
    patch.assignedTeacherId = teacherId || null;
  }

  const updated = await updateLead(leadId, patch);
  const parts: string[] = [];
  if (patch.status && patch.status !== lead.status) parts.push(`moved to ${LEAD_STATUS_LABELS[patch.status]}`);
  if (patch.assignedTeacherId !== undefined && patch.assignedTeacherId !== lead.assignedTeacherId) {
    const teacher = patch.assignedTeacherId ? await findTeacher(patch.assignedTeacherId) : null;
    parts.push(teacher ? `assigned to ${teacher.name}` : "unassigned");
  }
  if (parts.length === 0) return ok(null, "Nothing changed.");

  await audit({
    actor: auditActor(actor),
    action: "lead.update",
    entityType: "lead",
    entityId: leadId,
    summary: `${actor.name}: ${updated.studentName}'s enquiry ${parts.join(" and ")}`,
    metadata: { before: { status: lead.status, assignedTeacherId: lead.assignedTeacherId }, after: patch },
  });
  revalidateAcademy();
  return ok(null, `${updated.studentName}'s enquiry ${parts.join(" and ")}.`);
}

/** Turns an enquiry into a student and parent login in one step. */
export async function convertLead(
  actor: Teacher,
  leadId: string,
  input: { batchId: unknown; syllabus: unknown; exam: unknown },
): Promise<ServiceResult<{ studentId: string; parentId: string }>> {
  await ensureDatabase();
  const denied = requireActiveAdmin(actor);
  if (denied) return denied;

  const lead = await getLead(leadId);
  if (!lead) return fail("That lead no longer exists.", 404);
  if (lead.status === "enrolled") return fail("This enquiry has already been enrolled.");

  const student = await createPerson(actor, {
    role: "student",
    name: lead.studentName,
    phone: lead.phone,
    batchIds: [input.batchId],
    syllabus: input.syllabus,
    exam: input.exam,
  });
  if (!student.ok) return student;

  const parent = await createPerson(actor, {
    role: "parent",
    name: lead.parentName,
    studentIds: [student.data.id],
  });
  if (!parent.ok) {
    return fail(`Created ${lead.studentName}, but not the parent login: ${parent.error}`);
  }

  await updateLead(leadId, { status: "enrolled" });
  await audit({
    actor: auditActor(actor),
    action: "lead.convert",
    entityType: "lead",
    entityId: leadId,
    summary: `${actor.name} enrolled ${lead.studentName} from a website enquiry`,
    metadata: { studentId: student.data.id, parentId: parent.data.id },
  });
  revalidateAcademy();
  return ok(
    { studentId: student.data.id, parentId: parent.data.id },
    `Enrolled ${lead.studentName} (${student.data.email}) with parent login ${parent.data.email}. Both use the default password 123456.`,
  );
}
