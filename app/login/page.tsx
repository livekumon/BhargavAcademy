import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-heading";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { RoleSwitcher } from "@/components/auth/role-switcher";
import { SignedOutNotice } from "@/components/auth/signed-out-notice";
import { AuthForm } from "@/components/auth-form";
import { loginTeacher } from "@/lib/actions/auth";
import {
  SAMPLE_TEACHER_EMAIL,
  SAMPLE_TEACHER_PASSWORD,
} from "@/lib/seed";

export const metadata: Metadata = {
  title: "Teacher sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string | string[] }>;
}) {
  const { notice } = await searchParams;

  return (
    <AuthShell role="teacher" showcase={<AuthShowcase variant="teacher" />}>
      <div className="space-y-8">
        <RoleSwitcher current="teacher" />
        <AuthHeading
          title="Welcome back"
          description="Sign in to run your batches, courses, and class material. Admins land on the academy console."
        />
        <SignedOutNotice notice={notice} />
        <AuthForm
          action={loginTeacher}
          mode="login"
          emailPlaceholder="you@bhargavacademy.com"
          submitLabel="Sign in"
          demo={{
            name: "Bhargav",
            description:
              "Academy owner and admin. First sign-in asks you to set a new password.",
            email: SAMPLE_TEACHER_EMAIL,
            password: SAMPLE_TEACHER_PASSWORD,
          }}
          help="Default accounts use password 123456. On first sign-in you'll choose a new one. Teacher accounts are created by the academy admin, who can also reset your password."
        />
      </div>
    </AuthShell>
  );
}
