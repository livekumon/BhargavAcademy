import { NextResponse, type NextRequest } from "next/server";
import {
  PARENT_SESSION_COOKIE,
  SESSION_COOKIE,
  STUDENT_SESSION_COOKIE,
} from "@/lib/session";

export function proxy(request: NextRequest) {
  const hasTeacherSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const hasStudentSession = Boolean(
    request.cookies.get(STUDENT_SESSION_COOKIE)?.value,
  );
  const hasParentSession = Boolean(
    request.cookies.get(PARENT_SESSION_COOKIE)?.value,
  );
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !hasTeacherSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === "/login" || pathname === "/register") && hasTeacherSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/student") && pathname !== "/student/login") {
    if (!hasStudentSession) {
      const loginUrl = new URL("/student/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === "/student/login" && hasStudentSession) {
    return NextResponse.redirect(new URL("/student", request.url));
  }

  if (pathname.startsWith("/parent") && pathname !== "/parent/login") {
    if (!hasParentSession) {
      const loginUrl = new URL("/parent/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === "/parent/login" && hasParentSession) {
    return NextResponse.redirect(new URL("/parent", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/student",
    "/student/:path*",
    "/parent",
    "/parent/:path*",
  ],
};
