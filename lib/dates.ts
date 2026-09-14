const DATE_INPUT = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayDateInput() {
  return toDateInput(new Date());
}

export function shiftDateInput(value: string, days: number) {
  const date = startOfDateInput(value);
  date.setDate(date.getDate() + days);
  return toDateInput(date);
}

export function parseDateInput(value: string | undefined) {
  if (!value || !DATE_INPUT.test(value)) return null;
  return value;
}

export function startOfDateInput(value: string) {
  const [, year, month, day] = value.match(DATE_INPUT) ?? [];
  return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
}

export function endOfDateInput(value: string) {
  const [, year, month, day] = value.match(DATE_INPUT) ?? [];
  return new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
];

export function formatDateInput(value: string) {
  const date = startOfDateInput(value);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isCompletedInWindow(
  completedAt: Date | string | null | undefined,
  from: string | null,
  to: string | null,
) {
  if (!completedAt) return false;
  const date = completedAt instanceof Date ? completedAt : new Date(completedAt);
  if (Number.isNaN(date.getTime())) return false;
  if (from && date < startOfDateInput(from)) return false;
  if (to && date > endOfDateInput(to)) return false;
  return true;
}

export function resolveBatchWindow(
  searchParams: { from?: string; to?: string; all?: string },
  latestDate: string | null,
) {
  const today = todayDateInput();
  if (searchParams.all === "1") {
    return { from: null, to: null, preset: "all" as const };
  }

  const fallback = latestDate ?? today;
  let from = parseDateInput(searchParams.from) ?? fallback;
  let to = parseDateInput(searchParams.to) ?? fallback;

  if (startOfDateInput(from) > startOfDateInput(to)) {
    [from, to] = [to, from];
  }

  return { from, to, preset: "range" as const };
}
