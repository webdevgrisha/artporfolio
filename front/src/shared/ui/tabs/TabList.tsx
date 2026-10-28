import clsx from "clsx";
import type { KeyboardEvent, ReactNode } from "react";

import styles from "./TabList.module.css";

interface TabListProps {
  children: ReactNode;
  className?: string;
  /** Accessible name of the tab list. */
  label: string;
}

function getTargetIndex(key: string, currentIndex: number, count: number): number | undefined {
  switch (key) {
    case "ArrowLeft":
      return (currentIndex - 1 + count) % count;
    case "ArrowRight":
      return (currentIndex + 1) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return undefined;
  }
}

export function TabList({ children, className, label }: TabListProps) {
  // Only the selected tab is in the tab order; the arrow keys move between the tabs.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLButtonElement)) return;

    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'),
    );
    const currentIndex = tabs.indexOf(event.target);
    if (currentIndex < 0) return;

    const targetTab = tabs[getTargetIndex(event.key, currentIndex, tabs.length) ?? -1];
    if (!targetTab) return;

    event.preventDefault();
    targetTab.focus();
    // Automatic activation: a focused tab is selected at once, its panel is already rendered.
    targetTab.click();
  }

  return (
    <div
      className={clsx(styles.root, className)}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
