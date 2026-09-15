/*
 * Small, pure formatting helpers shared by the teacher screens. Dates are
 * shown in India time because that is where the academy runs, even when the
 * server does not.
 */

const TIME_ZONE = "Asia/Kolkata";

function dayKey(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

export function daysAgo(date: Date, now = new Date()) {
  const a = new Date(`${dayKey(date)}T00:00:00Z`).getTime();
  const b = new Date(`${dayKey(now)}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** The moment `days` days before now, for "this week" style windows. */
export function daysBefore(days: number, now = new Date()) {
  return new Date(now.getTime() - days * 86_400_000);
}

export function shortDate(date: Date, now = new Date()) {
  const sameYear = dayKey(date).slice(0, 4) === dayKey(now).slice(0, 4);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    timeZone: TIME_ZONE,
  });
}

/** "today", "yesterday", "3 days ago", or a short date after a week. */
export function relativeDay(date: Date, now = new Date()) {
  const days = daysAgo(date, now);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return shortDate(date, now);
}

export function greeting(now = new Date()) {
  const hour = Number(
    now.toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: TIME_ZONE }),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function longToday(now = new Date()) {
  return now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  });
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

export function percent(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
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

export function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Digits only, with India's country code when a 10-digit number has none — for wa.me links. */
export function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

/** A stored due date as YYYY-MM-DD in India time, for a date input. */
export function dueDateInput(date: Date | null | undefined) {
  return date ? dayKey(date) : "";
}

export type DueState = { tone: "danger" | "warning" | "neutral"; label: string };

/** "Overdue by 2 days", "Due today", "Due 20 Sept" — only for work that isn't finished. */
export function dueState(dueAt: Date | null | undefined, now = new Date()): DueState | null {
  if (!dueAt) return null;
  const days = daysAgo(dueAt, now);
  if (days > 0) return { tone: "danger", label: days === 1 ? "Overdue by a day" : `Overdue by ${days} days` };
  if (days === 0) return { tone: "warning", label: "Due today" };
  if (days === -1) return { tone: "warning", label: "Due tomorrow" };
  return { tone: "neutral", label: `Due ${shortDate(dueAt, now)}` };
}
