import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginTeacher } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Teacher sign in",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <Logo className="mb-8" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to manage batches, shared courses, and batch-specific PDFs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm
            action={loginTeacher}
            mode="login"
            footer={
              <p className="text-center text-sm text-muted-foreground">
                Parent?{" "}
                <Link href="/parent/login" className="font-medium text-primary hover:underline">
                  Sign in here
                </Link>
                {" · "}
                Student?{" "}
                <Link href="/student/login" className="font-medium text-primary hover:underline">
                  Sign in here
                </Link>
                {" · "}
                New teacher?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Create an account
                </Link>
              </p>
            }
          />
          <div className="mt-5 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            Prototype login
            <br />
            Email: <span className="font-medium text-foreground">teacher@academy.test</span>
            <br />
            Password: <span className="font-medium text-foreground">Teacher123!</span>
            <br />
            Dummy batches, students, courses, and PDFs load automatically.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
