"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  KeyRound,
  LogOut,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { cn } from "cn";
import { Logo, LogoMark } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { openCommandPalette } from "./command-palette";
import { teacherNav, type TeacherNavItem } from "./nav";

export const SIDEBAR_COOKIE = "ba_sidebar";

type Badges = { leads: number };
type User = { name: string; email: string };
/** A second workspace this person can open, e.g. an admin's academy console. */
type PortalSwitch = { href: string; label: string };

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-semibold text-brand-subtle-fg ring-1 ring-brand-line",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

function BadgeCount({ value, className }: { value: number; className?: string }) {
  if (value <= 0) return null;
  return (
    <span
      className={cn(
        "tabular inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-highlight px-1.5 text-[0.6875rem] font-semibold text-highlight-fg",
        className,
      )}
    >
      {value > 99 ? "99+" : value}
      <span className="sr-only"> new</span>
    </span>
  );
}

function AccountMenu({
  user,
  signOut,
  switchPortal,
  collapsed,
  side = "top",
}: {
  user: User;
  signOut: () => Promise<void>;
  switchPortal?: PortalSwitch;
  collapsed?: boolean;
  side?: "top" | "bottom";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors duration-(--dur-fast) hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            collapsed && "justify-center",
          )}
        >
          <Avatar name={user.name} />
          {collapsed ? null : (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-content-subtle">{user.email}</span>
            </span>
          )}
          <span className="sr-only">Open account menu</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent data-role="teacher" side={side} align="start" className="w-64 p-1.5">
        <DropdownMenuLabel className="flex items-center gap-2.5 p-2">
          <Avatar name={user.name} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-content">{user.name}</span>
            <span className="block truncate text-xs font-normal text-content-subtle">{user.email}</span>
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
        <DropdownMenuItem asChild className="gap-2 p-2">
          <Link href="/dashboard/settings?section=account">
            <KeyRound aria-hidden="true" />
            Account and password
          </Link>
        </DropdownMenuItem>
        <form action={signOut}>
          <DropdownMenuItem asChild className="w-full gap-2 p-2" onSelect={(event) => event.preventDefault()}>
            <button type="submit">
              <LogOut aria-hidden="true" />
              Sign out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  badge,
}: {
  item: TeacherNavItem;
  active: boolean;
  collapsed: boolean;
  badge: number;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors duration-(--dur-fast) focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        collapsed && "justify-center px-0",
        active
          ? "bg-brand-subtle text-brand-subtle-fg"
          : "text-content-muted hover:bg-sunken hover:text-content",
      )}
    >
      {active ? (
        <span aria-hidden="true" className="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-brand" />
      ) : null}
      <item.icon aria-hidden="true" className="size-4 shrink-0" />
      {collapsed ? (
        <>
          <span className="sr-only">{item.label}</span>
          {badge > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-highlight ring-2 ring-surface" />
          ) : null}
        </>
      ) : (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          <BadgeCount value={badge} />
        </>
      )}
    </Link>
  );
}

/**
 * Desktop sidebar. Collapses to icons; the choice lives in a cookie so the
 * server renders the right width and nothing jumps on load.
 */
