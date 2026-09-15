"use client";

import { useActionState, useId, useState } from "react";
import {
  Check,
  CircleAlert,
  Circle,
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
import { changedPasswordChecks } from "@/lib/identity";

const inputClass =
  "h-11 rounded-lg bg-raised pl-10 placeholder:text-content-subtle text-[0.9375rem] shadow-elevation-xs transition-[border-color,box-shadow] duration-(--dur-fast) hover:border-content-subtle/60 md:text-[0.9375rem]";

function strength(password: string) {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^a-z0-9]/i.test(password)) score += 1;
  const clamped = Math.max(1, Math.min(4, score));
  return { score: clamped, label: ["", "Weak", "Fair", "Good", "Strong"][clamped] };
}

export function SetPasswordForm({
  action,
  submitLabel = "Save new password",
  currentPlaceholder = "123456",
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel?: string;
  currentPlaceholder?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const checks = changedPasswordChecks(password, confirm);
  const ready = checks.every((check) => check.met);
  const meter = strength(password);
  const ids = useId();
  const errorId = `${ids}-error`;
  const checksId = `${ids}-checks`;
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
            placeholder={currentPlaceholder}
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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={`${checksId}${error ? ` ${errorId}` : ""}`}
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
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            aria-invalid={error ? true : undefined}
            className={inputClass}
          />
        </div>
      </div>

      <div id={checksId} className="space-y-3 rounded-lg bg-sunken/60 p-3">
        <div className="flex items-center gap-3">
          <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-(--dur-base)",
                  meter.score >= step
                    ? meter.score <= 1
                      ? "bg-danger"
                      : meter.score === 2
                        ? "bg-warning"
                        : "bg-success"
                    : "bg-line",
                )}
              />
            ))}
          </div>
          <span className="w-14 text-right text-xs font-medium text-content-muted" aria-live="polite">
            {meter.label ? `${meter.label}` : ""}
            <span className="sr-only">{meter.label ? " password" : ""}</span>
          </span>
        </div>
        <ul className="grid gap-1.5 text-xs sm:grid-cols-2">
          {checks.map((check) => (
            <li
              key={check.label}
              className={cn(
                "flex items-center gap-1.5",
                check.met ? "text-success-subtle-fg" : "text-content-subtle",
              )}
            >
              {check.met ? (
                <Check aria-hidden="true" className="size-3.5" />
              ) : (
                <Circle aria-hidden="true" className="size-3" />
              )}
              {check.label}
              <span className="sr-only">{check.met ? " (done)" : " (not yet)"}</span>
            </li>
          ))}
        </ul>
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
        disabled={pending || !ready}
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
