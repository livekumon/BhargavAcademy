"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { undoLeadStatus } from "@/lib/actions/leads";
import { FLASH_COOKIE, parseFlash, type Flash } from "@/lib/flash-shared";

function readCookie() {
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${FLASH_COOKIE}=`));
  return match?.slice(FLASH_COOKIE.length + 1);
}

function clearCookie() {
  document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
}

/**
 * Shows the flash message a server action left behind. Checks whenever the
 * server re-renders the shell (a new `initial`) and on every navigation.
 */
export function FlashToaster({ initial }: { initial: Flash | null }) {
  const shown = useRef(new Set<string>());
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const flash = parseFlash(readCookie()) ?? initial;
    if (!flash || shown.current.has(flash.id)) return;
    shown.current.add(flash.id);
    clearCookie();

    const undo = flash.undo;
    const show = flash.tone === "error" ? toast.error : flash.tone === "info" ? toast.info : toast.success;
    show(flash.message, {
      description: flash.description,
      action: undo
        ? {
            label: "Undo",
            onClick: () => {
              if (undo.kind === "lead-status") void undoLeadStatus(undo.id, undo.status);
            },
          }
        : undefined,
    });
  }, [initial, pathname, searchParams]);

  return null;
}
