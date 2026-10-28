import type { ReactNode } from "react";

import { getTabId, getTabPanelId, useTabsContext } from "./tabsContext";

interface TabPanelProps {
  children: ReactNode;
  className?: string;
  /** Links the panel to the `Tab` with the same value. */
  value: string;
}

/** Stays mounted while another tab is selected; it is only hidden. */
export function TabPanel({ children, className, value }: TabPanelProps) {
  const { baseId, selectedValue } = useTabsContext();

  return (
    <div
      className={className}
      role="tabpanel"
      id={getTabPanelId(baseId, value)}
      aria-labelledby={getTabId(baseId, value)}
      hidden={value !== selectedValue}
    >
      {children}
    </div>
  );
}
