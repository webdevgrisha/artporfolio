import clsx from "clsx";
import type { ComponentPropsWithRef, ReactNode } from "react";

import styles from "./IconButton.module.css";

interface IconButtonProps extends Omit<ComponentPropsWithRef<"button">, "aria-label" | "children"> {
  /** The icon. It is decorative: the button is named by `label`. */
  children: ReactNode;
  /** Accessible name of the button. */
  label: string;
}

export function IconButton({
  children,
  className,
  label,
  ref,
  type = "button",
  ...buttonProps
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      className={clsx(styles.root, className)}
      type={type}
      aria-label={label}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
