import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/logo";

const columns = [
  {
    heading: "Product",
    links: [
      { href: "#roles", label: "Who it's for" },
      { href: "#how-sharing-works", label: "How it works" },
      { href: "#features", label: "Features" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    heading: "Sign in",
    links: [
      { href: "/login", label: "Teacher" },
      { href: "/student/login", label: "Student" },
      { href: "/parent/login", label: "Parent" },
      { href: "/register", label: "Create an account" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm text-content-muted text-pretty">
              A workspace for coaching academies: batches, shared courses,
              per-batch material, and progress that students and parents can
              see for themselves.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="font-heading text-sm font-semibold">
                {column.heading}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) =>
                  link.href.startsWith("#") ? (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="rounded text-sm text-content-muted transition-colors duration-(--dur-fast) hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="rounded text-sm text-content-muted transition-colors duration-(--dur-fast) hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="text-sm text-content-subtle">
            Prototype build · records and uploads stay on this machine.
          </p>
        </div>
      </Container>
    </footer>
  );
}
