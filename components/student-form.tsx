"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SELECT_CLASS_NAME, type LookupChoice } from "@/lib/academics";
import { type StudentState } from "@/lib/actions/students";

export function StudentForm({
  action,
  defaultValues,
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
  defaultValues?: {
    name: string;
    contactNumber: string;
    email: string;
    parentName?: string;
    parentEmail?: string;
    syllabus?: string;
    exam?: string;
  };
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const isEdit = Boolean(defaultValues);

  return (
    <form action={formAction} className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {batches && batches.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="batchId">Batch</Label>
          <select
            id="batchId"
            name="batchId"
            required
            className={SELECT_CLASS_NAME}
            defaultValue={defaultBatchId ?? ""}
          >
            <option value="" disabled>
              Choose a batch
            </option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Student name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultValues?.name}
          placeholder="Ananya Sharma"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactNumber">Contact number</Label>
        <Input
          id="contactNumber"
          name="contactNumber"
          type="tel"
          defaultValue={defaultValues?.contactNumber}
          placeholder="9876543210"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Login email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email}
          placeholder="ananyas@bhargavacademy.com"
          required={isEdit}
        />
        {isEdit ? null : (
          <p className="text-xs text-muted-foreground">
            Leave blank to generate a unique @bhargavacademy.com email from the
            student name. If this email already belongs to one of your students,
            they will be enrolled in this batch.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="syllabus">Syllabus</Label>
        <select
          id="syllabus"
          name="syllabus"
          required
          className={SELECT_CLASS_NAME}
          defaultValue={defaultValues?.syllabus ?? ""}
        >
          <option value="" disabled>
            Choose a syllabus
          </option>
          {syllabuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exam">Exam</Label>
        <select
          id="exam"
          name="exam"
          required
          className={SELECT_CLASS_NAME}
          defaultValue={defaultValues?.exam ?? ""}
        >
          <option value="" disabled>
            Choose an exam
          </option>
          {exams.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentName">Parent name</Label>
        <Input
          id="parentName"
          name="parentName"
          defaultValue={defaultValues?.parentName}
          placeholder="Priya Sharma"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentEmail">Parent login email</Label>
        <Input
          id="parentEmail"
          name="parentEmail"
          type="email"
          defaultValue={defaultValues?.parentEmail}
          placeholder="priyas@bhargavacademy.com"
        />
        <p className="text-xs text-muted-foreground">
          Leave blank to generate a unique @bhargavacademy.com email from the
          parent name. Use the same parent email on more than one student so they
          share one login.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentPassword">
          {isEdit ? "New parent password" : "Parent password"}
        </Label>
        <Input
          id="parentPassword"
          name="parentPassword"
          type="password"
          placeholder={
            isEdit
              ? "Leave blank to keep the current parent password"
              : "Leave blank to use 123456. They must change it on first login."
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{isEdit ? "New password" : "Password"}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={
            isEdit
              ? "Leave blank to keep the current password"
              : "Leave blank to use 123456. They must change it on first login."
          }
          required={false}
        />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : submitLabel}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
