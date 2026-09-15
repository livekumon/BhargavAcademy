/*
 * Pure rules for who may do what in the admin console. Nothing here touches
 * the database or Next.js, so every rule can be unit-tested directly
 * (see policy.test.ts) and reused by pages, server actions, and API routes.
 */

export const OWNER_EMAIL = "bhargav@bhargavacademy.com";

export type PersonRole = "teacher" | "student" | "parent";
export type AccountStatus = "active" | "suspended";
export type LeadStage = "new" | "contacted" | "demo" | "enrolled" | "closed";

export const PERSON_ROLES: readonly PersonRole[] = ["teacher", "student", "parent"];
export const LEAD_STAGES: readonly LeadStage[] = ["new", "contacted", "demo", "enrolled", "closed"];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  demo: "Demo class",
  enrolled: "Enrolled",
  closed: "Closed",
};

export type RoleHolder = {
  id: string;
  email: string;
  role: string;
  roleExpiresAt: Date | null;
  status: string;
};

export function isPersonRole(value: unknown): value is PersonRole {
  return typeof value === "string" && (PERSON_ROLES as readonly string[]).includes(value);
}

export function isLeadStage(value: unknown): value is LeadStage {
  return typeof value === "string" && (LEAD_STAGES as readonly string[]).includes(value);
}

export function isOwner(teacher: Pick<RoleHolder, "email">) {
  return teacher.email.toLowerCase() === OWNER_EMAIL;
}

export function isActive(account: Pick<RoleHolder, "status">) {
  return account.status === "active";
}

/** An admin grant with a past expiry date quietly counts as a teacher again. */
export function effectiveRole(
  teacher: Pick<RoleHolder, "email" | "role" | "roleExpiresAt" | "status">,
  now: Date = new Date(),
): "admin" | "teacher" {
  if (isOwner(teacher)) return "admin";
  if (!isActive(teacher) || teacher.role !== "admin") return "teacher";
  if (teacher.roleExpiresAt && teacher.roleExpiresAt.getTime() <= now.getTime()) {
    return "teacher";
  }
  return "admin";
}

export function isAdmin(
  teacher: Pick<RoleHolder, "email" | "role" | "roleExpiresAt" | "status">,
  now: Date = new Date(),
) {
  return effectiveRole(teacher, now) === "admin";
}

export type Decision = { ok: true } | { ok: false; reason: string };

const allow: Decision = { ok: true };
const deny = (reason: string): Decision => ({ ok: false, reason });

/**
 * Grant or change admin access. The owner's access is fixed, and an expiry
 * must be in the future so a grant is never born already lapsed.
 */
export function canGrantAdmin(
  actor: RoleHolder,
  target: RoleHolder,
  expiresAt: Date | null,
  now: Date = new Date(),
): Decision {
  if (!isAdmin(actor, now)) return deny("Only admins can change admin access.");
  if (isOwner(target)) return deny("The academy owner is always an admin.");
  if (!isActive(target)) return deny("Reactivate this teacher before making them an admin.");
  if (expiresAt && expiresAt.getTime() <= now.getTime()) {
    return deny("Choose an end date in the future, or make the access permanent.");
  }
  return allow;
}

/** Revoke admin access. There must always be at least one admin left. */
export function canRevokeAdmin(
  actor: RoleHolder,
  target: RoleHolder,
  activeAdminCount: number,
  now: Date = new Date(),
): Decision {
  if (!isAdmin(actor, now)) return deny("Only admins can change admin access.");
  if (isOwner(target)) return deny("The academy owner is always an admin.");
  if (!isAdmin(target, now)) return deny("This teacher is not an admin.");
  if (activeAdminCount <= 1) return deny("The academy needs at least one admin.");
  return allow;
}

/** Suspend a teacher, student, or parent. Admins cannot lock themselves out. */
export function canSuspend(
  actor: RoleHolder,
  target: { id: string; email: string; status: string },
  now: Date = new Date(),
): Decision {
  if (!isAdmin(actor, now)) return deny("Only admins can suspend accounts.");
  if (target.id === actor.id) return deny("You cannot suspend your own account.");
  if (target.email.toLowerCase() === OWNER_EMAIL) return deny("The academy owner cannot be suspended.");
  if (target.status === "suspended") return deny("This account is already suspended.");
  return allow;
}

/** Editing the owner's name or email is reserved for the owner. */
export function canEditTeacher(actor: RoleHolder, target: RoleHolder, now: Date = new Date()): Decision {
  if (!isAdmin(actor, now)) return deny("Only admins can edit teachers.");
  if (isOwner(target) && !isOwner(actor)) return deny("Only the owner can edit the owner's account.");
  return allow;
}

export function canTransferTeaching(
  actor: RoleHolder,
  fromTeacherId: string,
  toTeacher: RoleHolder | null,
  now: Date = new Date(),
): Decision {
  if (!isAdmin(actor, now)) return deny("Only admins can move batches between teachers.");
  if (!toTeacher) return deny("Choose the teacher who should take over.");
  if (toTeacher.id === fromTeacherId) return deny("Choose a different teacher to take over.");
  if (!isActive(toTeacher)) return deny("The receiving teacher's account is suspended.");
  return allow;
}

/** Parses an "until" date from a form or JSON body. Empty means permanent. */
export function parseExpiry(value: unknown): { expiresAt: Date | null } | { error: string } {
  if (value === null || value === undefined) return { expiresAt: null };
  const raw = String(value).trim();
  if (!raw) return { expiresAt: null };
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T23:59:59`)
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return { error: "Enter a valid end date." };
  return { expiresAt: date };
}
