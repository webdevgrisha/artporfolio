import clsx from "clsx";
import type { ComponentPropsWithRef } from "react";

import { Field, getFieldControlClassName, useFieldIds } from "@/shared/ui/field";

import styles from "./Textarea.module.css";

interface TextareaProps extends ComponentPropsWithRef<"textarea"> {
  /** Positions the field: the label, the control, the hint and the error. */
  className?: string;
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
      <textarea
        ref={ref}
        id={controlId}
        className={clsx(getFieldControlClassName(isModified), styles.control)}
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid ?? Boolean(error)}
        {...textareaProps}
      />
    </Field>
  );
}
