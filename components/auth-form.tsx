"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AuthState } from "@/lib/actions/auth";

export function AuthForm({
  action,
  mode,
  emailPlaceholder,
  submitLabel,
  footer,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  mode: "login" | "register";
  emailPlaceholder?: string;
  submitLabel?: string;
  footer?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      {mode === "register" ? (
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Priya Sharma"
            autoComplete="name"
            required
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={emailPlaceholder ?? "teacher@academy.test"}
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          minLength={mode === "register" ? 8 : undefined}
          required
        />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending
          ? mode === "login"
            ? "Signing in..."
            : "Creating account..."
          : submitLabel
            ? submitLabel
            : mode === "login"
              ? "Sign in"
              : "Create teacher account"}
      </Button>

      {footer !== undefined ? (
        footer
      ) : (
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
      )}
    </form>
  );
}
