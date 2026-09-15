import { CircleAlert } from "lucide-react";

/** Explains why someone landed back on a sign-in page after being signed out. */
export function SignedOutNotice({ notice }: { notice: string | string[] | undefined }) {
  const value = Array.isArray(notice) ? notice[0] : notice;
  if (value !== "suspended") return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-danger-line bg-danger-subtle px-4 py-3 text-sm text-danger-subtle-fg"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p className="text-pretty">
        You were signed out because this account is suspended. Contact the academy admin to
        restore access.
      </p>
    </div>
  );
}
