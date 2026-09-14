import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginParent } from "@/lib/actions/auth";
import { SAMPLE_PARENT_EMAIL, SAMPLE_PARENT_PASSWORD } from "@/lib/seed";

export const metadata: Metadata = {
  title: "Parent sign in",
};

export default function ParentLoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <Logo className="mb-8" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Parent sign in</CardTitle>
          <CardDescription>
            See how your children are progressing through class material and
            assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm
            action={loginParent}
            mode="login"
            emailPlaceholder="parent@academy.test"
            submitLabel="Sign in as parent"
            footer={
              <p className="text-center text-sm text-muted-foreground">
                Student?{" "}
                <Link href="/student/login" className="font-medium text-primary hover:underline">
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
            Sample parent with two children
            <br />
            Email:{" "}
            <span className="font-medium text-foreground">{SAMPLE_PARENT_EMAIL}</span>
            <br />
            Password:{" "}
            <span className="font-medium text-foreground">{SAMPLE_PARENT_PASSWORD}</span>
            <br />
            Priya can see Ananya (Grade 10) and Aarav (Grade 8).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
