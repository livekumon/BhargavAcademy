"use server";

import { flash } from "@/lib/flash";
import { isAdmin } from "@/lib/admin/policy";
import { getLead, updateLeadStatus } from "@/lib/leads";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { db, ensureDatabase, nextAcademyEmail } from "@/lib/db";
import { enrollInBatch, unenrollFromBatch } from "@/lib/enrolments";
import { resolveAccountPassword } from "@/lib/identity";
import { batchPath, parentChildPath, studentsPath, studentManagePath } from "@/lib/paths";
import { parseOption } from "@/lib/academics";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import {
  getOwnedBatch,
  getOwnedStudent,
  getOwnedStudentForTeacher,
} from "@/lib/queries";
import { hash } from "bcryptjs";
import {
  batches,
  parents,
  parentStudents,
  studentBatches,
  students,
} from "@/lib/schema";

export type StudentState = {
  error?: string;
};

function normalizeContact(value: string) {
  return value.replace(/\s+/g, "");
}

function isValidContact(value: string) {
  return /^[+]?\d{8,15}$/.test(value);
}

async function readAcademicProfile(formData: FormData) {
  const catalog = await getLookupCatalog();
  const syllabus = parseOption(
    lookupChoices(catalog.syllabus),
    formData.get("syllabus"),
  );
  const exam = parseOption(lookupChoices(catalog.exam), formData.get("exam"));
  if (!syllabus) {
    return { error: "Select the student's syllabus." } as const;
  }
  if (!exam) {
    return { error: "Select the exam this student is preparing for." } as const;
  }
  return { syllabus, exam };
}

async function studentOwnedByTeacher(teacherId: string, studentId: string) {
  const [row] = await db
    .select({ id: studentBatches.id })
    .from(studentBatches)
    .innerJoin(batches, eq(studentBatches.batchId, batches.id))
    .where(
      and(
        eq(studentBatches.studentId, studentId),
        eq(batches.teacherId, teacherId),
      ),
    )
    .limit(1);

  return Boolean(row);
}

/** A student created from a website enquiry closes that lead, if it's this teacher's to close. */
async function markLeadEnrolled(formData: FormData, teacher: { id: string } & Parameters<typeof isAdmin>[0]) {
  const leadId = String(formData.get("leadId") ?? "").trim();
  if (!leadId) return;
  try {
    const lead = await getLead(leadId);
    if (!lead || (lead.assignedTeacherId !== teacher.id && !isAdmin(teacher))) return;
    await updateLeadStatus(leadId, "enrolled");
    revalidatePath("/dashboard/leads");
    revalidatePath("/admin/leads");
  } catch {
    // The lead may have been removed; the student is created either way.
  }
}

function safeNext(value: unknown) {
  const next = String(value ?? "").trim();
  return next.startsWith("/dashboard/") && !next.startsWith("//") ? next : "";
}

function revalidateStudentPaths(batchId: string, studentId: string) {
  revalidatePath(batchPath(batchId));
  revalidatePath(studentsPath());
  revalidatePath(studentManagePath(studentId));
  revalidatePath("/parent");
  revalidatePath(parentChildPath(studentId));
  revalidatePath("/student");
}

