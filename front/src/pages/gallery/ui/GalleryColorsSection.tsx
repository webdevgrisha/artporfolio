import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryColorsQuery } from "@/entities/gallery";
import { EditColorsForm } from "@/features/edit-gallery";

import styles from "./GalleryPage.module.css";

export function GalleryColorsSection() {
  // The loader of the section has fetched the data, so this never suspends.
  const { data: colors } = useSuspenseQuery(galleryColorsQuery);

  return <EditColorsForm className={styles.form} colors={colors} />;
}
