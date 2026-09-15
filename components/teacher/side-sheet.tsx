"use client";

import type { ReactNode } from "react";
import { Pencil, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const icons = { plus: Plus, pencil: Pencil, upload: Upload } as const;

/**
 * A button that opens a form in a side sheet, so editing happens next to the
 * content instead of on a separate page or a form stacked at the bottom.
 * The trigger is built here (not passed in) so server pages can use it.
 */
export function SideSheet({
  label,
  icon,
  variant = "outline",
  eyebrow,
  title,
  description,
  children,
}: {
  label: string;
  icon?: keyof typeof icons;
  variant?: "default" | "outline" | "ghost";
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const Icon = icon ? icons[icon] : null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant={variant} size="lg">
          {Icon ? <Icon data-icon="inline-start" /> : null}
          {label}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        title={title}
        description={description}
        className="w-[min(36rem,100vw)] overflow-y-auto"
      >
        <div data-role="teacher" className="flex flex-col gap-6">
          <div className="pr-8">
            {eyebrow ? <p className="text-sm font-medium text-brand">{eyebrow}</p> : null}
            <h2 className="mt-1 text-title-2 font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-content-muted text-pretty">{description}</p> : null}
          </div>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
