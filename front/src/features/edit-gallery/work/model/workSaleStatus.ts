import type { WorkSaleStatus } from "@/entities/gallery";

/** What the admin reads for each status, in the form and in the table. */
const saleStatusLabels: Record<WorkSaleStatus, string> = {
  available: "В продаже",
  reserved: "Забронирована",
  sold: "Продана",
  notForSale: "Не продаётся",
};

/** The statuses to choose from, for sale first, as most works are. */
export const workSaleStatusOptions: readonly { label: string; value: WorkSaleStatus }[] = (
  ["available", "reserved", "sold", "notForSale"] as const
).map((value) => ({ label: saleStatusLabels[value], value }));

/** The status as the admin reads it in the table, the same as in the form. */
export function formatSaleStatus(saleStatus: WorkSaleStatus): string {
  return saleStatusLabels[saleStatus];
}
