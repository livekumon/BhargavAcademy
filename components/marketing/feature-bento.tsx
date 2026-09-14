import {
  ClipboardCheck,
  FileUp,
  Layers,
  LineChart,
  UserPlus,
  Users,
} from "lucide-react";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { cn } from "cn";

function Tile({
  icon: Icon,
  title,
  body,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Surface
      pad="default"
      className={cn(
        "group/tile flex flex-col gap-3 transition-shadow duration-(--dur-base) ease-out-quart hover:shadow-elevation-md",
        className,
      )}
    >
      <span className="flex size-10 w-fit items-center justify-center rounded-lg bg-brand-subtle text-brand-subtle-fg">
        <Icon className="size-4.5" />
      </span>
      <div>
        <h3 className="font-heading text-title-3 font-semibold">{title}</h3>
        <p className="mt-1.5 text-sm text-content-muted text-pretty">{body}</p>
      </div>
      {children ? <div className="mt-auto pt-2">{children}</div> : null}
    </Surface>
  );
}

export function FeatureBento() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Tile
        icon={Users}
        title="Batches and rosters"
        body="Group students by class and timing. Each batch keeps its own roster, its own material, and its own pace."
        className="lg:col-span-2"
      >
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="brand">Grade 10 Morning</StatusPill>
          <StatusPill tone="brand">Grade 10 Evening</StatusPill>
          <StatusPill tone="brand">Grade 8 Afternoon</StatusPill>
        </div>
      </Tile>

      <Tile
        icon={Layers}
        title="A shared course library"
        body="Write a course and its chapters once, then attach it to as many batches as you teach."
      />

      <Tile
        icon={FileUp}
        title="Material per batch"
        body="Upload a different PDF for the same chapter in a different batch. Up to 20 MB, previewed in place."
      >
        <div className="flex items-center gap-2 rounded-lg bg-sunken px-3 py-2 font-mono text-xs text-content-muted">
          <FileUp aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">grade8-linear-equations.pdf</span>
        </div>
      </Tile>

      <Tile
        icon={ClipboardCheck}
        title="Class material or assignment"
        body="Mark a chapter's material as something to revise, or something to hand back in — and assign it student by student."
        className="lg:col-span-2"
      >
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="info" dot>
            To revise
          </StatusPill>
          <StatusPill tone="warning" dot>
            To submit
          </StatusPill>
          <StatusPill tone="success" dot>
            Submitted
          </StatusPill>
        </div>
      </Tile>

      <Tile
        icon={LineChart}
        title="Marks and progress"
        body="Record chapter scores against a syllabus and exam paper, then read them back as a timeline per student."
      >
        <div className="flex flex-col gap-2">
          <ProgressMeter value={82} label="Kinematics marks" size="sm" />
          <ProgressMeter
            value={64}
            label="Laws of Motion marks"
            tone="highlight"
            size="sm"
          />
        </div>
      </Tile>

      <Tile
        icon={UserPlus}
        title="Parents, linked properly"
        body="A parent signs in once and sees every child linked to them, with progress broken down by batch."
        className="lg:col-span-2"
      />
    </div>
  );
}
