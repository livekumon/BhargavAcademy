import { fromResult, jsonError, readJson, withAdmin } from "@/lib/admin/api";
import { convertLead } from "@/lib/admin/service";

/** POST /api/admin/leads/:id/convert — { batchId, syllabus, exam } creates student + parent logins. */
export function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withAdmin(async (actor) => {
    const { id } = await params;
    const body = await readJson(request);
    if (!body) return jsonError("Send a JSON object.", 400);
    return fromResult(
      await convertLead(actor, id, { batchId: body.batchId, syllabus: body.syllabus, exam: body.exam }),
      201,
    );
  });
}
