import { ActionError } from "astro:actions";
import { describe, expect, it } from "vitest";

import { subscribeOutcome } from "@/lib/newsletter/subscribeOutcome";

describe("subscribeOutcome", () => {
  it("is subscribed without an error", () => {
    expect(subscribeOutcome(undefined)).toBe("subscribed");
  });

  it("is invalid for an address refused, which the check of the action also answers so", () => {
    expect(subscribeOutcome(new ActionError({ code: "BAD_REQUEST" }))).toBe("invalid");
  });

  it("failed for any other error", () => {
    expect(subscribeOutcome(new ActionError({ code: "INTERNAL_SERVER_ERROR" }))).toBe("failed");
  });
});
