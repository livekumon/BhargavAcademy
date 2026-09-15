const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Today", "Yesterday", "6 days ago", then a date. Null means never. */
export function relativeDay(value: Date | string | null | undefined, now: Date = new Date()) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.floor((startOfToday.getTime() - date.getTime()) / DAY) + 1;
  if (date.getTime() >= startOfToday.getTime()) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(date);
}

export function daysSince(value: Date | string | null | undefined, now: Date = new Date()) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Math.floor((now.getTime() - date.getTime()) / DAY);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Clock time for today's events, otherwise a short date. */
export function formatEventTime(value: Date | string, now: Date = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** yyyy-mm-dd for date inputs. */
export function toDateInputValue(value: Date | null | undefined) {
  if (!value) return "";
  const local = new Date(value.getTime() - value.getTimezoneOffset() * MINUTE);
  return local.toISOString().slice(0, 10);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
