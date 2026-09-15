"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTeacherName, type AuthState } from "@/lib/actions/auth";

export function AccountNameForm({ name, email }: { name: string; email: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(updateTeacherName, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="account-name">Your name</Label>
          <Input id="account-name" name="name" defaultValue={name} required className="h-10" autoComplete="name" />
          <p className="text-xs text-content-subtle">Shown to students and parents.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="account-email">Sign-in email</Label>
          <Input id="account-email" value={email} readOnly disabled className="h-10 font-mono text-sm" />
          <p className="text-xs text-content-subtle">Your email can&apos;t be changed here.</p>
        </div>
      </div>
      {state.error ? (
        <p role="alert" className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-fg">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save name"}
      </Button>
    </form>
  );
}
