import type { WorkPrice } from "@/entities/gallery";

import { formatPrice } from "../model/formatPrice";
import { NoValue } from "./NoValue";
import styles from "./WorksList.module.css";

interface WorkPriceCellProps {
  price: WorkPrice | null;
}

/** The price a visitor pays, with the discount under it, muted. */
export function WorkPriceCell({ price }: WorkPriceCellProps) {
  if (price === null) return <NoValue label="Без цены" />;

  return (
    <>
      {formatPrice(price.finalAmount, price.currency)}
      {price.discountPercent === null ? null : (
        <div className={styles.muted}>
          −{price.discountPercent}% от {formatPrice(price.amount, price.currency)}
        </div>
      )}
    </>
  );
}
