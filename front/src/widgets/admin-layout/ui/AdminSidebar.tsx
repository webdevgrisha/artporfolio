import clsx from "clsx";
import type { Ref } from "react";

import { LogoutButton } from "@/features/logout";
import avatarUrl from "@/shared/assets/images/portraitMark.png";
import { CloseIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Tooltip } from "@/shared/ui/tooltip";

import { AdminNavigation } from "./AdminNavigation";
import { AdminProfile } from "./AdminProfile";
import styles from "./AdminSidebar.module.css";

const closeLabel = "Закрыть меню";

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
        className={clsx(styles.backdrop, isOpen && styles.backdropVisible)}
        aria-hidden="true"
        onClick={onClose}
      />

      <div ref={ref} id={id} className={clsx(styles.sidebar, isOpen && styles.open)}>
        <Tooltip className={styles.close} content={closeLabel}>
          <IconButton label={closeLabel} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Tooltip>

        <AdminProfile className={styles.profile} imageUrl={avatarUrl} name="ANASTASIA TURKEVICH" />

        <AdminNavigation className={styles.navigation} onNavigate={onClose} />

        <LogoutButton className={styles.logout} />
      </div>
    </>
  );
}
