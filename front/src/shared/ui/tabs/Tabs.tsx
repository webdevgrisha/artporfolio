import React, { type ReactNode } from "react";

import { TabsContext } from "./tabsContext";

interface TabsProps<TValue extends string> {
  /** A `TabList` with `Tab`s and a `TabPanel` for each of them, in any layout. */
  children: ReactNode;
  onValueChange: (value: TValue) => void;
  /** The selected tab. Controlled, so the owner can switch tabs, e.g. to show an error. */
  value: TValue;
}

/**
 * Tabs that follow the WAI-ARIA tabs pattern: arrow keys move between tabs and select them.
 * Inactive panels stay mounted and are only hidden, so form fields in them keep their state.
 */
export function Tabs<TValue extends string>({ children, onValueChange, value }: TabsProps<TValue>) {
  const baseId = React.useId();
  const contextValue = React.useMemo(
    () => ({
      baseId,
      // Every Tab and TabPanel of these Tabs passes a value of the owner's type.
      onSelect: onValueChange as (value: string) => void,
      selectedValue: value,
    }),
    [baseId, onValueChange, value],
  );

  return <TabsContext value={contextValue}>{children}</TabsContext>;
}
