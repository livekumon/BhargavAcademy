import type { ReactNode } from "react";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { isAdmin } from "@/lib/admin/policy";
import { logoutTeacher } from "@/lib/actions/auth";
import { requireTeacher } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const teacher = await requireTeacher();

  return (
    <TeacherShell
      teacher={{ id: teacher.id, name: teacher.name, email: teacher.email }}
      signOut={logoutTeacher}
      switchPortal={isAdmin(teacher) ? { href: "/admin", label: "Admin console" } : undefined}
    >
      {children}
    </TeacherShell>
  );
}
