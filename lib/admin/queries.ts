import { isAssignment } from "@/lib/materials";
import { effectiveRole, isOwner, type PersonRole } from "./policy";
import { computeSignals, isStudentFlag, studentsWithFlag, type StudentFlag } from "./signals";
import { loadAcademySnapshot, type AcademySnapshot } from "./snapshot";

/*
 * Reads for the admin console. These deliberately skip the per-teacher
 * ownership joins in lib/queries.ts — never import them into teacher pages.
 */

export type DirectoryRole = PersonRole | "admin" | "all";
export type DirectoryStatus = "all" | "active" | "suspended" | "not_signed_in";

export type PeopleFilter = {
  role?: DirectoryRole;
  status?: DirectoryStatus;
  q?: string;
  teacherId?: string;
  batchId?: string;
  flag?: StudentFlag;
};

export type PersonRow = {
  id: string;
  role: PersonRole;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  isAdmin: boolean;
  isOwner: boolean;
  adminUntil: Date | null;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  /** Short facts shown under the name: batches, children, workload. */
  context: string[];
  flags: StudentFlag[];
  href: string;
};

export function personHref(role: PersonRole, id: string) {
  return `/admin/${role}s/${encodeURIComponent(id)}`;
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

function indexSnapshot(snapshot: AcademySnapshot) {
  const batchById = new Map(snapshot.batches.map((batch) => [batch.id, batch]));
  const teacherById = new Map(snapshot.teachers.map((teacher) => [teacher.id, teacher]));
  const studentById = new Map(snapshot.students.map((student) => [student.id, student]));

  const batchIdsByStudent = new Map<string, string[]>();
  const studentIdsByBatch = new Map<string, string[]>();
  for (const row of snapshot.enrolments) {
    batchIdsByStudent.set(row.studentId, [...(batchIdsByStudent.get(row.studentId) ?? []), row.batchId]);
    studentIdsByBatch.set(row.batchId, [...(studentIdsByBatch.get(row.batchId) ?? []), row.studentId]);
  }

  const childIdsByParent = new Map<string, string[]>();
  const parentIdByStudent = new Map<string, string>();
  for (const link of snapshot.parentLinks) {
    childIdsByParent.set(link.parentId, [...(childIdsByParent.get(link.parentId) ?? []), link.studentId]);
    parentIdByStudent.set(link.studentId, link.parentId);
  }

  const teacherIdsByStudent = (studentId: string) =>
    new Set(
      (batchIdsByStudent.get(studentId) ?? [])
        .map((batchId) => batchById.get(batchId)?.teacherId)
        .filter((id): id is string => Boolean(id)),
    );

  return {
    batchById,
    teacherById,
    studentById,
    batchIdsByStudent,
    studentIdsByBatch,
    childIdsByParent,
    parentIdByStudent,
    teacherIdsByStudent,
  };
}

export async function listPeople(filter: PeopleFilter = {}) {
  return peopleFromSnapshot(await loadAcademySnapshot(), filter);
}

function peopleFromSnapshot(snapshot: AcademySnapshot, filter: PeopleFilter) {
  const index = indexSnapshot(snapshot);
  const signals = computeSignals(snapshot);
  const now = new Date();

  const rows: PersonRow[] = [];

  for (const teacher of snapshot.teachers) {
    const owned = snapshot.batches.filter((batch) => batch.teacherId === teacher.id);
    const studentCount = new Set(owned.flatMap((batch) => index.studentIdsByBatch.get(batch.id) ?? [])).size;
    const admin = effectiveRole(teacher, now) === "admin";
    rows.push({
      id: teacher.id,
      role: "teacher",
      name: teacher.name,
      email: teacher.email,
      phone: null,
      status: teacher.status,
      isAdmin: admin,
      isOwner: isOwner(teacher),
      adminUntil: admin ? teacher.roleExpiresAt : null,
      mustChangePassword: teacher.mustChangePassword,
      lastLoginAt: teacher.lastLoginAt,
      createdAt: teacher.createdAt,
      context: [plural(owned.length, "batch", "batches"), plural(studentCount, "student")],
      flags: [],
      href: personHref("teacher", teacher.id),
    });
  }

  for (const student of snapshot.students) {
    const batchNames = (index.batchIdsByStudent.get(student.id) ?? [])
      .map((batchId) => index.batchById.get(batchId)?.name)
      .filter((name): name is string => Boolean(name));
    const flags: StudentFlag[] = [];
    if (signals.falling.has(student.id)) flags.push("falling");
    if (signals.behind.has(student.id)) flags.push("behind");
    if (signals.noParent.has(student.id)) flags.push("no_parent");
    rows.push({
      id: student.id,
      role: "student",
      name: student.name,
      email: student.email,
      phone: student.contactNumber,
      status: student.status,
      isAdmin: false,
      isOwner: false,
      adminUntil: null,
      mustChangePassword: student.mustChangePassword,
      lastLoginAt: student.lastLoginAt,
      createdAt: student.createdAt,
      context: batchNames.length > 0 ? batchNames : ["No batch"],
      flags,
      href: personHref("student", student.id),
    });
  }

  for (const parent of snapshot.parents) {
    const childNames = (index.childIdsByParent.get(parent.id) ?? [])
      .map((studentId) => index.studentById.get(studentId)?.name)
      .filter((name): name is string => Boolean(name));
    rows.push({
      id: parent.id,
      role: "parent",
      name: parent.name,
      email: parent.email,
      phone: null,
      status: parent.status,
      isAdmin: false,
      isOwner: false,
      adminUntil: null,
      mustChangePassword: parent.mustChangePassword,
      lastLoginAt: parent.lastLoginAt,
      createdAt: parent.createdAt,
      context: childNames.length > 0 ? childNames.map((name) => `Parent of ${name}`) : ["No children linked"],
      flags: [],
      href: personHref("parent", parent.id),
    });
  }

  const matchesScope = (row: PersonRow) => {
    if (filter.teacherId) {
      if (row.role === "teacher" && row.id !== filter.teacherId) return false;
      if (row.role === "student" && !index.teacherIdsByStudent(row.id).has(filter.teacherId)) return false;
      if (
        row.role === "parent" &&
        !(index.childIdsByParent.get(row.id) ?? []).some((studentId) =>
          index.teacherIdsByStudent(studentId).has(filter.teacherId!),
        )
      ) {
        return false;
      }
    }
    if (filter.batchId) {
      const inBatch = (studentId: string) =>
        (index.batchIdsByStudent.get(studentId) ?? []).includes(filter.batchId!);
      if (row.role === "teacher" && index.batchById.get(filter.batchId)?.teacherId !== row.id) return false;
      if (row.role === "student" && !inBatch(row.id)) return false;
      if (row.role === "parent" && !(index.childIdsByParent.get(row.id) ?? []).some(inBatch)) return false;
    }
    return true;
  };

  const needle = filter.q?.trim().toLowerCase() ?? "";
  const scoped = rows.filter(matchesScope).filter((row) => {
    if (!needle) return true;
    return [row.name, row.email, row.phone ?? "", ...row.context].join(" ").toLowerCase().includes(needle);
  });

  // Tab counts ignore the role and status filters so every tab shows its size.
  const counts = {
    all: scoped.length,
    teacher: scoped.filter((row) => row.role === "teacher").length,
    student: scoped.filter((row) => row.role === "student").length,
    parent: scoped.filter((row) => row.role === "parent").length,
    admin: scoped.filter((row) => row.isAdmin).length,
  };

  const role = filter.role ?? "all";
  const status = filter.status ?? "all";
  const flagged = filter.flag ? studentsWithFlag(signals, filter.flag) : null;

  const people = scoped
    .filter((row) => {
      if (role === "admin") return row.isAdmin;
      return role === "all" || row.role === role;
    })
    .filter((row) => {
      if (status === "active") return row.status === "active";
      if (status === "suspended") return row.status !== "active";
      if (status === "not_signed_in") return row.status === "active" && row.mustChangePassword;
      return true;
    })
    .filter((row) => !flagged || (row.role === "student" && flagged.has(row.id)))
    .sort((a, b) => {
      const order = { teacher: 0, student: 1, parent: 2 } as const;
      return order[a.role] - order[b.role] || a.name.localeCompare(b.name);
    });

  return { people, counts };
}

export function parsePeopleFilter(params: Record<string, string | string[] | undefined>): PeopleFilter {
  const pick = (key: string) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
  };
  const role = pick("role");
  const status = pick("status");
  const flag = pick("flag");
  return {
    role:
      role === "teacher" || role === "student" || role === "parent" || role === "admin"
        ? role
        : "all",
    status:
      status === "active" || status === "suspended" || status === "not_signed_in" ? status : "all",
    q: pick("q"),
    teacherId: pick("teacherId"),
    batchId: pick("batchId"),
    flag: isStudentFlag(flag) ? flag : undefined,
  };
}

