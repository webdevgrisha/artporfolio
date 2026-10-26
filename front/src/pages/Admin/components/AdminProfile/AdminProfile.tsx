import clsx from "clsx";

import styles from "@/pages/Admin/components/AdminProfile/AdminProfile.module.css";

interface AdminProfileProps {
  className?: string;
  imageUrl: string;
  name: string;
}

export function AdminProfile({ className, imageUrl, name }: AdminProfileProps) {
  return (
    <div className={clsx(styles.profile, className)}>
      <span className={styles.avatar}>
        <img src={imageUrl} alt="" />
      </span>
      <span className={styles.name}>{name}</span>
    </div>
  );
}
