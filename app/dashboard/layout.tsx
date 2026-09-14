import type { ReactNode } from "react";
import { TeacherShell } from "@/components/teacher/teacher-shell";
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
    >
      {children}
    </TeacherShell>
  );
}
