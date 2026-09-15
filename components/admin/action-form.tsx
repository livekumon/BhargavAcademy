"use client";

import { useActionState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import type { AdminFormState } from "@/lib/actions/admin";

type Action = (state: AdminFormState, formData: FormData) => Promise<AdminFormState>;

/** Inline result of an admin action. Announced politely to screen readers. */
export function FormMessage({ state, className }: { state: AdminFormState; className?: string }) {
  if (!state.error && !state.message) return null;
  const error = Boolean(state.error);
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm text-pretty",
        error
          ? "border-danger-line bg-danger-subtle text-danger-subtle-fg"
          : "border-success-line bg-success-subtle text-success-subtle-fg",
        className,
      )}
    >
      {error ? (
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      )}
      {state.error ?? state.message}
    </p>
  );
}

/**
 * A server-action form with a pending state and an inline result. Hidden
 * inputs and fields go in children; `confirm` asks before submitting.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel,
  variant = "default",
  size = "default",
  confirm,
  className,
  footer,
}: {
  action: Action;
  children?: ReactNode;
  submitLabel: ReactNode;
  pendingLabel?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
  size?: "default" | "sm" | "lg";
  confirm?: string;
  className?: string;
  footer?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} aria-busy={pending} className={cn("flex flex-col gap-3", className)}>
      {children}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          variant={variant}
          size={size}
          disabled={pending}
          onClick={(event) => {
            if (confirm && !window.confirm(confirm)) event.preventDefault();
          }}
        >
          {pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : null}
          {pending ? pendingLabel ?? "Saving…" : submitLabel}
        </Button>
        {footer}
      </div>
      <FormMessage state={pending ? {} : state} />
    </form>
  );
}
