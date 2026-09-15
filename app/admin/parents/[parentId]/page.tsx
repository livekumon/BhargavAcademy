import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountStatusPill } from "@/components/admin/account-pills";
import { AccountActions, ParentChildrenForm, PersonDetailsForm } from "@/components/admin/profile-forms";
import { CreatedNotice, FactList, ProfileSection } from "@/components/admin/profile-parts";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { relativeDay } from "@/lib/admin/format";
import { getParentProfile } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Parent",
};

export default async function AdminParentPage({
  params,
  searchParams,
}: {
  params: Promise<{ parentId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdmin();
  const parentId = decodeURIComponent((await params).parentId);
  const { notice } = await searchParams;
  const profile = await getParentProfile(parentId);
  if (!profile) notFound();

  const { parent } = profile;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "People", href: "/admin/people?role=parent" }, { label: parent.name }]} />}
        eyebrow="Parent"
        title={parent.name}
        description={<span className="font-mono text-sm">{parent.email}</span>}
        actions={<AccountStatusPill status={parent.status} mustChangePassword={parent.mustChangePassword} />}
      />
      <CreatedNotice notice={notice} email={parent.email} />

      <FactList
        facts={[
          { label: "Children", value: profile.children.length },
          { label: "Last sign-in", value: relativeDay(parent.lastLoginAt) ?? "Never" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <ProfileSection title="Children" description="What this parent sees after signing in.">
            {profile.children.length === 0 ? (
              <p className="text-sm text-content-muted">No children linked. The parent will see an empty dashboard.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {profile.children.map((child) => (
                  <li key={child.id} className="flex flex-col gap-1 rounded-lg p-3 ring-1 ring-line">
                    <Link href={`/admin/students/${child.id}`} className="font-medium hover:underline">{child.name}</Link>
                    <span className="truncate text-xs text-content-subtle">
                      {child.batchNames.length > 0 ? child.batchNames.join(" · ") : "No batch"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ProfileSection>

          <ProfileSection
            title="Change children"
            description="A student has one parent login. Choosing a student who is linked elsewhere moves them to this parent."
          >
            <ParentChildrenForm
              parentId={parent.id}
              selected={profile.children.map((child) => child.id)}
              students={profile.studentOptions.map((student) => ({
                id: student.id,
                label: student.name,
                detail: student.otherParent
                  ? `${student.batchNames.join(" · ") || "No batch"} · linked to ${student.otherParent}`
                  : student.batchNames.join(" · ") || "No batch",
              }))}
            />
          </ProfileSection>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <ProfileSection title="Details">
            <PersonDetailsForm role="parent" id={parent.id} defaults={{ name: parent.name, email: parent.email }} />
          </ProfileSection>
          <ProfileSection title="Account">
            <AccountActions
              role="parent"
              id={parent.id}
              name={parent.name}
              status={parent.status}
              canReset
              canChangeStatus
            />
          </ProfileSection>
        </div>
      </div>
    </div>
  );
}
