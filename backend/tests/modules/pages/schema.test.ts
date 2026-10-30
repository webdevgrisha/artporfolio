import { describe, expect, it } from "vitest";

import { heroBodySchema, pageIds, pageParamsSchema } from "#modules/pages/schema";

describe("page schemas", () => {
  it.each(pageIds)("accepts the page %s", (page) => {
    expect(pageParamsSchema.parse({ page })).toEqual({ page });
  });

  it.each(["contact", "Home", "", "admin"])("rejects the unknown page %j", (page) => {
    expect(pageParamsSchema.safeParse({ page }).success).toBe(false);
  });

  it("takes a hero by its upload id", () => {
    expect(
      heroBodySchema.safeParse({ uploadId: "11111111-1111-4111-8111-111111111111" }).success,
    ).toBe(true);
    expect(heroBodySchema.safeParse({ uploadId: "painting" }).success).toBe(false);
  });

  it("rejects other fields sent with a hero, as a hero has no alt text", () => {
    expect(
      heroBodySchema.safeParse({
        alt: "Painting",
        uploadId: "11111111-1111-4111-8111-111111111111",
      }).success,
    ).toBe(false);
  });
});
