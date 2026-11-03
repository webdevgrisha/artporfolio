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
    expect(isValid({ ...links, instagram: "", linkedin: "", youtube: "" })).toBe(true);
  });

  it("needs an email", () => {
    expect(isValid({ ...links, email: "  " })).toBe(false);
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
    `https://instagram.com/${"a".repeat(2_048)}`,
  ])("rejects the link %s", (link) => {
    expect(isValid({ ...links, instagram: link })).toBe(false);
  });

  it.each([
    ["instagram", "https://www.instagram.com/artist"],
    ["linkedin", "https://pl.linkedin.com/in/artist"],
    ["youtube", "https://m.youtube.com/@artist"],
    ["youtube", "https://youtu.be/abc"],
  ])("accepts a %s link on its network: %s", (field, link) => {
    expect(isValid({ ...links, [field]: link })).toBe(true);
  });

  it.each([
    ["instagram", "https://youtube.com/@artist"],
    ["instagram", "https://notinstagram.com/artist"],
    ["linkedin", "https://linkedin.com.example.com/in/artist"],
    ["youtube", "https://instagram.com/artist"],
  ])("rejects a %s link to another site: %s", (field, link) => {
    expect(isValid({ ...links, [field]: link })).toBe(false);
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
