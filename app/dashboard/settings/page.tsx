import type { Metadata } from "next";
import { ListChecks, UserRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LookupSettings } from "@/components/lookup-settings";
import { SetPasswordForm } from "@/components/set-password-form";
import { AccountNameForm } from "@/components/teacher/account-name-form";
import { PageTabs } from "@/components/teacher/page-tabs";
import { Surface } from "@/components/ui/surface";
import { isAdmin } from "@/lib/admin/policy";
import { changeTeacherPassword } from "@/lib/actions/auth";
import { requireTeacher } from "@/lib/auth";
import { getLookupCatalog } from "@/lib/lookups";
import { firstQueryValue } from "@/lib/teacher-format";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const [teacher, query] = await Promise.all([requireTeacher(), searchParams]);
  // Dropdown lists are academy-wide, so only admins can edit them.
  const canEditLists = isAdmin(teacher);
  const section = !canEditLists || firstQueryValue(query.section) === "account" ? "account" : "lists";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Academy"
        title="Settings"
        description={
          canEditLists
            ? "The dropdown lists every portal uses, and your own account."
            : "Your name and password. Academy-wide lists are managed by the admin."
        }
      />
      {canEditLists ? (
        <PageTabs
          label="Settings sections"
          current={section}
          tabs={[
            { id: "lists", label: "Dropdown lists", href: "/dashboard/settings", icon: ListChecks },
            { id: "account", label: "Your account", href: "/dashboard/settings?section=account", icon: UserRound },
          ]}
        />
      ) : null}

      {section === "lists" ? (
        <ListsSection />
      ) : (
        <div className="grid max-w-3xl gap-6">
          <Surface pad="lg" className="space-y-4">
            <div>
              <h2 className="text-title-2 font-semibold">Profile</h2>
              <p className="text-sm text-content-muted">How you appear across the academy.</p>
            </div>
            <AccountNameForm name={teacher.name} email={teacher.email} />
          </Surface>
          <Surface pad="lg" className="space-y-4">
            <div>
              <h2 className="text-title-2 font-semibold">Change password</h2>
              <p className="text-sm text-content-muted">You&apos;ll stay signed in on this device.</p>
            </div>
            <div className="max-w-md">
              <SetPasswordForm action={changeTeacherPassword} submitLabel="Change password" currentPlaceholder="Your current password" />
            </div>
          </Surface>
        </div>
      )}
    </div>
  );
}

async function ListsSection() {
  const catalog = await getLookupCatalog();
  const toEditable = (option: { id: string; listKey: string; value: string; label: string; position: number }) => ({
    id: option.id,
    listKey: option.listKey,
    value: option.value,
    label: option.label,
    position: option.position,
  });

  return (
    <section aria-label="Dropdown lists" className="space-y-4">
      <p className="max-w-2xl text-sm text-content-muted text-pretty">
        Syllabus, exam and exam paper appear in teacher, student and parent screens. A new name shows up in every
        dropdown that uses that list. Options already in use can&apos;t be deleted.
      </p>
      <LookupSettings
        catalog={{
          syllabus: catalog.syllabus.map(toEditable),
          exam: catalog.exam.map(toEditable),
          exam_paper: catalog.exam_paper.map(toEditable),
        }}
      />
    </section>
  );
}
