import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-heading";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { AuthForm } from "@/components/auth-form";
import { registerTeacher } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Create teacher account",
};

export default function RegisterPage() {
  return (
    <AuthShell role="teacher" showcase={<AuthShowcase variant="register" />}>
      <div className="space-y-8">
        <AuthHeading
          title="Create your workspace"
          description="Register as a teacher to set up batches, courses, and chapter PDFs. Students and parents get their logins from you."
        />
        <AuthForm
          action={registerTeacher}
          mode="register"
          emailPlaceholder="you@bhargavacademy.com"
          submitLabel="Create teacher account"
          footer={
            <>
              Already have an account?{" "}
              <Link
                href="/login"
                className="rounded-sm font-medium text-brand underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                Sign in
              </Link>
            </>
          }
        />
      </div>
    </AuthShell>
  );
}
