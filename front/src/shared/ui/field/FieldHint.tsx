import type { ReactNode } from "react";

import styles from "./FieldHint.module.css";

interface FieldHintProps {
  children: ReactNode;
  /** Referenced by the control's `aria-describedby`, so screen readers read the hint with it. */
  id: string;
}

/** A short explanation under a form control, such as what to enter or which files fit. */
export function FieldHint({ children, id }: FieldHintProps) {
  return (
    <p className={styles.root} id={id}>
      {children}
    </p>
  );
}
