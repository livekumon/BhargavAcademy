import type { NextRequest } from "next/server";
import { jsonData, withAdmin } from "@/lib/admin/api";
import { getAdminOverview, parseOverviewRange } from "@/lib/admin/metrics";

/** GET /api/admin/overview?range=7|30|90 — KPIs, attention queue, funnel, teachers, activity. */
export function GET(request: NextRequest) {
  return withAdmin(async () => {
    const range = parseOverviewRange(request.nextUrl.searchParams.get("range"));
    return jsonData(await getAdminOverview(range));
  });
}
