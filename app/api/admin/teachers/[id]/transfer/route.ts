import { fromResult, jsonError, readJson, withAdmin } from "@/lib/admin/api";
import { transferTeaching } from "@/lib/admin/service";

/**
 * POST /api/admin/teachers/:id/transfer — { toTeacherId, batchIds? }
 * Without batchIds, moves every batch, the course library, and assigned leads.
 */
export function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (actor) => {
    const { id } = await params;
    const body = await readJson(request);
    if (!body) return jsonError("Send a JSON object.", 400);
    return fromResult(
      await transferTeaching(actor, id, { toTeacherId: body.toTeacherId, batchIds: body.batchIds }),
    );
  });
}
