import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-heading";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { RoleSwitcher } from "@/components/auth/role-switcher";
import { AuthForm } from "@/components/auth-form";
import { loginParent } from "@/lib/actions/auth";
import { SAMPLE_PARENT_EMAIL, SAMPLE_PARENT_PASSWORD } from "@/lib/seed";

export const metadata: Metadata = {
  title: "Parent sign in",
};

export default function ParentLoginPage() {
  return (
    <AuthShell role="parent" showcase={<AuthShowcase variant="parent" />}>
      <div className="space-y-8">
        <RoleSwitcher current="parent" />
        <AuthHeading
          title="Welcome back"
          description="Sign in to follow your children's class material, assignments, and marks."
        />
        <AuthForm
          action={loginParent}
          mode="login"
          emailPlaceholder="The email you gave the academy"
          demo={{
            name: "Priya Sharma",
            description:
              "Parent of Ananya (Grade 10) and Aarav (Grade 8). First sign-in asks for a new password.",
            email: SAMPLE_PARENT_EMAIL,
            password: SAMPLE_PARENT_PASSWORD,
          }}
          help="Parent logins are created by your child's teacher. Default password is 123456 — you'll set a new one on first sign-in. Ask them to confirm the email on your child's profile if you can't get in."
        />
      </div>
    </AuthShell>
  );
}
