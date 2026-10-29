import { describe, expect, it } from "vitest";

import { heroUploadBodySchema, pageIds, pageParamsSchema } from "#modules/pages/schema";

describe("page schemas", () => {
  it.each(pageIds)("accepts the page %s", (page) => {
    expect(pageParamsSchema.parse({ page })).toEqual({ page });
  });

  it.each(["contact", "Home", "", "admin"])("rejects the unknown page %j", (page) => {
    expect(pageParamsSchema.safeParse({ page }).success).toBe(false);
  });

  it("accepts a hero upload without text fields", () => {
    expect(heroUploadBodySchema.safeParse({}).success).toBe(true);
  });

  it("rejects text fields sent with a hero", () => {
    expect(heroUploadBodySchema.safeParse({ alt: "Painting" }).success).toBe(false);
  });
});
