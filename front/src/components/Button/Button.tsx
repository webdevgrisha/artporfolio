import type { ComponentPropsWithRef } from "react";

import styles from "@/components/Button/Button.module.css";

type ButtonProps = ComponentPropsWithRef<"button">;

export function Button({ children, className, ref, type = "button", ...buttonProps }: ButtonProps) {
  const classNames = className ? `${styles.root} ${className}` : styles.root;

  return (
    <button ref={ref} className={classNames} type={type} {...buttonProps}>
      {children}
    </button>
  );
}
