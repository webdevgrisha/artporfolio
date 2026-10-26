import type { ReactNode } from "react";

import styles from "@/pages/Admin/components/AdminHeader/AdminHeader.module.css";

interface AdminHeaderProps {
  adminRole: string;
  email?: string | null;
  menuButton?: ReactNode;
}

export function AdminHeader({ adminRole, email, menuButton }: AdminHeaderProps) {
  return (
    <header className={styles.header}>
      {menuButton}
      <div className={styles.account}>
        {email ? <span className={styles.email}>{email}</span> : null}
        <span className={styles.role}>{adminRole}</span>
      </div>
    </header>
  );
}
