import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthHeading } from "@/components/auth/auth-heading";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { SetPasswordForm } from "@/components/set-password-form";
import { setParentPassword } from "@/lib/actions/auth";
import { requireParent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Set a new password",
};

export default async function ParentSetPasswordPage() {
  const parent = await requireParent({ allowPendingPassword: true });
  if (!parent.mustChangePassword) {
    redirect("/parent");
  }

  return (
    <AuthShell role="parent" showcase={<AuthShowcase variant="parent" />}>
      <div className="space-y-8">
        <AuthHeading
          title="Choose a new password"
          description="This is your first sign-in. Replace the default password before opening the parent workspace."
        />
        <SetPasswordForm action={setParentPassword} />
      </div>
    </AuthShell>
  );
}
