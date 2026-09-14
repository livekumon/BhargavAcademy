import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export function CtaBand({
  primaryHref,
  primaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <Container>
      <div className="relative overflow-hidden rounded-2xl bg-inverse-surface px-6 py-14 text-content-inverse sm:px-12 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full bg-[radial-gradient(closest-side,var(--highlight),transparent)] opacity-25"
        />

        <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-heading text-display-3 font-semibold text-balance">
              Set up your first batch in a few minutes.
            </h2>
            <p className="mt-4 text-lead text-content-inverse-muted text-pretty">
              Or sign in to the demo academy and click around first — it comes
              loaded with three batches, shared courses, and real PDFs.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="h-11 bg-highlight px-5 text-[0.9375rem] text-highlight-fg hover:bg-highlight-hover"
              >
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 border-white/25 bg-transparent px-5 text-[0.9375rem] text-content-inverse hover:bg-white/10 hover:text-content-inverse"
              >
                <Link href="/login">Open the demo</Link>
              </Button>
            </div>

            <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-content-inverse-muted">
              <div className="flex gap-2">
                <dt>Email</dt>
                <dd className="font-mono text-content-inverse">
                  teacher@academy.test
                </dd>
              </div>
              <div className="flex gap-2">
                <dt>Password</dt>
                <dd className="font-mono text-content-inverse">Teacher123!</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </Container>
  );
}
