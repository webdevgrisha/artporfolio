import clsx from "clsx";

import { adminNavigation } from "@/shared/config/routes";
import { Skeleton, SkeletonRegion } from "@/shared/ui/skeleton";

import headerStyles from "./AdminHeader.module.css";
import layoutStyles from "./AdminLayout.module.css";
import styles from "./AdminLayoutSkeleton.module.css";
import profileStyles from "./AdminProfile.module.css";
import sidebarStyles from "./AdminSidebar.module.css";

/**
 * The admin on its first load, while the session is checked: the layout in its own classes, with
 * skeletons in place of the profile, the navigation, the account and the page. On a phone the
 * sidebar is a closed drawer, as in the layout.
 */
export function AdminLayoutSkeleton() {
  return (
    <SkeletonRegion className={layoutStyles.layout}>
      <div className={sidebarStyles.sidebar}>
        <div className={clsx(profileStyles.profile, sidebarStyles.profile)}>
          <Skeleton className={clsx(profileStyles.avatar, styles.avatar)} />
          <Skeleton className={styles.name} />
        </div>
        <ul className={clsx(sidebarStyles.navigation, styles.navigation)}>
          {adminNavigation.map((page) => (
            <li key={page.to} className={styles.navigationItem}>
              <Skeleton className={styles.navigationLink} />
            </li>
          ))}
        </ul>
      </div>

      <div className={layoutStyles.content}>
        <div className={headerStyles.header}>
          <Skeleton className={styles.account} />
        </div>
        <div className={layoutStyles.page}>
          <div className={layoutStyles.pageHeader}>
            <Skeleton className={styles.title} />
          </div>
          <div className={layoutStyles.contentFrame} />
        </div>
      </div>
    </SkeletonRegion>
  );
}
