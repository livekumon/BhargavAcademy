import type { ReactNode } from "react";
import {
  Award,
  CalendarClock,
  CheckCircle2,
  FileText,
  Users,
} from "lucide-react";
import type { PortalRole } from "@/components/auth/portals";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";

type ShowcaseCopy = {
  eyebrow: string;
  headline: ReactNode;
  lead: string;
  points: [string, string, string];
};

const copy: Record<PortalRole | "register", ShowcaseCopy> = {
  teacher: {
    eyebrow: "Teacher portal",
    headline: (
      <>
        Every batch, <span className="underline-highlight">one glance</span> away.
      </>
    ),
    lead: "Plan a course once, give each batch its own PDFs, and see who has revised and submitted without chasing anyone.",
    points: ["One course, many batches", "Batch-specific material", "Marks on one timeline"],
  },
  student: {
    eyebrow: "Student portal",
    headline: (
      <>
        Know exactly <span className="underline-highlight">what&rsquo;s due</span>.
      </>
    ),
    lead: "Only the chapters your teacher assigned to you — split into what to revise and what to submit.",
    points: ["Only what's assigned to you", "Submit assignments as PDFs", "Marks as soon as they're in"],
  },
  parent: {
    eyebrow: "Parent portal",
    headline: (
      <>
        Progress you can <span className="underline-highlight">actually check</span>.
      </>
    ),
    lead: "Class material revised, assignments submitted, and marks for every child — per batch, whenever you want to look.",
    points: ["Every child in one login", "Progress for each batch", "Marks as they're recorded"],
  },
  register: {
    eyebrow: "For teachers",
    headline: (
      <>
        Your academy, <span className="underline-highlight">organised</span> from day one.
      </>
    ),
    lead: "Create batches, attach a shared course, and add students with their own logins — parents get theirs too.",
    points: ["Set up in minutes", "Student and parent logins", "No more spreadsheets"],
  },
};

/** A card that drifts gently. The outer span handles the entrance, the inner one the float. */
function Floating({
  className,
  delay,
  children,
}: {
  className?: string;
  delay: number;
  children: ReactNode;
}) {
  return (
    <div
      className={`absolute animate-rise ${className ?? ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="animate-float" style={{ animationDelay: `${delay}ms` }}>
        {children}
      </div>
    </div>
  );
}

function PreviewHeader({
  eyebrow,
  title,
  badge,
}: {
  eyebrow: string;
  title: string;
  badge: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-sunken/60 px-5 py-4">
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-content-subtle uppercase">
          {eyebrow}
        </p>
        <p className="font-heading mt-0.5 truncate text-title-2 font-semibold">{title}</p>
      </div>
      {badge}
    </div>
  );
}

function Initials({ name, className }: { name: string; className?: string }) {
  const letters = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-semibold text-brand-subtle-fg ring-2 ring-raised ${className ?? ""}`}
    >
      {letters}
    </span>
  );
}

function TeacherPreview() {
  const roster = [
    { name: "Ananya Sharma", revised: "2 of 2", rTone: "success", submitted: "1 of 2", sTone: "info" },
    { name: "Meera Iyer", revised: "0 of 2", rTone: "warning", submitted: "1 of 2", sTone: "info" },
    { name: "Rohan Patel", revised: "1 of 2", rTone: "info", submitted: "2 of 2", sTone: "success" },
    { name: "Kavya Rao", revised: "2 of 2", rTone: "success", submitted: "2 of 2", sTone: "success" },
  ] as const;

  return (
    <>
      <Surface elevation="xl" pad="none" border="none" className="overflow-hidden rounded-2xl bg-raised">
        <PreviewHeader
          eyebrow="Batch · Physics"
          title="Grade 10 Morning"
          badge={
            <StatusPill tone="brand" dot>
              <span className="tabular">32</span> students
            </StatusPill>
          }
        />
        <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-3 border-b border-line px-5 py-2 text-[0.6875rem] font-medium tracking-wide text-content-subtle uppercase">
          <span>Student</span>
          <span>Revised</span>
          <span>Submitted</span>
        </div>
        <ul className="divide-y divide-line">
          {roster.map((row) => (
            <li key={row.name} className="grid grid-cols-[1.3fr_1fr_1fr] items-center gap-3 px-5 py-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <Initials name={row.name} className="size-7 ring-0" />
                <span className="truncate text-sm font-medium">{row.name}</span>
              </span>
              <StatusPill tone={row.rTone} size="sm" className="tabular">
                {row.revised}
              </StatusPill>
              <StatusPill tone={row.sTone} size="sm" className="tabular">
                {row.submitted}
              </StatusPill>
            </li>
          ))}
        </ul>
      </Surface>

      <Floating delay={350} className="-bottom-14 -left-8">
        <Surface elevation="lg" pad="none" border="hairline" className="flex items-center gap-3 bg-raised py-3 pr-5 pl-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-success-subtle text-success-subtle-fg">
            <CheckCircle2 className="size-4" />
          </span>
          <span className="text-sm">
            <span className="block font-medium">Meera submitted</span>
            <span className="block text-xs text-content-subtle">Laws of Motion · just now</span>
          </span>
        </Surface>
      </Floating>

      <Floating delay={500} className="-top-9 -right-6">
        <Surface elevation="lg" pad="sm" border="hairline" className="w-48 bg-raised">
          <p className="text-xs text-content-subtle">Class material revised</p>
          <p className="font-heading tabular mt-0.5 text-title-1 font-semibold">86%</p>
          <ProgressMeter value={86} label="Class material revised" tone="highlight" size="sm" className="mt-2" />
        </Surface>
      </Floating>
    </>
  );
}

