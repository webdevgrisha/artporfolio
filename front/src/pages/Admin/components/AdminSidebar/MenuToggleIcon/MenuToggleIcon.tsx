import clsx from "clsx";

import styles from "./MenuToggleIcon.module.css";

interface MenuToggleIconProps {
  isOpen: boolean;
}

export function MenuToggleIcon({ isOpen }: MenuToggleIconProps) {
  return (
    <svg
      className={clsx(styles.icon, { [styles.open]: isOpen })}
      width="31"
      height="14"
      viewBox="0 0 31 14"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect className={styles.topLine} width="31" height="2" fill="currentColor" />
      <rect className={styles.bottomLine} y="12" width="31" height="2" fill="currentColor" />
    </svg>
  );
}
