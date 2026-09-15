/*
 * Client-safe half of the flash-message helpers. See lib/flash.ts.
 */

export const FLASH_COOKIE = "ba_flash";

export type FlashUndo = { kind: "lead-status"; id: string; status: string };

export type Flash = {
  id: string;
  message: string;
  description?: string;
  tone?: "success" | "info" | "error";
  undo?: FlashUndo;
};

export function parseFlash(raw: string | undefined): Flash | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Partial<Flash>;
    return typeof value.id === "string" && typeof value.message === "string"
      ? (value as Flash)
      : null;
  } catch {
    return null;
  }
}
