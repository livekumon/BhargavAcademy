import { listAuditEvents } from "@/lib/audit";
import { isAssignment } from "@/lib/materials";
import { effectiveRole, isOwner } from "./policy";
import { SIGNAL_RULES, computeSignals } from "./signals";
import { loadAcademySnapshot } from "./snapshot";

const DAY = 24 * 60 * 60 * 1000;
const SPARK_BUCKETS = 8;

export const OVERVIEW_RANGES = [7, 30, 90] as const;
export type OverviewRange = (typeof OVERVIEW_RANGES)[number];

export function parseOverviewRange(value: unknown): OverviewRange {
  const days = Number(Array.isArray(value) ? value[0] : value);
  return (OVERVIEW_RANGES as readonly number[]).includes(days) ? (days as OverviewRange) : 30;
}

export type Kpi = {
  key: string;
  label: string;
  value: string;
  /** Change against the previous period of the same length. */
  delta: { text: string; direction: "up" | "down" | "flat"; good: boolean | null };
  hint: string;
  series: number[];
  href: string;
};

export type AttentionItem = {
  key: string;
  severity: "danger" | "warning" | "info";
  title: string;
  detail: string;
  count: number;
  action: string;
  href: string;
};

function inRange(date: Date | string | null | undefined, from: number, to: number) {
  if (!date) return false;
  const time = (date instanceof Date ? date : new Date(date)).getTime();
  return time >= from && time < to;
}

/** Counts per equal-width bucket across the current period, oldest first. */
function bucketCounts(dates: (Date | string | null)[], start: number, end: number) {
  const width = (end - start) / SPARK_BUCKETS;
  const buckets = Array.from({ length: SPARK_BUCKETS }, () => 0);
  for (const date of dates) {
    if (!inRange(date, start, end)) continue;
    const time = (date instanceof Date ? date : new Date(date!)).getTime();
    buckets[Math.min(SPARK_BUCKETS - 1, Math.floor((time - start) / width))] += 1;
  }
  return buckets;
}

function compare(current: number, previous: number, unit: string, higherIsGood: boolean | null): Kpi["delta"] {
  const diff = current - previous;
  if (diff === 0) return { text: `Same as previous ${unit}`, direction: "flat", good: null };
  return {
    text: `${diff > 0 ? "+" : "−"}${Math.abs(diff)} vs previous ${unit}`,
    direction: diff > 0 ? "up" : "down",
    good: higherIsGood === null ? null : diff > 0 === higherIsGood,
  };
}

