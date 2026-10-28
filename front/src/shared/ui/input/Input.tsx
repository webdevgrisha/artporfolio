import clsx from "clsx";
import type { ComponentPropsWithRef, ReactNode } from "react";

import { Field, getFieldControlClassName, useFieldIds } from "@/shared/ui/field";

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
  const { controlId, describedBy, errorId } = useFieldIds({
    "aria-describedby": ariaDescribedBy,
    error,
    id,
  });

  return (
    <Field controlId={controlId} error={error} errorId={errorId} label={label}>
      <div className={styles.controlWrapper}>
        <input
          ref={ref}
          id={controlId}
          className={clsx(getFieldControlClassName(isModified), styles.control, {
            [styles.controlWithAdornment]: Boolean(endAdornment),
          })}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          {...inputProps}
        />
        {endAdornment ? <div className={styles.endAdornment}>{endAdornment}</div> : null}
      </div>
    </Field>
  );
}
