import { describe, expect, it } from "vitest";

import { contactsBodySchema, contactsResponseSchema } from "#modules/contacts/schema";
import { apiImage } from "../../support/images.js";

const contacts = {
  email: "artist@example.com",
  instagram: "https://instagram.com/artist",
  linkedin: "https://www.linkedin.com/in/artist",
  youtube: "https://youtube.com/@artist",
};

function isValid(body: unknown): boolean {
  return contactsBodySchema.safeParse(body).success;
}

describe("contacts schema", () => {
  it("accepts filled contacts", () => {
    expect(contactsBodySchema.parse(contacts)).toEqual(contacts);
  });

  it("accepts empty contacts", () => {
    expect(isValid({ email: "", instagram: "", linkedin: "", youtube: "" })).toBe(true);
  });

  it("trims surrounding spaces", () => {
    const parsed = contactsBodySchema.parse({
      ...contacts,
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
    expect(isValid({ ...contacts, instagram: link })).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(isValid({ ...contacts, email: "artist" })).toBe(false);
  });

  it("rejects a missing field", () => {
    const { youtube: _youtube, ...withoutYoutube } = contacts;

    expect(isValid(withoutYoutube)).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(isValid({ ...contacts, telegram: "https://t.me/artist" })).toBe(false);
  });
});

describe("contacts response", () => {
  it("describes links and an alt text saved under older rules", () => {
    const response = {
      contacts: { ...contacts, linkedin: "linkedin.com/in/artist" },
      photo: { ...apiImage("photo.png"), alt: "" },
    };

    expect(contactsResponseSchema.safeParse(response).success).toBe(true);
  });
});
