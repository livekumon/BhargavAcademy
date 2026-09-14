import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-heading";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { RoleSwitcher } from "@/components/auth/role-switcher";
import { AuthForm } from "@/components/auth-form";
import { loginTeacher } from "@/lib/actions/auth";
import {
  SAMPLE_TEACHER_EMAIL,
  SAMPLE_TEACHER_PASSWORD,
} from "@/lib/seed";

export const metadata: Metadata = {
  title: "Teacher sign in",
};

export default function LoginPage() {
  return (
    <AuthShell role="teacher" showcase={<AuthShowcase variant="teacher" />}>
      <div className="space-y-8">
        <RoleSwitcher current="teacher" />
        <AuthHeading
          title="Welcome back"
          description="Sign in to run your batches, courses, and class material."
        />
        <AuthForm
          action={loginTeacher}
          mode="login"
          emailPlaceholder="you@bhargavacademy.com"
          submitLabel="Sign in"
          demo={{
            name: "Bhargav",
            description:
              "Admin teacher. First sign-in asks you to set a new password.",
            email: SAMPLE_TEACHER_EMAIL,
            password: SAMPLE_TEACHER_PASSWORD,
          }}
          help="Default accounts use password 123456. On first sign-in you'll choose a new one. If you've lost access, create a new teacher account."
          footer={
            <>
              New to Bhargav Academy?{" "}
              <Link
                href="/register"
                className="rounded-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                Create a teacher account
              </Link>
            </>
          }
        />
      </div>
    </AuthShell>
  );
}