export async function createStudent(
  batchId: string | null,
  _prev: StudentState,
  formData: FormData,
): Promise<StudentState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const resolvedBatchId = (batchId ?? String(formData.get("batchId") ?? "")).trim();
  const batch = await getOwnedBatch(teacher.id, resolvedBatchId);
  if (!batch) {
    return { error: "Select a batch for this student." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const contactNumber = normalizeContact(
    String(formData.get("contactNumber") ?? ""),
  );
  let email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) {
    return { error: "Student name is required." };
  }
  if (!isValidContact(contactNumber)) {
    return { error: "Enter a valid contact number." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid student email." };
  }
  if (!email) {
    email = await nextAcademyEmail(name);
  }

  const academic = await readAcademicProfile(formData);
  if ("error" in academic) {
    return academic;
  }

  const [existing] = await db
    .select()
    .from(students)
    .where(eq(students.email, email))
    .limit(1);

  if (existing) {
    const belongs = await studentOwnedByTeacher(teacher.id, existing.id);
    if (!belongs) {
      return { error: "A student with this email already exists." };
    }

    const [already] = await db
      .select({ id: studentBatches.id })
      .from(studentBatches)
      .where(
        and(
          eq(studentBatches.studentId, existing.id),
          eq(studentBatches.batchId, batch.id),
        ),
      )
      .limit(1);
    if (already) {
      return { error: "This student is already in this batch." };
    }

    await enrollInBatch(existing.id, batch.id);
    await db
      .update(students)
      .set({ syllabus: academic.syllabus, exam: academic.exam })
      .where(eq(students.id, existing.id));

    const parentEmail = String(formData.get("parentEmail") ?? "").trim();
    const parentName = String(formData.get("parentName") ?? "").trim();
    if (parentEmail || parentName) {
      const parentResult = await syncStudentParent(existing.id, formData);
      if (parentResult?.error) {
        return parentResult;
      }
    }

    revalidateStudentPaths(batch.id, existing.id);
    await markLeadEnrolled(formData, teacher);
    await flash(`${existing.name} added to ${batch.name}`);
    redirect(safeNext(formData.get("next")) || batchPath(batch.id));
  }

  const resolvedPassword = resolveAccountPassword(password);
  if ("error" in resolvedPassword) {
    return resolvedPassword;
  }

  const studentId = crypto.randomUUID();
  await db.insert(students).values({
    id: studentId,
    batchId: batch.id,
    name,
    contactNumber,
    email,
    passwordHash: await hash(resolvedPassword.password, 10),
    mustChangePassword: true,
    syllabus: academic.syllabus,
    exam: academic.exam,
    createdAt: new Date(),
  });
  await enrollInBatch(studentId, batch.id);

  const parentResult = await syncStudentParent(studentId, formData);
  if (parentResult?.error) {
    return parentResult;
  }

  revalidateStudentPaths(batch.id, studentId);
  await markLeadEnrolled(formData, teacher);
  await flash(`${name} added`, { description: `Enrolled in ${batch.name}. Their login is ${email}.` });
  redirect(safeNext(formData.get("next")) || batchPath(batch.id));
}

export async function updateStudent(
  batchId: string,
  studentId: string,
  _prev: StudentState,
  formData: FormData,
): Promise<StudentState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const owned = await getOwnedStudent(teacher.id, batchId, studentId);
  if (!owned) {
    return { error: "Student not found." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const contactNumber = normalizeContact(
    String(formData.get("contactNumber") ?? ""),
  );
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) {
    return { error: "Student name is required." };
  }
  if (!isValidContact(contactNumber)) {
    return { error: "Enter a valid contact number." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid student email." };
  }

  const academic = await readAcademicProfile(formData);
  if ("error" in academic) {
    return academic;
  }

  const [emailOwner] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.email, email))
    .limit(1);
  if (emailOwner && emailOwner.id !== studentId) {
    return { error: "A student with this email already exists." };
  }

  const updates: {
    name: string;
    contactNumber: string;
    email: string;
    syllabus: string;
    exam: string;
    passwordHash?: string;
    mustChangePassword?: boolean;
  } = {
    name,
    contactNumber,
    email,
    syllabus: academic.syllabus,
    exam: academic.exam,
  };

  if (password) {
    const resolvedPassword = resolveAccountPassword(password);
    if ("error" in resolvedPassword) {
      return resolvedPassword;
    }
    updates.passwordHash = await hash(resolvedPassword.password, 10);
    updates.mustChangePassword = true;
  }

  await db.update(students).set(updates).where(eq(students.id, studentId));

  const parentResult = await syncStudentParent(studentId, formData);
  if (parentResult?.error) {
    return parentResult;
  }

  revalidateStudentPaths(batchId, studentId);
  await flash(`${name} saved`);
  redirect(safeNext(formData.get("next")) || batchPath(batchId));
}

export async function updateDirectoryStudent(
  studentId: string,
  _prev: StudentState,
  formData: FormData,
): Promise<StudentState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const owned = await getOwnedStudentForTeacher(teacher.id, studentId);
  if (!owned) {
    return { error: "Student not found." };
  }

  return updateStudent(owned.batches[0].id, studentId, _prev, formData);
}

export async function enrollStudent(
  studentId: string,
  _prev: StudentState,
  formData: FormData,
): Promise<StudentState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const owned = await getOwnedStudentForTeacher(teacher.id, studentId);
  if (!owned) {
    return { error: "Student not found." };
  }

  const batchId = String(formData.get("batchId") ?? "").trim();
  const batch = await getOwnedBatch(teacher.id, batchId);
  if (!batch) {
    return { error: "Select a batch." };
  }

  if (owned.batches.some((item) => item.id === batch.id)) {
    return { error: "This student is already in that batch." };
  }

  await enrollInBatch(studentId, batch.id);
  revalidateStudentPaths(batch.id, studentId);
  await flash(`Enrolled in ${batch.name}`);
  redirect(studentManagePath(studentId));
}

