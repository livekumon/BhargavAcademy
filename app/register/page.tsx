import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { registerTeacher } from "@/lib/actions/auth";

export const metadata: Metadata = {
  title: "Create teacher account",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <Logo className="mb-8" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Create your workspace</CardTitle>
          <CardDescription>
            Register as a teacher to start adding courses and chapter PDFs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm action={registerTeacher} mode="register" />
        </CardContent>
      </Card>
    </div>
  );
}
