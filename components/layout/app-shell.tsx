import type { ReactNode } from "react"
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
  return (
    <div data-role={role} className="flex min-h-full flex-1 flex-col bg-canvas">
      <AppNav role={role} user={user} signOut={signOut} />
      <main id="main" className="flex-1 py-8 sm:py-10">
        <Container width="xl">{children}</Container>
      </main>
    </div>
  )
}
