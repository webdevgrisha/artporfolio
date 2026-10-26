import { Outlet, useLocation } from "react-router";

import { documentTitle } from "@/config/documentTitle";
import { useAuth } from "@/hooks/useAuth";
import { AdminHeader } from "@/pages/Admin/components/AdminHeader/AdminHeader";
import { AdminSidebar } from "@/pages/Admin/components/AdminSidebar/AdminSidebar";
import { MobileMenuButton } from "@/pages/Admin/components/MobileMenuButton/MobileMenuButton";
import { adminPages } from "@/pages/Admin/config/pages";
import { isAdminPageActive } from "@/pages/Admin/utils/isAdminPageActive";
import styles from "./AdminLayout.module.css";
import { useMobileMenu } from "./hooks/useMobileMenu";

const sidebarId = "admin-sidebar";

export function AdminLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const mobileMenu = useMobileMenu();
  const activeIndex = adminPages.findIndex((page) => isAdminPageActive(pathname, page.to));
  const pageTitle = adminPages[activeIndex]?.title ?? "";

  return (
    <div className={styles.layout}>
      <AdminSidebar
        ref={mobileMenu.drawerRef}
        id={sidebarId}
        activeIndex={activeIndex}
        isOpen={mobileMenu.isOpen}
        onClose={mobileMenu.close}
      />

      {/* While the drawer is open, the rest of the page is out of reach for focus and screen readers. */}
      <div className={styles.content} inert={mobileMenu.isOpen}>
        <AdminHeader
          email={user?.email}
          adminRole="Админ"
          menuButton={
            <MobileMenuButton
              ref={mobileMenu.toggleRef}
              controls={sidebarId}
              isExpanded={mobileMenu.isOpen}
              onClick={mobileMenu.open}
            />
          }
        />

        <main className={styles.page}>
          <title>{documentTitle(pageTitle)}</title>
          <h1 className={styles.title}>{pageTitle}</h1>
          <div className={styles.contentFrame}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
