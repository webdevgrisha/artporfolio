import clsx from "clsx";

import styles from "./RadioGroup.module.css";

export interface RadioOption<TValue extends string> {
  label: string;
  value: TValue;
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
 * One choice of a few, all in view, such as the unit of a size. The native radio buttons give the
 * keyboard and screen readers the behaviour they expect: the arrows move the choice.
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
  return (
    <fieldset className={clsx(styles.root, className)} disabled={disabled}>
      <legend className={styles.legend}>{label}</legend>
      <div className={clsx(styles.options, isModified && styles.modified)}>
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              className={styles.radio}
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
