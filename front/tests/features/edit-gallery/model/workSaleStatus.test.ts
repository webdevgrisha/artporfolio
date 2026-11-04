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

  it("shows the status beside the price, nothing for a work for sale", () => {
    expect(formatSaleStatus("available")).toBeNull();
    expect(formatSaleStatus("reserved")).toBe("забронирована");
    expect(formatSaleStatus("sold")).toBe("продана");
    expect(formatSaleStatus("notForSale")).toBe("не продаётся");
  });
});
