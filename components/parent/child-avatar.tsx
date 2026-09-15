import { cn } from "cn";
import { initials } from "@/lib/parent-insights";

/*
 * Siblings get different tints so a parent can tell them apart at a glance.
 * Brand first, then the rationed highlight, then two status hues used purely
 * decoratively here.
 */
const tints = [
  "bg-brand-subtle text-brand-subtle-fg ring-brand-line",
  "bg-highlight-subtle text-highlight-subtle-fg ring-highlight-line",
  "bg-info-subtle text-info-subtle-fg ring-info-line",
  "bg-success-subtle text-success-subtle-fg ring-success-line",
] as const;

const sizes = {
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-xl sm:size-20 sm:text-2xl",
} as const;

export function ChildAvatar({
  name,
  index = 0,
  size = "md",
  className,
}: {
  name: string;
  index?: number;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-heading flex shrink-0 items-center justify-center rounded-full font-semibold ring-1",
        tints[index % tints.length],
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
