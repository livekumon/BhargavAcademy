import { fromResult, jsonData, jsonError, readJson, withAdmin } from "@/lib/admin/api";
import { isPersonRole } from "@/lib/admin/policy";
import { getParentProfile, getStudentProfile, getTeacherProfile } from "@/lib/admin/queries";
import { updatePerson } from "@/lib/admin/service";

type Context = { params: Promise<{ role: string; id: string }> };

/** Profiles never leave the server with a password hash in them. */
function withoutPasswordHash<T extends { passwordHash?: unknown }>(row: T): Omit<T, "passwordHash"> {
  const copy = { ...row };
  delete copy.passwordHash;
  return copy;
}

/** GET /api/admin/people/:role/:id — the same profile the admin pages show. */
export function GET(_request: Request, { params }: Context) {
  return withAdmin(async () => {
    const { role, id } = await params;
    if (!isPersonRole(role)) return jsonError("Role must be teacher, student, or parent.", 400);

    if (role === "teacher") {
      const profile = await getTeacherProfile(id);
      if (!profile) return jsonError("No teacher with that id.", 404);
      return jsonData({ ...profile, teacher: withoutPasswordHash(profile.teacher) });
    }
    if (role === "student") {
      const profile = await getStudentProfile(id);
      if (!profile) return jsonError("No student with that id.", 404);
      return jsonData(profile);
    }
    const profile = await getParentProfile(id);
    if (!profile) return jsonError("No parent with that id.", 404);
    return jsonData(profile);
  });
}

/** PATCH /api/admin/people/:role/:id — { name?, email?, phone?, syllabus?, exam? } */
export function PATCH(request: Request, { params }: Context) {
  return withAdmin(async (actor) => {
    const { role, id } = await params;
    if (!isPersonRole(role)) return jsonError("Role must be teacher, student, or parent.", 400);
    const body = await readJson(request);
    if (!body) return jsonError("Send a JSON object.", 400);
    return fromResult(await updatePerson(actor, role, id, body));
  });
}
