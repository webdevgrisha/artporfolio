import clsx from "clsx";

import styles from "./AdminProfile.module.css";

interface AdminProfileProps {
  className?: string;
  imageUrl: string;
  name: string;
}

export function AdminProfile({ className, imageUrl, name }: AdminProfileProps) {
  const formattedName = name.trim().split(/\s+/).join("\n");

  return (
    <div className={clsx(styles.profile, className)}>
      <span className={styles.avatar}>
        <img src={imageUrl} alt="" />
      </span>
      <span className={styles.name}>{formattedName}</span>
    </div>
  );
}
