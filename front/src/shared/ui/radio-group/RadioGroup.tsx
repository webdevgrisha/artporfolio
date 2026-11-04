import clsx from "clsx";
import React from "react";

import styles from "./RadioGroup.module.css";

export interface RadioOption<TValue extends string> {
  label: string;
  value: TValue;
  /** Shown under the option while it is chosen, such as a field only this choice needs. */
  details?: React.ReactNode;
}

interface RadioGroupProps<TValue extends string> {
  className?: string;
  disabled?: boolean;
  /** Highlights a choice that differs from the saved one. */
  isModified?: boolean;
  label: string;
  /** The name of the radio buttons, which ties them into one group. */
  name: string;
  onChange: (value: TValue) => void;
  options: readonly RadioOption<TValue>[];
  value: TValue;
}

/**
 * One choice of a few, all in view, as a framed list like the sections of a work. The native radio
 * buttons give the keyboard and screen readers the behaviour they expect: the arrows move the
 * choice.
 */
export function RadioGroup<TValue extends string>({
  className,
  disabled = false,
  isModified = false,
  label,
  name,
  onChange,
  options,
  value,
}: RadioGroupProps<TValue>) {
  const groupId = React.useId();

  return (
    <fieldset className={clsx(styles.root, className)} disabled={disabled}>
      <legend className={styles.legend}>{label}</legend>
      <ul className={clsx(styles.frame, disabled && styles.frameDisabled)}>
        {options.map((option) => {
          const id = `${groupId}-${option.value}`;
          const isChecked = option.value === value;

          return (
            <li key={option.value} className={styles.option}>
              <div className={styles.row}>
                <label className={styles.title} htmlFor={id}>
                  {option.label}
                </label>
                <input
                  id={id}
                  className={clsx(styles.radio, isChecked && isModified && styles.radioModified)}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={isChecked}
                  onChange={() => onChange(option.value)}
                />
              </div>
              {isChecked && option.details ? (
                <div className={styles.details}>{option.details}</div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
