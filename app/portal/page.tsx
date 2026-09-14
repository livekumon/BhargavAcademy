import { Section, SectionHeading } from "@/components/layout/section";
import { CtaBand } from "@/components/marketing/cta-band";
import { Faq } from "@/components/marketing/faq";
import { FeatureBento } from "@/components/marketing/feature-bento";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { RoleShowcase } from "@/components/marketing/role-showcase";
import { SharingDiagram } from "@/components/marketing/sharing-diagram";
import { SiteFooter } from "@/components/marketing/site-footer";
import { StatCard } from "@/components/ui/stat-card";
import { getSessionParent, getSessionStudent, getSessionTeacher } from "@/lib/auth";

export default async function HomePage() {
  const [teacher, student, parent] = await Promise.all([
    getSessionTeacher(),
    getSessionStudent(),
    getSessionParent(),
  ]);

  const session = teacher
    ? { href: "/dashboard", label: "Open dashboard" }
    : student
      ? { href: "/student", label: "Open my courses" }
      : parent
        ? { href: "/parent", label: "Open parent dashboard" }
        : null;

  const primaryHref = session?.href ?? "/register";
  const primaryLabel = session ? session.label : "Create your academy";

  return (
    <div className="flex min-h-full flex-col">
      <MarketingNav session={session} />

      <main id="main" className="flex-1">
        <Hero primaryHref={primaryHref} primaryLabel={primaryLabel} />

        <Section id="roles" space="lg" className="border-t border-line bg-surface">
          <SectionHeading
            eyebrow="One platform, three views"
            title="Everyone sees the part that is theirs."
            lead="The same batch looks different depending on who opens it — and nobody has to be told what to look at."
            className="mb-10"
          />
          <RoleShowcase />
        </Section>

        <Section id="how-sharing-works" space="lg">
          <SectionHeading
            align="center"
            eyebrow="The idea it turns on"
            title="Write a course once. Teach it differently."
            lead="Most tools force you to copy a course for every batch, then keep four copies in sync by hand. This one separates the course from the material that hangs off it."
            className="mb-12 items-center"
          />
          <SharingDiagram />
        </Section>

        <Section id="features" space="lg" className="border-y border-line bg-surface">
          <SectionHeading
            eyebrow="What's inside"
            title="Everything a batch actually needs."
            lead="Built around how coaching classes really run — not around a generic course catalogue."
            className="mb-10"
          />
          <FeatureBento />
        </Section>

        <Section space="lg">
          <SectionHeading
            eyebrow="Getting going"
            title="Four steps to your first assigned chapter."
            className="mb-12"
          />
          <HowItWorks />

          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            <StatCard
              value="3"
              label="Demo batches"
              hint="Two share one Physics course with different PDFs."
            />
            <StatCard
              value="20 MB"
              label="Per PDF"
              hint="Preview, replace, or remove without touching other batches."
            />
            <StatCard
              value="3"
              label="Sign-in types"
              hint="Teacher, student, and parent, each with their own view."
            />
          </div>
        </Section>

        <Section id="faq" space="lg" width="md" className="border-t border-line bg-surface">
          <SectionHeading
            eyebrow="Questions"
            title="The things people ask first."
            className="mb-8"
          />
          <Faq />
        </Section>

        <Section space="lg" bleed>
          <CtaBand primaryHref={primaryHref} primaryLabel={primaryLabel} />
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
