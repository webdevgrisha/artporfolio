import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  maxProjectPhotos,
  projectBodySchema,
  projectsOrderBodySchema,
} from "#modules/projects/schema";

const project = {
  title: "Слон",
  description: "Иллюстрации к книге.",
  link: "https://elephant.com",
  photos: [{ alt: "Обложка", uploadId: randomUUID() }],
  translations: {},
};

function isValid(body: unknown): boolean {
  return projectBodySchema.safeParse(body).success;
}

describe("project body", () => {
  it("trims the texts", () => {
    expect(
      projectBodySchema.parse({ ...project, title: "  Слон  ", link: " https://elephant.com " }),
    ).toMatchObject({ title: "Слон", link: "https://elephant.com" });
  });

  it("needs a title", () => {
    expect(isValid({ ...project, title: "  " })).toBe(false);
    expect(isValid({ ...project, title: "a".repeat(100) })).toBe(true);
    expect(isValid({ ...project, title: "a".repeat(101) })).toBe(false);
  });

  it("needs a description", () => {
    expect(isValid({ ...project, description: "  " })).toBe(false);
  });

  it("takes an empty link", () => {
    expect(isValid({ ...project, link: "" })).toBe(true);
  });

  it("needs a photo", () => {
    expect(isValid({ ...project, photos: [] })).toBe(false);
  });

  it("limits the description", () => {
    expect(isValid({ ...project, description: "a".repeat(2_000) })).toBe(true);
    expect(isValid({ ...project, description: "a".repeat(2_001) })).toBe(false);
  });

  it("takes only web links", () => {
    expect(isValid({ ...project, link: "http://elephant.com/book" })).toBe(true);
    expect(isValid({ ...project, link: "elephant.com" })).toBe(false);
    expect(isValid({ ...project, link: "javascript:alert(1)" })).toBe(false);
  });

  it.each(["title", "description", "link", "photos"])("requires %s to be sent", (field) => {
    expect(isValid({ ...project, [field]: undefined })).toBe(false);
  });

  it("rejects more photos than a project may have", () => {
    const photos = Array.from({ length: maxProjectPhotos + 1 }, () => ({
      alt: "Фото",
      uploadId: randomUUID(),
    }));

    expect(isValid({ ...project, photos })).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(isValid({ ...project, position: 1 })).toBe(false);
  });
});

describe("projects order body", () => {
  it("takes distinct project ids", () => {
    expect(projectsOrderBodySchema.safeParse({ ids: [randomUUID(), randomUUID()] }).success).toBe(
      true,
    );
    expect(projectsOrderBodySchema.safeParse({ ids: [] }).success).toBe(true);
  });

  it("rejects an id given twice or one that is not a UUID", () => {
    const id = randomUUID();

    expect(projectsOrderBodySchema.safeParse({ ids: [id, id] }).success).toBe(false);
    expect(projectsOrderBodySchema.safeParse({ ids: ["first"] }).success).toBe(false);
  });
});
