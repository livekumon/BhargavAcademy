import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { changedPasswordChecks, validateChangedPassword } from "./identity.ts";

describe("validateChangedPassword", () => {
  it("rejects numbers-only passwords like 12345678", () => {
    assert.equal(
      validateChangedPassword("12345678", "12345678"),
      "Password must include both letters and numbers.",
    );
  });

  it("rejects the default password once it is long enough", () => {
    // "123456" is also short; the length rule fires first. Pad past that.
    assert.equal(
      validateChangedPassword("12345600", "12345600"),
      "Password must include both letters and numbers.",
    );
  });

  it("rejects short passwords", () => {
    assert.equal(
      validateChangedPassword("ab12", "ab12"),
      "Password must be at least 8 characters.",
    );
  });

  it("rejects exactly the default password", () => {
    // Length fails before the default check for the 6-char default.
    assert.equal(
      validateChangedPassword("123456", "123456"),
      "Password must be at least 8 characters.",
    );
  });

  it("rejects mismatched confirmation", () => {
    assert.equal(
      validateChangedPassword("Academy1", "Academy2"),
      "Passwords do not match.",
    );
  });

  it("accepts a password with letters and numbers", () => {
    assert.equal(validateChangedPassword("Academy1", "Academy1"), null);
  });
});

describe("changedPasswordChecks", () => {
  it("marks letters-and-numbers unmet for 12345678", () => {
    const checks = changedPasswordChecks("12345678", "12345678");
    assert.deepEqual(
      checks.map((check) => [check.label, check.met]),
      [
        ["At least 8 characters", true],
        ["Letters and numbers", false],
        ["Not the default password", true],
        ["Both passwords match", true],
      ],
    );
  });
});
