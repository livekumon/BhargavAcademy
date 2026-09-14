import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, ensureDatabase } from "./db";
import { parents, students, teachers, type Parent, type Student, type Teacher } from "./schema";
import {
  PARENT_SESSION_COOKIE,
  SESSION_COOKIE,
  STUDENT_SESSION_COOKIE,
} from "./session";

export { PARENT_SESSION_COOKIE, SESSION_COOKIE, STUDENT_SESSION_COOKIE };

export type SessionTeacher = {
  id: string;
  name: string;
  email: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(teacher: SessionTeacher) {
  const token = await new SignJWT(teacher)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setSubject(teacher.id)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionTeacher(): Promise<SessionTeacher | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export async function getCurrentTeacher(): Promise<Teacher | null> {
  await ensureDatabase();
  const session = await getSessionTeacher();
  if (!session) return null;

  const [teacher] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.id, session.id))
    .limit(1);

  return teacher ?? null;
}

export async function requireTeacher(options?: { allowPendingPassword?: boolean }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) {
    redirect("/login");
  }
  if (teacher.mustChangePassword && !options?.allowPendingPassword) {
    redirect("/login/set-password");
  }
  return teacher;
}

export type SessionStudent = {
  id: string;
  name: string;
  email: string;
};

export async function createStudentSession(student: SessionStudent) {
  const token = await new SignJWT({ ...student, role: "student" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setSubject(student.id)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearStudentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(STUDENT_SESSION_COOKIE);
}

export async function getSessionStudent(): Promise<SessionStudent | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STUDENT_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      payload.role !== "student" ||
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export async function getCurrentStudent(): Promise<Student | null> {
  await ensureDatabase();
  const session = await getSessionStudent();
  if (!session) return null;

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, session.id))
    .limit(1);

  return student ?? null;
}

export async function requireStudent(options?: { allowPendingPassword?: boolean }) {
  const student = await getCurrentStudent();
  if (!student) {
    redirect("/student/login");
  }
  if (student.mustChangePassword && !options?.allowPendingPassword) {
    redirect("/student/login/set-password");
  }
  return student;
}

export type SessionParent = {
  id: string;
  name: string;
  email: string;
};

export async function createParentSession(parent: SessionParent) {
  const token = await new SignJWT({ ...parent, role: "parent" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setSubject(parent.id)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(PARENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearParentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(PARENT_SESSION_COOKIE);
}

export async function getSessionParent(): Promise<SessionParent | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARENT_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      payload.role !== "parent" ||
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export async function getCurrentParent(): Promise<Parent | null> {
  await ensureDatabase();
  const session = await getSessionParent();
  if (!session) return null;

  const [parent] = await db
    .select()
    .from(parents)
    .where(eq(parents.id, session.id))
    .limit(1);

  return parent ?? null;
}

export async function requireParent(options?: { allowPendingPassword?: boolean }) {
  const parent = await getCurrentParent();
  if (!parent) {
    redirect("/parent/login");
  }
  if (parent.mustChangePassword && !options?.allowPendingPassword) {
    redirect("/parent/login/set-password");
  }
  return parent;
}
