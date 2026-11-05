import { EditPageHeroes, EditPageHeroesSkeleton } from "@/features/edit-page-heroes";
import { AwaitPageData } from "@/shared/ui/page-data";

import styles from "./SitePagesPage.module.css";

export function SitePagesPage() {
  return (
    <div className={styles.root}>
      <AwaitPageData fallback={<EditPageHeroesSkeleton />}>
        <EditPageHeroes />
      </AwaitPageData>
    </div>
  );
}
