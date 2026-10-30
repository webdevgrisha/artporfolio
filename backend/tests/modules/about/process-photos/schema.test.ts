import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { maxProcessPhotos, processPhotosBodySchema } from "#modules/about/process-photos/schema";

function isValidList(processPhotos: unknown[]): boolean {
  return processPhotosBodySchema.safeParse({ processPhotos }).success;
}

describe("process photos body", () => {
  const id = randomUUID();
  const uploadId = randomUUID();

  it("takes saved photos by id, new files by upload, and replaced files by both", () => {
    expect(
      isValidList([
        { alt: "Sketch", id },
        { alt: "New", uploadId },
        { alt: "Study", id: randomUUID(), uploadId: randomUUID() },
      ]),
    ).toBe(true);
    expect(isValidList([])).toBe(true);
  });

  it("rejects a photo with neither an id nor an upload", () => {
    expect(isValidList([{ alt: "Sketch" }])).toBe(false);
  });

  it("rejects an id or an upload given twice", () => {
    expect(
      isValidList([
        { alt: "Sketch", id },
        { alt: "Again", id },
      ]),
    ).toBe(false);
    expect(
      isValidList([
        { alt: "New", uploadId },
        { alt: "Again", uploadId },
      ]),
    ).toBe(false);
  });

  it("rejects ids that are not UUIDs", () => {
    expect(isValidList([{ alt: "Sketch", id: "first" }])).toBe(false);
    expect(isValidList([{ alt: "Sketch", uploadId: "upload" }])).toBe(false);
  });

  it("needs alt text on every photo", () => {
    expect(isValidList([{ alt: " ", id }])).toBe(false);
  });

  it("rejects more photos than the page may have", () => {
    const photos = Array.from({ length: maxProcessPhotos + 1 }, () => ({
      alt: "New",
      uploadId: randomUUID(),
    }));

    expect(isValidList(photos)).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(isValidList([{ alt: "Sketch", file: "sketch.png", id }])).toBe(false);
    expect(processPhotosBodySchema.safeParse({ ids: [], processPhotos: [] }).success).toBe(false);
  });
});
