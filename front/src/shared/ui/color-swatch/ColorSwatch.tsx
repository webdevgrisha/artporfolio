import clsx from "clsx";

import styles from "./ColorSwatch.module.css";

interface ColorSwatchProps {
  className?: string;
  /** The color, as #rrggbb. */
  hex: string;
}

/**
 * A color as a round swatch, in the space of a ColorSwatchInput, so one can take the place of the
 * other. It only shows the color: the text next to it names it.
 */
export function ColorSwatch({ className, hex }: ColorSwatchProps) {
  return (
    <span className={clsx(styles.root, className)} aria-hidden="true">
      <span className={styles.circle} style={{ backgroundColor: hex }} />
    </span>
  );
}
