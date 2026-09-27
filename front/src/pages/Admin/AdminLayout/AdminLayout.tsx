import { Outlet, useLocation } from "react-router";

import { useAuth } from "@/hooks/useAuth";
import { AdminHeader } from "@/pages/Admin/components/AdminHeader/AdminHeader";
import { AdminSidebar } from "@/pages/Admin/components/AdminSidebar/AdminSidebar";
import { adminPages } from "@/pages/Admin/config/pages";
import { isAdminPageActive } from "@/pages/Admin/utils/isAdminPageActive";
import styles from "./AdminLayout.module.css";

export function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const pageTitle =
    adminPages.find((page) => isAdminPageActive(location.pathname, page.to))?.title ?? "";

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.content}>
        <AdminHeader email={user?.email} adminRole="Админ" />

        <main className={styles.page}>
          <h1 className={styles.title}>{pageTitle}</h1>
          <section
            className={styles.contentFrame}
            aria-label={`Содержимое страницы «${pageTitle}»`}
          >
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
}
