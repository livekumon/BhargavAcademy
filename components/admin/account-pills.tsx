import { ShieldCheck } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/admin/format";
import { STUDENT_FLAG_LABELS, type StudentFlag } from "@/lib/admin/signals";

/** Account state in the shared status vocabulary: suspended beats not-signed-in. */
export function AccountStatusPill({
  status,
  mustChangePassword,
}: {
  status: string;
  mustChangePassword: boolean;
}) {
  if (status !== "active") {
    return (
      <StatusPill tone="danger" dot>
        Suspended
      </StatusPill>
    );
  }
  if (mustChangePassword) {
    return (
      <StatusPill tone="warning" dot>
        Not signed in yet
      </StatusPill>
    );
  }
  return (
    <StatusPill tone="success" dot>
      Active
    </StatusPill>
  );
}

export function AdminPill({ isOwner, until }: { isOwner?: boolean; until?: Date | null }) {
  return (
    <StatusPill tone="brand" size="sm">
      <ShieldCheck />
      {isOwner ? "Owner" : until ? `Admin until ${formatDate(until)}` : "Admin"}
    </StatusPill>
  );
}

const flagTone: Record<StudentFlag, "danger" | "warning" | "info"> = {
  falling: "danger",
  behind: "warning",
  no_parent: "info",
};

export function StudentFlagPills({ flags }: { flags: StudentFlag[] }) {
  if (flags.length === 0) return null;
  return (
    <>
      {flags.map((flag) => (
        <StatusPill key={flag} tone={flagTone[flag]} size="sm">
          {STUDENT_FLAG_LABELS[flag]}
        </StatusPill>
      ))}
    </>
  );
}
