import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-heading";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { RoleSwitcher } from "@/components/auth/role-switcher";
import { AuthForm } from "@/components/auth-form";
import { loginStudent } from "@/lib/actions/auth";
import { SAMPLE_STUDENT_EMAIL, SAMPLE_STUDENT_PASSWORD } from "@/lib/seed";

export const metadata: Metadata = {
  title: "Student sign in",
};

export default function StudentLoginPage() {
  return (
    <AuthShell role="student" showcase={<AuthShowcase variant="student" />}>
      <div className="space-y-8">
        <RoleSwitcher current="student" />
        <AuthHeading
          title="Ready to learn?"
          description="Sign in to see what to revise, what to submit, and your latest marks."
        />
        <AuthForm
          action={loginStudent}
          mode="login"
          emailPlaceholder="The email your teacher gave you"
          demo={{
            name: "Ananya Sharma",
            description:
              "Grade 10 Morning. First sign-in asks you to set a new password.",
            email: SAMPLE_STUDENT_EMAIL,
            password: SAMPLE_STUDENT_PASSWORD,
          }}
          help="Your login was set up by your teacher. Default password is 123456 — you'll set a new one on first sign-in. Ask them to check your email if you can't get in."
        />
      </div>
    </AuthShell>
  );
}
