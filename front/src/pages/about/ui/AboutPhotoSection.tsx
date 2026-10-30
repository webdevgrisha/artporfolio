import { useSuspenseQuery } from "@tanstack/react-query";

import { aboutPhoto } from "@/entities/about";
import { EditAboutPhotoForm } from "@/features/edit-about";

import styles from "./AboutPage.module.css";

export function AboutPhotoSection() {
  // The loader of the section has fetched the data, so this never suspends.
  const { data: photo } = useSuspenseQuery(aboutPhoto.query);

  return <EditAboutPhotoForm className={styles.form} photo={photo} />;
}
