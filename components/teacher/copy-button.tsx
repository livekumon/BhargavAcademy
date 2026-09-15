"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Copies prepared text — a reminder message, login details — to the clipboard. */
export function CopyButton({
  text,
  label,
  copiedMessage = "Copied to clipboard",
  variant = "outline",
  size = "lg",
}: {
  text: string;
  label: string;
  copiedMessage?: string;
  variant?: "outline" | "ghost" | "secondary";
  size?: "sm" | "default" | "lg";
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success(copiedMessage);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("Couldn't copy. Select the text and copy it manually.");
        }
      }}
    >
      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
      {label}
    </Button>
  );
}
