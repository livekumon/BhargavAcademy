import type { NextRequest } from "next/server";
import { jsonError, withAdmin } from "@/lib/admin/api";
import { listPeople, parsePeopleFilter } from "@/lib/admin/queries";
import { STUDENT_FLAG_LABELS } from "@/lib/admin/signals";
import { audit } from "@/lib/audit";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
  // Quote everything, and defuse spreadsheet formulas in user-entered text.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

/** GET /api/admin/export/people.csv?role=&status=&q=&teacherId=&batchId=&flag= — the directory as CSV. */
export function GET(request: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  return withAdmin(async (actor) => {
    const { file } = await params;
    if (file !== "people.csv") return jsonError("Only people.csv can be exported.", 404);

    const filter = parsePeopleFilter(Object.fromEntries(request.nextUrl.searchParams));
    const { people } = await listPeople(filter);

    const header = ["Name", "Type", "Email", "Phone", "Status", "Admin", "Belongs to", "Flags", "Last sign-in", "Created"];
    const rows = people.map((person) => [
      person.name,
      person.role,
      person.email,
      person.phone,
      person.status !== "active" ? "Suspended" : person.mustChangePassword ? "Not signed in yet" : "Active",
      person.isAdmin ? (person.isOwner ? "Owner" : person.adminUntil ? `Until ${person.adminUntil.toISOString().slice(0, 10)}` : "Permanent") : "",
      person.context.join("; "),
      person.flags.map((flag) => STUDENT_FLAG_LABELS[flag]).join("; "),
      person.lastLoginAt,
      person.createdAt,
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

    await audit({
      actor: { id: actor.id, role: "admin", name: actor.name },
      action: "person.export",
      summary: `${actor.name} exported ${people.length} people to CSV`,
      metadata: { filter },
    });

    const date = new Date().toISOString().slice(0, 10);
    return new Response(`﻿${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bhargav-academy-people-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
