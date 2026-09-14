import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { logoutStudent } from "@/lib/actions/auth";
import { requireStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudentAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const student = await requireStudent();

  return (
    <AppShell
      role="student"
      user={{ name: student.name, email: student.email }}
      signOut={logoutStudent}
    >
      {children}
    </AppShell>
  );
}
