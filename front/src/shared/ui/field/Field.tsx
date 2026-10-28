import clsx from "clsx";
import type { ReactNode } from "react";

import styles from "./Field.module.css";

interface FieldProps {
  /** The control. It takes `controlId` as its id and gets its look from `getFieldControlClassName`. */
  children: ReactNode;
  className?: string;
  controlId: string;
  error?: string;
  errorId: string;
  label: string;
}

/** The label and the error message around a form control. */
export function Field({ children, className, controlId, error, errorId, label }: FieldProps) {
  return (
    <div className={clsx(styles.root, className)}>
      <label className={styles.label} htmlFor={controlId}>
        {label}
      </label>
      {children}
      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
