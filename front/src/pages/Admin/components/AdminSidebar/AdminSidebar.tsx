import clsx from "clsx";

import avatarUrl from "@/assets/images/portraitMark.png";
import { AdminProfile } from "@/pages/Admin/components/AdminProfile/AdminProfile";
import { AdminNavigation } from "./AdminNavigation/AdminNavigation";
import styles from "./AdminSidebar.module.css";
import { useAdminSidebar } from "./hooks/useAdminSidebar";
import { MenuToggleIcon } from "./MenuToggleIcon/MenuToggleIcon";

const sidebarId = "admin-sidebar";

export function AdminSidebar() {
  const {
    activeIndex,
    closeMobileMenu,
    isLoggingOut,
    isMobileMenuOpen,
    logoutAdmin,
    menuButtonRef,
    sidebarRef,
    toggleMobileMenu,
  } = useAdminSidebar();

  return (
    <>
      <button
        ref={menuButtonRef}
        className={styles.mobileMenuButton}
        type="button"
        aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
        aria-controls={sidebarId}
        aria-expanded={isMobileMenuOpen}
        onClick={toggleMobileMenu}
      >
        <MenuToggleIcon isOpen={isMobileMenuOpen} />
      </button>

      <button
        className={clsx(styles.backdrop, {
          [styles.backdropVisible]: isMobileMenuOpen,
        })}
        type="button"
        aria-label="Закрыть меню"
        onClick={closeMobileMenu}
      />

      <aside
        ref={sidebarRef}
        id={sidebarId}
        className={clsx(styles.sidebar, {
          [styles.mobileOpen]: isMobileMenuOpen,
        })}
        aria-label="Навигация администратора"
      >
        <AdminProfile className={styles.profile} imageUrl={avatarUrl} name="ANASTASIA TURKEVICH" />

        <AdminNavigation
          className={styles.navigation}
          activeIndex={activeIndex}
          onNavigate={closeMobileMenu}
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
