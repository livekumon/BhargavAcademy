"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeftRight,
  BookMarked,
  Gauge,
  GraduationCap,
  HeartHandshake,
  History,
  Inbox,
  LayoutGrid,
  LogOut,
  Menu,
  PenLine,
  Settings,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Container } from "./container"

export type AppRole = "teacher" | "student" | "parent" | "admin"

/** A second workspace the signed-in person can open, e.g. an admin's own teaching. */
export type PortalSwitch = { href: string; label: string }

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  isActive: (pathname: string) => boolean
}

/*
 * Navigation lives here rather than in each layout so that active-state rules
 * are functions, which cannot be passed from a server layout.
 */
const navByRole: Record<
  AppRole,
  {
    home: string
    label: string
    items: NavItem[]
    /** On phones, show items as a bottom tab bar instead of the menu sheet. */
    tabBar?: boolean
  }
> = {
  teacher: {
    home: "/dashboard",
    label: "Teacher",
    items: [
      {
        href: "/dashboard",
        label: "Batches",
        icon: LayoutGrid,
        isActive: (p) => p === "/dashboard" || p.startsWith("/dashboard/batches"),
      },
      {
        href: "/dashboard/students",
        label: "Students",
        icon: Users,
        isActive: (p) => p.startsWith("/dashboard/students"),
      },
      {
        href: "/dashboard/parents",
        label: "Parents",
        icon: HeartHandshake,
        isActive: (p) => p.startsWith("/dashboard/parents"),
      },
      {
        href: "/dashboard/leads",
        label: "Leads",
        icon: Inbox,
        isActive: (p) => p.startsWith("/dashboard/leads"),
      },
      {
        href: "/dashboard/courses",
        label: "Course library",
        icon: BookMarked,
        isActive: (p) => p.startsWith("/dashboard/courses"),
      },
    ],
  },
  admin: {
    home: "/admin",
    label: "Admin",
    items: [
      {
        href: "/admin",
        label: "Overview",
        icon: Gauge,
        isActive: (p) => p === "/admin",
      },
      {
        href: "/admin/people",
        label: "People",
        icon: Users,
        isActive: (p) =>
          p.startsWith("/admin/people") ||
          p.startsWith("/admin/teachers") ||
          p.startsWith("/admin/students") ||
          p.startsWith("/admin/parents"),
      },
      {
        href: "/admin/batches",
        label: "Batches",
        icon: LayoutGrid,
        isActive: (p) => p.startsWith("/admin/batches"),
      },
      {
        href: "/admin/leads",
        label: "Leads",
        icon: Inbox,
        isActive: (p) => p.startsWith("/admin/leads"),
      },
      {
        href: "/admin/activity",
        label: "Activity",
        icon: History,
        isActive: (p) => p.startsWith("/admin/activity"),
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: Settings,
        isActive: (p) => p.startsWith("/admin/settings"),
      },
    ],
  },
  student: {
    home: "/student",
    label: "Student",
    tabBar: true,
    items: [
      {
        href: "/student",
        label: "Today",
        icon: Sun,
        isActive: (p) => p === "/student",
      },
      {
        href: "/student/courses",
        label: "Courses",
        icon: GraduationCap,
        isActive: (p) => p.startsWith("/student/courses") || p.startsWith("/student/materials"),
      },
      {
        href: "/student/marks",
        label: "Marks",
        icon: PenLine,
        isActive: (p) => p.startsWith("/student/marks"),
      },
    ],
  },
  parent: {
    home: "/parent",
    label: "Parent",
    items: [
      {
        href: "/parent",
        label: "My children",
        icon: Users,
        isActive: (p) => p === "/parent" || p.startsWith("/parent/students"),
      },
    ],
  },
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-semibold text-brand-subtle-fg ring-1 ring-brand-line",
        className
      )}
    >
      {initials(name)}
    </span>
  )
}