function StudentPreview() {
  const items = [
    { title: "Motion in a Straight Line", kind: "Class material", status: "Revised", tone: "success", icon: FileText },
    { title: "Laws of Motion", kind: "Assignment · submit a PDF", status: "To submit", tone: "warning", icon: CalendarClock },
    { title: "Work, Energy and Power", kind: "Class material", status: "To revise", tone: "info", icon: FileText },
  ] as const;

  return (
    <>
      <Surface elevation="xl" pad="none" border="none" className="overflow-hidden rounded-2xl bg-raised">
        <PreviewHeader
          eyebrow="My courses"
          title="Physics"
          badge={<StatusPill tone="info">2 to do</StatusPill>}
        />
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.title} className="flex items-center gap-3 px-5 py-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand-subtle-fg">
                <item.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.title}</span>
                <span className="block truncate text-xs text-content-subtle">{item.kind}</span>
              </span>
              <StatusPill tone={item.tone}>{item.status}</StatusPill>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-5 py-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">Course progress</span>
            <span className="tabular text-content-muted">7 of 9</span>
          </div>
          <ProgressMeter value={78} label="Course progress" size="sm" className="mt-2" />
        </div>
      </Surface>

      <Floating delay={350} className="-bottom-12 -left-8">
        <Surface elevation="lg" pad="none" border="hairline" className="flex items-center gap-3 bg-raised py-3 pr-5 pl-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-highlight-subtle text-highlight-subtle-fg">
            <Award className="size-4" />
          </span>
          <span className="text-sm">
            <span className="block font-medium">Marks recorded</span>
            <span className="block text-xs text-content-subtle">
              Kinematics · <span className="tabular">82/100</span>
            </span>
          </span>
        </Surface>
      </Floating>

      <Floating delay={500} className="-top-8 -right-6">
        <Surface elevation="lg" pad="none" border="hairline" className="flex items-center gap-2.5 bg-raised px-3.5 py-2.5">
          <CalendarClock className="size-4 text-warning" />
          <span className="text-sm">
            <span className="font-medium">Due Friday</span>
            <span className="text-content-subtle"> · Laws of Motion</span>
          </span>
        </Surface>
      </Floating>
    </>
  );
}

function ParentPreview() {
  return (
    <>
      <Surface elevation="xl" pad="none" border="none" className="overflow-hidden rounded-2xl bg-raised">
        <PreviewHeader
          eyebrow="My children"
          title="Ananya Sharma"
          badge={<StatusPill tone="brand">Grade 10 Morning</StatusPill>}
        />
        <div className="grid grid-cols-2 gap-5 px-5 py-5">
          <div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">Revised</span>
              <span className="tabular text-content-muted">78%</span>
            </div>
            <ProgressMeter value={78} label="Class material revised" size="sm" className="mt-2" />
            <p className="mt-2 text-xs text-content-subtle">
              <span className="tabular">7 of 9</span> class materials
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">Submitted</span>
              <span className="tabular text-content-muted">75%</span>
            </div>
            <ProgressMeter value={75} label="Assignments submitted" tone="highlight" size="sm" className="mt-2" />
            <p className="mt-2 text-xs text-content-subtle">
              <span className="tabular">3 of 4</span> assignments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-line px-5 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-highlight-subtle text-highlight-subtle-fg">
            <Award className="size-4" />
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-medium">Latest marks</span>
            <span className="block truncate text-xs text-content-subtle">Kinematics · CBSE</span>
          </span>
          <span className="font-heading tabular text-title-2 font-semibold">
            82<span className="text-content-subtle">/100</span>
          </span>
        </div>
      </Surface>

      <Floating delay={350} className="-bottom-12 -left-8">
        <Surface elevation="lg" pad="none" border="hairline" className="flex items-center gap-3 bg-raised py-3 pr-5 pl-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-success-subtle text-success-subtle-fg">
            <CheckCircle2 className="size-4" />
          </span>
          <span className="text-sm">
            <span className="block font-medium">Aarav revised Fractions</span>
            <span className="block text-xs text-content-subtle">Grade 8 · today</span>
          </span>
        </Surface>
      </Floating>

      <Floating delay={500} className="-top-8 -right-6">
        <Surface elevation="lg" pad="none" border="hairline" className="flex items-center gap-2.5 bg-raised px-3.5 py-2.5">
          <Users className="size-4 text-brand" />
          <span className="text-sm">
            <span className="font-medium">2 children</span>
            <span className="text-content-subtle"> · Ananya, Aarav</span>
          </span>
        </Surface>
      </Floating>
    </>
  );
}

