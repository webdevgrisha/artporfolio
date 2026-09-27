import styles from "./AdminHeader.module.css";

interface AdminHeaderProps {
  adminRole: string;
  email?: string | null;
}

export function AdminHeader({ adminRole, email }: AdminHeaderProps) {
  return (
    <header className={styles.header}>
      {email ? <span className={styles.email}>{email}</span> : null}
      <span className={styles.role}>{adminRole}</span>
    </header>
  );
}
