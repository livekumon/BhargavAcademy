import { isAssignment } from "@/lib/materials";
import type { AcademySnapshot } from "./snapshot";

/*
 * The rules behind the "Needs attention" queue. Each one is a named set of ids
 * so the dashboard count and the filtered list it links to can never disagree.
 */

const DAY = 24 * 60 * 60 * 1000;

export const SIGNAL_RULES = {
  /** Latest mark this far below the student's own earlier average. */
  fallingMarksRatio: 0.85,
  /** Earlier marks needed before a drop means anything. */
  fallingMarksMinHistory: 2,
  /** Unsubmitted assignments before a student counts as behind. */
  behindOpenAssignments: 3,
  /** Days without new material before a batch counts as stale. */
  staleBatchDays: 14,
  /** Days after an account is created before "never signed in" is flagged. */
  inactiveAccountDays: 7,
  /** Hours a new lead may wait for a first call. */
  leadResponseHours: 48,
  /** Days of warning before a time-limited admin grant lapses. */
  expiringAdminDays: 7,
} as const;

export type StudentFlag = "falling" | "behind" | "no_parent";

export function isStudentFlag(value: unknown): value is StudentFlag {
  return value === "falling" || value === "behind" || value === "no_parent";
}

export const STUDENT_FLAG_LABELS: Record<StudentFlag, string> = {
  falling: "Falling marks",
  behind: "Behind on work",
  no_parent: "No parent linked",
};

export function computeSignals(snapshot: AcademySnapshot, now: Date = new Date()) {
  const activeStudents = snapshot.students.filter((student) => student.status === "active");
  const activeIds = new Set(activeStudents.map((student) => student.id));

  const falling = new Set<string>();
  const marksByStudent = new Map<string, { marks: number; at: number }[]>();
  for (const mark of snapshot.marks) {
    if (!activeIds.has(mark.studentId)) continue;
    const list = marksByStudent.get(mark.studentId) ?? [];
    list.push({ marks: mark.marks, at: mark.recordedAt.getTime() });
    marksByStudent.set(mark.studentId, list);
  }
  for (const [studentId, list] of marksByStudent) {
    if (list.length <= SIGNAL_RULES.fallingMarksMinHistory) continue;
    list.sort((a, b) => a.at - b.at);
    const latest = list.at(-1)!;
    const earlier = list.slice(0, -1);
    const average = earlier.reduce((sum, row) => sum + row.marks, 0) / earlier.length;
    if (average > 0 && latest.marks < average * SIGNAL_RULES.fallingMarksRatio) {
      falling.add(studentId);
    }
  }

  const openAssignments = new Map<string, number>();
  for (const row of snapshot.assignments) {
    if (!activeIds.has(row.studentId) || !isAssignment(row.kind) || row.completedAt) continue;
    openAssignments.set(row.studentId, (openAssignments.get(row.studentId) ?? 0) + 1);
  }
  const behind = new Set(
    [...openAssignments]
      .filter(([, count]) => count >= SIGNAL_RULES.behindOpenAssignments)
      .map(([studentId]) => studentId),
  );

  const linked = new Set(snapshot.parentLinks.map((link) => link.studentId));
  const noParent = new Set(
    activeStudents.filter((student) => !linked.has(student.id)).map((student) => student.id),
  );

  const enrolledBatchIds = new Set(snapshot.enrolments.map((row) => row.batchId));
  const lastMaterialByBatch = new Map<string, number>();
  for (const material of snapshot.materials) {
    const at = material.updatedAt.getTime();
    lastMaterialByBatch.set(material.batchId, Math.max(lastMaterialByBatch.get(material.batchId) ?? 0, at));
  }
  const staleCutoff = now.getTime() - SIGNAL_RULES.staleBatchDays * DAY;
  const staleBatches = new Set(
    snapshot.batches
      .filter((batch) => enrolledBatchIds.has(batch.id))
      .filter((batch) => (lastMaterialByBatch.get(batch.id) ?? 0) < staleCutoff)
      .map((batch) => batch.id),
  );

  const inactiveCutoff = now.getTime() - SIGNAL_RULES.inactiveAccountDays * DAY;
  const neverSignedIn = <T extends { id: string; status: string; mustChangePassword: boolean; createdAt: Date }>(
    rows: T[],
  ) =>
    new Set(
      rows
        .filter((row) => row.status === "active" && row.mustChangePassword)
        .filter((row) => row.createdAt.getTime() < inactiveCutoff)
        .map((row) => row.id),
    );

  const leadCutoff = now.getTime() - SIGNAL_RULES.leadResponseHours * 60 * 60 * 1000;
  const slowLeads = snapshot.leads.filter(
    (lead) => lead.status === "new" && new Date(lead.createdAt).getTime() < leadCutoff,
  );

  const expiringCutoff = now.getTime() + SIGNAL_RULES.expiringAdminDays * DAY;
  const expiringAdmins = snapshot.teachers.filter(
    (teacher) =>
      teacher.role === "admin" &&
      teacher.status === "active" &&
      teacher.roleExpiresAt &&
      teacher.roleExpiresAt.getTime() > now.getTime() &&
      teacher.roleExpiresAt.getTime() <= expiringCutoff,
  );

  return {
    falling,
    behind,
    noParent,
    staleBatches,
    lastMaterialByBatch,
    openAssignments,
    neverSignedIn: {
      teachers: neverSignedIn(snapshot.teachers),
      students: neverSignedIn(snapshot.students),
      parents: neverSignedIn(snapshot.parents),
    },
    slowLeads,
    expiringAdmins,
  };
}

export type AcademySignals = ReturnType<typeof computeSignals>;

export function studentsWithFlag(signals: AcademySignals, flag: StudentFlag) {
  if (flag === "falling") return signals.falling;
  if (flag === "behind") return signals.behind;
  return signals.noParent;
}
