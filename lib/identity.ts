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

export function validateChangedPassword(password: string, confirm: string) {
  if (password.length < MIN_CHANGED_PASSWORD_LENGTH) {
    return "Password must be at least 8 characters.";
  }
  if (password === DEFAULT_PASSWORD) {
    return "Choose a new password. You cannot keep the default password.";
  }
  if (password !== confirm) {
    return "Passwords do not match.";
  }
  return null;
}
