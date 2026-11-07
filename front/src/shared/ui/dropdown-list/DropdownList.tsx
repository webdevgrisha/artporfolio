import clsx from "clsx";
import type { ComponentPropsWithRef, HTMLAttributes, ReactNode } from "react";

import styles from "./DropdownList.module.css";

interface DropdownListProps<TItem extends { value: string }> {
  /** From Downshift. */
  getItemProps: (options: { index: number; item: TItem }) => HTMLAttributes<HTMLLIElement>;
  /** From Downshift. */
  highlightedIndex: number;
  isOpen: boolean;
  items: readonly TItem[];
  /** From Downshift, with the position from `useDropdownPosition`. */
  menuProps: ComponentPropsWithRef<"ul">;
  /** Shown when nothing matches what was typed; a list that cannot be narrowed has none. */
  noMatchesText?: string;
  renderItem: (item: TItem) => ReactNode;
}

/**
 * The list under a select, a combobox or a multi-select. It stays in the page while closed, as
 * Downshift needs, but out of sight and of the layout.
 */
export function DropdownList<TItem extends { value: string }>({
  getItemProps,
  highlightedIndex,
  isOpen,
  items,
  menuProps,
  noMatchesText,
  renderItem,
}: DropdownListProps<TItem>) {
  return (
    <ul className={clsx(styles.menu, !isOpen && styles.menuHidden)} {...menuProps}>
      {isOpen && items.length === 0 && noMatchesText ? (
        <li className={styles.noMatches}>{noMatchesText}</li>
      ) : null}
      {isOpen
        ? items.map((item, index) => (
            <li
              key={item.value}
              className={clsx(styles.option, highlightedIndex === index && styles.highlighted)}
              {...getItemProps({ index, item })}
            >
              {renderItem(item)}
            </li>
          ))
        : null}
    </ul>
  );
}