function percent(part: number, whole: number) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export async function getAdminOverview(rangeDays: OverviewRange = 30, now: Date = new Date()) {
  const snapshot = await loadAcademySnapshot();
  const signals = computeSignals(snapshot, now);
  const end = now.getTime();
  const start = end - rangeDays * DAY;
  const previousStart = start - rangeDays * DAY;
  const unit = `${rangeDays} days`;

  const activeStudents = snapshot.students.filter((row) => row.status === "active");
  const activeTeachers = snapshot.teachers.filter((row) => row.status === "active");
  const activeParents = snapshot.parents.filter((row) => row.status === "active");

  // Students: headcount with a cumulative sparkline of when they joined.
  const joinedNow = snapshot.students.filter((row) => inRange(row.createdAt, start, end)).length;
  const joinedBefore = snapshot.students.filter((row) => inRange(row.createdAt, previousStart, start)).length;
  const signedInNow = [...activeStudents, ...activeParents, ...activeTeachers].filter((row) =>
    inRange(row.lastLoginAt, start, end),
  ).length;
  const baseline = snapshot.students.filter((row) => row.createdAt.getTime() < start).length;
  let running = baseline;
  const studentSeries = bucketCounts(snapshot.students.map((row) => row.createdAt), start, end).map(
    (count) => (running += count),
  );

  // Work: completion is a current state; momentum is completions per period.
  const activeIds = new Set(activeStudents.map((row) => row.id));
  const work = snapshot.assignments.filter((row) => activeIds.has(row.studentId));
  const completed = work.filter((row) => row.completedAt);
  const completionsNow = completed.filter((row) => inRange(row.completedAt, start, end)).length;
  const completionsBefore = completed.filter((row) => inRange(row.completedAt, previousStart, start)).length;
  const openAssignments = work.filter((row) => isAssignment(row.kind) && !row.completedAt).length;

  const marksNow = snapshot.marks.filter((row) => inRange(row.recordedAt, start, end)).length;
  const marksBefore = snapshot.marks.filter((row) => inRange(row.recordedAt, previousStart, start)).length;

  const accounts = [...activeStudents, ...activeParents, ...activeTeachers];
  const activated = accounts.filter((row) => !row.mustChangePassword).length;

  const leadsNow = snapshot.leads.filter((row) => inRange(row.createdAt, start, end));
  const leadsBefore = snapshot.leads.filter((row) => inRange(row.createdAt, previousStart, start)).length;

  const materialsNow = snapshot.materials.filter((row) => inRange(row.updatedAt, start, end)).length;
  const materialsBefore = snapshot.materials.filter((row) => inRange(row.updatedAt, previousStart, start)).length;

  const kpis: Kpi[] = [
    {
      key: "students",
      label: "Active students",
      value: String(activeStudents.length),
      delta: joinedNow > 0 || joinedBefore > 0
        ? compare(joinedNow, joinedBefore, unit, true)
        : { text: "No new students", direction: "flat", good: null },
      hint: `${joinedNow} joined · ${signedInNow} people signed in`,
      series: studentSeries,
      href: "/admin/people?role=student&status=active",
    },
    {
      key: "completion",
      label: "Work completion",
      value: `${percent(completed.length, work.length)}%`,
      delta: compare(completionsNow, completionsBefore, unit, true),
      hint: `${completed.length} of ${work.length} items done · ${openAssignments} ${openAssignments === 1 ? "assignment" : "assignments"} open`,
      series: bucketCounts(completed.map((row) => row.completedAt), start, end),
      href: "/admin/people?role=student&flag=behind",
    },
    {
      key: "marks",
      label: "Tests marked",
      value: String(marksNow),
      delta: compare(marksNow, marksBefore, unit, true),
      hint: `${signals.falling.size} students with falling marks`,
      series: bucketCounts(snapshot.marks.map((row) => row.recordedAt), start, end),
      href: "/admin/people?role=student&flag=falling",
    },
    {
      key: "activation",
      label: "Accounts activated",
      value: `${percent(activated, accounts.length)}%`,
      delta: {
        text: `${accounts.length - activated} still on default password`,
        direction: "flat",
        good: null,
      },
      hint: "Changed the default password at least once",
      series: [],
      href: "/admin/people?status=not_signed_in",
    },
    {
      key: "leads",
      label: "New leads",
      value: String(leadsNow.length),
      delta: compare(leadsNow.length, leadsBefore, unit, true),
      hint: `${snapshot.leads.filter((row) => row.status === "new").length} waiting for a call`,
      series: bucketCounts(snapshot.leads.map((row) => row.createdAt), start, end),
      href: "/admin/leads",
    },
    {
      key: "material",
      label: "Material uploaded",
      value: String(materialsNow),
      delta: compare(materialsNow, materialsBefore, unit, true),
      hint: `${signals.staleBatches.size} batches quiet for ${SIGNAL_RULES.staleBatchDays}+ days`,
      series: bucketCounts(snapshot.materials.map((row) => row.updatedAt), start, end),
      href: "/admin/batches",
    },
  ];

  const neverSignedIn =
    signals.neverSignedIn.students.size + signals.neverSignedIn.parents.size + signals.neverSignedIn.teachers.size;
  const oldestSlowLead = [...signals.slowLeads].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  const staleNames = snapshot.batches
    .filter((batch) => signals.staleBatches.has(batch.id))
    .map((batch) => batch.name);
  const nameList = (names: string[]) =>
    names.length <= 2 ? names.join(" and ") : `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;

  const severityOrder = { danger: 0, warning: 1, info: 2 } as const;
  const attention = (
    [
      {
        key: "slow-leads",
        severity: "danger",
        title: `Leads not contacted within ${SIGNAL_RULES.leadResponseHours} hours`,
        detail: oldestSlowLead
          ? `Oldest: ${oldestSlowLead.studentName}, ${oldestSlowLead.className}`
          : "",
        count: signals.slowLeads.length,
        action: "Assign",
        href: "/admin/leads?status=new",
      },
      {
        key: "falling",
        severity: "danger",
        title: "Students with falling marks",
        detail: `Latest mark more than ${Math.round((1 - SIGNAL_RULES.fallingMarksRatio) * 100)}% below their own average`,
        count: signals.falling.size,
        action: "Review",
        href: "/admin/people?role=student&flag=falling",
      },
      {
        key: "behind",
        severity: "warning",
        title: "Students behind on work",
        detail: `${SIGNAL_RULES.behindOpenAssignments} or more assignments not submitted`,
        count: signals.behind.size,
        action: "Open list",
        href: "/admin/people?role=student&flag=behind",
      },
      {
        key: "stale",
        severity: "warning",
        title: `Batches with no new material in ${SIGNAL_RULES.staleBatchDays} days`,
        detail: nameList(staleNames),
        count: signals.staleBatches.size,
        action: "View",
        href: "/admin/batches?stale=1",
      },
      {
        key: "never-signed-in",
        severity: "info",
        title: `Accounts not signed in after ${SIGNAL_RULES.inactiveAccountDays} days`,
        detail: `${signals.neverSignedIn.students.size} students, ${signals.neverSignedIn.parents.size} parents, ${signals.neverSignedIn.teachers.size} teachers still on the default password`,
        count: neverSignedIn,
        action: "Open list",
        href: "/admin/people?status=not_signed_in",
      },
      {
        key: "no-parent",
        severity: "info",
        title: "Students without a linked parent",
        detail: "Their parents can't follow progress yet",
        count: signals.noParent.size,
        action: "Link",
        href: "/admin/people?role=student&flag=no_parent",
      },
      {
        key: "expiring-admins",
        severity: "info",
        title: `Admin access ending within ${SIGNAL_RULES.expiringAdminDays} days`,
        detail: signals.expiringAdmins.map((teacher) => teacher.name).join(", "),
        count: signals.expiringAdmins.length,
        action: "Review",
        href: "/admin/settings",
      },
    ] satisfies AttentionItem[]
  )
    .filter((item) => item.count > 0)
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.count - a.count);

  const funnelLeads = leadsNow;
  const contacted = funnelLeads.filter((lead) => lead.status !== "new").length;
  const demo = funnelLeads.filter((lead) => lead.status === "demo" || lead.status === "enrolled").length;
  const enrolled = funnelLeads.filter((lead) => lead.status === "enrolled").length;
  const responseHours = median(
    funnelLeads
      .filter((lead) => lead.contactedAt)
      .map((lead) => (new Date(lead.contactedAt!).getTime() - new Date(lead.createdAt).getTime()) / 3_600_000),
  );

  const funnel = {
    steps: [
      { label: "Enquiries", count: funnelLeads.length },
      { label: "Contacted", count: contacted },
      { label: "Demo class", count: demo },
      { label: "Enrolled", count: enrolled },
    ],
    conversion: percent(enrolled, funnelLeads.length),
    medianResponseHours: responseHours === null ? null : Math.round(responseHours),
  };

  const teachers = snapshot.teachers
    .map((teacher) => {
      const batchIds = new Set(snapshot.batches.filter((batch) => batch.teacherId === teacher.id).map((batch) => batch.id));
      const studentIds = new Set(
        snapshot.enrolments.filter((row) => batchIds.has(row.batchId)).map((row) => row.studentId),
      );
      const teacherWork = snapshot.assignments.filter((row) => batchIds.has(row.batchId));
      return {
        id: teacher.id,
        name: teacher.name,
        status: teacher.status,
        isAdmin: effectiveRole(teacher, now) === "admin",
        isOwner: isOwner(teacher),
        batchCount: batchIds.size,
        studentCount: studentIds.size,
        assigned: teacherWork.length,
        completion: percent(teacherWork.filter((row) => row.completedAt).length, teacherWork.length),
        materialsThisPeriod: snapshot.materials.filter(
          (row) => batchIds.has(row.batchId) && inRange(row.updatedAt, start, end),
        ).length,
        lastLoginAt: teacher.lastLoginAt,
      };
    })
    .sort((a, b) => Number(b.status === "active") - Number(a.status === "active") || b.studentCount - a.studentCount);

  const { events: activity } = await listAuditEvents({ limit: 8, excludeLogins: true });

  return {
    rangeDays,
    generatedAt: now.toISOString(),
    totals: {
      teachers: activeTeachers.length,
      batches: snapshot.batches.length,
      students: activeStudents.length,
      parents: activeParents.length,
    },
    kpis,
    attention,
    funnel,
    teachers,
    activity,
  };
}

export type AdminOverview = Awaited<ReturnType<typeof getAdminOverview>>;
