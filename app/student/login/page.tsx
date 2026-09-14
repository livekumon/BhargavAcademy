import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginStudent } from "@/lib/actions/auth";
import { SAMPLE_STUDENT_EMAIL, SAMPLE_STUDENT_PASSWORD } from "@/lib/seed";

export const metadata: Metadata = {
  title: "Student sign in",
};

export default function StudentLoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <Logo className="mb-8" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Student sign in</CardTitle>
          <CardDescription>
            See the PDFs your teacher assigned to you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm
            action={loginStudent}
            mode="login"
            emailPlaceholder="ananya@student.test"
            submitLabel="Sign in as student"
            footer={
              <p className="text-center text-sm text-muted-foreground">
                Parent?{" "}
                <Link href="/parent/login" className="font-medium text-primary hover:underline">
                  Sign in here
                </Link>
                {" · "}
                Teacher?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            }
          />
          <div className="mt-5 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            Sample Grade 10 Physics student
            <br />
            Email:{" "}
            <span className="font-medium text-foreground">{SAMPLE_STUDENT_EMAIL}</span>
            <br />
            Password:{" "}
            <span className="font-medium text-foreground">{SAMPLE_STUDENT_PASSWORD}</span>
            <br />
            Ananya is in Grade 10 Morning and has Physics chapters assigned.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
