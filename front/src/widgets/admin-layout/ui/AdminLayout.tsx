import { Outlet } from "react-router";

import { useSessionUser } from "@/entities/user";
import { adminNavigation } from "@/shared/config/routes";
import { documentTitle } from "@/shared/lib/documentTitle";
import { UnsavedChangesProvider } from "@/shared/ui/unsaved-changes";

import { useActiveAdminPageIndex } from "../model/useActiveAdminPageIndex";
import { useMobileMenu } from "../model/useMobileMenu";
import { AdminHeader } from "./AdminHeader";
import styles from "./AdminLayout.module.css";
import { AdminSidebar } from "./AdminSidebar";
import { MobileMenuButton } from "./MobileMenuButton";

const sidebarId = "admin-sidebar";

export function AdminLayout() {
  const user = useSessionUser();
  const mobileMenu = useMobileMenu();
  const pageTitle = adminNavigation[useActiveAdminPageIndex()]?.title ?? "";

  return (
    <div className={styles.layout}>
      <AdminSidebar
        ref={mobileMenu.drawerRef}
        id={sidebarId}
        isOpen={mobileMenu.isOpen}
        onClose={mobileMenu.close}
      />

      {/* While the drawer is open, the rest of the page is out of reach for focus and screen readers. */}
      <div className={styles.content} inert={mobileMenu.isOpen}>
        <AdminHeader
          email={user.email}
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
            <UnsavedChangesProvider>
              <Outlet />
            </UnsavedChangesProvider>
          </div>
        </main>
      </div>
    </div>
  );
}
