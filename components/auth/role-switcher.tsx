import Link from "next/link";
import { portals, type PortalRole } from "@/components/auth/portals";

/**
 * A segmented control of real links, so anyone who arrived at the wrong door
 * can switch in one tap. Each option carries its own `data-role`, so the
 * active pill is tinted with that portal's colour.
 */
export function RoleSwitcher({ current }: { current: PortalRole }) {
  return (
    <nav aria-label="Choose how you sign in">
      <ul className="grid grid-cols-3 gap-1 rounded-xl bg-sunken p-1 ring-1 ring-line">
        {portals.map((portal) => {
          const active = portal.role === current;
          return (
            <li key={portal.role} data-role={portal.role}>
              <Link
                href={portal.href}
                aria-current={active ? "page" : undefined}
                className="flex h-10 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium text-content-muted transition-[color,background-color,box-shadow] duration-(--dur-base) ease-out-quart hover:bg-raised/60 hover:text-content focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-[current=page]:bg-raised aria-[current=page]:text-brand aria-[current=page]:shadow-elevation-sm aria-[current=page]:ring-1 aria-[current=page]:ring-line"
              >
                <portal.icon aria-hidden="true" className="size-4 shrink-0" />
                {portal.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
