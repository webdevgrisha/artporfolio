import type { ReactNode } from "react";

import styles from "./FieldError.module.css";

interface FieldErrorProps {
  children: ReactNode;
  /** Referenced by the control's `aria-describedby`, so screen readers read the error with it. */
  id: string;
}

/** The message under a form control that explains why its value is not accepted. */
export function FieldError({ children, id }: FieldErrorProps) {
  return (
    <p className={styles.root} id={id}>
      {children}
    </p>
  );
}
