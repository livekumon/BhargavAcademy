export type LookupChoice = {
  value: string;
  label: string;
};

export const SYLLABUSES: LookupChoice[] = [
  { value: "jp", label: "JP" },
  { value: "ip", label: "IP" },
  { value: "cbse", label: "CBSE" },
  { value: "state", label: "State syllabus" },
];

export const EXAMS: LookupChoice[] = [
  { value: "jee_advanced", label: "JEE Advanced" },
  { value: "jee_mains", label: "JEE Mains" },
  { value: "ca_foundation", label: "CA Foundation" },
  { value: "ca_intermediate", label: "CA Intermediate" },
  { value: "ca_final", label: "CA Final" },
];

export const EXAM_PAPERS: LookupChoice[] = [
  { value: "mains", label: "Mains" },
  { value: "advanced", label: "Advanced" },
];

export const SELECT_CLASS_NAME =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function parseOption(
  options: LookupChoice[],
  value: unknown,
): string | null {
  const next = String(value ?? "").trim();
  return options.some((item) => item.value === next) ? next : null;
}

export function optionLabel(
  options: LookupChoice[],
  value: string | null | undefined,
) {
  return options.find((item) => item.value === value)?.label ?? value ?? "";
}

export function defaultExamPaper(exam: string | null | undefined) {
  return exam === "jee_advanced" ? "advanced" : "mains";
}

export function parseMarks(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const marks = Number(raw);
  if (!Number.isFinite(marks) || marks < 0 || marks > 500) return null;
  return Math.round(marks * 10) / 10;
}