export function AppNav({
  role,
  user,
  signOut,
  switchPortal,
}: {
  role: AppRole
  user: { name: string; email: string }
  signOut: () => Promise<void>
  switchPortal?: PortalSwitch
}) {
  const pathname = usePathname()
  const config = navByRole[role]

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <Container width="xl" className="flex h-16 items-center gap-6">
        <div className="flex items-center gap-3">
          <Logo href={config.home} />
          <span className="hidden rounded-full bg-brand-subtle px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide text-brand-subtle-fg uppercase sm:inline">
            {config.label}
          </span>
        </div>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {config.items.map((item) => {
              const active = item.isActive(pathname)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-(--dur-fast) focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      active
                        ? "bg-brand-subtle text-brand-subtle-fg"
                        : "text-content-muted hover:bg-sunken hover:text-content"
                    )}
                  >
                    <item.icon aria-hidden="true" className="size-4" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "items-center gap-2.5 rounded-full py-1 pr-3 pl-1 text-left transition-colors duration-(--dur-fast) hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:flex",
                  config.tabBar ? "flex p-1.5 md:py-1 md:pr-3 md:pl-1" : "hidden"
                )}
              >
                <Avatar name={user.name} />
                <span className={cn("max-w-40 truncate text-sm font-medium", config.tabBar && "hidden md:inline")}>
                  {user.name}
                </span>
                <span className="sr-only">Open account menu</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-role={role} align="end" className="w-64 p-1.5">
              <DropdownMenuLabel className="flex items-center gap-2.5 p-2">
                <Avatar name={user.name} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-content">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs font-normal text-content-subtle">
                    {user.email}
                  </span>
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {switchPortal ? (
                <DropdownMenuItem asChild className="gap-2 p-2">
                  <Link href={switchPortal.href}>
                    <ArrowLeftRight aria-hidden="true" />
                    {switchPortal.label}
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <form action={signOut}>
                <DropdownMenuItem
                  asChild
                  className="w-full gap-2 p-2"
                  onSelect={(event) => event.preventDefault()}
                >
                  <button type="submit">
                    <LogOut aria-hidden="true" />
                    Sign out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>

          {config.tabBar ? null : (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-lg" className="md:hidden">
                <Menu className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" title="Menu" description="App navigation and account">
              <div data-role={role} className="flex h-full flex-col gap-6">
                <Logo href={config.home} className="w-fit" />

                <nav aria-label="Mobile">
                  <ul className="flex flex-col gap-1">
                    {config.items.map((item) => {
                      const active = item.isActive(pathname)
                      return (
                        <li key={item.href}>
                          <SheetClose asChild>
                            <Link
                              href={item.href}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors duration-(--dur-fast)",
                                active
                                  ? "bg-brand-subtle text-brand-subtle-fg"
                                  : "text-content-muted hover:bg-sunken hover:text-content"
                              )}
                            >
                              <item.icon aria-hidden="true" className="size-4" />
                              {item.label}
                            </Link>
                          </SheetClose>
                        </li>
                      )
                    })}
                  </ul>
                </nav>

                <div className="mt-auto flex flex-col gap-3 border-t border-line pt-5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={user.name} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{user.name}</span>
                      <span className="block truncate text-xs text-content-subtle">
                        {user.email}
                      </span>
                    </span>
                  </div>
                  {switchPortal ? (
                    <SheetClose asChild>
                      <Button asChild variant="secondary" size="lg" className="w-full">
                        <Link href={switchPortal.href}>
                          <ArrowLeftRight data-icon="inline-start" />
                          {switchPortal.label}
                        </Link>
                      </Button>
                    </SheetClose>
                  ) : null}
                  <form action={signOut}>
                    <Button type="submit" variant="outline" size="lg" className="w-full">
                      <LogOut data-icon="inline-start" />
                      Sign out
                    </Button>
                  </form>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          )}
        </div>
      </Container>
    </header>

    {config.tabBar ? (
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${config.items.length}, minmax(0, 1fr))` }}>
          {config.items.map((item) => {
            const active = item.isActive(pathname)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-(--dur-fast) focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset",
                    active ? "text-brand" : "text-content-muted hover:text-content"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-14 items-center justify-center rounded-full transition-colors duration-(--dur-base)",
                      active && "bg-brand-subtle"
                    )}
                  >
                    <item.icon aria-hidden="true" className="size-5" />
                  </span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    ) : null}
    </>
  )
}
