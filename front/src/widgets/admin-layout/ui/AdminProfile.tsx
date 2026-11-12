import clsx from "clsx";

import { Portrait } from "@/shared/ui/portrait";

import styles from "./AdminProfile.module.css";

interface AdminProfileProps {
  className?: string;
  name: string;
}

export function AdminProfile({ className, name }: AdminProfileProps) {
  return (
    <div className={clsx(styles.profile, className)}>
      <span className={styles.avatar}>
        {/* As wide as the avatar in AdminProfile.module.css. */}
        <Portrait sizes="(min-width: 75rem) 104px, 72px" />
      </span>
      <span className={styles.name}>{name}</span>
    </div>
  );
}
