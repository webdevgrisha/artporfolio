import clsx from "clsx";
import { useSelect } from "downshift";
import type React from "react";

import { useDropdownPosition } from "@/shared/lib/useDropdownPosition";
import { DropdownList } from "@/shared/ui/dropdown-list";
import { Field, getFieldControlClassName, useFieldIds } from "@/shared/ui/field";
import { ChevronRightIcon } from "@/shared/ui/icon";

import styles from "./Select.module.css";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  /** Positions the field: the label, the control, the hint and the error. */
  className?: string;
  disabled?: boolean;
  error?: string;
  /** A short explanation under the control. */
  hint?: string;
  /** Highlights a value that differs from the saved one. An error takes precedence. */
  isModified?: boolean;
  label: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  /** Shown while the value matches no option, such as an empty one before a choice is made. */
  placeholder?: string;
  /** The control, which a form focuses to show an error. */
  ref?: React.Ref<HTMLDivElement>;
  value: string;
}

/**
 * One choice from a fixed list, such as a month, in the look of the text fields beside it, its list
 * as the list of MultiSelect. It follows the WAI-ARIA select-only combobox pattern through
 * Downshift: the arrows, Home and End move in the list, Enter or Space chooses, Escape closes it,
 * and typing jumps to the option that starts with the letters typed.
 */
export function Select({
  className,
  disabled = false,
  error,
  hint,
  isModified = false,
  label,
  onBlur,
  onChange,
  options,
  placeholder,
  ref,
  value,
}: SelectProps) {
  const { controlId, describedBy, errorId, hintId } = useFieldIds({ error, hint });
  const labelId = `${controlId}-label`;
  const selectedOption = options.find((option) => option.value === value) ?? null;
  const {
    getItemProps,
    getLabelProps,
    getMenuProps,
    getToggleButtonProps,
    highlightedIndex,
    isOpen,
  } = useSelect<SelectOption>({
    items: [...options],
    itemToKey: (option) => option?.value,
    itemToString: (option) => option?.label ?? "",
    labelId,
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onChange(selectedItem.value);
    },
    selectedItem: selectedOption,
    toggleButtonId: controlId,
  });

  const { floatingStyles, setField, setList } = useDropdownPosition(isOpen);

  return (
    <Field
      className={className}
      controlId={controlId}
      error={error}
      errorId={errorId}
      hint={hint}
      hintId={hintId}
      label={label}
      labelId={labelId}
      onLabelClick={getLabelProps().onClick}
    >
      <div ref={setField} className={styles.controlWrapper}>
        <div
          className={clsx(
            getFieldControlClassName(isModified),
            styles.control,
            disabled && styles.controlDisabled,
          )}
          {...getToggleButtonProps({
            // Downshift merges its own ref with this one.
            ref,
            "aria-describedby": describedBy,
            "aria-invalid": Boolean(error),
            disabled,
            onBlur,
          })}
        >
          <span className={clsx(styles.value, selectedOption === null && styles.placeholder)}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronRightIcon className={clsx(styles.chevron, isOpen && styles.chevronOpen)} />
        </div>
        <DropdownList
          getItemProps={getItemProps}
          highlightedIndex={highlightedIndex}
          isOpen={isOpen}
          items={options}
          menuProps={getMenuProps({ ref: setList, style: floatingStyles })}
          renderItem={(option) => option.label}
        />
      </div>
    </Field>
  );
}
