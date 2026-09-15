import { fromResult, jsonError, withAdmin } from "@/lib/admin/api";
import { isPersonRole } from "@/lib/admin/policy";
import { setAccountStatus } from "@/lib/admin/service";

/** POST /api/admin/people/:role/:id/reactivate — lets a suspended account sign in again. */
export function POST(_request: Request, { params }: { params: Promise<{ role: string; id: string }> }) {
  return withAdmin(async (actor) => {
    const { role, id } = await params;
    if (!isPersonRole(role)) return jsonError("Role must be teacher, student, or parent.", 400);
    return fromResult(await setAccountStatus(actor, role, id, "active"));
  });
}
