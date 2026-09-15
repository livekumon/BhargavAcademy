import { NextResponse, type NextRequest } from "next/server";
import {
  PARENT_SESSION_COOKIE,
  SESSION_COOKIE,
  STUDENT_SESSION_COOKIE,
} from "@/lib/session";

const portals = {
  teacher: { cookie: SESSION_COOKIE, login: "/login" },
  student: { cookie: STUDENT_SESSION_COOKIE, login: "/student/login" },
  parent: { cookie: PARENT_SESSION_COOKIE, login: "/parent/login" },
} as const;

/**
 * Clears a session that no longer maps to a usable account (suspended or
 * removed) and lands on that portal's sign-in page with an explanation.
 */
export function GET(request: NextRequest) {
  const portalParam = request.nextUrl.searchParams.get("portal");
  const portal =
    portalParam === "student" || portalParam === "parent" ? portalParam : "teacher";
  const reason = request.nextUrl.searchParams.get("reason") === "suspended" ? "suspended" : "signed-out";

  const target = new URL(portals[portal].login, request.url);
  if (reason === "suspended") target.searchParams.set("notice", "suspended");

  const response = NextResponse.redirect(target);
  response.cookies.delete(portals[portal].cookie);
  return response;
}
