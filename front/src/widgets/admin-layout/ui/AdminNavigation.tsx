import clsx from "clsx";
import { NavLink } from "react-router";
import { adminNavigation } from "@/shared/config/routes";

import { useActiveAdminPageIndex } from "../model/useActiveAdminPageIndex";
import { ActiveIndicator } from "./ActiveIndicator";
import styles from "./AdminNavigation.module.css";

interface AdminNavigationProps {
  className?: string;
  onNavigate: () => void;
}

export function AdminNavigation({ className, onNavigate }: AdminNavigationProps) {
  const activeIndex = useActiveAdminPageIndex();

  return (
    <nav className={clsx(styles.navigation, className)} aria-label="Основная навигация">
      <ActiveIndicator activeIndex={activeIndex} />

      <ul className={styles.list}>
        {adminNavigation.map((page) => (
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
