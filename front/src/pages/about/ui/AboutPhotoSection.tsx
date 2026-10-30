import { useSuspenseQuery } from "@tanstack/react-query";

import { aboutQuery } from "@/entities/about";
import { EditAboutPhotoForm } from "@/features/edit-about";

import styles from "./AboutPage.module.css";

export function AboutPhotoSection() {
  // The loader of the page has fetched the data, so this never suspends.
  const { data: about } = useSuspenseQuery(aboutQuery);

  return <EditAboutPhotoForm className={styles.form} photo={about.photo} />;
}
