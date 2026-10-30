import { describe, expect, it } from "vitest";

import { contactLinksBodySchema, contactLinksResponseSchema } from "#modules/contacts/links/schema";

const links = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "https://www.linkedin.com/in/artist",
  youtube: "https://youtube.com/@artist",
};

function isValid(body: unknown): boolean {
  return contactLinksBodySchema.safeParse(body).success;
}

describe("contact links body", () => {
  it("accepts filled links", () => {
    expect(contactLinksBodySchema.parse(links)).toEqual(links);
  });

  it("accepts empty links", () => {
    expect(isValid({ email: "", instagram: "", linkedin: "", youtube: "" })).toBe(true);
  });

  it("trims surrounding spaces", () => {
    const parsed = contactLinksBodySchema.parse({
      ...links,
      instagram: "  https://instagram.com/a  ",
    });

    expect(parsed.instagram).toBe("https://instagram.com/a");
  });

  it.each([
    "javascript:alert(1)",
    "ftp://example.com",
    "instagram.com/artist",
    `https://example.com/${"a".repeat(2_048)}`,
  ])("rejects the link %s", (link) => {
    expect(isValid({ ...links, instagram: link })).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(isValid({ ...links, email: "artist" })).toBe(false);
  });

  it("rejects a missing field", () => {
    const { youtube: _youtube, ...withoutYoutube } = links;

    expect(isValid(withoutYoutube)).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(isValid({ ...links, telegram: "https://t.me/artist" })).toBe(false);
  });
});

describe("contact links response", () => {
  it("describes links saved under older rules", () => {
    const response = { links: { ...links, linkedin: "linkedin.com/in/artist" } };

    expect(contactLinksResponseSchema.safeParse(response).success).toBe(true);
  });
});
