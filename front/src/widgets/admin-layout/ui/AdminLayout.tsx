import { Outlet } from "react-router";

import { useSessionCheck, useSessionUser } from "@/entities/user";
import { languageNames } from "@/shared/config/languages";
import { adminNavigation } from "@/shared/config/routes";
import { documentTitle } from "@/shared/lib/documentTitle";
import { useFormLanguage } from "@/shared/lib/useFormLanguage";
import { type BreadcrumbItem, Breadcrumbs } from "@/shared/ui/breadcrumbs";
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

/** The trail with the language of the form after the current page; Russian needs no mention. */
function withLanguage(items: readonly BreadcrumbItem[], language: string): BreadcrumbItem[] {
  return items.map((item, index) =>
    index === items.length - 1
      ? {
          ...item,
          label: (
            <>
              {item.label} ({language})
            </>
          ),
        }
      : item,
  );
}

export function AdminLayout() {
  const user = useSessionUser();
  useSessionCheck();
  const mobileMenu = useMobileMenu();
  const pageTitle = adminNavigation[useActiveAdminPageIndex()]?.title ?? "";
  const { breadcrumbs, titleAction } = useAdminPageHandle();
  const [language] = useFormLanguage();

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
          <TranslationBanner />
          <div className={styles.pageHeader}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{pageTitle}</h1>
              {titleAction}
            </div>
            {breadcrumbs ? (
              <Breadcrumbs
                items={
                  language === "ru"
                    ? breadcrumbs
                    : withLanguage(breadcrumbs, languageNames[language])
                }
              />
            ) : null}
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
