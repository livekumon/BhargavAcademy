import { fromResult, jsonError, readJson, withAdmin } from "@/lib/admin/api";
import { setParentChildren } from "@/lib/admin/service";

/** PUT /api/admin/parents/:id/children — { studentIds: string[] } replaces the linked children. */
export function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (actor) => {
    const { id } = await params;
    const body = await readJson(request);
    if (!body || !Array.isArray(body.studentIds)) return jsonError("Send { studentIds: [...] }.", 400);
    return fromResult(await setParentChildren(actor, id, body.studentIds));
  });
}