async function syncStudentParent(
  studentId: string,
  formData: FormData,
): Promise<StudentState | void> {
  const parentName = String(formData.get("parentName") ?? "").trim();
  let parentEmail = String(formData.get("parentEmail") ?? "")
    .trim()
    .toLowerCase();
  const parentPassword = String(formData.get("parentPassword") ?? "");

  if (!parentEmail && parentName.length >= 2) {
    parentEmail = await nextAcademyEmail(parentName);
  }

  if (!parentEmail) {
    await db
      .delete(parentStudents)
      .where(eq(parentStudents.studentId, studentId));
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
    return { error: "Enter a valid parent email." };
  }

  const [existing] = await db
    .select()
    .from(parents)
    .where(eq(parents.email, parentEmail))
    .limit(1);

  let parentId = existing?.id;

  if (!existing) {
    if (parentName.length < 2) {
      return { error: "Parent name is required for a new parent login." };
    }
    const resolvedPassword = resolveAccountPassword(parentPassword);
    if ("error" in resolvedPassword) {
      return resolvedPassword;
    }

    parentId = crypto.randomUUID();
    await db.insert(parents).values({
      id: parentId,
      name: parentName,
      email: parentEmail,
      passwordHash: await hash(resolvedPassword.password, 10),
      mustChangePassword: true,
      createdAt: new Date(),
    });
  } else if (parentPassword) {
    const resolvedPassword = resolveAccountPassword(parentPassword);
    if ("error" in resolvedPassword) {
      return resolvedPassword;
    }
    await db
      .update(parents)
      .set({
        name: parentName || existing.name,
        passwordHash: await hash(resolvedPassword.password, 10),
        mustChangePassword: true,
      })
      .where(eq(parents.id, existing.id));
  } else if (parentName && parentName !== existing.name) {
    await db
      .update(parents)
      .set({ name: parentName })
      .where(eq(parents.id, existing.id));
  }

  await db.delete(parentStudents).where(eq(parentStudents.studentId, studentId));
  await db.insert(parentStudents).values({
    id: crypto.randomUUID(),
    parentId: parentId!,
    studentId,
    createdAt: new Date(),
  });
}

export async function enrollDirectoryStudents(formData: FormData) {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const studentIds = [
    ...new Set(formData.getAll("studentIds").map((value) => String(value).trim())),
  ].filter(Boolean);
  const batchId = String(formData.get("batchId") ?? "").trim();
  const batch = await getOwnedBatch(teacher.id, batchId);

  if (studentIds.length === 0) {
    redirect(safeNext(formData.get("next")) || studentsPath());
  }
  if (!batch) {
    redirect(safeNext(formData.get("next")) || studentsPath());
  }

  for (const studentId of studentIds) {
    const owned = await getOwnedStudentForTeacher(teacher.id, studentId);
    if (!owned) continue;
    if (owned.batches.some((item) => item.id === batch.id)) continue;
    await enrollInBatch(studentId, batch.id);
    revalidateStudentPaths(batch.id, studentId);
  }

  await flash(`Enrolled in ${batch.name}`);
  redirect(safeNext(formData.get("next")) || studentsPath());
}

export async function deleteDirectoryStudents(formData: FormData) {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const studentIds = [
    ...new Set(formData.getAll("studentIds").map((value) => String(value).trim())),
  ].filter(Boolean);

  for (const studentId of studentIds) {
    const owned = await getOwnedStudentForTeacher(teacher.id, studentId);
    if (!owned) continue;
    for (const batch of owned.batches) {
      await unenrollFromBatch(studentId, batch.id);
      revalidatePath(batchPath(batch.id));
    }
  }

  revalidatePath(studentsPath());
  await flash(`${studentIds.length === 1 ? "1 student" : `${studentIds.length} students`} removed`);
  redirect(safeNext(formData.get("next")) || studentsPath());
}

export async function deleteDirectoryStudent(
  studentId: string,
  formData?: FormData,
) {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const owned = await getOwnedStudentForTeacher(teacher.id, studentId);
  if (!owned) {
    redirect(studentsPath());
  }

  for (const batch of owned.batches) {
    await unenrollFromBatch(studentId, batch.id);
    revalidatePath(batchPath(batch.id));
  }

  revalidatePath(studentsPath());
  await flash(`${owned.student.name} removed`);
  redirect(safeNext(formData?.get("next")) || studentsPath());
}

export async function deleteStudent(
  batchId: string,
  studentId: string,
  formData?: FormData,
) {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const owned = await getOwnedStudent(teacher.id, batchId, studentId);
  if (!owned) {
    redirect("/dashboard");
  }

  await unenrollFromBatch(studentId, batchId);
  revalidateStudentPaths(batchId, studentId);
  await flash(`${owned.student.name} removed from ${owned.batch.name}`);
  redirect(safeNext(formData?.get("next")) || batchPath(batchId));
}
