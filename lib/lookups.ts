import { and, asc, eq } from "drizzle-orm";
import { type LookupChoice } from "@/lib/academics";
import { db, ensureDatabase } from "@/lib/db";
import {
  isLookupListKey,
  type LookupListKey,
} from "@/lib/lookup-lists";
import {
  lookupOptions,
  studentChapterMarks,
  students,
  type LookupOption,
} from "@/lib/schema";

export type { LookupListKey } from "@/lib/lookup-lists";
export {
  isLookupListKey,
  LOOKUP_LIST_KEYS,
  LOOKUP_LISTS,
  slugifyLookupValue,
} from "@/lib/lookup-lists";

export type LookupCatalog = Record<LookupListKey, LookupOption[]>;

export async function getLookupCatalog(): Promise<LookupCatalog> {
  await ensureDatabase();
  const rows = await db
    .select()
    .from(lookupOptions)
    .orderBy(asc(lookupOptions.position), asc(lookupOptions.label));

  const catalog: LookupCatalog = {
    syllabus: [],
    exam: [],
    exam_paper: [],
  };

  for (const row of rows) {
    if (isLookupListKey(row.listKey)) {
      catalog[row.listKey].push(row);
    }
  }

  return catalog;
}

export function lookupChoices(options: LookupOption[]): LookupChoice[] {
  return options.map((option) => ({
    value: option.value,
    label: option.label,
  }));
}

export async function countLookupUsage(listKey: LookupListKey, value: string) {
  await ensureDatabase();

  if (listKey === "syllabus") {
    const [studentRows, markRows] = await Promise.all([
      db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.syllabus, value)),
      db
        .select({ id: studentChapterMarks.id })
        .from(studentChapterMarks)
        .where(eq(studentChapterMarks.syllabus, value)),
    ]);
    return studentRows.length + markRows.length;
  }

  if (listKey === "exam") {
    const rows = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.exam, value));
    return rows.length;
  }

  const rows = await db
    .select({ id: studentChapterMarks.id })
    .from(studentChapterMarks)
    .where(eq(studentChapterMarks.examPaper, value));
  return rows.length;
}

export async function getLookupOption(id: string) {
  await ensureDatabase();
  const [option] = await db
    .select()
    .from(lookupOptions)
    .where(eq(lookupOptions.id, id))
    .limit(1);
  return option ?? null;
}

export async function findLookupOption(listKey: LookupListKey, value: string) {
  await ensureDatabase();
  const [option] = await db
    .select()
    .from(lookupOptions)
    .where(
      and(eq(lookupOptions.listKey, listKey), eq(lookupOptions.value, value)),
    )
    .limit(1);
  return option ?? null;
}
