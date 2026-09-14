import { CheckCircle2, Clock3, FileText, Layers } from "lucide-react";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";

const chapters = [
  {
    title: "Motion in a Straight Line",
    material: "morning-motion-notes.pdf",
    tone: "success" as const,
    status: "All 4 done",
    icon: CheckCircle2,
  },
  {
    title: "Laws of Motion",
    material: "morning-laws-of-motion.pdf",
    tone: "info" as const,
    status: "2 of 4 done",
    icon: Clock3,
  },
  {
    title: "Work, Energy and Power",
    material: "morning-work-energy.pdf",
    tone: "warning" as const,
    status: "Not started",
    icon: Clock3,
  },
];

/**
 * The hero composition. Every surface here mirrors something the product
 * actually renders — chapter material per batch, per-student completion,
 * and the same course attached to a second batch.
 */
export function HeroVisual() {
  return (
    <div className="relative" aria-hidden="true">
      <Surface
        elevation="xl"
        pad="none"
        className="overflow-hidden rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line bg-sunken/60 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-content-subtle uppercase">
              Grade 10 Morning
            </p>
            <p className="font-heading mt-0.5 truncate text-title-2 font-semibold">
              Physics
            </p>
          </div>
        </div>

        <ul className="divide-y divide-line">
          {chapters.map((chapter) => (
            <li
              key={chapter.title}
              className="flex items-center gap-3 px-5 py-3.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand-subtle-fg">
                <FileText className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {chapter.title}
                </span>
                <span className="block truncate font-mono text-xs text-content-subtle">
                  {chapter.material}
                </span>
              </span>
              <StatusPill tone={chapter.tone} className="hidden sm:inline-flex">
                {chapter.status}
              </StatusPill>
            </li>
          ))}
        </ul>

        {/* Keeps the floating progress card clear of the chapter rows. */}
        <div className="flex items-center justify-between gap-3 border-t border-line bg-sunken/40 px-5 py-3 text-xs text-content-subtle">
          <StatusPill tone="brand" dot size="sm">
            4 students
          </StatusPill>
          <span>
            <span className="tabular">3</span> chapters · updated today
          </span>
        </div>
      </Surface>

      {/* Same course, second batch — the idea the whole product turns on. */}
      <Surface
        elevation="lg"
        pad="sm"
        className="absolute -top-14 -right-3 hidden w-56 rotate-2 sm:block lg:-right-8"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-content-muted">
          <Layers className="size-3.5 text-highlight" />
          Same Physics course
        </div>
        <p className="mt-1.5 text-sm font-medium">Grade 10 Evening</p>
        <p className="mt-0.5 font-mono text-xs text-content-subtle">
          evening-motion-notes.pdf
        </p>
      </Surface>

      {/* Per-student progress — what the parent view is built on. */}
      <Surface
        elevation="lg"
        pad="sm"
        className="absolute -bottom-12 -left-3 w-60 -rotate-1 lg:-left-10"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Ananya Sharma</p>
          <span className="tabular text-sm font-semibold text-highlight-subtle-fg">
            78%
          </span>
        </div>
        <ProgressMeter
          value={78}
          label="Ananya Sharma course progress"
          tone="highlight"
          size="sm"
          className="mt-2"
        />
        <p className="mt-2 text-xs text-content-subtle">
          <span className="tabular">7 of 9</span> revisions · last seen today
        </p>
      </Surface>
    </div>
  );
}
