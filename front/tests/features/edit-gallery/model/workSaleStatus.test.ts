import { describe, expect, it } from "vitest";

import { workSaleStatuses } from "@/entities/gallery";
import {
  formatSaleStatus,
  workSaleStatusOptions,
} from "@/features/edit-gallery/model/workSaleStatus";

describe("the sale status of a work", () => {
  it("offers every status, for sale first", () => {
    expect(workSaleStatusOptions.map(({ value }) => value).sort()).toEqual(
      [...workSaleStatuses].sort(),
    );
    expect(workSaleStatusOptions[0]).toEqual({ label: "В продаже", value: "available" });
  });

  it("shows every status in the table as the form names it", () => {
    for (const { label, value } of workSaleStatusOptions) {
      expect(formatSaleStatus(value)).toBe(label);
    }
  });
});
