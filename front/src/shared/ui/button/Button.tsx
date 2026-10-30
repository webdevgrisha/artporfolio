import clsx from "clsx";
import type { ComponentPropsWithRef } from "react";

import styles from "./Button.module.css";

interface ButtonProps extends ComponentPropsWithRef<"button"> {
  /** `text` drops the border and the minimum width, for actions inside a dialog. */
  variant?: "outlined" | "text";
  /** `danger` marks an action that discards or destroys data. */
  tone?: "default" | "danger";
}

export function Button({
  children,
  className,
  ref,
  tone = "default",
  type = "button",
  variant = "outlined",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      ref={ref}
      className={clsx(
        styles.root,
        variant === "text" && styles.text,
        tone === "danger" && styles.danger,
        className,
      )}
      type={type}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
