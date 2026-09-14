import { Info } from "lucide-react";

/** A quiet one-line pointer to the demo data. Informational, never a call to action. */
export function PrototypeBanner() {
  return (
    <p className="flex items-start gap-2 text-sm text-content-subtle">
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" />
      <span>
        Demo data — open <span className="text-content-muted">Grade 10 Morning</span>{" "}
        and <span className="text-content-muted">Grade 10 Evening</span> to see
        one shared Physics course with different PDFs per batch.
      </span>
    </p>
  );
}
