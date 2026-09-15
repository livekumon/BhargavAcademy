import { fromResult, jsonError, withAdmin } from "@/lib/admin/api";
import { isPersonRole } from "@/lib/admin/policy";
import { resetPassword } from "@/lib/admin/service";

/** POST /api/admin/people/:role/:id/reset-password — back to 123456, must change at sign-in. */
export function POST(_request: Request, { params }: { params: Promise<{ role: string; id: string }> }) {
  return withAdmin(async (actor) => {
    const { role, id } = await params;
    if (!isPersonRole(role)) return jsonError("Role must be teacher, student, or parent.", 400);
    return fromResult(await resetPassword(actor, role, id));
  });
}
