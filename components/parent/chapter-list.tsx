import { BookOpen, ClipboardList } from "lucide-react";
import { cn } from "cn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill, completionTone } from "@/components/ui/status-pill";
import { isAssignment } from "@/lib/materials";
import { outstandingWork, relativeDay } from "@/lib/parent-insights";
import type { ParentCourse, ParentMaterial } from "@/lib/queries";

function materialStatus(material: ParentMaterial) {
  const assignment = isAssignment(material.kind);
  if (material.completedAt) {
    return { tone: "success" as const, label: assignment ? "Submitted" : "Revised" };
  }
  return assignment
    ? { tone: "warning" as const, label: "To submit" }
    : { tone: "info" as const, label: "To revise" };
}

const dotTones = {
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
} as const;

/**
 * Courses, then chapters that open to show each material. Each closed row
 * still shows one dot per material, so progress reads without expanding.
 * Chapters with open work start expanded.
 */
export function ChapterList({ courses }: { courses: ParentCourse[] }) {
  return (
    <div className="space-y-8">
      {courses.map((course) => {
        const done = course.progress.classMaterialCompleted + course.progress.assignmentCompleted;
        const total = course.progress.classMaterialAssigned + course.progress.assignmentAssigned;
        const openChapters = course.chapters
          .filter((chapter) => outstandingWork(chapter.materials).total > 0)
          .map((chapter) => chapter.id);

        return (
          <section key={course.id} aria-labelledby={`course-${course.id}`} className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id={`course-${course.id}`} className="text-title-1 font-semibold">
                  {course.title}
                </h2>
                <p className="tabular text-sm text-content-muted">
                  {done} of {total} done across {course.chapters.length}{" "}
                  {course.chapters.length === 1 ? "chapter" : "chapters"}
                </p>
              </div>
              <ProgressMeter
                value={total === 0 ? 0 : (done / total) * 100}
                label={`${course.title} progress`}
                className="w-full sm:w-48"
              />
            </div>

            <Accordion
              type="multiple"
              defaultValue={openChapters}
              className="rounded-xl bg-surface px-4 ring-1 ring-line sm:px-5"
            >
              {course.chapters.map((chapter, index) => {
                const chapterDone =
                  chapter.progress.classMaterialCompleted + chapter.progress.assignmentCompleted;
                return (
                  <AccordionItem key={chapter.id} value={chapter.id}>
                    <AccordionTrigger className="items-center py-4">
                      <span className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="tabular flex size-8 shrink-0 items-center justify-center rounded-lg bg-sunken text-xs font-semibold text-content-muted">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-content">{chapter.title}</span>
                          <span className="mt-1 flex items-center gap-1" aria-hidden="true">
                            {chapter.materials.map((material) => (
                              <span
                                key={material.id}
                                className={cn(
                                  "h-1.5 w-4 rounded-full",
                                  dotTones[materialStatus(material).tone],
                                )}
                              />
                            ))}
                          </span>
                        </span>
                        <StatusPill
                          tone={completionTone(chapterDone, chapter.materials.length)}
                          size="sm"
                          className="tabular"
                        >
                          {chapterDone} of {chapter.materials.length}
                        </StatusPill>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pr-0">
                      {chapter.description ? (
                        <p className="mb-3 text-sm">{chapter.description}</p>
                      ) : null}
                      <ul className="space-y-2">
                        {chapter.materials.map((material) => (
                          <MaterialRow key={material.id} material={material} />
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </section>
        );
      })}
    </div>
  );
}

function MaterialRow({ material }: { material: ParentMaterial }) {
  const assignment = isAssignment(material.kind);
  const status = materialStatus(material);
  const Icon = assignment ? ClipboardList : BookOpen;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg bg-sunken/60 px-3 py-2.5">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-content-subtle" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-content">{material.name}</span>
        <span className="block text-xs text-content-subtle">
          {assignment ? "Assignment" : "Class material"}
          {material.completedAt
            ? ` · ${status.label.toLowerCase()} ${relativeDay(material.completedAt)}`
            : ` · assigned ${relativeDay(material.assignedAt)}`}
        </span>
      </span>
      <StatusPill tone={status.tone}>{status.label}</StatusPill>
    </li>
  );
}
