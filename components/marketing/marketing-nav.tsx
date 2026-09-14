"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, GraduationCap, Menu, Presentation, Users } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { href: "#roles", label: "Who it's for" },
  { href: "#how-sharing-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
];

const signIns = [
  {
    href: "/login",
    label: "Teacher",
    hint: "Batches, courses, material",
    icon: Presentation,
  },
  {
    href: "/student/login",
    label: "Student",
    hint: "Your work and marks",
    icon: GraduationCap,
  },
  {
    href: "/parent/login",
    label: "Parent",
    hint: "Your child's progress",
    icon: Users,
  },
];

export function MarketingNav({
  session,
}: {
  /** Set when someone already has a session, so the nav offers one door back in. */
  session?: { href: string; label: string } | null;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="sticky top-0 z-50 border-b border-transparent transition-colors duration-(--dur-base) data-scrolled:border-line data-scrolled:bg-canvas/85 data-scrolled:backdrop-blur-xl"
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-content-muted transition-colors duration-(--dur-fast) hover:bg-sunken hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          {session ? (
            <Button asChild size="lg">
              <Link href={session.href}>{session.label}</Link>
            </Button>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="lg" className="hidden sm:inline-flex">
                    Sign in
                    <ChevronDown data-icon="inline-end" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-1.5">
                  <DropdownMenuLabel className="text-content-subtle">
                    I am a…
                  </DropdownMenuLabel>
                  {signIns.map((item) => (
                    <DropdownMenuItem key={item.href} asChild className="gap-2.5 p-2">
                      <Link href={item.href}>
                        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-subtle text-brand-subtle-fg">
                          <item.icon className="size-4" />
                        </span>
                        <span className="flex flex-col">
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="text-xs text-content-subtle">
                            {item.hint}
                          </span>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button asChild size="lg" className="hidden sm:inline-flex">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-lg" className="lg:hidden">
                <Menu className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              title="Menu"
              description="Site navigation and sign-in options"
            >
              <Logo className="w-fit" />

              <nav aria-label="Mobile">
                <ul className="flex flex-col gap-1">
                  {links.map((link) => (
                    <li key={link.href}>
                      <SheetClose asChild>
                        <a
                          href={link.href}
                          className="block rounded-lg px-3 py-2.5 font-medium text-content-muted transition-colors duration-(--dur-fast) hover:bg-sunken hover:text-content"
                        >
                          {link.label}
                        </a>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-auto flex flex-col gap-2">
                {session ? (
                  <SheetClose asChild>
                    <Button asChild size="lg">
                      <Link href={session.href}>{session.label}</Link>
                    </Button>
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild size="lg">
                        <Link href="/register">Get started</Link>
                      </Button>
                    </SheetClose>
                    <p className="px-1 pt-2 text-xs font-medium tracking-wide text-content-subtle uppercase">
                      Sign in as
                    </p>
                    {signIns.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Button asChild variant="outline" size="lg" className="justify-start">
                          <Link href={item.href}>
                            <item.icon data-icon="inline-start" />
                            {item.label}
                          </Link>
                        </Button>
                      </SheetClose>
                    ))}
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
