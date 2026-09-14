import { desc, eq } from "drizzle-orm";
import { db, ensureDatabase } from "./db";
import {
  isGcsConfigured,
  listLeadJsonFromGcs,
  saveLeadJsonToGcs,
} from "./gcs";
import { leads, type Lead } from "./schema";

export type LeadStatus = "new" | "contacted" | "enrolled";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  enrolled: "Enrolled",
};

export function asLeadStatus(value: unknown): LeadStatus {
  return value === "contacted" || value === "enrolled" ? value : "new";
}

export type LeadRecord = {
  id: string;
  parentName: string;
  studentName: string;
  phone: string;
  className: string;
  subjects: string;
  message: string;
  status: LeadStatus;
  notes: string;
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

function toRecord(lead: Lead): LeadRecord {
  return {
    id: lead.id,
    parentName: lead.parentName,
    studentName: lead.studentName,
    phone: lead.phone,
    className: lead.className,
    subjects: lead.subjects,
    message: lead.message,
    status: asLeadStatus(lead.status),
    notes: lead.notes ?? "",
    createdAt:
      lead.createdAt instanceof Date
        ? lead.createdAt.toISOString()
        : new Date(lead.createdAt).toISOString(),
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
    status: asLeadStatus(row.status),
    notes: typeof row.notes === "string" ? row.notes : "",
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
    notes: "",
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
    createdAt: new Date(record.createdAt),
  });

  if (isGcsConfigured()) {
    await saveLeadJsonToGcs(record.id, record);
  }

  return record;
}

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

async function findLead(id: string) {
  await ensureDatabase();
  const [existing] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  let record: LeadRecord | null = existing ? toRecord(existing) : null;
  if (!record && isGcsConfigured()) {
    const stored = await listLeads();
    record = stored.find((lead) => lead.id === id) ?? null;
  }
  if (!record) {
    throw new Error("Lead not found.");
  }
  return record;
}

/** Updates the local row and, when configured, the durable copy in Cloud Storage. */
async function saveLead(next: LeadRecord) {
  await db.update(leads).set({ status: next.status, notes: next.notes }).where(eq(leads.id, next.id));
  if (isGcsConfigured()) {
    await saveLeadJsonToGcs(next.id, next);
  }
  return next;
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const record = await findLead(id);
  return saveLead({ ...record, status });
}

export async function updateLeadNotes(id: string, notes: string) {
  const record = await findLead(id);
  return saveLead({ ...record, notes: notes.slice(0, 2000) });
}
