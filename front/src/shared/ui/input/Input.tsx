import clsx from "clsx";
import React, { type ComponentPropsWithRef, type ReactNode } from "react";

import styles from "./Input.module.css";

export interface InputProps extends ComponentPropsWithRef<"input"> {
  endAdornment?: ReactNode;
  error?: string;
  /** Highlights a value that differs from the saved one. An error takes precedence. */
  isModified?: boolean;
  label: string;
}

export function Input({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  endAdornment,
  error,
  id,
  isModified = false,
  label,
  ref,
  ...inputProps
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const describedBy = [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(" ");
  const controlClassName = clsx(styles.control, {
    [styles.controlModified]: isModified,
    [styles.controlWithAdornment]: Boolean(endAdornment),
  });

  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.controlWrapper}>
        <input
          ref={ref}
          id={inputId}
          className={controlClassName}
          aria-describedby={describedBy || undefined}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          {...inputProps}
        />
        {endAdornment ? <div className={styles.endAdornment}>{endAdornment}</div> : null}
      </div>
      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
