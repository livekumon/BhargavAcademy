"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth";
import { flash } from "@/lib/flash";
import {
  asLeadStatus,
  createLead,
  LEAD_STATUS_LABEL,
  listLeads,
  updateLeadNotes,
  updateLeadStatus,
  type LeadStatus,
} from "@/lib/leads";
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

export async function setLeadStatus(formData: FormData) {
  await requireTeacher();
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !["new", "contacted", "enrolled"].includes(status)) {
    return;
  }
  const previous = (await listLeads()).find((lead) => lead.id === id);
  const next = await updateLeadStatus(id, asLeadStatus(status));
  revalidatePath(leadsPath());
  revalidatePath("/dashboard", "layout");
  await flash(`${next.studentName} marked as ${LEAD_STATUS_LABEL[next.status].toLowerCase()}`, {
    undo: previous ? { kind: "lead-status", id, status: previous.status } : undefined,
  });
}

export async function undoLeadStatus(id: string, status: LeadStatus) {
  await requireTeacher();
  await updateLeadStatus(id, asLeadStatus(status));
  revalidatePath(leadsPath());
  revalidatePath("/dashboard", "layout");
}

export async function saveLeadNotes(formData: FormData) {
  await requireTeacher();
  const id = String(formData.get("id") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id) return;
  const lead = await updateLeadNotes(id, notes);
  revalidatePath(leadsPath());
  revalidatePath("/dashboard", "layout");
  await flash(`Notes saved for ${lead.studentName}`);
}
