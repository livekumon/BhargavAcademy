import { cn } from "cn";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { formatEventTime } from "@/lib/admin/format";
import type { AuditEvent } from "@/lib/schema";

const actionTone: Record<string, StatusTone> = {
  auth: "neutral",
  person: "info",
  role: "brand",
  teaching: "warning",
  student: "info",
  parent: "info",
  lead: "highlight",
};

const actionLabel: Record<string, string> = {
  "auth.login": "Sign-in",
  "person.create": "Added",
  "person.update": "Edited",
  "person.reset_password": "Password reset",
  "person.suspend": "Suspended",
  "person.reactivate": "Reactivated",
  "role.grant": "Admin granted",
  "role.revoke": "Admin removed",
  "teaching.transfer": "Transfer",
  "student.enrolments": "Batches",
  "parent.children": "Children",
  "lead.update": "Lead",
  "lead.status": "Lead",
  "lead.convert": "Enrolled",
};

export function ActivityFeed({ events, compact = false }: { events: AuditEvent[]; compact?: boolean }) {
  if (events.length === 0) {
    return (
      <p className="px-5 py-8 text-sm text-content-muted">
        Nothing recorded yet. Changes made in the admin console and sign-ins appear here.
      </p>
    );
  }

  const now = new Date();
  return (
    <ol className={cn("divide-y divide-line", compact ? "px-5" : "")}>
      {events.map((event) => {
        const family = event.action.split(".")[0] ?? "";
        return (
          <li
            key={event.id}
            className={cn(
              "grid grid-cols-[3.25rem_minmax(0,1fr)] items-baseline gap-3 text-sm",
              compact ? "py-2.5" : "px-5 py-3 sm:grid-cols-[4.5rem_7.5rem_minmax(0,1fr)]",
            )}
          >
            <time dateTime={event.createdAt.toISOString()} className="tabular font-mono text-xs text-content-subtle">
              {formatEventTime(event.createdAt, now)}
            </time>
            {compact ? null : (
              <span className="hidden sm:block">
                <StatusPill tone={actionTone[family] ?? "neutral"} size="sm">
                  {actionLabel[event.action] ?? event.action}
                </StatusPill>
              </span>
            )}
            <span className="text-pretty text-content">{event.summary}</span>
          </li>
        );
      })}
    </ol>
  );
}
