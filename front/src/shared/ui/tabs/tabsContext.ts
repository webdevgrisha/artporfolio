import React from "react";

interface TabsContextValue {
  /** Prefix of the tab and panel ids that link them for assistive technology. */
  baseId: string;
  onSelect: (value: string) => void;
  selectedValue: string;
}

export const TabsContext = React.createContext<TabsContextValue | null>(null);

export function useTabsContext(): TabsContextValue {
  const context = React.use(TabsContext);

  if (!context) {
    throw new Error("Tab and TabPanel must be rendered inside Tabs");
  }

  return context;
}

export function getTabId(baseId: string, value: string): string {
  return `${baseId}-tab-${value}`;
}

export function getTabPanelId(baseId: string, value: string): string {
  return `${baseId}-panel-${value}`;
}
