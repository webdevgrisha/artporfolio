import { describe, expect, it } from "vitest";

import { formatCollectionYears } from "@/features/edit-gallery/collection/model/collectionYears";

describe("formatCollectionYears", () => {
  it("joins the start and the end with a dash", () => {
    expect(formatCollectionYears({ endYear: 2025, startYear: 2022 })).toBe("2022–2025");
  });

  it("gives the one year of a collection without an end", () => {
    expect(formatCollectionYears({ endYear: null, startYear: 2024 })).toBe("2024");
  });
});
