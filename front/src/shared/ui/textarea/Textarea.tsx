import clsx from "clsx";
import type { ComponentPropsWithRef, ReactNode } from "react";

import { Field, getFieldControlClassName, useFieldIds } from "@/shared/ui/field";

import styles from "./Textarea.module.css";

export interface TextareaProps extends ComponentPropsWithRef<"textarea"> {
  /** Positions the field: the label, the control, the hint and the error. */
  className?: string;
  /** A control at the top end of the text, in a square slot. */
  endAdornment?: ReactNode;
  error?: string;
  /** A short explanation under the control, e.g. what to enter. */
  hint?: string;
  /** Highlights a value that differs from the saved one. An error takes precedence. */
  isModified?: boolean;
  label: string;
}

export function Textarea({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  endAdornment,
  error,
  hint,
  id,
  isModified = false,
  label,
  ref,
  ...textareaProps
}: TextareaProps) {
  const { controlId, describedBy, errorId, hintId } = useFieldIds({
    "aria-describedby": ariaDescribedBy,
    error,
    hint,
    id,
  });

  return (
    <Field
      className={className}
      controlId={controlId}
      error={error}
      errorId={errorId}
      hint={hint}
      hintId={hintId}
      label={label}
    >
      <div className={styles.controlWrapper}>
        <textarea
          ref={ref}
          id={controlId}
          className={clsx(
            getFieldControlClassName(isModified),
            styles.control,
            Boolean(endAdornment) && styles.controlWithAdornment,
          )}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          {...textareaProps}
        />
        {endAdornment ? <div className={styles.endAdornment}>{endAdornment}</div> : null}
      </div>
    </Field>
  );
}
