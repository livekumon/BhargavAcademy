import type { StatusTone } from "@/components/ui/status-pill";
import { isAssignment } from "./materials";
import { studentMaterialPath } from "./paths";

/*
 * Everything the student portal needs to answer "what do I do next?", derived
 * from getStudentHome. Kept pure so the Today, Courses, course, and material
 * pages all count and word progress identically.
 */

type HomeMaterial = {
  id: string;
  pdfOriginalName: string | null;
  kind: string;
  completedAt: Date | null;
  submissionOriginalName: string | null;
  batchName?: string;
};

type HomeCourse = {
  id: string;
  title: string;
  description: string;
  chapters: {
    id: string;
    title: string;
    description: string;
    materials: HomeMaterial[];
  }[];
};

export type WorkItem = {
  id: string;
  href: string;
  title: string;
  kind: "assignment" | "class_material";
  done: boolean;
  status: { label: string; tone: StatusTone };
  courseId: string;
  courseTitle: string;
  chapterTitle: string;
  chapterNumber: number;
};

export type WorkTally = {
  total: number;
  done: number;
  toSubmit: number;
  toRevise: number;
  submitted: number;
  assignments: number;
  revised: number;
  classMaterials: number;
  percent: number;
};

/** The status vocabulary from DESIGN.md — the same words teachers and parents see. */
export function materialStatus(
  kind: string,
  completedAt: Date | string | null,
): { label: string; tone: StatusTone } {
  if (isAssignment(kind)) {
    return completedAt
      ? { label: "Submitted", tone: "success" }
      : { label: "To submit", tone: "warning" };
  }
  return completedAt
    ? { label: "Revised", tone: "success" }
    : { label: "To revise", tone: "info" };
}

export function materialTitle(material: { pdfOriginalName: string | null }) {
  return (material.pdfOriginalName ?? "PDF material").replace(/\.pdf$/i, "");
}

export function courseWorkItems(course: HomeCourse): WorkItem[] {
  return course.chapters.flatMap((chapter, index) =>
    chapter.materials.map((material) => ({
      id: material.id,
      href: studentMaterialPath(material.id),
      title: materialTitle(material),
      kind: isAssignment(material.kind) ? "assignment" : "class_material",
      done: Boolean(material.completedAt),
      status: materialStatus(material.kind, material.completedAt),
      courseId: course.id,
      courseTitle: course.title,
      chapterTitle: chapter.title,
      chapterNumber: index + 1,
    })),
  );
}

export function tally(items: WorkItem[]): WorkTally {
  const assignments = items.filter((item) => item.kind === "assignment");
  const classMaterials = items.filter((item) => item.kind === "class_material");
  const submitted = assignments.filter((item) => item.done).length;
  const revised = classMaterials.filter((item) => item.done).length;
  const done = submitted + revised;

  return {
    total: items.length,
    done,
    toSubmit: assignments.length - submitted,
    toRevise: classMaterials.length - revised,
    submitted,
    assignments: assignments.length,
    revised,
    classMaterials: classMaterials.length,
    percent: items.length === 0 ? 0 : Math.round((done / items.length) * 100),
  };
}

/**
 * Open work in the order a student should tackle it: assignments to submit
 * first (someone is waiting on them), then material to revise, each in
 * course and chapter order.
 */
export function upNext(courses: HomeCourse[]): WorkItem[] {
  const open = courses.flatMap(courseWorkItems).filter((item) => !item.done);
  return [
    ...open.filter((item) => item.kind === "assignment"),
    ...open.filter((item) => item.kind === "class_material"),
  ];
}

/** The next open item after this one in its course, wrapping, then any other course. */
export function nextOpenItem(courses: HomeCourse[], materialId: string) {
  const course = courses.find((item) =>
    item.chapters.some((chapter) =>
      chapter.materials.some((material) => material.id === materialId),
    ),
  );
  if (!course) return null;

  const items = courseWorkItems(course);
  const index = items.findIndex((item) => item.id === materialId);
  const ordered = [...items.slice(index + 1), ...items.slice(0, index)];
  return (
    ordered.find((item) => !item.done) ??
    upNext(courses.filter((item) => item.id !== course.id))[0] ??
    null
  );
}

export function summarizeOpenWork(work: WorkTally) {
  const parts = [
    work.toSubmit > 0
      ? `${work.toSubmit} ${work.toSubmit === 1 ? "assignment" : "assignments"} to submit`
      : null,
    work.toRevise > 0 ? `${work.toRevise} to revise` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}
