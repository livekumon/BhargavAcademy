"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db, ensureDatabase } from "@/lib/db";
import { isLookupListKey, slugifyLookupValue } from "@/lib/lookup-lists";
import {
  countLookupUsage,
  findLookupOption,
  getLookupCatalog,
  getLookupOption,
} from "@/lib/lookups";
import { lookupOptions } from "@/lib/schema";

export type LookupState = {
  error?: string;
};

function revalidateLookupPaths() {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/student", "layout");
  revalidatePath("/parent", "layout");
}

/** Dropdown lists are academy-wide, so only admins may change them. */
export async function mutateLookup(
  _prev: LookupState,
  formData: FormData,
): Promise<LookupState> {
  await requireAdmin();
  await ensureDatabase();

  const intent = String(formData.get("intent") ?? "").trim();
  if (intent === "add") return addOption(formData);
  if (intent === "update") return updateOption(formData);
  if (intent === "delete") return deleteOption(formData);
  if (intent === "move") return moveOption(formData);
  return { error: "Unknown action." };
}

async function addOption(formData: FormData): Promise<LookupState> {
  const listKey = String(formData.get("listKey") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const value =
    String(formData.get("value") ?? "").trim() || slugifyLookupValue(label);

  if (!isLookupListKey(listKey)) {
    return { error: "Unknown dropdown list." };
  }
  if (label.length < 1) {
    return { error: "Enter a name for the option." };
  }
  if (!value) {
    return { error: "Enter a short value, or use a name with letters." };
  }

  const existing = await findLookupOption(listKey, value);
  if (existing) {
    return { error: "That option already exists in this list." };
  }

  const catalog = await getLookupCatalog();
  const position = catalog[listKey].length;

  await db.insert(lookupOptions).values({
    id: crypto.randomUUID(),
    listKey,
    value,
    label,
    position,
    createdAt: new Date(),
  });

  revalidateLookupPaths();
  return {};
}

async function updateOption(formData: FormData): Promise<LookupState> {
  const id = String(formData.get("id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const option = await getLookupOption(id);

  if (!option) {
    return { error: "That option was not found." };
  }
  if (label.length < 1) {
    return { error: "Enter a name for the option." };
  }

  await db
    .update(lookupOptions)
    .set({ label })
    .where(eq(lookupOptions.id, option.id));

  revalidateLookupPaths();
  return {};
}

async function deleteOption(formData: FormData): Promise<LookupState> {
  const id = String(formData.get("id") ?? "").trim();
  const option = await getLookupOption(id);

  if (!option || !isLookupListKey(option.listKey)) {
    return { error: "That option was not found." };
  }

  const used = await countLookupUsage(option.listKey, option.value);
  if (used > 0) {
    return {
      error: `"${option.label}" is still used on ${used} student or marks record${used === 1 ? "" : "s"}. Rename it instead of deleting.`,
    };
  }

  await db.delete(lookupOptions).where(eq(lookupOptions.id, option.id));
  revalidateLookupPaths();
  return {};
}

async function moveOption(formData: FormData): Promise<LookupState> {
  const id = String(formData.get("id") ?? "").trim();
  const direction = String(formData.get("direction") ?? "").trim();
  const option = await getLookupOption(id);

  if (!option || !isLookupListKey(option.listKey)) {
    return { error: "That option was not found." };
  }

  const catalog = await getLookupCatalog();
  const list = catalog[option.listKey];
  const index = list.findIndex((item) => item.id === option.id);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  const neighbor = list[nextIndex];

  if (index < 0 || !neighbor) {
    return {};
  }

  await db
    .update(lookupOptions)
    .set({ position: neighbor.position })
    .where(eq(lookupOptions.id, option.id));
  await db
    .update(lookupOptions)
    .set({ position: option.position })
    .where(eq(lookupOptions.id, neighbor.id));

  revalidateLookupPaths();
  return {};
}
