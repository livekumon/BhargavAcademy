import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SetPasswordForm } from "@/components/set-password-form";
import { AccountNameForm } from "@/components/teacher/account-name-form";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { changeTeacherPassword } from "@/lib/actions/auth";
import { isAdmin } from "@/lib/admin/policy";
import { requireTeacher } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings",
};

/** Your own account. Academy-wide settings, like dropdown lists, live in the admin console. */
export default async function SettingsPage() {
  const teacher = await requireTeacher();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Academy" title="Settings" description="Your name and password." />

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
        {isAdmin(teacher) ? (
          <Surface pad="lg" className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 text-brand" />
              <div>
                <h2 className="text-title-3 font-semibold">Academy settings</h2>
                <p className="text-sm text-content-muted">Dropdown lists, people and access are managed in the admin console.</p>
              </div>
            </div>
            <Button asChild variant="outline" size="lg">
              <Link href="/admin/settings">Open admin settings</Link>
            </Button>
          </Surface>
        ) : null}
      </div>
    </div>
  );
}
