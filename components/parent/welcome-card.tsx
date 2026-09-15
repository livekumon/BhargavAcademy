"use client";

import { useSyncExternalStore } from "react";
import { BookOpenCheck, FileCheck2, X } from "lucide-react";

const STORAGE_KEY = "bhargav.parent.welcome-dismissed";

const listeners = new Set<() => void>();

function isDismissed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Storage blocked: skip the card rather than show it on every visit.
    return true;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * A one-time explainer for the two words the whole portal is built on.
 * Treated as dismissed on the server, so it never flashes in and out.
 */
export function WelcomeCard() {
  const dismissed = useSyncExternalStore(subscribe, isDismissed, () => true);

  if (dismissed) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    listeners.forEach((listener) => listener());
  }

  return (
    <section
      aria-labelledby="welcome-title"
      className="relative isolate animate-rise overflow-hidden rounded-2xl bg-brand-active p-5 text-content-inverse sm:p-6"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(80%_120%_at_100%_0%,var(--brand-hover),transparent_70%)]"
      />
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss welcome"
        className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full text-content-inverse-muted transition-colors duration-(--dur-fast) hover:bg-white/10 hover:text-content-inverse focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
      <h2 id="welcome-title" className="text-title-2 font-semibold pr-10">
        Welcome to the parent portal
      </h2>
      <p className="mt-1 max-w-xl text-sm text-content-inverse-muted text-pretty">
        Two words tell you almost everything here:
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex gap-3 rounded-xl bg-white/8 p-3 ring-1 ring-white/12">
          <BookOpenCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-highlight" />
          <div>
            <dt className="font-medium">Revised</dt>
            <dd className="text-sm text-content-inverse-muted text-pretty">
              Your child studied a class material the teacher shared.
            </dd>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl bg-white/8 p-3 ring-1 ring-white/12">
          <FileCheck2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-highlight" />
          <div>
            <dt className="font-medium">Submitted</dt>
            <dd className="text-sm text-content-inverse-muted text-pretty">
              Your child uploaded their work for an assignment.
            </dd>
          </div>
        </div>
      </dl>
    </section>
  );
}
