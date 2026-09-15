import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADMIN_EMAIL } from "../identity.ts";
import {
  OWNER_EMAIL,
  canEditTeacher,
  canGrantAdmin,
  canRevokeAdmin,
  canSuspend,
  canTransferTeaching,
  effectiveRole,
  parseExpiry,
  type RoleHolder,
} from "./policy.ts";

const now = new Date("2026-09-14T12:00:00Z");
const tomorrow = new Date("2026-09-15T12:00:00Z");
const yesterday = new Date("2026-09-13T12:00:00Z");

function person(overrides: Partial<RoleHolder> = {}): RoleHolder {
  return {
    id: crypto.randomUUID(),
    email: `${crypto.randomUUID()}@bhargavacademy.com`,
    role: "teacher",
    roleExpiresAt: null,
    status: "active",
    ...overrides,
  };
}

const owner = person({ id: "owner", email: OWNER_EMAIL, role: "admin" });
const admin = person({ id: "admin", role: "admin" });
const teacher = person({ id: "teacher" });

describe("effectiveRole", () => {
  it("keeps the owner constant in sync with the seeded admin email", () => {
    assert.equal(OWNER_EMAIL, ADMIN_EMAIL);
  });

  it("treats the owner as admin even if the row says otherwise", () => {
    assert.equal(effectiveRole({ ...owner, role: "teacher" }, now), "admin");
  });

  it("honours permanent and future-dated grants", () => {
    assert.equal(effectiveRole(admin, now), "admin");
    assert.equal(effectiveRole({ ...admin, roleExpiresAt: tomorrow }, now), "admin");
  });

  it("lapses an expired grant back to teacher", () => {
    assert.equal(effectiveRole({ ...admin, roleExpiresAt: yesterday }, now), "teacher");
  });

  it("never gives a suspended account admin rights", () => {
    assert.equal(effectiveRole({ ...admin, status: "suspended" }, now), "teacher");
  });

  it("keeps plain teachers as teachers", () => {
    assert.equal(effectiveRole(teacher, now), "teacher");
  });
});

describe("permission matrix", () => {
  const actors = { owner, admin, teacher, expiredAdmin: { ...admin, id: "expired", roleExpiresAt: yesterday } };
  const expectAdminOnly = {
    owner: true,
    admin: true,
    teacher: false,
    expiredAdmin: false,
  } as const;

  for (const [name, actor] of Object.entries(actors)) {
    const allowed = expectAdminOnly[name as keyof typeof expectAdminOnly];
    const target = person();

    it(`${name} ${allowed ? "can" : "cannot"} grant admin`, () => {
      assert.equal(canGrantAdmin(actor, target, null, now).ok, allowed);
    });
    it(`${name} ${allowed ? "can" : "cannot"} suspend someone else`, () => {
      assert.equal(canSuspend(actor, target, now).ok, allowed);
    });
    it(`${name} ${allowed ? "can" : "cannot"} transfer teaching`, () => {
      assert.equal(canTransferTeaching(actor, "someone", target, now).ok, allowed);
    });
    it(`${name} ${allowed ? "can" : "cannot"} edit a teacher`, () => {
      assert.equal(canEditTeacher(actor, target, now).ok, allowed);
    });
  }
});

describe("owner and last-admin guardrails", () => {
  it("does not let another admin demote, suspend, expire, or edit the owner", () => {
    assert.equal(canRevokeAdmin(admin, owner, 5, now).ok, false);
    assert.equal(canSuspend(admin, owner, now).ok, false);
    assert.equal(canGrantAdmin(admin, owner, tomorrow, now).ok, false);
    assert.equal(canEditTeacher(admin, owner, now).ok, false);
    assert.equal(canEditTeacher(owner, owner, now).ok, true);
  });

  it("refuses to revoke the last admin", () => {
    const other = person({ role: "admin" });
    assert.equal(canRevokeAdmin(owner, other, 1, now).ok, false);
    assert.equal(canRevokeAdmin(owner, other, 2, now).ok, true);
  });

  it("stops admins suspending themselves", () => {
    assert.equal(canSuspend(admin, admin, now).ok, false);
  });

  it("rejects an expiry date in the past", () => {
    assert.equal(canGrantAdmin(owner, teacher, yesterday, now).ok, false);
  });

  it("rejects making a suspended teacher an admin", () => {
    assert.equal(canGrantAdmin(owner, { ...teacher, status: "suspended" }, null, now).ok, false);
  });

  it("rejects transferring to the same or a suspended teacher", () => {
    assert.equal(canTransferTeaching(owner, teacher.id, teacher, now).ok, false);
    assert.equal(
      canTransferTeaching(owner, "a", { ...teacher, status: "suspended" }, now).ok,
      false,
    );
    assert.equal(canTransferTeaching(owner, "a", null, now).ok, false);
  });
});

describe("parseExpiry", () => {
  it("treats blank as permanent", () => {
    assert.deepEqual(parseExpiry(""), { expiresAt: null });
    assert.deepEqual(parseExpiry(undefined), { expiresAt: null });
  });

  it("reads a date input as the end of that day", () => {
    const parsed = parseExpiry("2026-10-31");
    assert.ok("expiresAt" in parsed && parsed.expiresAt);
    assert.equal(parsed.expiresAt.getDate(), 31);
    assert.equal(parsed.expiresAt.getHours(), 23);
  });

  it("rejects nonsense", () => {
    assert.ok("error" in parseExpiry("next tuesday-ish"));
  });
});
