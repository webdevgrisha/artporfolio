import type { ReactNode } from "react";

import { ThemeToggle } from "@/features/toggle-theme";

import styles from "./AdminHeader.module.css";

interface AdminHeaderProps {
  email?: string | null;
  menuButton?: ReactNode;
}

export function AdminHeader({ email, menuButton }: AdminHeaderProps) {
  return (
    <header className={styles.header}>
      {menuButton}
      <div className={styles.account}>
        {email ? <span className={styles.email}>{email}</span> : null}
        <ThemeToggle />
      </div>
    </header>
  );
}
