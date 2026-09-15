import type { NextRequest } from "next/server";
import { jsonData, withAdmin } from "@/lib/admin/api";
import { listAuditEvents } from "@/lib/audit";

/** GET /api/admin/activity?actorId=&entityId=&action=role|role.grant&before=ISO&limit=50 */
export function GET(request: NextRequest) {
  return withAdmin(async () => {
    const params = request.nextUrl.searchParams;
    const before = params.get("before");
    const limit = Number(params.get("limit") ?? 50);
    return jsonData(
      await listAuditEvents({
        actorId: params.get("actorId") || undefined,
        entityId: params.get("entityId") || undefined,
        action: params.get("action") || undefined,
        before: before && !Number.isNaN(Date.parse(before)) ? new Date(before) : undefined,
        limit: Number.isFinite(limit) ? limit : 50,
      }),
    );
  });
}
