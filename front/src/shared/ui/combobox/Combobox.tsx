import clsx from "clsx";
import { useCombobox } from "downshift";
import React from "react";

import { Field, getFieldControlClassName, useFieldIds } from "@/shared/ui/field";
import { ChevronRightIcon } from "@/shared/ui/icon";
import type { SelectOption } from "@/shared/ui/select";

import styles from "./Combobox.module.css";

interface ComboboxProps {
  /** Positions the field: the label, the control, the hint and the error. */
  className?: string;
  disabled?: boolean;
  error?: string;
  /** A short explanation under the control. */
  hint?: string;
  /** The text field, which a form focuses to show an error. */
  inputRef?: React.Ref<HTMLInputElement>;
  /** Highlights a value that differs from the saved one. An error takes precedence. */
  isModified?: boolean;
  label: string;
  /** Shown in the list when nothing matches what was typed. */
  noMatchesText?: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  /** Every choice, in the order of the list. */
  options: readonly SelectOption[];
  /** Shown while the field is empty. */
  placeholder?: string;
  value: string;
}

function matches(option: SelectOption, query: string): boolean {
  return option.label.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru"));
}

/**
 * One choice from a long list, such as a country: the field shows the choice, and typing in it
 * narrows the list. It follows the WAI-ARIA combobox pattern through Downshift: the arrows move in
 * the list, Enter chooses the highlighted one. Escape or leaving the field without a choice keeps
 * the one made before, so what was typed never stays as a value.
 */
export function Combobox({
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
}: ComboboxProps) {
  // What was typed since the list opened; the whole list while nothing was.
  const [query, setQuery] = React.useState("");
  const { controlId, describedBy, errorId, hintId } = useFieldIds({ error, hint });
  const labelId = `${controlId}-label`;
  const selectedOption = options.find((option) => option.value === value) ?? null;
  const items = React.useMemo(
    () => (query === "" ? [...options] : options.filter((option) => matches(option, query))),
    [options, query],
  );
  const {
    getInputProps,
    getItemProps,
    getMenuProps,
    getToggleButtonProps,
    highlightedIndex,
    isOpen,
  } = useCombobox<SelectOption>({
    // The first match is highlighted as the list narrows, so Enter chooses it.
    defaultHighlightedIndex: 0,
    inputId: controlId,
    items,
    itemToKey: (option) => option?.value,
    itemToString: (option) => option?.label ?? "",
    labelId,
    onInputValueChange: ({ inputValue, type }) => {
      if (type === useCombobox.stateChangeTypes.InputChange) setQuery(inputValue);
    },
    onIsOpenChange: ({ isOpen: opened }) => {
      if (!opened) setQuery("");
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) onChange(selectedItem.value);
    },
    selectedItem: selectedOption,
    // A blur or Escape only closes the list and shows the choice again: a blur never chooses,
    // and Escape never clears the choice.
    stateReducer: (state, { changes, type }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputBlur:
        case useCombobox.stateChangeTypes.InputKeyDownEscape:
          return {
            ...changes,
            inputValue: state.selectedItem?.label ?? "",
            selectedItem: state.selectedItem,
          };
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
        <input
          className={clsx(getFieldControlClassName(isModified), styles.control)}
          placeholder={placeholder}
          disabled={disabled}
          {...getInputProps({
            // Downshift merges its own ref with this one.
            ref: inputRef,
            "aria-describedby": describedBy,
            "aria-invalid": Boolean(error),
            onBlur,
            // The whole choice is selected, so typing replaces it.
            onFocus: (event) => event.currentTarget.select(),
          })}
        />
        <button
          type="button"
          className={styles.toggle}
          aria-label={isOpen ? "Закрыть список" : "Открыть список"}
          disabled={disabled}
          {...getToggleButtonProps()}
        >
          <ChevronRightIcon className={clsx(styles.chevron, isOpen && styles.chevronOpen)} />
        </button>
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
                  {option.label}
                </li>
              ))
            : null}
        </ul>
      </div>
    </Field>
  );
}
