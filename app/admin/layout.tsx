import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { logoutTeacher } from "@/lib/actions/auth";
import { requireAdmin } from "@/lib/auth";
import { isPersistentDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return (
    <AppShell
      role="admin"
      user={{ name: admin.name, email: admin.email }}
      signOut={logoutTeacher}
      switchPortal={{ href: "/dashboard", label: "My teaching" }}
    >
      {isPersistentDatabase ? null : (
        <p
          role="status"
          className="mb-6 flex items-start gap-2 rounded-xl border border-warning-line bg-warning-subtle px-4 py-3 text-sm text-warning-subtle-fg"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          This deployment has no hosted database, so people you add here disappear when the server
          restarts. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to keep them.
        </p>
      )}
      {children}
    </AppShell>
  );
}
