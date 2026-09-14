import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
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
    >
      {children}
    </AppShell>
  );
}
