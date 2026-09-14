"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Submits its surrounding form only after a real confirmation dialog —
 * never the browser's `confirm()`. The dialog names what will be lost, and
 * for the biggest deletions asks the teacher to type the name first.
 */
export function ConfirmSubmitButton({
  message,
  title = "Are you sure?",
  consequences,
  confirmLabel,
  confirmText,
  children,
  variant = "destructive",
  size,
  className,
}: {
  /** One or two sentences explaining what happens. */
  message: string;
  title?: string;
  /** Specific things that will be removed, listed under the message. */
  consequences?: string[];
  /** Defaults to the trigger's own text when that is a plain string. */
  confirmLabel?: string;
  /** When set, the confirm button stays disabled until this exact text is typed. */
  confirmText?: string;
  children: ReactNode;
  variant?: "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-xs";
  className?: string;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [typed, setTyped] = useState("");
  const inputId = useId();
  const blocked = Boolean(confirmText) && typed.trim() !== confirmText;
  const label = confirmLabel ?? (typeof children === "string" ? children : "Confirm");

  return (
    <AlertDialog onOpenChange={(open) => !open && setTyped("")}>
      {/* The dialog is portaled, so this anchor is how we find our form again. */}
      <span ref={anchorRef} hidden />
      <AlertDialogTrigger asChild>
        <Button type="button" variant={variant} size={size} className={className}>
          {children}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <div className="flex gap-4">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-subtle text-danger-subtle-fg"
          >
            <TriangleAlert className="size-5" />
          </span>
          <div className="min-w-0 space-y-2">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{message}</AlertDialogDescription>
            {consequences && consequences.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-content-muted">
                {consequences.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {confirmText ? (
          <div className="space-y-2">
            <Label htmlFor={inputId} className="text-sm font-normal text-content-muted">
              Type <span className="font-semibold text-content">{confirmText}</span> to confirm
            </Label>
            <Input
              id={inputId}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              className="h-10"
            />
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={blocked}
            onClick={() => anchorRef.current?.closest("form")?.requestSubmit()}
          >
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
