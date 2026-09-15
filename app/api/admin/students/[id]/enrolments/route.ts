import { fromResult, jsonError, readJson, withAdmin } from "@/lib/admin/api";
import { setStudentBatches } from "@/lib/admin/service";

/** PUT /api/admin/students/:id/enrolments — { batchIds: string[] } replaces the student's batches. */
export function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (actor) => {
    const { id } = await params;
    const body = await readJson(request);
    if (!body || !Array.isArray(body.batchIds)) return jsonError("Send { batchIds: [...] }.", 400);
    return fromResult(await setStudentBatches(actor, id, body.batchIds));
  });
}
