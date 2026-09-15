import { fromResult, jsonError, readJson, withAdmin } from "@/lib/admin/api";
import { parseExpiry } from "@/lib/admin/policy";
import { grantAdmin, revokeAdmin } from "@/lib/admin/service";

type Context = { params: Promise<{ id: string }> };

/** POST /api/admin/teachers/:id/admin-access — { expiresAt: null | "2026-10-31" }; null is permanent. */
export function POST(request: Request, { params }: Context) {
  return withAdmin(async (actor) => {
    const { id } = await params;
    const body = (await readJson(request)) ?? {};
    const parsed = parseExpiry(body.expiresAt);
    if ("error" in parsed) return jsonError(parsed.error, 400);
    return fromResult(await grantAdmin(actor, id, parsed.expiresAt));
  });
}

/** DELETE /api/admin/teachers/:id/admin-access — back to teacher. Refused for the owner and the last admin. */
export function DELETE(_request: Request, { params }: Context) {
  return withAdmin(async (actor) => {
    const { id } = await params;
    return fromResult(await revokeAdmin(actor, id));
  });
}
