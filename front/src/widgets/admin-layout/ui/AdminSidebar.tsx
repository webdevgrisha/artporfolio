import clsx from "clsx";
import type { Ref } from "react";

import { LogoutButton } from "@/features/logout";
import avatarUrl from "@/shared/assets/images/portraitMark.png";
import { CloseIcon } from "@/shared/ui/icon";

import { AdminNavigation } from "./AdminNavigation";
import { AdminProfile } from "./AdminProfile";
import styles from "./AdminSidebar.module.css";

interface AdminSidebarProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  ref?: Ref<HTMLDivElement>;
}

export function AdminSidebar({ id, isOpen, onClose, ref }: AdminSidebarProps) {
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

        <LogoutButton className={styles.logout} />
      </div>
    </>
  );
}
