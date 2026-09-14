import Link from "next/link";
import { ArrowRight, Smartphone, Sparkles, ShieldCheck } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "./hero-visual";

const assurances = [
  { icon: Sparkles, label: "Demo account ready — no setup" },
  { icon: Smartphone, label: "Works on any phone" },
  { icon: ShieldCheck, label: "Your data stays on your machine" },
];

export function Hero({
  primaryHref,
  primaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28">
      {/* Warm wash behind the fold; purely decorative. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 h-[36rem] bg-[radial-gradient(60%_55%_at_50%_0%,var(--brand-subtle),transparent_70%)] opacity-70"
      />

      <Container className="relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-highlight-subtle px-3 py-1 text-xs font-medium tracking-wide text-highlight-subtle-fg uppercase">
              Built for coaching academies
            </span>

            <h1 className="font-heading mt-5 max-w-[15ch] text-display-1 font-semibold text-balance">
              Run the academy,{" "}
              <span className="underline-highlight">not the paperwork</span>.
            </h1>

            <p className="mt-6 max-w-xl text-lead text-content-muted text-pretty">
              Share one course across every batch, assign material student by
              student, and give parents a live view of how their child is
              actually doing.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-11 px-5 text-[0.9375rem] shadow-elevation-brand"
              >
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="h-11 px-4">
                <Link href="/login">Explore the demo</Link>
              </Button>
            </div>

            <ul className="mt-10 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {assurances.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 text-sm text-content-muted"
                >
                  <item.icon
                    aria-hidden="true"
                    className="size-4 shrink-0 text-brand"
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:pl-4">
            <HeroVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}
