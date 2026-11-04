import clsx from "clsx";
import type React from "react";

import { CheckIcon } from "@/shared/ui/icon";

import styles from "./Checkbox.module.css";

interface CheckboxProps {
  checked: boolean;
  className?: string;
  disabled?: boolean;
  /** Marks the box invalid, for a list whose choice has an error. */
  hasError?: boolean;
  /** Ties the box to its label, which the owner draws: `<label htmlFor={id}>`. */
  id: string;
  inputRef?: React.Ref<HTMLInputElement>;
  /** Frames the box as the modified text fields are framed. */
  isModified?: boolean;
  onBlur?: () => void;
  onChange: (checked: boolean) => void;
}

/** A square checkbox in the style of the admin: black when checked, with a white check mark. */
export function Checkbox({
  checked,
  className,
  disabled = false,
  hasError = false,
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
        aria-invalid={hasError}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.checked)}
      />
      <CheckIcon className={styles.checkIcon} />
    </span>
  );
}
