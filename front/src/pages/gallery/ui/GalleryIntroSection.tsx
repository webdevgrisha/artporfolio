import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryIntroQuery } from "@/entities/gallery";
import { EditGalleryIntroForm } from "@/features/edit-gallery";

import styles from "./GalleryPage.module.css";

export function GalleryIntroSection() {
  // The loader of the section has fetched the data, so this never suspends.
  const { data: intro } = useSuspenseQuery(galleryIntroQuery);

  return <EditGalleryIntroForm className={styles.form} intro={intro} />;
}
