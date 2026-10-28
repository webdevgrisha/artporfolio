import type { ReactNode } from "react";

import styles from "./Tab.module.css";
import { getTabId, getTabPanelId, useTabsContext } from "./tabsContext";

interface TabProps {
  children: ReactNode;
  /** Links the tab to the `TabPanel` with the same value. */
  value: string;
}

export function Tab({ children, value }: TabProps) {
  const { baseId, onSelect, selectedValue } = useTabsContext();
  const isSelected = value === selectedValue;

  return (
    <button
      className={styles.root}
      type="button"
      role="tab"
      id={getTabId(baseId, value)}
      aria-controls={getTabPanelId(baseId, value)}
      aria-selected={isSelected}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => onSelect(value)}
    >
      {children}
    </button>
  );
}
