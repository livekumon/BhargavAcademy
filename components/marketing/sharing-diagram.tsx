import { BookMarked, FileText, Users } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";

const batches = [
  {
    name: "Grade 10 Morning",
    file: "morning-motion-notes.pdf",
    students: "4 students",
    assigned: "Assigned to 3",
    tone: "info" as const,
  },
  {
    name: "Grade 10 Evening",
    file: "evening-motion-notes.pdf",
    students: "3 students",
    assigned: "Assigned to 3",
    tone: "success" as const,
  },
];

/**
 * The one idea the product turns on: a course is authored once, but the
 * material hanging off each chapter belongs to a batch, and the assignment
 * belongs to a student.
 */
export function SharingDiagram() {
  return (
    <div className="flex flex-col items-center">
      <Surface
        elevation="md"
        pad="sm"
        className="w-full max-w-sm rounded-xl text-center"
      >
        <span className="mx-auto flex size-10 items-center justify-center rounded-lg bg-brand text-brand-fg">
          <BookMarked className="size-4" />
        </span>
        <p className="font-heading mt-3 text-title-3 font-semibold">
          Physics
        </p>
        <p className="mt-1 text-sm text-content-muted">
          One course · three chapters · written once
        </p>
      </Surface>

      {/* Fork. Decorative — the structure is already in the headings.
          The drop legs land at 25% and 75%, the centres of the two columns. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 64"
        preserveAspectRatio="none"
        className="hidden h-16 w-full text-line-strong sm:block"
      >
        <path
          d="M200 0 V26 M100 26 H300 M100 26 V64 M300 26 V64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Stacked layout gets a plain stem instead. */}
      <span
        aria-hidden="true"
        className="my-5 block h-8 w-px bg-line-strong sm:hidden"
      />

      <div className="grid w-full gap-4 sm:grid-cols-2">
        {batches.map((batch) => (
          <Surface key={batch.name} elevation="sm" pad="sm" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-heading text-title-3 font-semibold">
                {batch.name}
              </p>
              <StatusPill tone="neutral">
                <Users className="size-3" />
                {batch.students}
              </StatusPill>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg bg-sunken px-3 py-2.5">
              <FileText
                aria-hidden="true"
                className="size-4 shrink-0 text-highlight-subtle-fg"
              />
              <span className="min-w-0 truncate font-mono text-xs text-content-muted">
                {batch.file}
              </span>
            </div>

            <StatusPill tone={batch.tone} dot className="w-fit">
              {batch.assigned}
            </StatusPill>
          </Surface>
        ))}
      </div>

      <p className="mt-6 max-w-lg text-center text-sm text-content-subtle text-pretty">
        Edit the chapter once and both batches get it. Swap the PDF for the
        evening batch and the morning batch never notices.
      </p>
    </div>
  );
}
