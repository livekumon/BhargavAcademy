import { getAdminActor } from "@/lib/auth";
import type { Teacher } from "@/lib/schema";
import type { ServiceResult } from "./service";

/*
 * Shared plumbing for /api/admin/*. Every route authenticates from the
 * session cookie and answers in one JSON shape:
 *   success → { data, message? }   failure → { error }
 */

export function jsonError(error: string, status: number) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export function jsonData(data: unknown, init: { status?: number; message?: string } = {}) {
  return Response.json(
    init.message ? { data, message: init.message } : { data },
    { status: init.status ?? 200, headers: { "Cache-Control": "no-store" } },
  );
}

export function fromResult<T>(result: ServiceResult<T>, successStatus = 200) {
  return result.ok
    ? jsonData(result.data, { status: successStatus, message: result.message })
    : jsonError(result.error, result.status);
}

/** Runs the handler only for a signed-in, active admin. */
export async function withAdmin(handler: (actor: Teacher) => Promise<Response>) {
  const actor = await getAdminActor();
  if (!actor) {
    return jsonError("Sign in as an admin to use this API.", 401);
  }
  try {
    return await handler(actor);
  } catch (error) {
    console.error("Admin API error", error);
    return jsonError("Something went wrong on the server. Try again.", 500);
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
