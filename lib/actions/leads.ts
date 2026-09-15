"use server";

import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin/policy";
import { audit } from "@/lib/audit";
import { requireTeacher } from "@/lib/auth";
import { flash } from "@/lib/flash";
import {
  asLeadStatus,
  createLead,
  getLead,
  LEAD_STATUS_LABEL,
  updateLeadNotes,
  updateLeadStatus,
  type LeadRecord,
  type LeadStatus,
} from "@/lib/leads";
import type { Teacher } from "@/lib/schema";
import { leadsPath } from "@/lib/paths";

export type EnquiryState = {
  error?: string;
  ok?: boolean;
};

const CLASSES = new Set(["Class 8", "Class 9", "Class 10"]);
const SUBJECTS = new Set([
  "Mathematics + Physics + Chemistry",
  "Mathematics only",
  "Mathematics + Physics",
  "Mathematics + Chemistry",
]);

function clip(value: string, max: number) {
  return value.slice(0, max).trim();
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

export async function submitEnquiry(
  formData: FormData,
): Promise<EnquiryState> {
  const parentName = clip(String(formData.get("parent") ?? ""), 80);
  const studentName = clip(String(formData.get("student") ?? ""), 80);
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const className = clip(String(formData.get("cls") ?? ""), 20);
  const subjects = clip(String(formData.get("subjects") ?? ""), 80);
  const message = clip(String(formData.get("message") ?? ""), 1000);

  if (parentName.length < 2) {
    return { error: "Please enter the parent's name." };
  }
  if (studentName.length < 2) {
    return { error: "Please enter the student's name." };
  }
  if (!/^[+]?\d{8,15}$/.test(phone)) {
    return { error: "Please enter a valid phone number." };
  }
  if (!CLASSES.has(className)) {
    return { error: "Please select a class." };
  }
  if (subjects && !SUBJECTS.has(subjects)) {
    return { error: "Please choose a subject option." };
  }

  try {
    await createLead({
      parentName,
      studentName,
      phone,
      className,
      subjects,
      message,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return { error: `Could not save the enquiry. ${detail}` };
  }

  return { ok: true };
}

/** Teachers work only the leads an admin assigned to them; admins work any lead. */
function canWorkLead(teacher: Teacher, lead: LeadRecord | null): lead is LeadRecord {
  return Boolean(lead && (lead.assignedTeacherId === teacher.id || isAdmin(teacher)));
}

function revalidateLeads() {
  revalidatePath(leadsPath());
  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin", "layout");
}

export async function setLeadStatus(formData: FormData) {
  const teacher = await requireTeacher();
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !["new", "contacted", "enrolled"].includes(status)) {
    return;
  }

  const previous = await getLead(id);
  if (!canWorkLead(teacher, previous)) return;

  const next = await updateLeadStatus(id, asLeadStatus(status));
  await audit({
    actor: { id: teacher.id, role: isAdmin(teacher) ? "admin" : "teacher", name: teacher.name },
    action: "lead.status",
    entityType: "lead",
    entityId: id,
    summary: `${teacher.name} marked ${next.studentName}'s enquiry as ${LEAD_STATUS_LABEL[next.status].toLowerCase()}`,
  });
  revalidateLeads();
  await flash(`${next.studentName} marked as ${LEAD_STATUS_LABEL[next.status].toLowerCase()}`, {
    undo: { kind: "lead-status", id, status: previous.status },
  });
}

export async function undoLeadStatus(id: string, status: LeadStatus) {
  const teacher = await requireTeacher();
  if (!canWorkLead(teacher, await getLead(id))) return;
  await updateLeadStatus(id, asLeadStatus(status));
  revalidateLeads();
}

export async function saveLeadNotes(formData: FormData) {
  const teacher = await requireTeacher();
  const id = String(formData.get("id") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id || !canWorkLead(teacher, await getLead(id))) return;
  const lead = await updateLeadNotes(id, notes);
  revalidateLeads();
  await flash(`Notes saved for ${lead.studentName}`);
}
