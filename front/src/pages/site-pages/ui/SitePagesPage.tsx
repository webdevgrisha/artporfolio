import { useSuspenseQuery } from "@tanstack/react-query";

import { sitePagesQuery } from "@/entities/site-page";
import { EditPageHeroesForm } from "@/features/edit-page-heroes";

import styles from "./SitePagesPage.module.css";

export function SitePagesPage() {
  // The route loader has fetched the data, so this never suspends.
  const { data: pages } = useSuspenseQuery(sitePagesQuery);

  return (
    <div className={styles.root}>
      <EditPageHeroesForm className={styles.form} pages={pages} />
    </div>
  );
}
