"use client";

import { cn } from "cn";
import { ActionForm } from "@/components/admin/action-form";
import { SELECT_CLASS_NAME, type LookupChoice } from "@/lib/academics";
import {
  convertLeadAction,
  transferTeachingAction,
  updateLeadAction,
} from "@/lib/actions/admin";
import { LEAD_STAGES, LEAD_STAGE_LABELS as LEAD_STATUS_LABELS } from "@/lib/admin/policy";
import type { LeadRecord } from "@/lib/leads";

type Option = { id: string; name: string };

export function LeadTriageForm({ lead, teachers }: { lead: LeadRecord; teachers: Option[] }) {
  return (
    <ActionForm action={updateLeadAction} submitLabel="Save" variant="secondary" className="sm:flex-row sm:items-end">
      <input type="hidden" name="leadId" value={lead.id} />
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Stage
          <select name="status" defaultValue={lead.status} className={cn(SELECT_CLASS_NAME, "h-9 font-normal")}>
            {LEAD_STAGES.map((stage) => (
              <option key={stage} value={stage}>{LEAD_STATUS_LABELS[stage]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Assigned to
          <select name="assignedTeacherId" defaultValue={lead.assignedTeacherId ?? ""} className={cn(SELECT_CLASS_NAME, "h-9 font-normal")}>
            <option value="">Nobody yet</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </select>
        </label>
      </div>
    </ActionForm>
  );
}

export function ConvertLeadForm({
  lead,
  batches,
  syllabuses,
  exams,
}: {
  lead: LeadRecord;
  batches: { id: string; name: string; teacherName: string }[];
  syllabuses: LookupChoice[];
  exams: LookupChoice[];
}) {
  return (
    <ActionForm
      action={convertLeadAction}
      submitLabel={`Enrol ${lead.studentName}`}
      pendingLabel="Creating logins…"
      confirm={`Create a student login for ${lead.studentName} and a parent login for ${lead.parentName}?`}
    >
      <input type="hidden" name="leadId" value={lead.id} />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Batch
          <select name="batchId" required defaultValue="" className={cn(SELECT_CLASS_NAME, "h-9 font-normal")}>
            <option value="" disabled>Choose a batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name} · {batch.teacherName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Syllabus
          <select name="syllabus" required defaultValue="" className={cn(SELECT_CLASS_NAME, "h-9 font-normal")}>
            <option value="" disabled>Choose</option>
            {syllabuses.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Preparing for
          <select name="exam" required defaultValue="" className={cn(SELECT_CLASS_NAME, "h-9 font-normal")}>
            <option value="" disabled>Choose</option>
            {exams.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
    </ActionForm>
  );
}

export function ReassignBatchForm({
  batchId,
  fromTeacherId,
  teachers,
}: {
  batchId: string;
  fromTeacherId: string;
  teachers: Option[];
}) {
  if (teachers.length === 0) return null;
  return (
    <ActionForm
      action={transferTeachingAction}
      submitLabel="Move"
      pendingLabel="Moving…"
      variant="outline"
      size="sm"
      className="gap-2"
      confirm="Move this batch, with its students, material and marks, to the chosen teacher?"
    >
      <input type="hidden" name="fromTeacherId" value={fromTeacherId} />
      <input type="hidden" name="scope" value="selected" />
      <input type="hidden" name="batchIds" value={batchId} />
      <label className="sr-only" htmlFor={`reassign-${batchId}`}>Move to teacher</label>
      <select id={`reassign-${batchId}`} name="toTeacherId" required defaultValue="" className={cn(SELECT_CLASS_NAME, "h-8")}>
        <option value="" disabled>Move to another teacher…</option>
        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
        ))}
      </select>
    </ActionForm>
  );
}
