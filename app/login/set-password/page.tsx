import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthHeading } from "@/components/auth/auth-heading";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { SetPasswordForm } from "@/components/set-password-form";
import { setTeacherPassword } from "@/lib/actions/auth";
import { requireTeacher } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Set a new password",
};

export default async function TeacherSetPasswordPage() {
  const teacher = await requireTeacher({ allowPendingPassword: true });
  if (!teacher.mustChangePassword) {
    redirect("/dashboard");
  }

  return (
    <AuthShell role="teacher" showcase={<AuthShowcase variant="teacher" />}>
      <div className="space-y-8">
        <AuthHeading
          title="Choose a new password"
          description="This is your first sign-in. Replace the default password before opening the dashboard."
        />
        <SetPasswordForm action={setTeacherPassword} />
      </div>
    </AuthShell>
  );
}
