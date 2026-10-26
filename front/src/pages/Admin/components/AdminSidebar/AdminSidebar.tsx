import clsx from "clsx";
import type { Ref } from "react";

import avatarUrl from "@/assets/images/portraitMark.png";
import { AdminProfile } from "@/pages/Admin/components/AdminProfile/AdminProfile";
import { AdminNavigation } from "./AdminNavigation/AdminNavigation";
import styles from "./AdminSidebar.module.css";
import { useAdminLogout } from "./hooks/useAdminLogout";

interface AdminSidebarProps {
  activeIndex: number;
  id: string;
  isOpen: boolean;
  onClose: () => void;
  ref?: Ref<HTMLElement>;
}

export function AdminSidebar({ activeIndex, id, isOpen, onClose, ref }: AdminSidebarProps) {
  const { isLoggingOut, logoutAdmin } = useAdminLogout();

  return (
    <>
      <button
        className={clsx(styles.backdrop, { [styles.backdropVisible]: isOpen })}
        type="button"
        aria-label="Закрыть меню"
        onClick={onClose}
      />

      <aside
        ref={ref}
        id={id}
        className={clsx(styles.sidebar, { [styles.open]: isOpen })}
        aria-label="Навигация администратора"
      >
        <AdminProfile className={styles.profile} imageUrl={avatarUrl} name="ANASTASIA TURKEVICH" />

        <AdminNavigation
          className={styles.navigation}
          activeIndex={activeIndex}
          onNavigate={onClose}
        />

        <button
          className={styles.logout}
          type="button"
          disabled={isLoggingOut}
          onClick={logoutAdmin}
        >
          Выйти
        </button>
      </aside>
    </>
  );
}
