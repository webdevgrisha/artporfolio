import clsx from "clsx";
import type { ComponentPropsWithRef } from "react";

import styles from "./Button.module.css";

type ButtonProps = ComponentPropsWithRef<"button">;

export function Button({ children, className, ref, type = "button", ...buttonProps }: ButtonProps) {
  return (
    <button ref={ref} className={clsx(styles.root, className)} type={type} {...buttonProps}>
      {children}
    </button>
  );
}
