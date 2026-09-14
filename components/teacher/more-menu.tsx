"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { MoreHorizontal, TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Icons are rendered elements (e.g. `<Pencil />`) so server pages can pass them in. */
export type MoreMenuLink = { label: string; href: string; icon?: ReactNode };

export type MoreMenuDanger = {
  label: string;
  icon?: ReactNode;
  title: string;
  message: string;
  consequences?: string[];
  /** Require typing this before the action unlocks. */
  confirmText?: string;
  action: () => Promise<void>;
};

/**
 * The "⋯" overflow for a page or row. Safe links first; destructive actions
 * sit below a separator and always go through a confirmation dialog, so they
 * never live next to Edit.
 */
export function MoreMenu({
  links = [],
  dangers = [],
  label = "More actions",
  variant = "outline",
}: {
  links?: MoreMenuLink[];
  dangers?: MoreMenuDanger[];
  /** Accessible name for the trigger, e.g. "Actions for Ananya Sharma". */
  label?: string;
  /** Outline for page headers, ghost for table rows. */
  variant?: "outline" | "ghost";
}) {
  const [pending, setPending] = useState<MoreMenuDanger | null>(null);
  const [typed, setTyped] = useState("");
  const blocked = Boolean(pending?.confirmText) && typed.trim() !== pending?.confirmText;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon-lg" aria-label={label}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-1.5">
          {links.map((link) => (
            <DropdownMenuItem key={link.href} asChild className="gap-2 p-2">
              <Link href={link.href}>
                {link.icon}
                {link.label}
              </Link>
            </DropdownMenuItem>
          ))}
          {links.length > 0 && dangers.length > 0 ? <DropdownMenuSeparator /> : null}
          {dangers.map((danger) => (
            <DropdownMenuItem
              key={danger.label}
              variant="destructive"
              className="gap-2 p-2"
              onSelect={() => {
                setTyped("");
                setPending(danger);
              }}
            >
              {danger.icon}
              {danger.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        {pending ? (
          <AlertDialogContent>
            <form action={pending.action} className="flex flex-col gap-5">
              <div className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-subtle text-danger-subtle-fg"
                >
                  <TriangleAlert className="size-5" />
                </span>
                <div className="min-w-0 space-y-2">
                  <AlertDialogTitle>{pending.title}</AlertDialogTitle>
                  <AlertDialogDescription>{pending.message}</AlertDialogDescription>
                  {pending.consequences?.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-content-muted">
                      {pending.consequences.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
              {pending.confirmText ? (
                <div className="space-y-2">
                  <Label htmlFor="more-menu-confirm" className="text-sm font-normal text-content-muted">
                    Type <span className="font-semibold text-content">{pending.confirmText}</span> to confirm
                  </Label>
                  <Input
                    id="more-menu-confirm"
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                    autoComplete="off"
                    className="h-10"
                  />
                </div>
              ) : null}
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <Button
                  type="submit"
                  size="lg"
                  disabled={blocked}
                  className="bg-danger text-danger-fg hover:bg-danger/90"
                >
                  {pending.label}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        ) : null}
      </AlertDialog>
    </>
  );
}
