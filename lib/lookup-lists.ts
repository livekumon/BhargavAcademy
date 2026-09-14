export const LOOKUP_LIST_KEYS = ["syllabus", "exam", "exam_paper"] as const;

export type LookupListKey = (typeof LOOKUP_LIST_KEYS)[number];

export const LOOKUP_LISTS: {
  key: LookupListKey;
  title: string;
  description: string;
  placeholder: string;
}[] = [
  {
    key: "syllabus",
    title: "Syllabus",
    description:
      "Used when a teacher adds a student and when a student logs marks.",
    placeholder: "e.g. IB",
  },
  {
    key: "exam",
    title: "Exam",
    description: "The exam a student is preparing for.",
    placeholder: "e.g. NEET",
  },
  {
    key: "exam_paper",
    title: "Exam paper",
    description: "The paper students pick when they log chapter marks.",
    placeholder: "e.g. Paper 1",
  },
];

export function isLookupListKey(value: string): value is LookupListKey {
  return LOOKUP_LIST_KEYS.includes(value as LookupListKey);
}

export function slugifyLookupValue(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}
