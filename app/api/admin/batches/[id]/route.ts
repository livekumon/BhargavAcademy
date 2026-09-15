import { fromResult, jsonError, readJson, withAdmin } from "@/lib/admin/api";
import { db } from "@/lib/db";
import { transferTeaching } from "@/lib/admin/service";
import { batches } from "@/lib/schema";
import { eq } from "drizzle-orm";

/** PATCH /api/admin/batches/:id — { teacherId } hands the batch to another teacher. */
export function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (actor) => {
    const { id } = await params;
    const body = await readJson(request);
    if (!body || typeof body.teacherId !== "string") return jsonError("Send { teacherId }.", 400);

    const [batch] = await db.select({ teacherId: batches.teacherId }).from(batches).where(eq(batches.id, id)).limit(1);
    if (!batch) return jsonError("No batch with that id.", 404);

    return fromResult(await transferTeaching(actor, batch.teacherId, { toTeacherId: body.teacherId, batchIds: [id] }));
  });
}
