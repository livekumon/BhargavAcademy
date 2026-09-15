import type { ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import { Surface } from "@/components/ui/surface";

/** One titled block on a profile page. */
export function ProfileSection({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <Surface className="flex flex-col gap-4" id={id}>
      <div>
        <h2 className="font-heading text-title-3 font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-sm text-content-muted text-pretty">{description}</p> : null}
      </div>
      {children}
    </Surface>
  );
}

export function FactList({ facts }: { facts: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0">
          <dt className="text-content-subtle">{fact.label}</dt>
          <dd className="tabular mt-0.5 truncate font-medium">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Confirmation after arriving from a create or enrol redirect. */
export function CreatedNotice({ notice, email }: { notice: string | undefined; email: string }) {
  if (notice !== "created" && notice !== "enrolled") return null;
  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-xl border border-success-line bg-success-subtle px-4 py-3 text-sm text-success-subtle-fg"
    >
      <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span className="text-pretty">
        {notice === "enrolled" ? "Enrolled from the enquiry, with a parent login. " : "Login created. "}
        They sign in with <span className="font-mono">{email}</span> and the starting password, then
        choose their own.
      </span>
    </p>
  );
}
