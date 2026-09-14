"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MousePointerClick,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type AuthState } from "@/lib/actions/auth";

export type DemoAccount = {
  /** Who the demo person is, e.g. "Priya Sharma". */
  name: string;
  /** One line on what they will see. */
  description: string;
  email: string;
  password: string;
};

const MIN_PASSWORD = 8;

const inputClass =
  "h-11 rounded-lg bg-raised pl-10 placeholder:text-content-subtle text-[0.9375rem] shadow-elevation-xs transition-[border-color,box-shadow] duration-(--dur-fast) hover:border-content-subtle/60 md:text-[0.9375rem]";

function FieldIcon({ icon: Icon }: { icon: typeof Mail }) {
  return (
    <Icon
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-content-subtle transition-colors duration-(--dur-fast) group-focus-within/field:text-brand"
    />
  );
}

export function AuthForm({
  action,
  mode,
  emailPlaceholder = "name@example.com",
  submitLabel,
  demo,
  help,
  footer,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  mode: "login" | "register";
  emailPlaceholder?: string;
  submitLabel?: string;
  /** A sample account that can be filled in with one click. */
  demo?: DemoAccount;
  /** Guidance shown under "Trouble signing in?". */
  help?: ReactNode;
  footer?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  // Controlled, so React's automatic form reset after the action doesn't wipe
  // what someone typed when the server sends back an error.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const passwordRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const ids = useId();
  const errorId = `${ids}-error`;
  const passwordHintId = `${ids}-password-hint`;
  const capsId = `${ids}-caps`;

  const error = pending ? undefined : state.error;
  const isRegister = mode === "register";
  const meetsLength = password.length >= MIN_PASSWORD;
  const label = submitLabel ?? (isRegister ? "Create account" : "Sign in");

  // After a failed attempt, put the cursor back where the fix usually is.
  useEffect(() => {
    if (state.error && passwordRef.current) {
      passwordRef.current.focus();
      passwordRef.current.select();
    }
  }, [state]);

  function trackCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState("CapsLock"));
  }

  function fillDemo() {
    if (!demo) return;
    setEmail(demo.email);
    setPassword(demo.password);
    setAnnouncement(`Filled in ${demo.name}'s demo details. Press ${label} to continue.`);
    submitRef.current?.focus();
  }

  const describedBy = (...parts: Array<string | false>) =>
    parts.filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        // Mask the password again before the browser offers to save it.
        onSubmit={() => setShowPassword(false)}
        aria-busy={pending}
        className="space-y-5"
      >
        {isRegister ? (
          <div className="space-y-2">
            <Label htmlFor={`${ids}-name`}>Full name</Label>
            <div className="group/field relative">
              <FieldIcon icon={UserRound} />
              <Input
                id={`${ids}-name`}
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Priya Sharma"
                autoComplete="name"
                minLength={2}
                required
                className={inputClass}
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor={`${ids}-email`}>Email</Label>
          <div className="group/field relative">
            <FieldIcon icon={Mail} />
            <Input
              id={`${ids}-email`}
              name="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={emailPlaceholder}
              autoComplete={isRegister ? "email" : "username"}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy(Boolean(error) && errorId)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${ids}-password`}>Password</Label>
          <div className="group/field relative">
            <FieldIcon icon={LockKeyhole} />
            <Input
              ref={passwordRef}
              id={`${ids}-password`}
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={trackCapsLock}
              onKeyUp={trackCapsLock}
              onBlur={() => setCapsLock(false)}
              placeholder={isRegister ? `At least ${MIN_PASSWORD} characters` : "Your password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              minLength={isRegister ? MIN_PASSWORD : undefined}
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy(
                isRegister && passwordHintId,
                capsLock && capsId,
                Boolean(error) && errorId,
              )}
              className={cn(inputClass, "pr-12")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              // Keep focus (and the caret) in the field while toggling.
              onMouseDown={(event) => event.preventDefault()}
              aria-controls={`${ids}-password`}
              aria-pressed={showPassword}
              // A toggle keeps one name; aria-pressed carries the state.
              aria-label="Show password"
              title={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-content-subtle transition-colors duration-(--dur-fast) hover:bg-sunken hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {isRegister ? (
            <p
              id={passwordHintId}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors duration-(--dur-base)",
                meetsLength ? "text-success-subtle-fg" : "text-content-subtle",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-4 items-center justify-center rounded-full ring-1 transition-colors duration-(--dur-base)",
                  meetsLength ? "bg-success text-success-fg ring-success" : "ring-line-strong",
                )}
              >
                {meetsLength ? <Check className="size-2.5" strokeWidth={3} /> : null}
              </span>
              At least {MIN_PASSWORD} characters
            </p>
          ) : null}

          <div aria-live="polite">
            {capsLock ? (
              <p
                id={capsId}
                className="flex animate-fade-in items-center gap-1.5 text-xs font-medium text-warning-subtle-fg"
              >
                <TriangleAlert aria-hidden="true" className="size-3.5" />
                Caps Lock is on
              </p>
            ) : null}
          </div>
        </div>

        {error ? (
          <div
            id={errorId}
            role="alert"
            className="flex animate-rise items-start gap-2.5 rounded-lg border border-danger-line bg-danger-subtle px-3.5 py-3 text-sm text-danger-subtle-fg"
          >
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-medium">{error}</span>
              {!isRegister ? (
                <span className="block text-danger-subtle-fg/80">
                  Check for typos, or show the password to see what you entered.
                </span>
              ) : null}
            </span>
          </div>
        ) : null}

        <Button
          ref={submitRef}
          type="submit"
          size="lg"
          disabled={pending}
          className="group/submit h-11 w-full text-[0.9375rem] shadow-elevation-brand hover:bg-brand-hover disabled:opacity-80"
        >
          {pending ? (
            <>
              <LoaderCircle aria-hidden="true" className="animate-spin" />
              {isRegister ? "Creating your account…" : "Signing you in…"}
            </>
          ) : (
            <>
              {label}
              <ArrowRight
                aria-hidden="true"
                className="transition-transform duration-(--dur-base) ease-out-quart group-hover/submit:translate-x-0.5"
              />
            </>
          )}
        </Button>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </form>

      {help ? (
        <details className="group rounded-lg text-sm">
          <summary className="w-fit cursor-pointer list-none rounded-md font-medium text-content-muted transition-colors duration-(--dur-fast) hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
            Trouble signing in?
          </summary>
          <div className="mt-2 animate-fade-in text-content-muted text-pretty">{help}</div>
        </details>
      ) : null}

      {demo ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-content-subtle uppercase">
            <span className="h-px flex-1 bg-line" />
            Or explore the demo
            <span className="h-px flex-1 bg-line" />
          </div>
          <button
            type="button"
            onClick={fillDemo}
            className="group/demo flex w-full items-center gap-3 rounded-xl border border-dashed border-line-strong bg-surface/70 p-3 text-left transition-[border-color,background-color,box-shadow] duration-(--dur-base) ease-out-quart hover:border-brand-line hover:bg-brand-subtle/60 hover:shadow-elevation-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-fg">
              {demo.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{demo.name}</span>
              <span className="block text-xs text-content-subtle text-pretty">
                {demo.description}
              </span>
              <span className="mt-1 flex flex-wrap gap-x-1.5 font-mono text-[0.6875rem] text-content-muted">
                <span className="break-all">{demo.email}</span>
                <span aria-hidden="true">·</span>
                <span>{demo.password}</span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand transition-colors group-hover/demo:bg-raised">
              <MousePointerClick aria-hidden="true" className="size-3.5" />
              Use
            </span>
          </button>
        </div>
      ) : null}

      {footer ? <div className="text-center text-sm text-content-muted">{footer}</div> : null}
    </div>
  );
}
