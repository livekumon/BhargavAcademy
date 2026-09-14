"use server";

import { flash } from "@/lib/flash";
import { hash } from "bcryptjs";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { db, ensureDatabase, nextAcademyEmail } from "@/lib/db";
import { resolveAccountPassword } from "@/lib/identity";
import { parentChildPath, parentManagePath, parentsPath } from "@/lib/paths";
import {
  getOwnedParentForTeacher,
  getOwnedStudentForTeacher,
} from "@/lib/queries";
import { parents, parentStudents } from "@/lib/schema";

export type ParentState = {
  error?: string;
};

function readStudentIds(formData: FormData) {
  return [
    ...new Set(
      formData.getAll("studentIds").map((value) => String(value).trim()),
    ),
  ].filter(Boolean);
}

async function ownedStudentIds(teacherId: string, studentIds: string[]) {
  const owned: string[] = [];
  for (const studentId of studentIds) {
    const student = await getOwnedStudentForTeacher(teacherId, studentId);
    if (student) owned.push(studentId);
  }
  return owned;
}

function revalidateParentPaths(parentId: string, studentIds: string[]) {
  revalidatePath(parentsPath());
  revalidatePath(parentManagePath(parentId));
  revalidatePath("/parent");
  revalidatePath("/parent", "layout");
  revalidatePath("/dashboard/students");
  for (const studentId of studentIds) {
    revalidatePath(parentChildPath(studentId));
  }
}

async function setParentStudents(
  parentId: string,
  nextStudentIds: string[],
  currentlyLinkedOwnedIds: string[] = [],
) {
  const next = new Set(nextStudentIds);
  const toUnlink = currentlyLinkedOwnedIds.filter((studentId) => !next.has(studentId));

  if (toUnlink.length > 0) {
    await db
      .delete(parentStudents)
      .where(
        and(
          eq(parentStudents.parentId, parentId),
          inArray(parentStudents.studentId, toUnlink),
        ),
      );
  }

  if (nextStudentIds.length === 0) return;

  await db
    .delete(parentStudents)
    .where(inArray(parentStudents.studentId, nextStudentIds));

  const now = new Date();
  await db.insert(parentStudents).values(
    nextStudentIds.map((studentId) => ({
      id: crypto.randomUUID(),
      parentId,
      studentId,
      createdAt: now,
    })),
  );
}

export async function createParent(
  _prev: ParentState,
  formData: FormData,
): Promise<ParentState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const name = String(formData.get("name") ?? "").trim();
  let email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const studentIds = await ownedStudentIds(teacher.id, readStudentIds(formData));

  if (name.length < 2) {
    return { error: "Parent name is required." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid parent email." };
  }
  if (!email) {
    email = await nextAcademyEmail(name);
  }
  if (studentIds.length === 0) {
    return { error: "Assign at least one student to this parent." };
  }

  const resolvedPassword = resolveAccountPassword(password);
  if ("error" in resolvedPassword) {
    return resolvedPassword;
  }

  const [emailOwner] = await db
    .select({ id: parents.id })
    .from(parents)
    .where(eq(parents.email, email))
    .limit(1);
  if (emailOwner) {
    return { error: "A parent with this email already exists." };
  }

  const parentId = crypto.randomUUID();
  await db.insert(parents).values({
    id: parentId,
    name,
    email,
    passwordHash: await hash(resolvedPassword.password, 10),
    mustChangePassword: true,
    createdAt: new Date(),
  });
  await setParentStudents(parentId, studentIds);
  revalidateParentPaths(parentId, studentIds);
  await flash(`Parent login created for ${name}`, { description: `They sign in with ${email}.` });
  redirect(parentsPath());
}

export async function updateParent(
  parentId: string,
  _prev: ParentState,
  formData: FormData,
): Promise<ParentState> {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const owned = await getOwnedParentForTeacher(teacher.id, parentId);
  if (!owned) {
    return { error: "Parent not found." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const studentIds = await ownedStudentIds(teacher.id, readStudentIds(formData));

  if (name.length < 2) {
    return { error: "Parent name is required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid parent email." };
  }
  if (studentIds.length === 0) {
    return { error: "Assign at least one student to this parent." };
  }

  const [emailOwner] = await db
    .select({ id: parents.id })
    .from(parents)
    .where(eq(parents.email, email))
    .limit(1);
  if (emailOwner && emailOwner.id !== parentId) {
    return { error: "A parent with this email already exists." };
  }

  const updates: {
    name: string;
    email: string;
    passwordHash?: string;
    mustChangePassword?: boolean;
  } = { name, email };

  if (password) {
    const resolvedPassword = resolveAccountPassword(password);
    if ("error" in resolvedPassword) {
      return resolvedPassword;
    }
    updates.passwordHash = await hash(resolvedPassword.password, 10);
    updates.mustChangePassword = true;
  }

  await db.update(parents).set(updates).where(eq(parents.id, parentId));
  await setParentStudents(
    parentId,
    studentIds,
    owned.students.map((student) => student.id),
  );
  revalidateParentPaths(parentId, [
    ...new Set([...owned.students.map((student) => student.id), ...studentIds]),
  ]);
  await flash(`${name} saved`);
  redirect(parentsPath());
}

export async function deleteParent(formData: FormData) {
  const teacher = await requireTeacher();
  await ensureDatabase();

  const parentId = String(formData.get("parentId") ?? "").trim();
  const owned = await getOwnedParentForTeacher(teacher.id, parentId);
  if (!owned) {
    redirect(parentsPath());
  }

  const studentIds = owned.students.map((student) => student.id);
  await db.delete(parents).where(eq(parents.id, parentId));
  revalidateParentPaths(parentId, studentIds);
  await flash(`${owned.name}'s parent login deleted`);
  redirect(parentsPath());
}