export function TeacherSidebar({
  user,
  signOut,
  switchPortal,
  badges,
  defaultCollapsed,
}: {
  user: User;
  signOut: () => Promise<void>;
  switchPortal?: PortalSwitch;
  badges: Badges;
  defaultCollapsed: boolean;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "open"}; path=/; max-age=31536000; SameSite=Lax`;
  }

  return (
    <aside
      aria-label="Teacher navigation"
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface/70 py-4 backdrop-blur-xl transition-[width] duration-(--dur-base) ease-out-quart lg:flex",
        collapsed ? "w-[4.25rem] px-2" : "w-64 px-3",
      )}
    >
      <div className={cn("flex items-center gap-2 px-1", collapsed && "justify-center px-0")}>
        {collapsed ? (
          <Link
            href="/dashboard"
            className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <LogoMark />
            <span className="sr-only">Bhargav Academy</span>
          </Link>
        ) : (
          <Logo href="/dashboard" />
        )}
      </div>

      <button
        type="button"
        onClick={openCommandPalette}
        className={cn(
          "mt-5 flex h-9 items-center gap-2 rounded-lg bg-sunken px-2.5 text-sm text-content-subtle ring-1 ring-line transition-colors duration-(--dur-fast) hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          collapsed && "justify-center px-0",
        )}
      >
        <Search aria-hidden="true" className="size-4 shrink-0" />
        {collapsed ? (
          <span className="sr-only">Search</span>
        ) : (
          <>
            <span className="flex-1 text-left">Search…</span>
            <kbd className="rounded bg-surface px-1.5 font-mono text-[0.6875rem] ring-1 ring-line">⌘K</kbd>
          </>
        )}
      </button>

      <nav aria-label="Primary" className="mt-4 flex-1 overflow-y-auto">
        {teacherNav.map((group) => (
          <div key={group.label} className="mt-4 first:mt-0">
            {collapsed ? (
              <div aria-hidden="true" className="mx-2 mb-2 h-px bg-line" />
            ) : (
              <p className="px-2.5 pb-1.5 text-[0.6875rem] font-medium tracking-wide text-content-subtle uppercase">
                {group.label}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    active={item.isActive(pathname)}
                    collapsed={collapsed}
                    badge={item.badge ? badges[item.badge] : 0}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-1 border-t border-line pt-3">
        <AccountMenu user={user} signOut={signOut} switchPortal={switchPortal} collapsed={collapsed} />
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          className={cn(
            "flex h-8 items-center gap-2 rounded-lg px-2.5 text-xs text-content-subtle transition-colors duration-(--dur-fast) hover:bg-sunken hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" className="size-4" />
          ) : (
            <PanelLeftClose aria-hidden="true" className="size-4" />
          )}
          <span className={collapsed ? "sr-only" : undefined}>
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
        </button>
      </div>
    </aside>
  );
}

const PRIMARY_MOBILE = ["/dashboard", "/dashboard/batches", "/dashboard/students", "/dashboard/leads"];

/** Below `lg`: a slim top bar plus a bottom tab bar within thumb reach. */
export function TeacherMobileNav({
  user,
  signOut,
  switchPortal,
  badges,
}: {
  user: User;
  signOut: () => Promise<void>;
  switchPortal?: PortalSwitch;
  badges: Badges;
}) {
  const pathname = usePathname();
  const items = teacherNav.flatMap((group) => group.items);
  const primary = PRIMARY_MOBILE.map((href) => items.find((item) => item.href === href)!);
  const secondary = items.filter((item) => !PRIMARY_MOBILE.includes(item.href));
  const moreActive = secondary.some((item) => item.isActive(pathname));

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-line bg-canvas/85 px-4 backdrop-blur-xl lg:hidden">
        <Logo href="/dashboard" showWordmark={false} />
        <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide text-brand-subtle-fg uppercase">
          Teacher
        </span>
        <button
          type="button"
          onClick={openCommandPalette}
          className="ml-auto flex size-10 items-center justify-center rounded-lg text-content-muted hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Search aria-hidden="true" className="size-5" />
          <span className="sr-only">Search</span>
        </button>
        <div className="w-10">
          <AccountMenu user={user} signOut={signOut} switchPortal={switchPortal} collapsed side="bottom" />
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {primary.map((item) => {
            const active = item.isActive(pathname);
            const badge = item.badge ? badges[item.badge] : 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium focus-visible:bg-sunken focus-visible:outline-none",
                    active ? "text-brand" : "text-content-muted",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-(--dur-base)",
                      active && "bg-brand-subtle",
                    )}
                  >
                    <item.icon aria-hidden="true" className="size-5" />
                    <BadgeCount value={badge} className="absolute -top-1.5 -right-1 h-4 min-w-4 px-1 text-[0.625rem]" />
                  </span>
                  {item.label === "Course library" ? "Library" : item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-16 w-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium focus-visible:bg-sunken focus-visible:outline-none",
                    moreActive ? "text-brand" : "text-content-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-12 items-center justify-center rounded-full",
                      moreActive && "bg-brand-subtle",
                    )}
                  >
                    <MoreHorizontal aria-hidden="true" className="size-5" />
                  </span>
                  More
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" title="More" description="Other teacher pages">
                <ul data-role="teacher" className="grid gap-1 pb-[env(safe-area-inset-bottom)]">
                  {secondary.map((item) => (
                    <li key={item.href}>
                      <SheetClose asChild>
                        <Link
                          href={item.href}
                          aria-current={item.isActive(pathname) ? "page" : undefined}
                          className="flex h-12 items-center gap-3 rounded-lg px-3 font-medium text-content-muted hover:bg-sunken hover:text-content aria-[current=page]:bg-brand-subtle aria-[current=page]:text-brand-subtle-fg"
                        >
                          <item.icon aria-hidden="true" className="size-5" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </>
  );
}
