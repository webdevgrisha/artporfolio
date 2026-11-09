import { formatPrice } from "../model/formatPrice";
import { discountedAmount } from "../model/workPriceAmount";
import { parseTypedPrice, workFormCurrency } from "../model/workPriceInput";
import styles from "./WorkFields.module.css";

interface FinalPriceProps {
  /** The price as typed. */
  price: string;
  /** The discount as typed. */
  discountPercent: string;
  /** The ids of the price and discount fields, which the result is computed from. */
  sourceIds: string;
}

/**
 * The price after the discount, computed as it is typed, as the server will compute it on save; a
 * dash while the price is empty or wrong.
 */
export function FinalPrice({ discountPercent, price, sourceIds }: FinalPriceProps) {
  const typed = parseTypedPrice(price, discountPercent);

  return (
    <div className={styles.final}>
      <span className={styles.finalLabel}>Итоговая цена</span>
      <output htmlFor={sourceIds} className={styles.finalValue}>
        {typed
          ? formatPrice(discountedAmount(typed.amount, typed.discount), workFormCurrency)
          : "—"}
      </output>
    </div>
  );
}
