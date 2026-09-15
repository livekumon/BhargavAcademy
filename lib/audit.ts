import { and, desc, eq, like, lt, notLike, type SQL } from "drizzle-orm";
import { db, ensureDatabase } from "./db";
import { auditEvents, type AuditEvent } from "./schema";

export type AuditActor = {
  id: string | null;
  role: "admin" | "teacher" | "student" | "parent" | "system";
  name: string;
};

export type AuditInput = {
  actor: AuditActor;
  /** Dotted verb, e.g. "person.create", "role.grant", "auth.login". */
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

/**
 * Records one thing that happened. Logging must never break the action it
 * describes, so a failed write is reported to the server log and swallowed.
 */
export async function audit(input: AuditInput) {
  try {
    await ensureDatabase();
    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      actorId: input.actor.id,
      actorRole: input.actor.role,
      actorName: input.actor.name,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      summary: input.summary,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Could not write audit event", input.action, error);
  }
}

export type AuditFilters = {
  actorId?: string;
  /** Matches an action or an action family: "role" matches "role.grant". */
  action?: string;
  entityId?: string;
  before?: Date;
  limit?: number;
  /** Sign-ins are frequent and mostly noise in a feed of changes. */
  excludeLogins?: boolean;
};

export async function listAuditEvents(filters: AuditFilters = {}): Promise<{
  events: AuditEvent[];
  nextBefore: string | null;
}> {
  await ensureDatabase();
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
  const conditions: SQL[] = [];
  if (filters.actorId) conditions.push(eq(auditEvents.actorId, filters.actorId));
  if (filters.entityId) conditions.push(eq(auditEvents.entityId, filters.entityId));
  if (filters.action) {
    conditions.push(
      filters.action.includes(".")
        ? eq(auditEvents.action, filters.action)
        : like(auditEvents.action, `${filters.action}.%`),
    );
  }
  if (filters.before) conditions.push(lt(auditEvents.createdAt, filters.before));
  if (filters.excludeLogins) conditions.push(notLike(auditEvents.action, "auth.%"));

  const rows = await db
    .select()
    .from(auditEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditEvents.createdAt))
    .limit(limit + 1);

  const events = rows.slice(0, limit);
  const last = events.at(-1);
  return {
    events,
    nextBefore: rows.length > limit && last ? last.createdAt.toISOString() : null,
  };
}
