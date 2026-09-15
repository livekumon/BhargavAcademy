import type { ReactNode } from "react"
import { cn } from "cn"
import { AppNav, type AppRole } from "./app-nav"
import { Container } from "./container"

/**
 * The frame for every signed-in page. Setting data-role here re-points the
 * brand tokens, so student and parent pages pick up their tint without any
 * component knowing which portal it is in.
 */
export function AppShell({
  role,
  user,
  signOut,
  children,
}: {
  role: AppRole
  user: { name: string; email: string }
  signOut: () => Promise<void>
  children: ReactNode
}) {
  // Students get a fixed bottom tab bar on phones (see app-nav). Leave room for
  // it, and keep keyboard focus from scrolling underneath it (WCAG 2.2 · 2.4.11).
  const tabBar = role === "student"

  return (
    <div
      data-role={role}
      className={cn(
        "flex min-h-full flex-1 flex-col bg-canvas",
        tabBar && "[html:has(&)]:scroll-pt-20 [html:has(&)]:scroll-pb-24 md:[html:has(&)]:scroll-pb-0"
      )}
    >
      <AppNav role={role} user={user} signOut={signOut} />
      <main
        id="main"
        className={cn(
          "flex-1 py-8 sm:py-10",
          tabBar && "pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-10"
        )}
      >
        <Container width="xl">{children}</Container>
      </main>
    </div>
  )
}
