import { GraduationCap, Presentation, Users } from "lucide-react";

export type PortalRole = "teacher" | "student" | "parent";

/** The three doors into the academy, in the order they are offered. */
export const portals = [
  { role: "teacher", label: "Teacher", href: "/login", icon: Presentation },
  { role: "student", label: "Student", href: "/student/login", icon: GraduationCap },
  { role: "parent", label: "Parent", href: "/parent/login", icon: Users },
] as const satisfies ReadonlyArray<{
  role: PortalRole;
  label: string;
  href: string;
  icon: typeof Users;
}>;
