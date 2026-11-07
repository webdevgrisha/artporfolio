import { randomUUID } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  maxWorkCityLength,
  maxWorkColors,
  maxWorkDiscount,
  maxWorkMaterials,
  maxWorkPalettes,
  maxWorkPrice,
  maxWorkProcessPhotos,
  maxWorkSections,
  maxWorkSetSize,
  maxWorkSide,
  minWorkDiscount,
  minWorkSetSize,
  minWorkYear,
  workBodySchema,
  workSaleStatuses,
} from "#modules/gallery/works/schema";

const work = {
  published: true,
  title: "Слон",
  description: "Масло, холст.",
  size: { width: 50, height: 70 },
  year: 2024,
  month: 3,
  country: null,
  city: "",
  photo: { alt: "Слон на закате", uploadId: randomUUID() },
  processPhotos: [],
  sectionIds: [randomUUID()],
  materialIds: [randomUUID()],
  colorIds: [randomUUID()],
  paletteIds: [randomUUID()],
  collectionId: null,
  format: "single",
  partCount: null,
  saleStatus: "available",
  price: null,
};
const price = { amount: 500, currency: "USD", discountPercent: null };

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

  describe("dated by the month", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("takes this month, but not a month to come", () => {
      vi.useFakeTimers({ now: new Date("2026-06-15T12:00:00Z"), toFake: ["Date"] });

      expect(isValid({ ...work, year: 2026, month: 6 })).toBe(true);
      expect(isValid({ ...work, year: 2026, month: 7 })).toBe(false);
      expect(isValid({ ...work, year: 2027, month: 1 })).toBe(false);
    });

    it("takes a month that has come east of the server, which runs in UTC", () => {
      // Already 1 July in Minsk, UTC+3.
      vi.useFakeTimers({ now: new Date("2026-06-30T22:00:00Z"), toFake: ["Date"] });

      expect(isValid({ ...work, year: 2026, month: 7 })).toBe(true);
    });
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

  it("needs at least one color, each named once", () => {
    const id = randomUUID();

    expect(isValid({ ...work, colorIds: [] })).toBe(false);
    expect(isValid({ ...work, colorIds: [id, id] })).toBe(false);
    expect(isValid({ ...work, colorIds: ["black"] })).toBe(false);
    expect(isValid({ ...work, colorIds: Array.from({ length: maxWorkColors }, randomUUID) })).toBe(
      true,
    );
    expect(
      isValid({ ...work, colorIds: Array.from({ length: maxWorkColors + 1 }, randomUUID) }),
    ).toBe(false);
  });

  it("needs at least one palette, each named once", () => {
    const id = randomUUID();

    expect(isValid({ ...work, paletteIds: [] })).toBe(false);
    expect(isValid({ ...work, paletteIds: [id, id] })).toBe(false);
    expect(isValid({ ...work, paletteIds: ["pastel"] })).toBe(false);
    expect(
      isValid({ ...work, paletteIds: Array.from({ length: maxWorkPalettes }, randomUUID) }),
    ).toBe(true);
    expect(
      isValid({ ...work, paletteIds: Array.from({ length: maxWorkPalettes + 1 }, randomUUID) }),
    ).toBe(false);
  });

  it("takes the id of a collection, or null for a work on its own", () => {
    expect(isValid({ ...work, collectionId: randomUUID() })).toBe(true);
    expect(isValid({ ...work, collectionId: null })).toBe(true);
    expect(isValid({ ...work, collectionId: "animals" })).toBe(false);
    expect(isValid({ ...work, collectionId: undefined })).toBe(false);
  });

  it("takes a single work, a diptych or a triptych without a count", () => {
    expect(isValid({ ...work, format: "single" })).toBe(true);
    expect(isValid({ ...work, format: "diptych" })).toBe(true);
    expect(isValid({ ...work, format: "triptych" })).toBe(true);
    expect(isValid({ ...work, format: "diptych", partCount: 2 })).toBe(false);
    expect(isValid({ ...work, format: "polyptych" })).toBe(false);
  });

  it("needs the count of works of a set, within the limits", () => {
    expect(isValid({ ...work, format: "set", partCount: null })).toBe(false);
    expect(isValid({ ...work, format: "set", partCount: minWorkSetSize })).toBe(true);
    expect(isValid({ ...work, format: "set", partCount: maxWorkSetSize })).toBe(true);
    expect(isValid({ ...work, format: "set", partCount: minWorkSetSize - 1 })).toBe(false);
    expect(isValid({ ...work, format: "set", partCount: maxWorkSetSize + 1 })).toBe(false);
    expect(isValid({ ...work, format: "set", partCount: 2.5 })).toBe(false);
  });

  it("takes a country by its ISO 3166-1 code, or none", () => {
    expect(isValid({ ...work, country: "PL" })).toBe(true);
    expect(isValid({ ...work, country: null })).toBe(true);
    expect(isValid({ ...work, country: "pl" })).toBe(false);
    expect(isValid({ ...work, country: "Польша" })).toBe(false);
    // The European Union has a code of its own, but is not a country.
    expect(isValid({ ...work, country: "EU" })).toBe(false);
    expect(isValid({ ...work, country: undefined })).toBe(false);
  });

  it("takes no city, or a city within the limit, trimmed", () => {
    expect(isValid({ ...work, city: "" })).toBe(true);
    expect(workBodySchema.parse({ ...work, city: "  Варшава " }).city).toBe("Варшава");
    expect(isValid({ ...work, city: "а".repeat(maxWorkCityLength) })).toBe(true);
    expect(isValid({ ...work, city: "а".repeat(maxWorkCityLength + 1) })).toBe(false);
    expect(isValid({ ...work, city: undefined })).toBe(false);
  });

  it("needs to know whether the site shows the work", () => {
    expect(isValid({ ...work, published: false })).toBe(true);
    expect(isValid({ ...work, published: undefined })).toBe(false);
    expect(isValid({ ...work, published: "yes" })).toBe(false);
  });

  it("takes each sale status, whatever the price", () => {
    for (const saleStatus of workSaleStatuses) {
      expect(isValid({ ...work, saleStatus })).toBe(true);
      expect(isValid({ ...work, saleStatus, price })).toBe(true);
    }

    expect(isValid({ ...work, saleStatus: "lost" })).toBe(false);
    expect(isValid({ ...work, saleStatus: undefined })).toBe(false);
  });

  it("takes a work without a price", () => {
    expect(isValid({ ...work, price: null })).toBe(true);
    expect(isValid({ ...work, price: undefined })).toBe(false);
  });

  it("takes a price in whole dollars, within the limits", () => {
    expect(isValid({ ...work, price })).toBe(true);
    expect(isValid({ ...work, price: { ...price, amount: 1 } })).toBe(true);
    expect(isValid({ ...work, price: { ...price, amount: maxWorkPrice } })).toBe(true);
    expect(isValid({ ...work, price: { ...price, amount: 0 } })).toBe(false);
    expect(isValid({ ...work, price: { ...price, amount: maxWorkPrice + 1 } })).toBe(false);
    expect(isValid({ ...work, price: { ...price, amount: 499.99 } })).toBe(false);
    expect(isValid({ ...work, price: { ...price, currency: "EUR" } })).toBe(false);
    expect(isValid({ ...work, price: { ...price, discountPercent: undefined } })).toBe(false);
  });

  it("takes a discount of a whole percent, within the limits", () => {
    expect(isValid({ ...work, price: { ...price, discountPercent: minWorkDiscount } })).toBe(true);
    expect(isValid({ ...work, price: { ...price, discountPercent: maxWorkDiscount } })).toBe(true);
    expect(isValid({ ...work, price: { ...price, discountPercent: 0 } })).toBe(false);
    expect(isValid({ ...work, price: { ...price, discountPercent: 100 } })).toBe(false);
    expect(isValid({ ...work, price: { ...price, discountPercent: 12.5 } })).toBe(false);
  });

  it("refuses a discount that leaves nothing to pay", () => {
    // 1 × 0.01 rounds to 0, 50 × 0.01 to 1.
    expect(isValid({ ...work, price: { ...price, amount: 1, discountPercent: 99 } })).toBe(false);
    expect(isValid({ ...work, price: { ...price, amount: 50, discountPercent: 99 } })).toBe(true);
  });

  it("does not take the price after the discount, which the API computes", () => {
    expect(isValid({ ...work, price: { ...price, finalAmount: 500 } })).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(isValid({ ...work, cost: 100 })).toBe(false);
  });
});
