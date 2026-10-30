import { describe, expect, it } from "vitest";

import { aboutTextBodySchema, aboutTextResponseSchema } from "#modules/about/text/schema";

const text = { about: "Иллюстратор.", biography: "Родилась в Минске.", creation: "Пишет маслом." };

function isValid(body: unknown): boolean {
  return aboutTextBodySchema.safeParse(body).success;
}

describe("about text body", () => {
  it("trims every text and keeps the paragraphs", () => {
    expect(aboutTextBodySchema.parse({ ...text, biography: "  Первый.\n\nВторой.  " })).toEqual({
      ...text,
      biography: "Первый.\n\nВторой.",
    });
  });

  it.each(["about", "biography", "creation"])("accepts an empty %s", (field) => {
    expect(aboutTextBodySchema.parse({ ...text, [field]: "  " })).toEqual({ ...text, [field]: "" });
  });

  it.each(["about", "biography", "creation"])("requires %s to be sent", (field) => {
    expect(isValid({ ...text, [field]: undefined })).toBe(false);
  });

  it("limits the texts", () => {
    expect(isValid({ ...text, about: "a".repeat(500) })).toBe(true);
    expect(isValid({ ...text, about: "a".repeat(501) })).toBe(false);
    expect(isValid({ ...text, biography: "a".repeat(2_000) })).toBe(true);
    expect(isValid({ ...text, biography: "a".repeat(2_001) })).toBe(false);
    expect(isValid({ ...text, creation: "a".repeat(2_001) })).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(isValid({ ...text, title: "О себе" })).toBe(false);
  });
});

describe("about text response", () => {
  it("describes a text saved before its limit was lowered", () => {
    const savedText = { ...text, about: "a".repeat(1_000) };

    expect(aboutTextResponseSchema.safeParse({ text: savedText }).success).toBe(true);
  });
});
