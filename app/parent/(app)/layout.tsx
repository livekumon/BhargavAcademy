import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { logoutParent } from "@/lib/actions/auth";
import { requireParent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ParentAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const parent = await requireParent();

  return (
    <AppShell
      role="parent"
      user={{ name: parent.name, email: parent.email }}
      signOut={logoutParent}
    >
      {children}
    </AppShell>
  );
}
