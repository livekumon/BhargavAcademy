import type { ReactNode } from "react";

export function AuthHeading({
  title,
  description,
}: {
  title: ReactNode;
  description: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h1 className="text-display-3 font-semibold text-balance">{title}</h1>
      <p className="text-content-muted text-pretty">{description}</p>
    </div>
  );
}
