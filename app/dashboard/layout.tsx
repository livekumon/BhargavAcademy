import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
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
    <AppShell
      role="teacher"
      user={{ name: teacher.name, email: teacher.email }}
      signOut={logoutTeacher}
      switchPortal={isAdmin(teacher) ? { href: "/admin", label: "Admin console" } : undefined}
    >
      {children}
    </AppShell>
  );
}
