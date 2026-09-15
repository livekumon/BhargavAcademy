"use client";

import { useState } from "react";
import { cn } from "cn";
import { AccessChoice, type AccessValue } from "@/components/admin/access-choice";
import { ActionForm } from "@/components/admin/action-form";
import { CheckboxPicker, type PickerOption } from "@/components/admin/checkbox-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SELECT_CLASS_NAME, type LookupChoice } from "@/lib/academics";
import {
  adminAccessAction,
  resetPasswordAction,
  setParentChildrenAction,
  setStatusAction,
  setStudentBatchesAction,
  transferTeachingAction,
  updatePersonAction,
} from "@/lib/actions/admin";

type Role = "teacher" | "student" | "parent";

export function PersonDetailsForm({
  role,
  id,
  defaults,
  syllabuses = [],
  exams = [],
  lockEmail = false,
  disabled = false,
}: {
  role: Role;
  id: string;
  defaults: { name: string; email: string; phone?: string; syllabus?: string; exam?: string };
  syllabuses?: LookupChoice[];
  exams?: LookupChoice[];
  lockEmail?: boolean;
  disabled?: boolean;
}) {
  // Controlled so a rejected save keeps the edits on screen.
  const [values, setValues] = useState({
    name: defaults.name,
    email: defaults.email,
    phone: defaults.phone ?? "",
    syllabus: defaults.syllabus ?? "",
    exam: defaults.exam ?? "",
  });
  const bind = (key: keyof typeof values) => ({
    name: key,
    value: values[key],
    onChange: (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [key]: event.target.value })),
  });

  return (
    <ActionForm action={updatePersonAction} submitLabel="Save details" variant="secondary">
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="id" value={id} />
      <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-name`}>Full name</Label>
          <Input id={`${id}-name`} {...bind("name")} required minLength={2} className="h-9" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-email`}>Login email</Label>
          <Input
            id={`${id}-email`}
            type="email"
            {...bind("email")}
            readOnly={lockEmail}
            aria-describedby={lockEmail ? `${id}-email-hint` : undefined}
            className="h-9 font-mono text-sm"
          />
          {lockEmail ? (
            <p id={`${id}-email-hint`} className="text-xs text-content-subtle">
              The owner’s email identifies the academy owner.
            </p>
          ) : null}
        </div>
        {role === "student" ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-phone`}>Contact number</Label>
              <Input id={`${id}-phone`} type="tel" {...bind("phone")} required className="h-9" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-syllabus`}>Syllabus</Label>
                <select id={`${id}-syllabus`} {...bind("syllabus")} className={cn(SELECT_CLASS_NAME, "h-9")}>
                  {syllabuses.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${id}-exam`}>Exam</Label>
                <select id={`${id}-exam`} {...bind("exam")} className={cn(SELECT_CLASS_NAME, "h-9")}>
                  {exams.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : null}
      </fieldset>
    </ActionForm>
  );
}

export function AccountActions({
  role,
  id,
  name,
  status,
  canReset,
  canChangeStatus,
  lockedReason,
}: {
  role: Role;
  id: string;
  name: string;
  status: string;
  canReset: boolean;
  canChangeStatus: boolean;
  lockedReason?: string;
}) {
  const suspended = status !== "active";
  return (
    <div className="flex flex-col gap-4">
      {canReset ? (
        <ActionForm
          action={resetPasswordAction}
          submitLabel="Reset password to 123456"
          pendingLabel="Resetting…"
          variant="outline"
          confirm={`Reset ${name}'s password? They will sign in with 123456 and must choose a new password.`}
        >
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="id" value={id} />
        </ActionForm>
      ) : null}
      {canChangeStatus ? (
        <ActionForm
          action={setStatusAction}
          submitLabel={suspended ? "Reactivate account" : "Suspend account"}
          pendingLabel={suspended ? "Reactivating…" : "Suspending…"}
          variant={suspended ? "secondary" : "destructive"}
          confirm={
            suspended
              ? undefined
              : `Suspend ${name}? They are signed out on their next click and cannot sign in until reactivated. Nothing is deleted.`
          }
        >
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={suspended ? "active" : "suspended"} />
        </ActionForm>
      ) : null}
      {lockedReason ? <p className="text-sm text-content-muted text-pretty">{lockedReason}</p> : null}
    </div>
  );
}

export function AdminAccessForm({
  teacherId,
  current,
  until,
}: {
  teacherId: string;
  current: AccessValue;
  until: string;
}) {
  return (
    <ActionForm action={adminAccessAction} submitLabel="Save access">
      <input type="hidden" name="teacherId" value={teacherId} />
      <AccessChoice defaultValue={current} defaultUntil={until} />
    </ActionForm>
  );
}

export function TransferTeachingForm({
  fromTeacherId,
  fromName,
  batches,
  teachers,
}: {
  fromTeacherId: string;
  fromName: string;
  batches: PickerOption[];
  teachers: { id: string; name: string }[];
}) {
  const [scope, setScope] = useState<"all" | "selected">("all");

  if (batches.length === 0) {
    return <p className="text-sm text-content-muted">{fromName} has no batches to move.</p>;
  }

  return (
    <ActionForm
      action={transferTeachingAction}
      submitLabel="Move teaching"
      pendingLabel="Moving…"
      confirm={`Move ${scope === "all" ? `all of ${fromName}'s batches, courses and assigned leads` : "the selected batches"} to another teacher? Students, marks and material move with them.`}
    >
      <input type="hidden" name="fromTeacherId" value={fromTeacherId} />
      <div className="flex flex-col gap-1.5 sm:max-w-sm">
        <Label htmlFor={`${fromTeacherId}-to`}>New teacher</Label>
        <select id={`${fromTeacherId}-to`} name="toTeacherId" required defaultValue="" className={cn(SELECT_CLASS_NAME, "h-9")}>
          <option value="" disabled>Choose a teacher</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
          ))}
        </select>
      </div>
      <fieldset className="flex flex-wrap gap-4 text-sm">
        <legend className="sr-only">What to move</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="scope" value="all" checked={scope === "all"} onChange={() => setScope("all")} className="size-4 accent-primary" />
          Everything — batches, course library and leads
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="scope" value="selected" checked={scope === "selected"} onChange={() => setScope("selected")} className="size-4 accent-primary" />
          Only some batches
        </label>
      </fieldset>
      {scope === "selected" ? <CheckboxPicker name="batchIds" legend="Batches to move" options={batches} /> : null}
    </ActionForm>
  );
}

export function StudentBatchesForm({
  studentId,
  batches,
  selected,
}: {
  studentId: string;
  batches: PickerOption[];
  selected: string[];
}) {
  return (
    <ActionForm
      action={setStudentBatchesAction}
      submitLabel="Save batches"
      variant="secondary"
      confirm="Removing a batch also removes the student's assignments and submissions for it. Continue?"
    >
      <input type="hidden" name="studentId" value={studentId} />
      <CheckboxPicker name="batchIds" legend="Enrolled in" options={batches} defaultSelected={selected} searchPlaceholder="Search batches or teachers" />
    </ActionForm>
  );
}

export function ParentChildrenForm({
  parentId,
  students,
  selected,
}: {
  parentId: string;
  students: PickerOption[];
  selected: string[];
}) {
  return (
    <ActionForm action={setParentChildrenAction} submitLabel="Save children" variant="secondary">
      <input type="hidden" name="parentId" value={parentId} />
      <CheckboxPicker name="studentIds" legend="Children" options={students} defaultSelected={selected} searchPlaceholder="Search students" />
    </ActionForm>
  );
}
