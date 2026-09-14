"use client";

import { useActionState, useId, useState } from "react";
import {
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AuthState } from "@/lib/actions/auth";

const inputClass =
  "h-11 rounded-lg bg-raised pl-10 placeholder:text-content-subtle text-[0.9375rem] shadow-elevation-xs transition-[border-color,box-shadow] duration-(--dur-fast) hover:border-content-subtle/60 md:text-[0.9375rem]";

export function SetPasswordForm({
  action,
  submitLabel = "Save new password",
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [showPassword, setShowPassword] = useState(false);
  const ids = useId();
  const errorId = `${ids}-error`;
  const error = pending ? undefined : state.error;

  return (
    <form action={formAction} aria-busy={pending} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor={`${ids}-current`}>Current password</Label>
        <div className="group/field relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-content-subtle transition-colors duration-(--dur-fast) group-focus-within/field:text-brand"
          />
          <Input
            id={`${ids}-current`}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            placeholder="123456"
            required
            aria-invalid={error ? true : undefined}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${ids}-password`}>New password</Label>
        <div className="group/field relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-content-subtle transition-colors duration-(--dur-fast) group-focus-within/field:text-brand"
          />
          <Input
            id={`${ids}-password`}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(inputClass, "pr-12")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            onMouseDown={(event) => event.preventDefault()}
            aria-controls={`${ids}-password`}
            aria-pressed={showPassword}
            aria-label="Show password"
            title={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-content-subtle transition-colors duration-(--dur-fast) hover:bg-sunken hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${ids}-confirm`}>Confirm new password</Label>
        <div className="group/field relative">
          <LockKeyhole
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-content-subtle transition-colors duration-(--dur-fast) group-focus-within/field:text-brand"
          />
          <Input
            id={`${ids}-confirm`}
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat the new password"
            minLength={8}
            required
            aria-invalid={error ? true : undefined}
            className={inputClass}
          />
        </div>
      </div>

      {error ? (
        <div
          id={errorId}
          role="alert"
          className="flex animate-rise items-start gap-2.5 rounded-lg border border-danger-line bg-danger-subtle px-3.5 py-3 text-sm text-danger-subtle-fg"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="h-11 w-full text-[0.9375rem] shadow-elevation-brand hover:bg-brand-hover disabled:opacity-80"
      >
        {pending ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Saving…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
