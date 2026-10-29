import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  maxProcessPhotos,
  processPhotoOrderBodySchema,
  processPhotoParamsSchema,
} from "#modules/about/process-photos/schema";

function isValidOrder(body: unknown): boolean {
  return processPhotoOrderBodySchema.safeParse(body).success;
}

describe("process photo order body", () => {
  it("accepts distinct ids", () => {
    expect(isValidOrder({ ids: [randomUUID(), randomUUID()] })).toBe(true);
    expect(isValidOrder({ ids: [] })).toBe(true);
  });

  it("rejects an id given twice", () => {
    const id = randomUUID();

    expect(isValidOrder({ ids: [id, id] })).toBe(false);
  });

  it("rejects ids that are not UUIDs", () => {
    expect(isValidOrder({ ids: ["first"] })).toBe(false);
  });

  it("rejects more ids than there can be photos", () => {
    const ids = Array.from({ length: maxProcessPhotos + 1 }, () => randomUUID());

    expect(isValidOrder({ ids })).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(isValidOrder({ ids: [], photos: [] })).toBe(false);
  });
});

describe("process photo params", () => {
  it("names a photo by its UUID", () => {
    expect(processPhotoParamsSchema.safeParse({ id: randomUUID() }).success).toBe(true);
    expect(processPhotoParamsSchema.safeParse({ id: "order" }).success).toBe(false);
  });
});
