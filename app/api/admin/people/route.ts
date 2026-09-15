import type { NextRequest } from "next/server";
import { fromResult, jsonData, jsonError, readJson, withAdmin } from "@/lib/admin/api";
import { parseExpiry } from "@/lib/admin/policy";
import { listPeople, parsePeopleFilter } from "@/lib/admin/queries";
import { createPerson } from "@/lib/admin/service";

/**
 * GET /api/admin/people?role=teacher|student|parent|admin&status=&q=&teacherId=&batchId=&flag=
 * The unified directory. `counts` gives the size of each role tab.
 */
export function GET(request: NextRequest) {
  return withAdmin(async () => {
    const filter = parsePeopleFilter(Object.fromEntries(request.nextUrl.searchParams));
    const { people, counts } = await listPeople(filter);
    return jsonData({ people, counts, filter });
  });
}

/**
 * POST /api/admin/people
 * { role, name, email?, phone?, password?, batchIds?, syllabus?, exam?, studentIds?,
 *   admin?: { expiresAt: null | "2026-10-31" } }
 */
export function POST(request: Request) {
  return withAdmin(async (actor) => {
    const body = await readJson(request);
    if (!body) return jsonError("Send a JSON object.", 400);

    let admin: { expiresAt: Date | null } | null = null;
    if (body.admin && typeof body.admin === "object") {
      const parsed = parseExpiry((body.admin as { expiresAt?: unknown }).expiresAt);
      if ("error" in parsed) return jsonError(parsed.error, 400);
      admin = { expiresAt: parsed.expiresAt };
    }

    return fromResult(await createPerson(actor, { ...body, role: body.role, name: body.name, admin }), 201);
  });
}