function RegisterPreview() {
  const steps = [
    { label: "Create a course", detail: "Grade 10 Physics · 12 chapters", done: true },
    { label: "Open a batch", detail: "Grade 10 Morning", done: true },
    { label: "Add students", detail: "Logins created for them and their parents", done: true },
    { label: "Upload the first PDF", detail: "Motion in a Straight Line", done: false },
  ];

  return (
    <>
      <Surface elevation="xl" pad="none" border="none" className="overflow-hidden rounded-2xl bg-raised">
        <PreviewHeader
          eyebrow="Getting started"
          title="Your academy, ready today"
          badge={
            <StatusPill tone="brand" dot>
              <span className="tabular">3 of 4</span>
            </StatusPill>
          }
        />
        <ol className="divide-y divide-line">
          {steps.map((step, index) => (
            <li key={step.label} className="flex items-center gap-3 px-5 py-3.5">
              <span
                className={`tabular flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step.done ? "bg-success text-success-fg" : "bg-sunken text-content-muted ring-1 ring-line"
                }`}
              >
                {step.done ? <CheckCircle2 className="size-4" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm font-medium ${step.done ? "text-content-muted" : ""}`}>{step.label}</span>
                <span className="block truncate text-xs text-content-subtle">{step.detail}</span>
              </span>
              {step.done ? null : <StatusPill tone="info">Next</StatusPill>}
            </li>
          ))}
        </ol>
        <div className="border-t border-line px-5 py-4">
          <ProgressMeter value={75} label="Setup progress" size="sm" />
        </div>
      </Surface>

      <Floating delay={350} className="-bottom-12 -left-8">
        <Surface elevation="lg" pad="none" border="hairline" className="flex items-center gap-3 bg-raised py-3 pr-5 pl-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-brand-subtle text-brand-subtle-fg">
            <Users className="size-4" />
          </span>
          <span className="text-sm">
            <span className="block font-medium">32 students added</span>
            <span className="block text-xs text-content-subtle">Parents get their own logins</span>
          </span>
        </Surface>
      </Floating>
    </>
  );
}

const previews: Record<PortalRole | "register", () => ReactNode> = {
  teacher: TeacherPreview,
  student: StudentPreview,
  parent: ParentPreview,
  register: RegisterPreview,
};

/**
 * The right-hand panel on auth pages. Tinted by the surrounding `data-role`,
 * it previews the screen the person is about to land on. The sample cards are
 * illustrative only, so they are hidden from assistive tech.
 */
export function AuthShowcase({ variant }: { variant: PortalRole | "register" }) {
  const { eyebrow, headline, lead, points } = copy[variant];
  const Preview = previews[variant];

  return (
    <aside
      aria-label={eyebrow}
      className="relative isolate flex h-full flex-col overflow-hidden rounded-2xl bg-brand-active px-10 py-10 text-content-inverse xl:px-14"
    >
      {/* Atmosphere: a lit corner, a warm marigold ember, and a dot grid. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_100%_0%,var(--brand-hover),transparent_70%)] opacity-90"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-32 -z-10 size-[28rem] rounded-full bg-highlight opacity-[0.09] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle,oklch(1_0_0/0.14)_1px,transparent_1.5px)] bg-size-[22px_22px] mask-[radial-gradient(75%_60%_at_60%_55%,black,transparent)]"
      />

      <div className="max-w-lg">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-content-inverse ring-1 ring-white/15 backdrop-blur">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-highlight" />
          {eyebrow}
        </p>
        <h2 className="mt-5 text-display-3 font-semibold text-balance">{headline}</h2>
        <p className="mt-4 max-w-md text-content-inverse-muted text-pretty">{lead}</p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center py-14">
        <div aria-hidden="true" className="relative w-full max-w-md text-content">
          <Preview />
        </div>
      </div>

      <ul className="hidden grid-cols-3 gap-4 border-t border-white/12 pt-6 text-sm text-content-inverse-muted xl:grid [@media(max-height:760px)]:hidden">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-highlight" />
            <span className="text-pretty">{point}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
