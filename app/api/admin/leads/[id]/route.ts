import { fromResult, jsonError, readJson, withAdmin } from "@/lib/admin/api";
import { updateLeadAsAdmin } from "@/lib/admin/service";

/** PATCH /api/admin/leads/:id — { status?, assignedTeacherId? (null to unassign) } */
export function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (actor) => {
    const { id } = await params;
    const body = await readJson(request);
    if (!body) return jsonError("Send a JSON object.", 400);
    return fromResult(
      await updateLeadAsAdmin(actor, id, {
        status: body.status,
        assignedTeacherId: body.assignedTeacherId === null ? "" : body.assignedTeacherId,
      }),
    );
  });
}
