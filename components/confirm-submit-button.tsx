"use client";

import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({
  message,
  children,
  variant = "destructive",
  size,
}: {
  message: string;
  children: ReactNode;
  variant?: "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "icon" | "icon-sm" | "icon-xs";
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
