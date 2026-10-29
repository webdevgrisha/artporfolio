import { useLoaderData } from "react-router";

import { EditPageHeroesForm } from "@/features/edit-page-heroes";

import type { sitePagesLoader } from "../model/sitePagesRoute";
import styles from "./SitePagesPage.module.css";

export function SitePagesPage() {
  const pages = useLoaderData<typeof sitePagesLoader>();

  return (
    <div className={styles.root}>
      <EditPageHeroesForm className={styles.form} pages={pages} />
    </div>
  );
}
