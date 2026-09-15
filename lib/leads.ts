import { desc, eq } from "drizzle-orm";
import { LEAD_STAGE_LABELS, isLeadStage, type LeadStage } from "./admin/policy";
import { db, ensureDatabase } from "./db";
import {
  isGcsConfigured,
  listLeadJsonFromGcs,
  saveLeadJsonToGcs,
} from "./gcs";
import { leads, type Lead } from "./schema";

export type LeadStatus = LeadStage;

export const LEAD_STATUS_LABELS = LEAD_STAGE_LABELS;

export type LeadRecord = {
  id: string;
  parentName: string;
  studentName: string;
  phone: string;
  className: string;
  subjects: string;
  message: string;
  status: LeadStatus;
  assignedTeacherId: string | null;
  contactedAt: string | null;
  createdAt: string;
};

type LeadInput = {
  parentName: string;
  studentName: string;
  phone: string;
  className: string;
  subjects: string;
  message: string;
};

function toIso(value: Date | number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toRecord(lead: Lead): LeadRecord {
  return {
    id: lead.id,
    parentName: lead.parentName,
    studentName: lead.studentName,
    phone: lead.phone,
    className: lead.className,
    subjects: lead.subjects,
    message: lead.message,
    status: isLeadStage(lead.status) ? lead.status : "new",
    assignedTeacherId: lead.assignedTeacherId ?? null,
    contactedAt: toIso(lead.contactedAt),
    createdAt: toIso(lead.createdAt) ?? new Date().toISOString(),
  };
}

function parseStoredLead(value: unknown): LeadRecord | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<LeadRecord>;
  if (
    typeof row.id !== "string" ||
    typeof row.parentName !== "string" ||
    typeof row.studentName !== "string" ||
    typeof row.phone !== "string" ||
    typeof row.className !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    parentName: row.parentName,
    studentName: row.studentName,
    phone: row.phone,
    className: row.className,
    subjects: typeof row.subjects === "string" ? row.subjects : "",
    message: typeof row.message === "string" ? row.message : "",
    status: isLeadStage(row.status) ? row.status : "new",
    assignedTeacherId:
      typeof row.assignedTeacherId === "string" ? row.assignedTeacherId : null,
    contactedAt: typeof row.contactedAt === "string" ? row.contactedAt : null,
    createdAt:
      typeof row.createdAt === "string"
        ? row.createdAt
        : new Date().toISOString(),
  };
}

export async function createLead(input: LeadInput): Promise<LeadRecord> {
  await ensureDatabase();
  const record: LeadRecord = {
    id: crypto.randomUUID(),
    parentName: input.parentName,
    studentName: input.studentName,
    phone: input.phone,
    className: input.className,
    subjects: input.subjects,
    message: input.message,
    status: "new",
    assignedTeacherId: null,
    contactedAt: null,
    createdAt: new Date().toISOString(),
  };

  await db.insert(leads).values({
    id: record.id,
    parentName: record.parentName,
    studentName: record.studentName,
    phone: record.phone,
    className: record.className,
    subjects: record.subjects,
    message: record.message,
    status: record.status,
    assignedTeacherId: null,
    contactedAt: null,
    createdAt: new Date(record.createdAt),
  });

  if (isGcsConfigured()) {
    await saveLeadJsonToGcs(record.id, record);
  }

  return record;
}

/** Every lead, newest first. Admin-only callers. */
export async function listLeads(): Promise<LeadRecord[]> {
  if (isGcsConfigured()) {
    const stored = await listLeadJsonFromGcs<unknown>();
    return stored
      .map(parseStoredLead)
      .filter((lead): lead is LeadRecord => Boolean(lead))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  await ensureDatabase();
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
  return rows.map(toRecord);
}

/** The leads an admin has handed to one teacher. */
export async function listLeadsForTeacher(teacherId: string) {
  const all = await listLeads();
  return all.filter((lead) => lead.assignedTeacherId === teacherId);
}

export async function getLead(id: string) {
  await ensureDatabase();
  const [existing] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (existing) return toRecord(existing);
  if (!isGcsConfigured()) return null;
  const stored = await listLeads();
  return stored.find((lead) => lead.id === id) ?? null;
}

export type LeadPatch = {
  status?: LeadStatus;
  assignedTeacherId?: string | null;
};

export async function updateLead(id: string, patch: LeadPatch) {
  const record = await getLead(id);
  if (!record) {
    throw new Error("Lead not found.");
  }

  const next: LeadRecord = { ...record };
  if (patch.status) {
    next.status = patch.status;
    // The first move out of "new" is when the parent was first called back.
    if (patch.status !== "new" && !next.contactedAt) {
      next.contactedAt = new Date().toISOString();
    }
  }
  if (patch.assignedTeacherId !== undefined) {
    next.assignedTeacherId = patch.assignedTeacherId;
  }

  const [existing] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, id)).limit(1);
  const values = {
    status: next.status,
    assignedTeacherId: next.assignedTeacherId,
    contactedAt: next.contactedAt ? new Date(next.contactedAt) : null,
  };
  if (existing) {
    await db.update(leads).set(values).where(eq(leads.id, id));
  } else {
    // Stored only in GCS (the local database was reset); keep both in step.
    await db.insert(leads).values({
      ...values,
      id: next.id,
      parentName: next.parentName,
      studentName: next.studentName,
      phone: next.phone,
      className: next.className,
      subjects: next.subjects,
      message: next.message,
      createdAt: new Date(next.createdAt),
    });
  }

  if (isGcsConfigured()) {
    await saveLeadJsonToGcs(id, next);
  }

  return next;
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  return updateLead(id, { status });
}
