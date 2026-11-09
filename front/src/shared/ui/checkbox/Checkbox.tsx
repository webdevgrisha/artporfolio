import clsx from "clsx";
import type React from "react";

import { CheckIcon } from "@/shared/ui/icon";

import styles from "./Checkbox.module.css";

interface CheckboxProps {
  /** The id of a hint about the box, which screen readers read with it. */
  "aria-describedby"?: string;
  checked: boolean;
  className?: string;
  disabled?: boolean;
  /** Marks the box invalid, for a list whose choice has an error. */
  invalid?: boolean;
  /** Ties the box to its label, which the owner draws: `<label htmlFor={id}>`. */
  id: string;
  inputRef?: React.Ref<HTMLInputElement>;
  /** Frames the box as the modified text fields are framed. */
  isModified?: boolean;
  onBlur?: () => void;
  onChange: (checked: boolean) => void;
}

/** A square checkbox in the style of the admin: filled when checked, with a check mark over it. */
export function Checkbox({
  "aria-describedby": ariaDescribedBy,
  checked,
  className,
  disabled = false,
  invalid = false,
  id,
  inputRef,
  isModified = false,
  onBlur,
  onChange,
}: CheckboxProps) {
  return (
    <span className={clsx(styles.root, className)}>
      <input
        ref={inputRef}
        id={id}
        type="checkbox"
        className={clsx(styles.box, isModified && styles.boxModified)}
        checked={checked}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={ariaDescribedBy}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.checked)}
      />
      <CheckIcon className={styles.checkIcon} />
    </span>
  );
}
