import clsx from "clsx";
import { useCombobox, useMultipleSelection } from "downshift";
import React from "react";

import { Field, useFieldIds } from "@/shared/ui/field";
import { CloseIcon } from "@/shared/ui/icon";

import styles from "./MultiSelect.module.css";

export interface MultiSelectOption {
  /** What the list and the chip show, such as «Живопись › Пейзаж». */
  label: string;
  value: string;
  /** Shown before the label in the list and the chip, such as a color swatch; only decoration. */
  icon?: React.ReactNode;
}

interface MultiSelectProps {
  className?: string;
  disabled?: boolean;
  error?: string;
  /** A short explanation under the control. */
  hint?: string;
  /** The text field of the list, which a form focuses to show an error. */
  inputRef?: React.Ref<HTMLInputElement>;
  /** Highlights a choice that differs from the saved one. An error takes precedence. */
  isModified?: boolean;
  label: string;
  /** Shown in the list when nothing matches what was typed. */
  noMatchesText?: string;
  onBlur?: () => void;
  /** Gets the chosen values. */
  onChange: (values: string[]) => void;
  /** Every choice, in the order of the list. */
  options: readonly MultiSelectOption[];
  placeholder?: string;
  /**
   * The chosen values, shown as chips in the order of the options; a value with no option, such as
   * a deleted section, is not shown.
   */
  value: readonly string[];
}

function matches(option: MultiSelectOption, query: string): boolean {
  return option.label.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru"));
}

/**
 * Several choices from a list, such as the sections of a work: the chosen ones stand as chips in
 * the field, and typing narrows the list. It follows the WAI-ARIA combobox pattern through
 * Downshift: the arrows move in the list, Enter chooses, Backspace in the empty field removes the
 * last chip, and the left arrow moves to the chips.
 */
export function MultiSelect({
  className,
  disabled = false,
  error,
  hint,
  inputRef,
  isModified = false,
  label,
  noMatchesText = "Ничего не найдено",
  onBlur,
  onChange,
  options,
  placeholder,
  value,
}: MultiSelectProps) {
  const [query, setQuery] = React.useState("");
  const { controlId, describedBy, errorId, hintId } = useFieldIds({ error, hint });
  const labelId = `${controlId}-label`;
  const selectedOptions = React.useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value],
  );
  const items = React.useMemo(
    () => options.filter((option) => !value.includes(option.value) && matches(option, query)),
    [options, query, value],
  );

  function choose(next: readonly MultiSelectOption[]) {
    onChange(next.map((option) => option.value));
  }

  const { getDropdownProps, getSelectedItemProps, removeSelectedItem } =
    useMultipleSelection<MultiSelectOption>({
      itemToKey: (option) => option?.value,
      onSelectedItemsChange: ({ selectedItems }) => choose(selectedItems),
      selectedItems: selectedOptions,
    });
  const { getInputProps, getItemProps, getMenuProps, highlightedIndex, isOpen } =
    useCombobox<MultiSelectOption>({
      defaultHighlightedIndex: 0,
      inputId: controlId,
      inputValue: query,
      items,
      itemToKey: (option) => option?.value,
      itemToString: (option) => option?.label ?? "",
      labelId,
      onInputValueChange: ({ inputValue, type }) => {
        if (type === useCombobox.stateChangeTypes.InputChange) setQuery(inputValue);
      },
      onSelectedItemChange: ({ selectedItem }) => {
        if (!selectedItem) return;

        choose([...selectedOptions, selectedItem]);
        setQuery("");
      },
      // Nothing stays chosen in the combobox itself: a choice becomes a chip.
      selectedItem: null,
      // After a choice the list stays open on the same place, for the next one; a blur only
      // closes the list, it never chooses.
      stateReducer: (state, { changes, type }) => {
        switch (type) {
          case useCombobox.stateChangeTypes.InputKeyDownEnter:
          case useCombobox.stateChangeTypes.ItemClick:
            return { ...changes, highlightedIndex: state.highlightedIndex, isOpen: true };
          case useCombobox.stateChangeTypes.InputBlur:
            return { ...changes, selectedItem: null };
          default:
            return changes;
        }
      },
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
      labelId={labelId}
    >
      <div className={styles.controlWrapper}>
        <div
          className={clsx(
            styles.control,
            isModified && styles.controlModified,
            error && styles.controlInvalid,
            disabled && styles.controlDisabled,
          )}
        >
          {selectedOptions.map((option, index) => (
            <span
              key={option.value}
              className={styles.chip}
              {...getSelectedItemProps({ index, selectedItem: option })}
            >
              {option.icon}
              {option.label}
              <button
                type="button"
                className={styles.chipRemove}
                aria-label={`Убрать ${option.label}`}
                disabled={disabled}
                // The chip, not the button, takes the focus: the keyboard removes it with Delete.
                tabIndex={-1}
                onClick={(event) => {
                  event.stopPropagation();
                  removeSelectedItem(option);
                }}
              >
                <CloseIcon className={styles.chipRemoveIcon} />
              </button>
            </span>
          ))}
          <input
            className={styles.input}
            placeholder={selectedOptions.length === 0 ? placeholder : undefined}
            disabled={disabled}
            {...getInputProps({
              // Downshift merges its own ref with this one.
              ...getDropdownProps({ preventKeyAction: isOpen, ref: inputRef }),
              "aria-describedby": describedBy,
              "aria-invalid": Boolean(error),
              onBlur,
            })}
          />
        </div>
        <ul className={clsx(styles.menu, !isOpen && styles.menuHidden)} {...getMenuProps()}>
          {isOpen && items.length === 0 ? (
            <li className={styles.noMatches}>{noMatchesText}</li>
          ) : null}
          {isOpen
            ? items.map((option, index) => (
                <li
                  key={option.value}
                  className={clsx(styles.option, highlightedIndex === index && styles.highlighted)}
                  {...getItemProps({ index, item: option })}
                >
                  {option.icon}
                  {option.label}
                </li>
              ))
            : null}
        </ul>
      </div>
    </Field>
  );
}
