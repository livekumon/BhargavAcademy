"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { GraduationCap, HeartHandshake, LoaderCircle, Presentation } from "lucide-react";
import { cn } from "cn";
import { AccessChoice } from "@/components/admin/access-choice";
import { FormMessage } from "@/components/admin/action-form";
import { CheckboxPicker, type PickerOption } from "@/components/admin/checkbox-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Surface } from "@/components/ui/surface";
import { SELECT_CLASS_NAME, type LookupChoice } from "@/lib/academics";
import { createPersonAction } from "@/lib/actions/admin";
import { ACADEMY_EMAIL_DOMAIN, academyEmailLocalPart } from "@/lib/identity";

type Role = "teacher" | "student" | "parent";

const roles: { value: Role; label: string; icon: typeof Presentation; hint: string }[] = [
  { value: "teacher", label: "Teacher", icon: Presentation, hint: "Runs batches and uploads material" },
  { value: "student", label: "Student", icon: GraduationCap, hint: "Joins one or more batches" },
  { value: "parent", label: "Parent", icon: HeartHandshake, hint: "Follows their children's progress" },
];

export function AddPersonForm({
  defaultRole,
  batches,
  students,
  syllabuses,
  exams,
}: {
  defaultRole: Role;
  batches: PickerOption[];
  students: PickerOption[];
  syllabuses: LookupChoice[];
  exams: LookupChoice[];
}) {
  const [state, formAction, pending] = useActionState(createPersonAction, {});
  const [role, setRole] = useState<Role>(defaultRole);
  // Controlled, so React's reset after a failed submit doesn't wipe the form.
  const [fields, setFields] = useState({ name: "", email: "", phone: "", password: "", syllabus: "", exam: "" });
  const bind = (key: keyof typeof fields) => ({
    name: key,
    value: fields[key],
    onChange: (event: { target: { value: string } }) =>
      setFields((current) => ({ ...current, [key]: event.target.value })),
  });
  const name = fields.name;
  const emailPreview = `${academyEmailLocalPart(name || role)}@${ACADEMY_EMAIL_DOMAIN}`;

  return (
    <form action={formAction} aria-busy={pending} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-heading text-title-3 font-semibold">1. Who is this?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {roles.map((option) => (
            <label
              key={option.value}
              data-role={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl p-4 ring-1 transition-[box-shadow,background-color] duration-(--dur-fast) has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                role === option.value ? "bg-brand-subtle ring-brand" : "bg-surface ring-line hover:ring-line-strong",
              )}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="sr-only"
              />
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-brand ring-1 ring-brand-line">
                <option.icon aria-hidden="true" className="size-4" />
              </span>
              <span>
                <span className="block font-medium">{option.label}</span>
                <span className="block text-xs text-content-muted">{option.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Surface className="flex flex-col gap-5">
        <h2 className="font-heading text-title-3 font-semibold">2. Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="person-name">Full name</Label>
            <Input
              id="person-name"
              {...bind("name")}
              placeholder={role === "parent" ? "Priya Sharma" : role === "student" ? "Ananya Sharma" : "Sneha Latha"}
              autoComplete="off"
              minLength={2}
              required
              className="h-9"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="person-email">Login email</Label>
            <Input
              id="person-email"
              {...bind("email")}
              type="email"
              placeholder={emailPreview}
              autoComplete="off"
              aria-describedby="person-email-hint"
              className="h-9 font-mono text-sm"
            />
            <p id="person-email-hint" className="text-xs text-content-subtle">
              Leave blank to use {emailPreview} (a number is added if it’s taken).
            </p>
          </div>
          {role === "student" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="person-phone">Contact number</Label>
              <Input id="person-phone" {...bind("phone")} type="tel" inputMode="tel" placeholder="9876543210" required className="h-9" />
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="person-password">Starting password</Label>
            <Input
              id="person-password"
              {...bind("password")}
              type="text"
              placeholder="123456"
              autoComplete="off"
              aria-describedby="person-password-hint"
              className="h-9"
            />
            <p id="person-password-hint" className="text-xs text-content-subtle">
              Blank uses 123456. They must choose their own at first sign-in.
            </p>
          </div>
        </div>

        {role === "student" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="person-syllabus">Syllabus</Label>
              <select id="person-syllabus" {...bind("syllabus")} required className={cn(SELECT_CLASS_NAME, "h-9")}>
                <option value="" disabled>Choose a syllabus</option>
                {syllabuses.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="person-exam">Preparing for</Label>
              <select id="person-exam" {...bind("exam")} required className={cn(SELECT_CLASS_NAME, "h-9")}>
                <option value="" disabled>Choose an exam</option>
                {exams.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <CheckboxPicker
                name="batchIds"
                legend="Batches"
                options={batches}
                searchPlaceholder="Search batches or teachers"
                emptyText="Create a batch from a teacher's workspace first."
              />
            </div>
          </div>
        ) : null}

        {role === "parent" ? (
          <CheckboxPicker
            name="studentIds"
            legend="Children"
            options={students}
            searchPlaceholder="Search students"
            emptyText="Add the student first, then link their parent."
          />
        ) : null}
      </Surface>

      {role === "teacher" ? (
        <Surface className="flex flex-col gap-4">
          <h2 className="font-heading text-title-3 font-semibold">3. Access</h2>
          <AccessChoice />
        </Surface>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : null}
          {pending ? "Creating…" : `Create ${role} login`}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/admin/people">Cancel</Link>
        </Button>
      </div>
      <FormMessage state={pending ? {} : state} />
    </form>
  );
}
