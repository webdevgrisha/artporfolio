import { Outlet } from "react-router";

import { useSessionCheck, useSessionUser } from "@/entities/user";
import { adminNavigation } from "@/shared/config/routes";
import { documentTitle } from "@/shared/lib/documentTitle";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { UnsavedChangesProvider } from "@/shared/ui/unsaved-changes";

import { useAdminPageHandle } from "../model/adminPageHandle";
import { useActiveAdminPageIndex } from "../model/useActiveAdminPageIndex";
import { useMobileMenu } from "../model/useMobileMenu";
import { AdminHeader } from "./AdminHeader";
import styles from "./AdminLayout.module.css";
import { AdminSidebar } from "./AdminSidebar";
import { MobileMenuButton } from "./MobileMenuButton";
import { NavigationProgress } from "./NavigationProgress";
import { TranslationBanner } from "./TranslationBanner";

const sidebarId = "admin-sidebar";

export function AdminLayout() {
  const user = useSessionUser();
  useSessionCheck();
  const mobileMenu = useMobileMenu();
  const pageTitle = adminNavigation[useActiveAdminPageIndex()]?.title ?? "";
  const { breadcrumbs } = useAdminPageHandle();

  return (
    <div className={styles.layout}>
      <NavigationProgress />
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
          <TranslationBanner className={styles.banner} />
          <div className={styles.pageHeader}>
            <h1 className={styles.title}>{pageTitle}</h1>
            {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
          </div>
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
