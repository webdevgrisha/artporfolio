import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  maxWorkMaterials,
  maxWorkProcessPhotos,
  maxWorkSections,
  maxWorkSide,
  minWorkYear,
  workBodySchema,
} from "#modules/gallery-works/schema";

const work = {
  title: "Слон",
  description: "Масло, холст.",
  size: { width: 50, height: 70 },
  year: 2024,
  month: 3,
  photo: { alt: "Слон на закате", uploadId: randomUUID() },
  processPhotos: [],
  sectionIds: [randomUUID()],
  materialIds: [randomUUID()],
};

function isValid(body: unknown): boolean {
  return workBodySchema.safeParse(body).success;
}

describe("work body", () => {
  it("trims the texts", () => {
    expect(
      workBodySchema.parse({ ...work, title: "  Слон  ", description: " Масло. " }),
    ).toMatchObject({ title: "Слон", description: "Масло." });
  });

  it("needs a title", () => {
    expect(isValid({ ...work, title: "  " })).toBe(false);
    expect(isValid({ ...work, title: "a".repeat(100) })).toBe(true);
    expect(isValid({ ...work, title: "a".repeat(101) })).toBe(false);
  });

  it("needs a description and limits it", () => {
    expect(isValid({ ...work, description: "  " })).toBe(false);
    expect(isValid({ ...work, description: "a".repeat(2_000) })).toBe(true);
    expect(isValid({ ...work, description: "a".repeat(2_001) })).toBe(false);
  });

  it("takes a size in centimetres, with up to two decimals", () => {
    expect(isValid({ ...work, size: { width: 29.75, height: 42 } })).toBe(true);
    expect(isValid({ ...work, size: { width: 29.755, height: 42 } })).toBe(false);
    expect(isValid({ ...work, size: { width: 8.5, height: 11, unit: "in" } })).toBe(false);
  });

  it("needs both sides, above zero and within the limit", () => {
    expect(isValid({ ...work, size: { width: 50 } })).toBe(false);
    expect(isValid({ ...work, size: { width: 0, height: 70 } })).toBe(false);
    expect(isValid({ ...work, size: { width: maxWorkSide, height: 70 } })).toBe(true);
    expect(isValid({ ...work, size: { width: maxWorkSide + 1, height: 70 } })).toBe(false);
  });

  it("takes a whole year from the earliest one", () => {
    expect(isValid({ ...work, year: minWorkYear })).toBe(true);
    expect(isValid({ ...work, year: minWorkYear - 1 })).toBe(false);
    expect(isValid({ ...work, year: 2024.5 })).toBe(false);
  });

  it("takes a month from 1 to 12", () => {
    expect(isValid({ ...work, month: 1 })).toBe(true);
    expect(isValid({ ...work, month: 12 })).toBe(true);
    expect(isValid({ ...work, month: 0 })).toBe(false);
    expect(isValid({ ...work, month: 13 })).toBe(false);
    expect(isValid({ ...work, month: undefined })).toBe(false);
  });

  it("takes this month, but not a month to come", () => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1);

    expect(isValid({ ...work, year: now.getFullYear(), month: now.getMonth() + 1 })).toBe(true);
    expect(isValid({ ...work, year: next.getFullYear(), month: next.getMonth() + 1 })).toBe(false);
    expect(isValid({ ...work, year: now.getFullYear() + 1, month: 1 })).toBe(false);
  });

  it("needs a photo with its alt text; the upload may be left out to keep the saved file", () => {
    expect(isValid({ ...work, photo: { alt: "Слон" } })).toBe(true);
    expect(isValid({ ...work, photo: { alt: " ", uploadId: randomUUID() } })).toBe(false);
    expect(isValid({ ...work, photo: undefined })).toBe(false);
  });

  it("takes up to the limit of process photos, each with its alt text", () => {
    const processPhoto = () => ({ alt: "Набросок", uploadId: randomUUID() });

    expect(isValid({ ...work, processPhotos: [processPhoto()] })).toBe(true);
    expect(
      isValid({
        ...work,
        processPhotos: Array.from({ length: maxWorkProcessPhotos }, processPhoto),
      }),
    ).toBe(true);
    expect(
      isValid({
        ...work,
        processPhotos: Array.from({ length: maxWorkProcessPhotos + 1 }, processPhoto),
      }),
    ).toBe(false);
    expect(isValid({ ...work, processPhotos: [{ ...processPhoto(), alt: "" }] })).toBe(false);
    expect(isValid({ ...work, processPhotos: undefined })).toBe(false);
  });

  it("needs at least one section, each named once", () => {
    const id = randomUUID();

    expect(isValid({ ...work, sectionIds: [] })).toBe(false);
    expect(isValid({ ...work, sectionIds: [id, id] })).toBe(false);
    expect(isValid({ ...work, sectionIds: ["animals"] })).toBe(false);
    expect(
      isValid({ ...work, sectionIds: Array.from({ length: maxWorkSections }, randomUUID) }),
    ).toBe(true);
    expect(
      isValid({ ...work, sectionIds: Array.from({ length: maxWorkSections + 1 }, randomUUID) }),
    ).toBe(false);
  });

  it("needs at least one material, each named once", () => {
    const id = randomUUID();

    expect(isValid({ ...work, materialIds: [] })).toBe(false);
    expect(isValid({ ...work, materialIds: [id, id] })).toBe(false);
    expect(isValid({ ...work, materialIds: ["oil"] })).toBe(false);
    expect(
      isValid({ ...work, materialIds: Array.from({ length: maxWorkMaterials }, randomUUID) }),
    ).toBe(true);
    expect(
      isValid({ ...work, materialIds: Array.from({ length: maxWorkMaterials + 1 }, randomUUID) }),
    ).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(isValid({ ...work, price: 100 })).toBe(false);
  });
});
