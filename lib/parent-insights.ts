import { isAssignment } from "./materials";
import type { ParentChild, ParentMaterial } from "./queries";

/*
 * Pure helpers that turn a child's raw progress into what a parent actually
 * wants to know: is anything outstanding, what happened recently, and how
 * marks are moving. No database access, so every rule here is easy to read.
 */

const TIME_ZONE = "Asia/Kolkata";

function dayKey(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

function daysBetween(from: Date, to: Date) {
  const a = new Date(`${dayKey(from)}T00:00:00Z`).getTime();
  const b = new Date(`${dayKey(to)}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function greeting(now = new Date()) {
  const hour = Number(
    now.toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: TIME_ZONE }),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatShortDate(date: Date, now = new Date()) {
  const sameYear = dayKey(date).slice(0, 4) === dayKey(now).slice(0, 4);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    timeZone: TIME_ZONE,
  });
}

/** "today", "yesterday", "3 days ago", or a short date once it is over a week old. */
export function relativeDay(date: Date, now = new Date()) {
  const days = daysBetween(date, now);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return formatShortDate(date, now);
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

export type Outstanding = {
  toSubmit: ParentMaterial[];
  toRevise: ParentMaterial[];
  total: number;
};

/** Open work, assignments first because they are the ones a teacher checks. */
export function outstandingWork(materials: ParentMaterial[]): Outstanding {
  const open = materials.filter((material) => !material.completedAt);
  const toSubmit = open.filter((material) => isAssignment(material.kind));
  const toRevise = open.filter((material) => !isAssignment(material.kind));
  return { toSubmit, toRevise, total: open.length };
}

export type ChildStatus = {
  tone: "success" | "warning" | "info" | "neutral";
  label: string;
};

export function childStatus(child: ParentChild): ChildStatus {
  if (child.materials.length === 0) {
    return { tone: "neutral", label: "Nothing assigned" };
  }
  const { total, toSubmit } = outstandingWork(child.materials);
  if (total === 0) return { tone: "success", label: "All caught up" };
  return {
    tone: toSubmit.length > 0 ? "warning" : "info",
    label: `${total} outstanding`,
  };
}

/** One plain sentence about a child, e.g. "has 2 assignments to submit and 1 class material to revise". */
export function childSentence(child: ParentChild) {
  if (child.materials.length === 0) return "has nothing assigned yet.";
  const { toSubmit, toRevise, total } = outstandingWork(child.materials);
  if (total === 0) return "is all caught up.";

  const parts: string[] = [];
  if (toSubmit.length > 0) parts.push(`${plural(toSubmit.length, "assignment")} to submit`);
  if (toRevise.length > 0) parts.push(`${plural(toRevise.length, "class material")} to revise`);
  return `has ${parts.join(" and ")}.`;
}

export type ActivityEvent = {
  id: string;
  type: "revised" | "submitted" | "mark";
  at: Date;
  childId: string;
  childName: string;
  title: string;
  detail: string;
  marks?: { value: number; outOf: number | null };
};

export function activityFor(children: ParentChild[], limit = 12): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const child of children) {
    for (const material of child.materials) {
      if (!material.completedAt) continue;
      const submitted = isAssignment(material.kind);
      events.push({
        id: `${child.student.id}:${material.id}`,
        type: submitted ? "submitted" : "revised",
        at: material.completedAt,
        childId: child.student.id,
        childName: child.student.name,
        title: material.chapterTitle,
        detail: `${submitted ? "Assignment" : "Class material"} · ${material.courseTitle}`,
      });
    }

    for (const mark of child.marks) {
      events.push({
        id: `${child.student.id}:${mark.id}`,
        type: "mark",
        at: mark.createdAt,
        childId: child.student.id,
        childName: child.student.name,
        title: mark.chapterTitles.join(", "),
        detail: mark.courseTitle,
        marks: { value: mark.marks, outOf: markOutOf(mark) },
      });
    }
  }

  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

export function groupByRecency(events: ActivityEvent[], now = new Date()) {
  const groups: { label: string; events: ActivityEvent[] }[] = [
    { label: "Today", events: [] },
    { label: "This week", events: [] },
    { label: "Earlier", events: [] },
  ];
  for (const event of events) {
    const days = daysBetween(event.at, now);
    groups[days <= 0 ? 0 : days < 7 ? 1 : 2].events.push(event);
  }
  return groups.filter((group) => group.events.length > 0);
}

export function lastActive(child: ParentChild) {
  const dates = [
    ...child.materials.flatMap((material) => (material.completedAt ? [material.completedAt] : [])),
    ...child.marks.map((mark) => mark.createdAt),
  ];
  if (dates.length === 0) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

type MarkLike = ParentChild["marks"][number];

/** Filled in once marks carry a maximum; until then every mark is a bare score. */
export function markOutOf(mark: MarkLike): number | null {
  const value = (mark as { outOf?: number | null }).outOf;
  return typeof value === "number" && value > 0 ? value : null;
}

export type MarkPoint = {
  id: string;
  at: Date;
  score: number;
  mark: MarkLike;
  delta: number | null;
};

/** Every mark has a maximum, so scores can be compared as percentages. */
export function marksArePercent(marks: MarkLike[]) {
  return marks.length > 0 && marks.every((mark) => markOutOf(mark) !== null);
}

/**
 * Marks oldest first, each with its change against the previous test.
 * Percentages only when every mark knows its maximum, so units never mix.
 */
export function markSeries(marks: MarkLike[]): MarkPoint[] {
  const percent = marksArePercent(marks);
  const score = (mark: MarkLike) =>
    Math.round((percent ? (mark.marks / markOutOf(mark)!) * 100 : mark.marks) * 10) / 10;
  const ordered = [...marks].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  return ordered.map((mark, index) => ({
    id: mark.id,
    at: mark.recordedAt,
    score: score(mark),
    mark,
    delta: index === 0 ? null : Math.round((score(mark) - score(ordered[index - 1])) * 10) / 10,
  }));
}

export function formatMark(mark: MarkLike) {
  const outOf = markOutOf(mark);
  return outOf ? `${formatNumber(mark.marks)}/${formatNumber(outOf)}` : formatNumber(mark.marks);
}

export function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function trendPoints(marks: MarkLike[], paperLabel: (value: string) => string) {
  return {
    percent: marksArePercent(marks),
    points: markSeries(marks).map((point) => ({
      id: point.id,
      date: formatShortDate(point.at),
      score: point.score,
      label: formatMark(point.mark),
      chapters: point.mark.chapterTitles.join(", "),
      paper: paperLabel(point.mark.examPaper),
      delta: point.delta,
    })),
  };
}
