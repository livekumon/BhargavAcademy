"use server";

import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
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
import { parents, students, teachers } from "@/lib/schema";

export type AuthState = {
  error?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerTeacher(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await ensureDatabase();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) {
    return { error: "Please enter your full name." };
  }
  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const [existing] = await db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.email, email))
    .limit(1);

  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const teacher = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: await hash(password, 10),
    mustChangePassword: false,
    createdAt: new Date(),
  };

  await db.insert(teachers).values(teacher);
  await createSession({ id: teacher.id, name: teacher.name, email: teacher.email });
  redirect("/dashboard");
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

  await createSession({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
  });
  redirect(teacher.mustChangePassword ? "/login/set-password" : "/dashboard");
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

  redirect("/dashboard");
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
