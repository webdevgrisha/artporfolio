import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryPalettesQuery } from "@/entities/gallery";
import { EditPalettesForm } from "@/features/edit-gallery";

import styles from "./GalleryPage.module.css";

export function GalleryPalettesSection() {
  // The loader of the section has fetched the data, so this never suspends.
  const { data: palettes } = useSuspenseQuery(galleryPalettesQuery);

  return <EditPalettesForm className={styles.form} palettes={palettes} />;
}
