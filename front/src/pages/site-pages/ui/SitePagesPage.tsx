import { EditPageHeroes } from "@/features/edit-page-heroes";

import styles from "./SitePagesPage.module.css";

export function SitePagesPage() {
  return (
    <div className={styles.root}>
      <EditPageHeroes />
    </div>
  );
}
