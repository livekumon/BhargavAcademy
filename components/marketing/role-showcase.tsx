"use client";

import { useState } from "react";
import {
  CalendarClock,
  FileText,
  GraduationCap,
  Presentation,
  TrendingUp,
  Users,
} from "lucide-react";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const roles = [
  {
    value: "teacher",
    label: "Teacher",
    icon: Presentation,
    headline: "See the whole batch at a glance.",
    body: "Every student, what they have been given, and what they have actually finished — in one row each.",
  },
  {
    value: "student",
    label: "Student",
    icon: GraduationCap,
    headline: "Know exactly what is due.",
    body: "Only the chapters assigned to you, split into what to revise and what to submit.",
  },
  {
    value: "parent",
    label: "Parent",
    icon: Users,
    headline: "Progress you can actually check.",
    body: "Revision, assignments, and marks for each child, per batch — without asking anyone.",
  },
] as const;

const roster = [
  { name: "Ananya Sharma", revision: "2 of 2", rTone: "success", work: "1 of 2", wTone: "info" },
  { name: "Kavya Rao", revision: "No material", rTone: "neutral", work: "—", wTone: "neutral" },
  { name: "Meera Iyer", revision: "0 of 2", rTone: "warning", work: "0 of 1", wTone: "warning" },
  { name: "Rohan Patel", revision: "1 of 2", rTone: "info", work: "1 of 1", wTone: "success" },
] as const;

function PanelFrame({
  role,
  title,
  subtitle,
  badge,
  children,
}: {
  role: string;
  title: string;
  subtitle: string;
  badge: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Surface
      data-role={role}
      elevation="lg"
      pad="none"
      className="animate-rise overflow-hidden rounded-2xl"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line bg-sunken/60 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-content-subtle uppercase">
            {subtitle}
          </p>
          <p className="font-heading mt-0.5 truncate text-title-2 font-semibold">
            {title}
          </p>
        </div>
        {badge}
      </div>
      {children}
    </Surface>
  );
}

export function RoleShowcase() {
  const [value, setValue] = useState<string>("teacher");
  const active = roles.find((role) => role.value === value) ?? roles[0];

  return (
    <Tabs value={value} onValueChange={setValue} className="gap-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-md">
          <p
            key={`${active.value}-headline`}
            className="font-heading animate-fade-in text-title-1 font-semibold text-balance"
          >
            {active.headline}
          </p>
          <p
            key={`${active.value}-body`}
            className="animate-fade-in mt-2 text-content-muted text-pretty"
          >
            {active.body}
          </p>
        </div>

        <TabsList aria-label="Choose a role">
          {roles.map((role) => (
            <TabsTrigger key={role.value} value={role.value}>
              <role.icon aria-hidden="true" />
              {role.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="teacher">
        <PanelFrame
          role="teacher"
          subtitle="Teacher · batch dashboard"
          title="Grade 10 Morning"
          badge={
            <StatusPill tone="brand" dot>
              4 students
            </StatusPill>
          }
        >
          <div className="hidden grid-cols-[1.4fr_1fr_1fr] gap-3 border-b border-line px-5 py-2.5 text-xs font-medium tracking-wide text-content-subtle uppercase sm:grid">
            <span>Student</span>
            <span>Class material</span>
            <span>Assignments</span>
          </div>
          <ul className="divide-y divide-line">
            {roster.map((row) => (
              <li
                key={row.name}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3.5 sm:grid sm:grid-cols-[1.4fr_1fr_1fr]"
              >
                <span className="text-sm font-medium">{row.name}</span>
                <StatusPill tone={row.rTone}>{row.revision}</StatusPill>
                <StatusPill tone={row.wTone}>{row.work}</StatusPill>
              </li>
            ))}
          </ul>
        </PanelFrame>
      </TabsContent>

      <TabsContent value="student">
        <PanelFrame
          role="student"
          subtitle="Student · my courses"
          title="Physics"
          badge={<StatusPill tone="info">2 due</StatusPill>}
        >
          <ul className="divide-y divide-line">
            {[
              {
                title: "Motion in a Straight Line",
                kind: "Class material",
                action: "Revised",
                tone: "success" as const,
                icon: FileText,
              },
              {
                title: "Laws of Motion",
                kind: "Assignment · submit a PDF",
                action: "Due",
                tone: "warning" as const,
                icon: CalendarClock,
              },
              {
                title: "Work, Energy and Power",
                kind: "Class material",
                action: "To revise",
                tone: "info" as const,
                icon: FileText,
              },
            ].map((item) => (
              <li key={item.title} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-subtle text-brand-subtle-fg">
                  <item.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.title}
                  </span>
                  <span className="block truncate text-xs text-content-subtle">
                    {item.kind}
                  </span>
                </span>
                <StatusPill tone={item.tone}>{item.action}</StatusPill>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-5 py-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">Course progress</span>
              <span className="tabular text-content-muted">7 of 9</span>
            </div>
            <ProgressMeter
              value={78}
              label="Course progress"
              className="mt-2"
              size="sm"
            />
          </div>
        </PanelFrame>
      </TabsContent>

      <TabsContent value="parent">
        <PanelFrame
          role="parent"
          subtitle="Parent · my children"
          title="Ananya Sharma"
          badge={<StatusPill tone="brand">Grade 10 Morning</StatusPill>}
        >
          <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">Revision</span>
                <span className="tabular text-content-muted">78%</span>
              </div>
              <ProgressMeter
                value={78}
                label="Revision completed"
                className="mt-2"
                size="sm"
              />
              <p className="mt-2 text-xs text-content-subtle">
                <span className="tabular">7 of 9</span> class materials completed
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">Assignments</span>
                <span className="tabular text-content-muted">75%</span>
              </div>
              <ProgressMeter
                value={75}
                label="Assignments submitted"
                tone="highlight"
                className="mt-2"
                size="sm"
              />
              <p className="mt-2 text-xs text-content-subtle">
                <span className="tabular">3 of 4</span> submitted on time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-line px-5 py-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-highlight-subtle text-highlight-subtle-fg">
              <TrendingUp className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="block font-medium">Latest marks</span>
              <span className="block text-xs text-content-subtle">
                Kinematics · CBSE · recorded last Friday
              </span>
            </span>
            <span className="font-heading tabular text-title-2 font-semibold">
              82<span className="text-content-subtle">/100</span>
            </span>
          </div>
        </PanelFrame>
      </TabsContent>
    </Tabs>
  );
}
