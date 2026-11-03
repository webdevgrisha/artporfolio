import clsx from "clsx";

import styles from "./ColorSwatch.module.css";

interface ColorSwatchProps {
  className?: string;
  /** The color, as #rrggbb. */
  hex: string;
  /**
   * `field` (the default) takes the space of a ColorSwatchInput; `text` is a small circle that sits
   * in a line of text, such as a chip.
   */
  variant?: "field" | "text";
}

/**
 * A color as a round swatch, by default in the space of a ColorSwatchInput, so one can take the
 * place of the other. It only shows the color: the text next to it names it.
 */
export function ColorSwatch({ className, hex, variant = "field" }: ColorSwatchProps) {
  return (
    <span
      className={clsx(styles.root, variant === "text" && styles.text, className)}
      aria-hidden="true"
    >
      <span className={styles.circle} style={{ backgroundColor: hex }} />
    </span>
  );
}
