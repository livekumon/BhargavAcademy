import Link from "next/link";
import { cn } from "cn";

/**
 * The brand mark: a scholar's cap over two stacked rules — one course
 * sitting above the layers of material that hang off it.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-fg shadow-elevation-sm",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="size-5"
      >
        <path d="M12 3 21.5 7.2 12 11.4 2.5 7.2 12 3Z" fill="var(--highlight)" />
        <path
          d="M5 11.2 12 14.4l7-3.2M5 15.4 12 18.6l7-3.2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  className,
  showWordmark = true,
}: {
  href?: string;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <LogoMark />
      {showWordmark ? (
        <span className="font-heading text-lg leading-none font-semibold tracking-tight">
          Bhargav Academy
        </span>
      ) : (
        <span className="sr-only">Bhargav Academy</span>
      )}
    </Link>
  );
}
