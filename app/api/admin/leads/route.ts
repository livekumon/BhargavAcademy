import type { NextRequest } from "next/server";
import { jsonData, withAdmin } from "@/lib/admin/api";
import { isLeadStage } from "@/lib/admin/policy";
import { listLeads } from "@/lib/leads";

/** GET /api/admin/leads?status=new|contacted|demo|enrolled|closed&assignedTeacherId= */
export function GET(request: NextRequest) {
  return withAdmin(async () => {
    const status = request.nextUrl.searchParams.get("status");
    const assigned = request.nextUrl.searchParams.get("assignedTeacherId");
    const leads = (await listLeads())
      .filter((lead) => !isLeadStage(status) || lead.status === status)
      .filter((lead) => !assigned || lead.assignedTeacherId === assigned);
    return jsonData(leads);
  });
}
