import { useSuspenseQuery } from "@tanstack/react-query";

import { aboutQuery } from "@/entities/about";
import { EditAboutForm } from "@/features/edit-about";

import styles from "./AboutPage.module.css";

export function AboutPage() {
  // The route loader has fetched the data, so this never suspends.
  const { data: about } = useSuspenseQuery(aboutQuery);

  return (
    <div className={styles.root}>
      <EditAboutForm className={styles.form} about={about} />
    </div>
  );
}
