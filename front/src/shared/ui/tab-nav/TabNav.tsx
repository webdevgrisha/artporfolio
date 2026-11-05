import clsx from "clsx";
import React from "react";
import { NavLink, useLocation } from "react-router";

import styles from "./TabNav.module.css";

interface TabNavItem {
  label: string;
  to: string;
}

interface TabNavProps {
  className?: string;
  items: readonly TabNavItem[];
  /** Accessible name of the navigation. */
  label: string;
}

/**
 * Links to the sections of a page, drawn as tabs. Each section is a page of its own with its own
 * URL, so leaving one with unsaved changes asks first, as leaving any page does. The link of the
 * open section gets `aria-current="page"` from `NavLink`.
 */
export function TabNav({ className, items, label }: TabNavProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // On a phone the tabs scroll sideways, so the open one is brought into view. Only the tabs
  // scroll, as `scrollIntoView` would move the page too.
  React.useEffect(() => {
    const root = rootRef.current;
    const current = root?.querySelector<HTMLElement>(`[href="${pathname}"]`);

    if (root && current) {
      root.scrollLeft = current.offsetLeft - (root.clientWidth - current.offsetWidth) / 2;
    }
  }, [pathname]);

  return (
    <nav ref={rootRef} className={clsx(styles.root, className)} aria-label={label}>
      {items.map((item) => (
        <NavLink key={item.to} className={styles.tab} to={item.to}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
