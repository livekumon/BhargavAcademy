import type { Metadata } from "next";
import Link from "next/link";
import { AdminPill } from "@/components/admin/account-pills";
import { LookupSettings } from "@/components/lookup-settings";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { formatDate, relativeDay } from "@/lib/admin/format";
import { listPeople } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { getLookupCatalog } from "@/lib/lookups";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [catalog, { people: admins }] = await Promise.all([
    getLookupCatalog(),
    listPeople({ role: "admin" }),
  ]);

  const editable = {
    syllabus: catalog.syllabus.map(toEditable),
    exam: catalog.exam.map(toEditable),
    exam_paper: catalog.exam_paper.map(toEditable),
  };

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Academy settings"
        title="Settings"
        description="Who can run the academy, and the dropdown lists every portal uses."
      />

      <section aria-labelledby="admins-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="admins-heading" className="font-heading text-title-2 font-semibold">Admins</h2>
            <p className="mt-1 max-w-2xl text-sm text-content-muted text-pretty">
              Admins see every teacher, student, and parent. To make a teacher an admin — permanently or
              until a date — open their profile.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/people?role=teacher">Choose a teacher</Link>
          </Button>
        </div>
        <Surface pad="none">
          <ul className="divide-y divide-line">
            {admins.map((admin) => (
              <li key={admin.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <Link href={admin.href} className="font-medium hover:underline">{admin.name}</Link>
                  <p className="font-mono text-xs text-content-subtle">{admin.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-content-muted">
                  <span>Last sign-in: {relativeDay(admin.lastLoginAt) ?? "Never"}</span>
                  <AdminPill isOwner={admin.isOwner} until={admin.adminUntil} />
                </div>
              </li>
            ))}
          </ul>
        </Surface>
        {admins.some((admin) => admin.adminUntil) ? (
          <p className="text-xs text-content-subtle">
            Time-limited access lapses automatically at the end of the chosen day — next on{" "}
            {formatDate(
              admins
                .map((admin) => admin.adminUntil)
                .filter((date): date is Date => Boolean(date))
                .sort((a, b) => a.getTime() - b.getTime())[0],
            )}
            .
          </p>
        ) : null}
      </section>

      <section aria-labelledby="dropdowns-heading" className="flex flex-col gap-4">
        <div>
          <h2 id="dropdowns-heading" className="font-heading text-title-2 font-semibold">Dropdowns</h2>
          <p className="mt-1 max-w-2xl text-sm text-content-muted text-pretty">
            The syllabus, exam, and exam paper lists used in teacher, student, and parent screens. New names
            show up in every dropdown that uses that list.
          </p>
        </div>
        <LookupSettings catalog={editable} />
      </section>
    </div>
  );
}

function toEditable(option: { id: string; listKey: string; value: string; label: string; position: number }) {
  return {
    id: option.id,
    listKey: option.listKey,
    value: option.value,
    label: option.label,
    position: option.position,
  };
}
