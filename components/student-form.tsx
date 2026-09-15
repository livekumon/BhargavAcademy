"use client";

import { useActionState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type LookupChoice } from "@/lib/academics";
import { type StudentState } from "@/lib/actions/students";

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-raised px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-4 border-t border-line pt-5 first:border-t-0 first:pt-0 sm:grid-cols-2">
      <legend className="sr-only">{title}</legend>
      <div className="sm:col-span-2">
        <p className="text-sm font-semibold">{title}</p>
        {hint ? <p className="mt-0.5 text-xs text-content-muted text-pretty">{hint}</p> : null}
      </div>
      {children}
    </fieldset>
  );
}

function Field({
  id,
  label,
  hint,
  wide = false,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-content-subtle text-pretty">{hint}</p> : null}
    </div>
  );
}

export function StudentForm({
  action,
  defaultValues,
  prefill,
  leadId,
  submitLabel,
  cancelHref,
  syllabuses,
  exams,
  batches,
  defaultBatchId,
  next,
}: {
  action: (state: StudentState, formData: FormData) => Promise<StudentState>;
  syllabuses: LookupChoice[];
  exams: LookupChoice[];
  batches?: { id: string; name: string }[];
  defaultBatchId?: string;
  next?: string;
  /** Existing student being edited. */
  defaultValues?: {
    name: string;
    contactNumber: string;
    email: string;
    parentName?: string;
    parentEmail?: string;
    syllabus?: string;
    exam?: string;
  };
  /** Suggested values for a new student, e.g. from a website lead. */
  prefill?: { name?: string; contactNumber?: string; parentName?: string };
  /** When set, the lead is marked enrolled once this student is created. */
  leadId?: string;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const isEdit = Boolean(defaultValues);
  const initial: {
    name?: string;
    contactNumber?: string;
    email?: string;
    parentName?: string;
    parentEmail?: string;
    syllabus?: string;
    exam?: string;
  } = { ...prefill, ...defaultValues };

  return (
    <form action={formAction} className="space-y-6">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {leadId ? <input type="hidden" name="leadId" value={leadId} /> : null}

      <Section title="Student">
        <Field id="name" label="Full name">
          <Input id="name" name="name" defaultValue={initial.name} placeholder="Ananya Sharma" required autoComplete="off" className="h-10" />
        </Field>
        <Field id="contactNumber" label="Contact number">
          <Input
            id="contactNumber"
            name="contactNumber"
            type="tel"
            inputMode="tel"
            defaultValue={initial.contactNumber}
            placeholder="9876543210"
            required
            className="h-10"
          />
        </Field>
        {batches && batches.length > 0 ? (
          <Field id="batchId" label="First batch" hint="You can enroll them in more batches from their profile.">
            <select id="batchId" name="batchId" required className={selectClass} defaultValue={defaultBatchId ?? ""}>
              <option value="" disabled>
                Choose a batch
              </option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </Section>

      <Section title="Academics">
        <Field id="syllabus" label="Syllabus">
          <select id="syllabus" name="syllabus" required className={selectClass} defaultValue={initial.syllabus ?? ""}>
            <option value="" disabled>
              Choose a syllabus
            </option>
            {syllabuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="exam" label="Preparing for">
          <select id="exam" name="exam" required className={selectClass} defaultValue={initial.exam ?? ""}>
            <option value="" disabled>
              Choose an exam
            </option>
            {exams.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section
        title="Student login"
        hint={isEdit ? undefined : "Leave both blank and we create an @bhargavacademy.com email and the default password 123456. They choose a new password on first sign-in."}
      >
        <Field
          id="email"
          label="Login email"
          hint={isEdit ? undefined : "If this email already belongs to one of your students, they're enrolled in the batch instead."}
        >
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={initial.email}
            placeholder="ananyas@bhargavacademy.com"
            required={isEdit}
            autoComplete="off"
            className="h-10"
          />
        </Field>
        <Field id="password" label={isEdit ? "Reset password" : "Password"}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={isEdit ? "Leave blank to keep it" : "Leave blank for 123456"}
            className="h-10"
          />
        </Field>
      </Section>

      <Section
        title="Parent login"
        hint="Use the same parent email on siblings so one login shows every child. Leave it blank to generate one from the parent's name."
      >
        <Field id="parentName" label="Parent name">
          <Input id="parentName" name="parentName" defaultValue={initial.parentName} placeholder="Priya Sharma" autoComplete="off" className="h-10" />
        </Field>
        <Field id="parentEmail" label="Parent login email">
          <Input
            id="parentEmail"
            name="parentEmail"
            type="email"
            defaultValue={initial.parentEmail}
            placeholder="priyas@bhargavacademy.com"
            autoComplete="off"
            className="h-10"
          />
        </Field>
        <Field id="parentPassword" label={isEdit ? "Reset parent password" : "Parent password"}>
          <Input
            id="parentPassword"
            name="parentPassword"
            type="password"
            autoComplete="new-password"
            placeholder={isEdit ? "Leave blank to keep it" : "Leave blank for 123456"}
            className="h-10"
          />
        </Field>
      </Section>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-fg">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-line pt-5">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
