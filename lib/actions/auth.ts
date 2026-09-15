"use server";

import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/policy";
import { audit } from "@/lib/audit";
import {
  clearParentSession,
  clearSession,
  clearStudentSession,
  createParentSession,
  createSession,
  createStudentSession,
  requireParent,
  requireStudent,
  requireTeacher,
} from "@/lib/auth";
import { db, ensureDatabase } from "@/lib/db";
import { validateChangedPassword } from "@/lib/identity";
import { parents, students, teachers, type Teacher } from "@/lib/schema";

export type AuthState = {
  error?: string;
};

const SUSPENDED_MESSAGE =
  "This account is suspended. Contact the academy admin to restore access.";

function teacherHome(teacher: Teacher) {
  return isAdmin(teacher) ? "/admin" : "/dashboard";
}

export async function loginTeacher(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await ensureDatabase();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.email, email))
    .limit(1);

  if (!teacher || !(await compare(password, teacher.passwordHash))) {
    return { error: "Incorrect email or password." };
  }
  if (teacher.status !== "active") {
    return { error: SUSPENDED_MESSAGE };
  }

  const admin = isAdmin(teacher);
  await db
    .update(teachers)
    .set({ lastLoginAt: new Date() })
    .where(eq(teachers.id, teacher.id));
  await audit({
    actor: { id: teacher.id, role: admin ? "admin" : "teacher", name: teacher.name },
    action: "auth.login",
    entityType: "teacher",
    entityId: teacher.id,
    summary: `${teacher.name} signed in`,
  });

  await createSession({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
  });
  redirect(teacher.mustChangePassword ? "/login/set-password" : teacherHome(teacher));
}

export async function logoutTeacher() {
  await clearSession();
  redirect("/login");
}

export async function loginStudent(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await ensureDatabase();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.email, email))
    .limit(1);

  if (!student?.passwordHash || !(await compare(password, student.passwordHash))) {
    return { error: "Incorrect email or password." };
  }
  if (student.status !== "active") {
    return { error: SUSPENDED_MESSAGE };
  }

  await db
    .update(students)
    .set({ lastLoginAt: new Date() })
    .where(eq(students.id, student.id));
  await audit({
    actor: { id: student.id, role: "student", name: student.name },
    action: "auth.login",
    entityType: "student",
    entityId: student.id,
    summary: `${student.name} signed in`,
  });

  await createStudentSession({
    id: student.id,
    name: student.name,
    email: student.email,
  });
  redirect(student.mustChangePassword ? "/student/login/set-password" : "/student");
}

export async function logoutStudent() {
  await clearStudentSession();
  redirect("/student/login");
}

export async function loginParent(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await ensureDatabase();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const [parent] = await db
    .select()
    .from(parents)
    .where(eq(parents.email, email))
    .limit(1);

  if (!parent || !(await compare(password, parent.passwordHash))) {
    return { error: "Incorrect email or password." };
  }
  if (parent.status !== "active") {
    return { error: SUSPENDED_MESSAGE };
  }

  await db
    .update(parents)
    .set({ lastLoginAt: new Date() })
    .where(eq(parents.id, parent.id));
  await audit({
    actor: { id: parent.id, role: "parent", name: parent.name },
    action: "auth.login",
    entityType: "parent",
    entityId: parent.id,
    summary: `${parent.name} signed in`,
  });

  await createParentSession({
    id: parent.id,
    name: parent.name,
    email: parent.email,
  });
  redirect(parent.mustChangePassword ? "/parent/login/set-password" : "/parent");
}

export async function logoutParent() {
  await clearParentSession();
  redirect("/parent/login");
}

async function readNewPassword(formData: FormData) {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const error = validateChangedPassword(password, confirmPassword);
  if (!currentPassword) {
    return { error: "Enter your current password." };
  }
  if (error) {
    return { error };
  }
  return { currentPassword, password };
}

export async function setTeacherPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const teacher = await requireTeacher({ allowPendingPassword: true });
  const parsed = await readNewPassword(formData);
  if ("error" in parsed) return parsed;

  if (!(await compare(parsed.currentPassword, teacher.passwordHash))) {
    return { error: "Current password is incorrect." };
  }

  await db
    .update(teachers)
    .set({
      passwordHash: await hash(parsed.password, 10),
      mustChangePassword: false,
    })
    .where(eq(teachers.id, teacher.id));

  redirect(teacherHome(teacher));
}

export async function setStudentPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const student = await requireStudent({ allowPendingPassword: true });
  const parsed = await readNewPassword(formData);
  if ("error" in parsed) return parsed;

  if (
    !student.passwordHash ||
    !(await compare(parsed.currentPassword, student.passwordHash))
  ) {
    return { error: "Current password is incorrect." };
  }

  await db
    .update(students)
    .set({
      passwordHash: await hash(parsed.password, 10),
      mustChangePassword: false,
    })
    .where(eq(students.id, student.id));

  redirect("/student");
}

export async function setParentPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parent = await requireParent({ allowPendingPassword: true });
  const parsed = await readNewPassword(formData);
  if ("error" in parsed) return parsed;

  if (!(await compare(parsed.currentPassword, parent.passwordHash))) {
    return { error: "Current password is incorrect." };
  }

  await db
    .update(parents)
    .set({
      passwordHash: await hash(parsed.password, 10),
      mustChangePassword: false,
    })
    .where(eq(parents.id, parent.id));

  redirect("/parent");
}
