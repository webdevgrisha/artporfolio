import clsx from "clsx";
import type { ComponentPropsWithRef } from "react";

import styles from "./ColorSwatchInput.module.css";

interface ColorSwatchInputProps
  extends Omit<ComponentPropsWithRef<"input">, "aria-label" | "type"> {
  /** Accessible name of the control: it shows only the color. */
  label: string;
}

/**
 * A color as a round swatch; a click opens the color picker of the browser. The value is a color
 * as #rrggbb.
 */
export function ColorSwatchInput({ className, label, ref, ...inputProps }: ColorSwatchInputProps) {
  return (
    <input
      ref={ref}
      className={clsx(styles.root, className)}
      type="color"
      aria-label={label}
      {...inputProps}
    />
  );
}
