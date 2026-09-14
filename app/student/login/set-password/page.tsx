import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthHeading } from "@/components/auth/auth-heading";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { SetPasswordForm } from "@/components/set-password-form";
import { setStudentPassword } from "@/lib/actions/auth";
import { requireStudent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Set a new password",
};

export default async function StudentSetPasswordPage() {
  const student = await requireStudent({ allowPendingPassword: true });
  if (!student.mustChangePassword) {
    redirect("/student");
  }

  return (
    <AuthShell role="student" showcase={<AuthShowcase variant="student" />}>
      <div className="space-y-8">
        <AuthHeading
          title="Choose a new password"
          description="This is your first sign-in. Replace the default password before opening your student workspace."
        />
        <SetPasswordForm action={setStudentPassword} />
      </div>
    </AuthShell>
  );
}
