import clsx from "clsx";
import type { ComponentPropsWithRef } from "react";

import { Field, getFieldControlClassName, useFieldIds } from "@/shared/ui/field";
import { ChevronRightIcon } from "@/shared/ui/icon";

import styles from "./Select.module.css";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends Omit<ComponentPropsWithRef<"select">, "children"> {
  /** Positions the field: the label, the control, the hint and the error. */
  className?: string;
  error?: string;
  /** A short explanation under the control. */
  hint?: string;
  /** Highlights a value that differs from the saved one. An error takes precedence. */
  isModified?: boolean;
  label: string;
  options: readonly SelectOption[];
  /** The text of the empty choice, shown until one is made; without it the first option is chosen. */
  placeholder?: string;
}

/**
 * One choice from a fixed list, such as a month. The native control gives the keyboard, screen
 * readers and phones the list they expect; it looks like the text fields beside it.
 */
export function Select({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  error,
  hint,
  id,
  isModified = false,
  label,
  options,
  placeholder,
  ref,
  ...selectProps
}: SelectProps) {
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
        <select
          ref={ref}
          id={controlId}
          className={clsx(getFieldControlClassName(isModified), styles.control)}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          {...selectProps}
        >
          {placeholder === undefined ? null : (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronRightIcon className={styles.chevron} />
      </div>
    </Field>
  );
}
