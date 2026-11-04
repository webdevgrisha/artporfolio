import type { WorkSaleStatus } from "@/entities/gallery";

/** The statuses to choose from, for sale first, as most works are. */
export const workSaleStatusOptions: readonly { label: string; value: WorkSaleStatus }[] = [
  { label: "В продаже", value: "available" },
  { label: "Забронирована", value: "reserved" },
  { label: "Продана", value: "sold" },
  { label: "Не продаётся", value: "notForSale" },
];

/**
 * The status as the admin reads it beside the price: «продана», «забронирована», «не продаётся»;
 * nothing for a work for sale, the usual one.
 */
export function formatSaleStatus(saleStatus: WorkSaleStatus): string | null {
  switch (saleStatus) {
    case "available":
      return null;
    case "reserved":
      return "забронирована";
    case "sold":
      return "продана";
    case "notForSale":
      return "не продаётся";
  }
}
