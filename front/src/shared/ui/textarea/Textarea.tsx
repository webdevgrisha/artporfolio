import clsx from "clsx";
import type { ComponentPropsWithRef } from "react";

import { Field, getFieldControlClassName, useFieldIds } from "@/shared/ui/field";

import styles from "./Textarea.module.css";

interface TextareaProps extends ComponentPropsWithRef<"textarea"> {
  error?: string;
  /** Highlights a value that differs from the saved one. An error takes precedence. */
  isModified?: boolean;
  label: string;
}

export function Textarea({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  error,
  id,
  isModified = false,
  label,
  ref,
  ...textareaProps
}: TextareaProps) {
  const { controlId, describedBy, errorId } = useFieldIds({
    "aria-describedby": ariaDescribedBy,
    error,
    id,
  });

  return (
    <Field
      className={className}
      controlId={controlId}
      error={error}
      errorId={errorId}
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
