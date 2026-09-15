import { redirect } from "next/navigation";

/** Dropdown lists are academy-wide, so they moved to the admin console. */
export default function SettingsPage() {
  redirect("/admin/settings");
}
