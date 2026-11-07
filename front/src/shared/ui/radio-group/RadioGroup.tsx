import clsx from "clsx";
import React from "react";

import { Fieldset } from "@/shared/ui/fieldset";
import { Frame, FrameList, FrameListItem, FrameRow, FrameRowLabel } from "@/shared/ui/frame-list";

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
    <Fieldset className={clsx(styles.root, className)} legend={label} disabled={disabled}>
      <Frame disabled={disabled}>
        <FrameList>
          {options.map((option) => {
            const id = `${groupId}-${option.value}`;
            const isChecked = option.value === value;

            return (
              <FrameListItem key={option.value}>
                <FrameRow>
                  <FrameRowLabel htmlFor={id}>{option.label}</FrameRowLabel>
                  <input
                    id={id}
                    className={clsx(styles.radio, isChecked && isModified && styles.radioModified)}
                    type="radio"
                    name={name}
                    value={option.value}
                    checked={isChecked}
                    onChange={() => onChange(option.value)}
                  />
                </FrameRow>
                {isChecked && option.details ? (
                  <div className={styles.details}>{option.details}</div>
                ) : null}
              </FrameListItem>
            );
          })}
        </FrameList>
      </Frame>
    </Fieldset>
  );
}
