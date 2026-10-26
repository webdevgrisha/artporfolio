import clsx from "clsx";
import type { Ref } from "react";

import avatarUrl from "@/assets/images/portraitMark.png";
import { CloseIcon } from "@/components/Icon/CloseIcon";
import { AdminProfile } from "@/pages/Admin/components/AdminProfile/AdminProfile";
import { AdminNavigation } from "./AdminNavigation/AdminNavigation";
import styles from "./AdminSidebar.module.css";
import { useAdminLogout } from "./hooks/useAdminLogout";

interface AdminSidebarProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  ref?: Ref<HTMLDivElement>;
}

export function AdminSidebar({ id, isOpen, onClose, ref }: AdminSidebarProps) {
  const { isLoggingOut, logoutAdmin } = useAdminLogout();

  return (
    <>
      {/* A pointer-only shortcut: keyboard users close the menu with Escape or the close button. */}
      <div
        className={clsx(styles.backdrop, { [styles.backdropVisible]: isOpen })}
        aria-hidden="true"
        onClick={onClose}
      />

      <div ref={ref} id={id} className={clsx(styles.sidebar, { [styles.open]: isOpen })}>
        <button
          className={styles.closeButton}
          type="button"
          aria-label="Закрыть меню"
          onClick={onClose}
        >
          <CloseIcon />
        </button>

        <AdminProfile className={styles.profile} imageUrl={avatarUrl} name="ANASTASIA TURKEVICH" />

        <AdminNavigation className={styles.navigation} onNavigate={onClose} />

        <button
          className={styles.logout}
          type="button"
          disabled={isLoggingOut}
          onClick={logoutAdmin}
        >
          Выйти
        </button>
      </div>
    </>
  );
}
