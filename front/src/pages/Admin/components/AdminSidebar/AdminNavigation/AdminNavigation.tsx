import clsx from "clsx";
import type { CSSProperties } from "react";
import { NavLink } from "react-router";

import { adminPages } from "@/pages/Admin/config/pages";
import styles from "./AdminNavigation.module.css";

interface AdminNavigationProps {
  activeIndex: number;
  className?: string;
  onNavigate: () => void;
}

interface ActiveIndicatorProps {
  activeIndex: number;
}

function ActiveIndicator({ activeIndex }: ActiveIndicatorProps) {
  if (activeIndex < 0) return null;

  return (
    <span
      className={styles.activeIndicator}
      style={{ "--active-index": activeIndex } as CSSProperties}
      aria-hidden="true"
    />
  );
}

export function AdminNavigation({ activeIndex, className, onNavigate }: AdminNavigationProps) {
  return (
    <nav className={clsx(styles.navigation, className)} aria-label="Основная навигация">
      <ActiveIndicator activeIndex={activeIndex} />

      <ul className={styles.list}>
        {adminPages.map((page) => (
          <li key={page.to}>
            <NavLink className={styles.navigationLink} to={page.to} onClick={onNavigate}>
              {page.title}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
