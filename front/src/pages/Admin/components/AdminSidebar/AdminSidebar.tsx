import clsx from "clsx";
import type { Ref } from "react";
import { Form, useNavigation } from "react-router";

import avatarUrl from "@/assets/images/portraitMark.png";
import { CloseIcon } from "@/components/Icon/CloseIcon";
import { AdminProfile } from "@/pages/Admin/components/AdminProfile/AdminProfile";
import { logoutPath } from "@/pages/Admin/config/pages";
import { AdminNavigation } from "./AdminNavigation/AdminNavigation";
import styles from "./AdminSidebar.module.css";

interface AdminSidebarProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  ref?: Ref<HTMLDivElement>;
}

export function AdminSidebar({ id, isOpen, onClose, ref }: AdminSidebarProps) {
  const navigation = useNavigation();
  const isLoggingOut = navigation.formAction === logoutPath;

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

        <Form className={styles.logoutForm} method="post" action={logoutPath}>
          <button className={styles.logout} type="submit" disabled={isLoggingOut}>
            Выйти
          </button>
        </Form>
      </div>
    </>
  );
}
