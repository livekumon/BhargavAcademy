import type { NextRequest } from "next/server";
import { jsonData, withAdmin } from "@/lib/admin/api";
import { listAllBatches } from "@/lib/admin/queries";

/** GET /api/admin/batches?teacherId=&stale=1 — every batch with its health. */
export function GET(request: NextRequest) {
  return withAdmin(async () => {
    const params = request.nextUrl.searchParams;
    return jsonData(
      await listAllBatches({
        teacherId: params.get("teacherId") || undefined,
        stale: params.get("stale") === "1",
      }),
    );
  });
}
