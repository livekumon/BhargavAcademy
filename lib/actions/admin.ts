"use server";

import { redirect } from "next/navigation";
import { isPersonRole, parseExpiry } from "@/lib/admin/policy";
import {
  convertLead,
  createPerson,
  grantAdmin,
  resetPassword,
  revokeAdmin,
  setAccountStatus,
  setParentChildren,
  setStudentBatches,
  transferTeaching,
  updateLeadAsAdmin,
  updatePerson,
  type ServiceResult,
} from "@/lib/admin/service";
import { requireAdmin } from "@/lib/auth";

/*
 * Thin form adapters over lib/admin/service. Each one re-establishes the admin
 * from the session cookie — a server action is a public endpoint, so the page
 * that rendered the form proves nothing.
 */

export type AdminFormState = {
  error?: string;
  message?: string;
};

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function toState(result: ServiceResult<unknown>): AdminFormState {
  return result.ok ? { message: result.message } : { error: result.error };
}

export async function createPersonAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireAdmin();
  const role = field(formData, "role");
  const access = field(formData, "access");

  let admin: { expiresAt: Date | null } | null = null;
  if (role === "teacher" && (access === "permanent" || access === "until")) {
    const parsed = parseExpiry(access === "until" ? field(formData, "until") : "");
    if ("error" in parsed) return { error: parsed.error };
    if (access === "until" && !parsed.expiresAt) {
      return { error: "Choose the date admin access should end." };
    }
    admin = { expiresAt: parsed.expiresAt };
  }

  const result = await createPerson(actor, {
    role,
    name: field(formData, "name"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    password: field(formData, "password"),
    batchIds: formData.getAll("batchIds"),
    syllabus: field(formData, "syllabus"),
    exam: field(formData, "exam"),
    studentIds: formData.getAll("studentIds"),
    admin,
  });

  if (!result.ok) return { error: result.error };
  redirect(`${result.data.href}?notice=created`);
}

export async function updatePersonAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireAdmin();
  const role = field(formData, "role");
  const id = field(formData, "id") ?? "";
  if (!isPersonRole(role)) return { error: "Unknown account type." };

  return toState(
    await updatePerson(actor, role, id, {
      name: field(formData, "name"),
      email: field(formData, "email"),
      phone: role === "student" ? field(formData, "phone") : undefined,
      syllabus: role === "student" ? field(formData, "syllabus") : undefined,
      exam: role === "student" ? field(formData, "exam") : undefined,
    }),
  );
}

export async function resetPasswordAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireAdmin();
  const role = field(formData, "role");
  if (!isPersonRole(role)) return { error: "Unknown account type." };
  return toState(await resetPassword(actor, role, field(formData, "id") ?? ""));
}

export async function setStatusAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireAdmin();
  const role = field(formData, "role");
  const status = field(formData, "status");
  if (!isPersonRole(role)) return { error: "Unknown account type." };
  if (status !== "active" && status !== "suspended") return { error: "Unknown status." };
  return toState(await setAccountStatus(actor, role, field(formData, "id") ?? "", status));
}

export async function adminAccessAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireAdmin();
  const teacherId = field(formData, "teacherId") ?? "";
  const access = field(formData, "access");

  if (access === "teacher") {
    return toState(await revokeAdmin(actor, teacherId));
  }
  if (access !== "permanent" && access !== "until") {
    return { error: "Choose the access this teacher should have." };
  }

  const parsed = parseExpiry(access === "until" ? field(formData, "until") : "");
  if ("error" in parsed) return { error: parsed.error };
  if (access === "until" && !parsed.expiresAt) {
    return { error: "Choose the date admin access should end." };
  }
  return toState(await grantAdmin(actor, teacherId, parsed.expiresAt));
}

export async function transferTeachingAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireAdmin();
  const scope = field(formData, "scope");
  return toState(
    await transferTeaching(actor, field(formData, "fromTeacherId") ?? "", {
      toTeacherId: field(formData, "toTeacherId"),
      batchIds: scope === "selected" ? formData.getAll("batchIds") : undefined,
    }),
  );
}

export async function setStudentBatchesAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireAdmin();
  return toState(
    await setStudentBatches(actor, field(formData, "studentId") ?? "", formData.getAll("batchIds")),
  );
}

export async function setParentChildrenAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireAdmin();
  return toState(
    await setParentChildren(actor, field(formData, "parentId") ?? "", formData.getAll("studentIds")),
  );
}

export async function updateLeadAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireAdmin();
  return toState(
    await updateLeadAsAdmin(actor, field(formData, "leadId") ?? "", {
      status: field(formData, "status"),
      assignedTeacherId: field(formData, "assignedTeacherId"),
    }),
  );
}

export async function convertLeadAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireAdmin();
  const result = await convertLead(actor, field(formData, "leadId") ?? "", {
    batchId: field(formData, "batchId"),
    syllabus: field(formData, "syllabus"),
    exam: field(formData, "exam"),
  });
  if (!result.ok) return { error: result.error };
  redirect(`/admin/students/${result.data.studentId}?notice=enrolled`);
}