export async function listTeacherOptions() {
  const snapshot = await loadAcademySnapshot();
  return snapshot.teachers
    .map((teacher) => ({ id: teacher.id, name: teacher.name, active: teacher.status === "active" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type AdminBatchRow = {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacherName: string;
  courseTitle: string | null;
  studentCount: number;
  materialCount: number;
  assigned: number;
  completed: number;
  lastMaterialAt: Date | null;
  stale: boolean;
};

type BatchFilter = { teacherId?: string; stale?: boolean };

export async function listAllBatches(filter: BatchFilter = {}) {
  return batchesFromSnapshot(await loadAcademySnapshot(), filter);
}

function batchesFromSnapshot(snapshot: AcademySnapshot, filter: BatchFilter) {
  const index = indexSnapshot(snapshot);
  const signals = computeSignals(snapshot);
  const courseById = new Map(snapshot.courses.map((course) => [course.id, course]));

  const rows: AdminBatchRow[] = snapshot.batches.map((batch) => {
    const link = snapshot.batchCourses.find((row) => row.batchId === batch.id);
    const assignments = snapshot.assignments.filter((row) => row.batchId === batch.id);
    const last = signals.lastMaterialByBatch.get(batch.id);
    return {
      id: batch.id,
      name: batch.name,
      description: batch.description,
      teacherId: batch.teacherId,
      teacherName: index.teacherById.get(batch.teacherId)?.name ?? "Unknown teacher",
      courseTitle: link ? courseById.get(link.courseId)?.title ?? null : null,
      studentCount: index.studentIdsByBatch.get(batch.id)?.length ?? 0,
      materialCount: snapshot.materials.filter((row) => row.batchId === batch.id).length,
      assigned: assignments.length,
      completed: assignments.filter((row) => row.completedAt).length,
      lastMaterialAt: last ? new Date(last) : null,
      stale: signals.staleBatches.has(batch.id),
    };
  });

  return rows
    .filter((row) => !filter.teacherId || row.teacherId === filter.teacherId)
    .filter((row) => !filter.stale || row.stale)
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName) || a.name.localeCompare(b.name));
}

export async function getTeacherProfile(teacherId: string) {
  const snapshot = await loadAcademySnapshot();
  const teacher = snapshot.teachers.find((row) => row.id === teacherId);
  if (!teacher) return null;

  const batches = batchesFromSnapshot(snapshot, { teacherId });
  const directory = peopleFromSnapshot(snapshot, { teacherId, role: "student" });
  const libraryCourses = snapshot.courses.filter((course) => course.teacherId === teacherId);
  const assignedLeads = snapshot.leads.filter((lead) => lead.assignedTeacherId === teacherId);
  const activeAdmins = snapshot.teachers.filter((row) => effectiveRole(row) === "admin").length;

  return {
    teacher,
    role: effectiveRole(teacher),
    isOwner: isOwner(teacher),
    batches,
    students: directory.people,
    courseCount: libraryCourses.length,
    assignedLeads,
    activeAdmins,
  };
}

export async function getStudentProfile(studentId: string) {
  const snapshot = await loadAcademySnapshot();
  const index = indexSnapshot(snapshot);
  const signals = computeSignals(snapshot);
  const student = snapshot.students.find((row) => row.id === studentId);
  if (!student) return null;

  const enrolled = (index.batchIdsByStudent.get(studentId) ?? [])
    .map((batchId) => index.batchById.get(batchId))
    .filter((batch): batch is NonNullable<typeof batch> => Boolean(batch))
    .map((batch) => ({
      id: batch.id,
      name: batch.name,
      teacherId: batch.teacherId,
      teacherName: index.teacherById.get(batch.teacherId)?.name ?? "Unknown teacher",
    }));

  const parentId = index.parentIdByStudent.get(studentId);
  const parent = parentId ? snapshot.parents.find((row) => row.id === parentId) ?? null : null;
  const work = snapshot.assignments.filter((row) => row.studentId === studentId);
  const split = (assignment: boolean) => {
    const rows = work.filter((row) => isAssignment(row.kind) === assignment);
    return { total: rows.length, done: rows.filter((row) => row.completedAt).length };
  };

  const flags: StudentFlag[] = [];
  if (signals.falling.has(studentId)) flags.push("falling");
  if (signals.behind.has(studentId)) flags.push("behind");
  if (signals.noParent.has(studentId)) flags.push("no_parent");

  return {
    student,
    batches: enrolled,
    allBatches: snapshot.batches
      .map((batch) => ({
        id: batch.id,
        name: batch.name,
        teacherName: index.teacherById.get(batch.teacherId)?.name ?? "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    parent,
    classMaterial: split(false),
    assignments: split(true),
    flags,
  };
}

export async function getParentProfile(parentId: string) {
  const snapshot = await loadAcademySnapshot();
  const index = indexSnapshot(snapshot);
  const parent = snapshot.parents.find((row) => row.id === parentId);
  if (!parent) return null;

  const describeStudent = (studentId: string) => {
    const student = index.studentById.get(studentId);
    if (!student) return null;
    const batchNames = (index.batchIdsByStudent.get(studentId) ?? [])
      .map((batchId) => index.batchById.get(batchId)?.name)
      .filter((name): name is string => Boolean(name));
    const otherParentId = index.parentIdByStudent.get(studentId);
    const otherParent =
      otherParentId && otherParentId !== parentId
        ? snapshot.parents.find((row) => row.id === otherParentId)?.name ?? null
        : null;
    return { id: student.id, name: student.name, email: student.email, batchNames, otherParent };
  };

  const children = (index.childIdsByParent.get(parentId) ?? [])
    .map(describeStudent)
    .filter((child): child is NonNullable<typeof child> => Boolean(child));

  const studentOptions = snapshot.students
    .map((student) => describeStudent(student.id))
    .filter((child): child is NonNullable<typeof child> => Boolean(child))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { parent, children, studentOptions };
}

/** Pickers for the Add person form. */
export async function getPersonFormOptions() {
  const snapshot = await loadAcademySnapshot();
  const index = indexSnapshot(snapshot);
  return {
    batches: snapshot.batches
      .map((batch) => ({
        id: batch.id,
        name: batch.name,
        teacherName: index.teacherById.get(batch.teacherId)?.name ?? "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    students: snapshot.students
      .map((student) => {
        const parentId = index.parentIdByStudent.get(student.id);
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          parentName: parentId
            ? snapshot.parents.find((row) => row.id === parentId)?.name ?? null
            : null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
