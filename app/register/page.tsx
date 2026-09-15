import { redirect } from "next/navigation";

/** Teacher accounts are created by admins in the academy console. */
export default function RegisterPage() {
  redirect("/login");
}
