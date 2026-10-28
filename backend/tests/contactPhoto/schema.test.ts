import { describe, expect, it } from "vitest";

import { photoAltBodySchema } from "#schemas/contactPhoto";

function isValid(body: unknown): boolean {
  return photoAltBodySchema.safeParse(body).success;
}

describe("contact photo schema", () => {
  it("trims the alt text", () => {
    expect(photoAltBodySchema.parse({ alt: "  Портрет художницы  " })).toEqual({
      alt: "Портрет художницы",
    });
  });

  it.each(["", "   "])("requires alt text, rejecting %j", (alt) => {
    expect(isValid({ alt })).toBe(false);
  });

  it("limits the alt text to 250 characters", () => {
    expect(isValid({ alt: "a".repeat(250) })).toBe(true);
    expect(isValid({ alt: "a".repeat(251) })).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(isValid({ alt: "Портрет", title: "Портрет" })).toBe(false);
  });
});
