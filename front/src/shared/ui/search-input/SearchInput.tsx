import clsx from "clsx";
import React, { type ComponentPropsWithoutRef } from "react";

import { CloseIcon, SearchIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Tooltip } from "@/shared/ui/tooltip";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import styles from "./SearchInput.module.css";

interface SearchInputProps
  extends Omit<ComponentPropsWithoutRef<"input">, "onChange" | "type" | "value"> {
  className?: string;
  clearLabel: string;
  /** The accessible name; the field shows only its placeholder, as a search field usually does. */
  label: string;
  onChange: (value: string) => void;
  value: string;
}

/**
 * A search field: the magnifier, the query and a line under it, as in the design. It clears with
 * its button or Escape and keeps the focus.
 */
export function SearchInput({
  className,
  clearLabel,
  label,
  onChange,
  placeholder = "Поиск…",
  value,
  ...inputProps
}: SearchInputProps) {
  const inputId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);

  function clear() {
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <div className={clsx(styles.root, className)}>
      <VisuallyHidden>
        <label htmlFor={inputId}>{label}</label>
      </VisuallyHidden>
      <SearchIcon className={styles.searchIcon} />
      <input
        {...inputProps}
        ref={inputRef}
        id={inputId}
        className={styles.control}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            // Escape clears the query here instead of closing anything around the field.
            event.preventDefault();
            clear();
          }
        }}
      />
      {value ? (
        <Tooltip content={clearLabel}>
          <IconButton label={clearLabel} onClick={clear}>
            <CloseIcon className={styles.clearIcon} />
          </IconButton>
        </Tooltip>
      ) : null}
    </div>
  );
}
