import { DEFAULT_PASSWORD } from "./identity";

/** A message a teacher can paste into WhatsApp so a parent can sign in. */
export function parentLoginMessage(parent: { name: string; email: string; mustChangePassword: boolean }) {
  return [
    `Hello ${parent.name}, here is your Bhargav Academy parent login.`,
    "Sign in at: https://bhargavacademy.com/parent/login",
    `Email: ${parent.email}`,
    parent.mustChangePassword
      ? `Password: ${DEFAULT_PASSWORD} (you'll choose your own the first time you sign in)`
      : "Use the password you set. Ask us if you've forgotten it.",
  ].join("\n");
}
