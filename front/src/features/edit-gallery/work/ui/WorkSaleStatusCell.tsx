import type { WorkSaleStatus } from "@/entities/gallery";

import { formatSaleStatus } from "../model/workSaleStatus";
import styles from "./WorksList.module.css";

const saleStatusClassNames: Record<WorkSaleStatus, string | undefined> = {
  available: styles.available,
  reserved: styles.reserved,
  sold: styles.sold,
  notForSale: styles.notForSale,
};

interface WorkSaleStatusCellProps {
  saleStatus: WorkSaleStatus;
}

/** The sale status of a work, in its color. */
export function WorkSaleStatusCell({ saleStatus }: WorkSaleStatusCellProps) {
  return <span className={saleStatusClassNames[saleStatus]}>{formatSaleStatus(saleStatus)}</span>;
}
