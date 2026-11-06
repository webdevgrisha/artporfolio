import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  collectionBodySchema,
  maxCollectionWorks,
  minCollectionYear,
} from "#modules/gallery/collections/schema";

const thisYear = new Date().getFullYear();

const collection = {
  title: "Звери",
  description: "Серия о животных.",
  cover: { alt: "Слон на закате", uploadId: randomUUID() },
  startYear: 2023,
  endYear: 2024,
  workIds: [randomUUID()],
  translations: {},
};

function isValid(body: unknown): boolean {
  return collectionBodySchema.safeParse(body).success;
}

describe("collection body", () => {
  it("trims the texts", () => {
    expect(
      collectionBodySchema.parse({ ...collection, title: "  Звери  ", description: " Серия. " }),
    ).toMatchObject({ title: "Звери", description: "Серия." });
  });

  it("needs a title", () => {
    expect(isValid({ ...collection, title: "  " })).toBe(false);
    expect(isValid({ ...collection, title: "a".repeat(100) })).toBe(true);
    expect(isValid({ ...collection, title: "a".repeat(101) })).toBe(false);
  });

  it("needs a description and limits it", () => {
    expect(isValid({ ...collection, description: "  " })).toBe(false);
    expect(isValid({ ...collection, description: "a".repeat(2_000) })).toBe(true);
    expect(isValid({ ...collection, description: "a".repeat(2_001) })).toBe(false);
  });

  it("needs a cover with its alt text; the upload may be left out to keep the saved file", () => {
    expect(isValid({ ...collection, cover: { alt: "Слон" } })).toBe(true);
    expect(isValid({ ...collection, cover: { alt: " ", uploadId: randomUUID() } })).toBe(false);
    expect(isValid({ ...collection, cover: undefined })).toBe(false);
  });

  it("needs a whole start year from the earliest one up to this year", () => {
    expect(isValid({ ...collection, startYear: minCollectionYear, endYear: null })).toBe(true);
    expect(isValid({ ...collection, startYear: thisYear, endYear: null })).toBe(true);
    expect(isValid({ ...collection, startYear: minCollectionYear - 1 })).toBe(false);
    expect(isValid({ ...collection, startYear: thisYear + 1, endYear: null })).toBe(false);
    expect(isValid({ ...collection, startYear: 2023.5 })).toBe(false);
    expect(isValid({ ...collection, startYear: undefined })).toBe(false);
  });

  it("takes no end year for a collection of one year, but the field is sent", () => {
    expect(isValid({ ...collection, endYear: null })).toBe(true);
    expect(isValid({ ...collection, endYear: undefined })).toBe(false);
  });

  it("takes an end year after the start, up to this year", () => {
    expect(isValid({ ...collection, startYear: 2023, endYear: thisYear })).toBe(true);
    expect(isValid({ ...collection, startYear: 2023, endYear: 2023 })).toBe(false);
    expect(isValid({ ...collection, startYear: 2023, endYear: 2022 })).toBe(false);
    expect(isValid({ ...collection, startYear: 2023, endYear: thisYear + 1 })).toBe(false);
  });

  it("reports a wrong end year at the end year", () => {
    const result = collectionBodySchema.safeParse({ ...collection, endYear: 2023 });

    expect(result.error?.issues.map((issue) => issue.path)).toEqual([["endYear"]]);
  });

  it("takes no works, or up to the limit, each named once", () => {
    const id = randomUUID();

    expect(isValid({ ...collection, workIds: [] })).toBe(true);
    expect(
      isValid({ ...collection, workIds: Array.from({ length: maxCollectionWorks }, randomUUID) }),
    ).toBe(true);
    expect(
      isValid({
        ...collection,
        workIds: Array.from({ length: maxCollectionWorks + 1 }, randomUUID),
      }),
    ).toBe(false);
    expect(isValid({ ...collection, workIds: [id, id] })).toBe(false);
    expect(isValid({ ...collection, workIds: ["elephant"] })).toBe(false);
    expect(isValid({ ...collection, workIds: undefined })).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(isValid({ ...collection, position: 1 })).toBe(false);
  });
});
