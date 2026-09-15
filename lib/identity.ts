export const ACADEMY_EMAIL_DOMAIN = "bhargavacademy.com";
export const ADMIN_EMAIL = `bhargav@${ACADEMY_EMAIL_DOMAIN}`;
export const DEFAULT_PASSWORD = "123456";
export const MIN_CHANGED_PASSWORD_LENGTH = 8;
export const LEGACY_TEACHER_EMAIL = "teacher@academy.test";
export const LEGACY_PARENT_EMAIL = "parent@academy.test";
export const LEGACY_STUDENT_EMAIL_DOMAIN = "student.test";

const RESERVED_LOCAL_PARTS = new Set([
  "bhargav",
  "admin",
  "info",
  "support",
  "hello",
  "contact",
]);

export function academyEmailLocalPart(name: string) {
  const parts = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "student";
  }

  const first = parts[0];
  const lastInitial = parts.length > 1 ? parts[parts.length - 1]![0]! : "";
  return `${first}${lastInitial}`;
}

export function uniqueAcademyEmail(name: string, taken: Set<string>) {
  const base = academyEmailLocalPart(name);
  let n = 0;

  while (true) {
    const local = n === 0 ? base : `${base}${n + 1}`;
    const email = `${local}@${ACADEMY_EMAIL_DOMAIN}`;
    if (!RESERVED_LOCAL_PARTS.has(local) && !taken.has(email)) {
      taken.add(email);
      return email;
    }
    n += 1;
  }
}

export function isLegacyStudentEmail(email: string) {
  return email.toLowerCase().endsWith(`@${LEGACY_STUDENT_EMAIL_DOMAIN}`);
}

export function resolveAccountPassword(password: string) {
  const value = password || DEFAULT_PASSWORD;
  if (value !== DEFAULT_PASSWORD && value.length < MIN_CHANGED_PASSWORD_LENGTH) {
    return {
      error:
        "Password must be at least 8 characters, or leave blank to use the default 123456.",
    };
  }
  return { password: value };
}

export type PasswordCheck = { label: string; met: boolean };

/** Same rules the set-password form shows. Keep UI and server in lockstep. */
export function changedPasswordChecks(
  password: string,
  confirm: string,
): PasswordCheck[] {
  return [
    {
      label: "At least 8 characters",
      met: password.length >= MIN_CHANGED_PASSWORD_LENGTH,
    },
    {
      label: "Letters and numbers",
      met: /[a-z]/i.test(password) && /\d/.test(password),
    },
    {
      label: "Not the default password",
      met: password.length > 0 && password !== DEFAULT_PASSWORD,
    },
    {
      label: "Both passwords match",
      met: password.length > 0 && password === confirm,
    },
  ];
}

export function validateChangedPassword(password: string, confirm: string) {
  const failed = changedPasswordChecks(password, confirm).find((check) => !check.met);
  if (!failed) return null;
  if (failed.label === "At least 8 characters") {
    return "Password must be at least 8 characters.";
  }
  if (failed.label === "Letters and numbers") {
    return "Password must include both letters and numbers.";
  }
  if (failed.label === "Not the default password") {
    return "Choose a new password. You cannot keep the default password.";
  }
  return "Passwords do not match.";
}
