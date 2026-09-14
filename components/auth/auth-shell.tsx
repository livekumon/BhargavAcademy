import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { PortalRole } from "@/components/auth/portals";
import { Logo } from "@/components/logo";

/**
 * The frame for every sign-in and sign-up page: the form on the left, a
 * role-tinted panel showing what waits on the other side on the right.
 * Below `lg` the panel drops away and the form has the screen to itself.
 */
export function AuthShell({
  role,
  showcase,
  children,
}: {
  role: PortalRole;
  showcase: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      data-role={role}
      className="relative isolate grid min-h-dvh flex-1 bg-canvas lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]"
    >
      <div className="relative flex min-w-0 flex-col px-5 py-5 sm:px-10 lg:px-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(70%_65%_at_15%_0%,var(--brand-subtle),transparent)]"
        />

        <header className="flex items-center justify-between gap-4">
          <Logo />
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-content-muted transition-colors duration-(--dur-fast) hover:bg-sunken hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform duration-(--dur-base) ease-out-quart group-hover:-translate-x-0.5"
            />
            Home
          </Link>
        </header>

        <main id="main" className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-[26rem] animate-rise">{children}</div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-content-subtle">
          <span>© Bhargav Academy</span>
          <span>You stay signed in on this device for 7 days.</span>
        </footer>
      </div>

      <div className="hidden p-3 lg:block">
        <div className="sticky top-3 h-[calc(100dvh-1.5rem)] min-h-[40rem]">
          {showcase}
        </div>
      </div>
    </div>
  );
}
