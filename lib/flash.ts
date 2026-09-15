import { cookies } from "next/headers";
import { FLASH_COOKIE, parseFlash, type Flash } from "./flash-shared";

/*
 * One-shot toast messages that survive a server action's redirect. The
 * action sets a short-lived cookie; FlashToaster reads it on the next render
 * of the teacher shell, shows it, and clears it.
 */

export async function flash(message: string, options: Omit<Flash, "id" | "message"> = {}) {
  const store = await cookies();
  store.set(
    FLASH_COOKIE,
    encodeURIComponent(JSON.stringify({ id: crypto.randomUUID(), message, ...options })),
    { path: "/", maxAge: 30, sameSite: "lax", httpOnly: false },
  );
}

export async function readFlash() {
  const store = await cookies();
  return parseFlash(store.get(FLASH_COOKIE)?.value);
}
